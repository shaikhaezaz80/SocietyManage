import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';

interface WebSocketClient extends WebSocket {
  userId?: number;
  societyId?: number;
  role?: string;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server: server, 
    path: '/ws' 
  });

  wss.on('connection', (ws: WebSocketClient, req) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'authenticate':
            await handleAuthentication(ws, message);
            break;
          case 'visitor_approval_request':
            await handleVisitorApprovalRequest(message, wss);
            break;
          case 'visitor_status_update':
            await handleVisitorStatusUpdate(message, wss);
            break;
          case 'emergency_alert':
            await handleEmergencyAlert(message, wss);
            break;
          case 'message':
            await handleMessage(message, wss);
            break;
          case 'voice_call_request':
            await handleVoiceCallRequest(message, wss);
            break;
          case 'voice_call_response':
            await handleVoiceCallResponse(message, wss);
            break;
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'WebSocket connection established' 
    }));
  });

  // Heartbeat to keep connections alive
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  return wss;
}

async function handleAuthentication(ws: WebSocketClient, message: any) {
  try {
    const { userId, token } = message;
    
    // In a real implementation, verify the JWT token
    const user = await storage.getUser(userId);
    if (!user) {
      ws.send(JSON.stringify({ 
        type: 'auth_error', 
        message: 'Invalid user' 
      }));
      return;
    }

    ws.userId = user.id;
    ws.societyId = user.societyId || undefined;
    ws.role = user.role;

    ws.send(JSON.stringify({ 
      type: 'authenticated', 
      userId: user.id,
      role: user.role 
    }));
  } catch (error) {
    console.error('Authentication error:', error);
    ws.send(JSON.stringify({ 
      type: 'auth_error', 
      message: 'Authentication failed' 
    }));
  }
}

async function handleVisitorApprovalRequest(message: any, wss: WebSocketServer) {
  try {
    const { visitorId, flatId, residentId } = message;
    
    // Find the resident's WebSocket connection
    const targetWs = Array.from(wss.clients).find((client: any) => 
      client.userId === residentId && client.readyState === WebSocket.OPEN
    ) as WebSocketClient;

    if (targetWs) {
      const visitor = await storage.getVisitorById(visitorId);
      const flat = await storage.getFlatById(flatId);
      
      targetWs.send(JSON.stringify({
        type: 'visitor_approval_request',
        visitor,
        flat,
        timestamp: new Date().toISOString()
      }));
    }

    // Also send push notification (in real implementation)
    // await sendPushNotification(residentId, `Visitor ${visitor.name} is at the gate`);
    
  } catch (error) {
    console.error('Visitor approval request error:', error);
  }
}

async function handleVisitorStatusUpdate(message: any, wss: WebSocketServer) {
  try {
    const { visitorId, status, approvedBy } = message;
    
    // Update visitor status in database
    await storage.updateVisitor(visitorId, { 
      status, 
      approvedBy,
      checkInTime: status === 'approved' ? new Date() : undefined
    });

    // Notify guard
    const guardClients = Array.from(wss.clients).filter((client: any) => 
      client.role === 'guard' && 
      client.societyId === message.societyId &&
      client.readyState === WebSocket.OPEN
    ) as WebSocketClient[];

    const visitor = await storage.getVisitorById(visitorId);
    
    guardClients.forEach(guardWs => {
      guardWs.send(JSON.stringify({
        type: 'visitor_status_updated',
        visitor,
        status,
        timestamp: new Date().toISOString()
      }));
    });

  } catch (error) {
    console.error('Visitor status update error:', error);
  }
}

async function handleEmergencyAlert(message: any, wss: WebSocketServer) {
  try {
    const { userId, societyId, location, description } = message;
    
    // Log the emergency in audit logs
    await storage.logAuditEntry({
      userId,
      societyId,
      action: 'emergency_alert',
      entity: 'security',
      newData: { location, description, timestamp: new Date() }
    });

    // Notify all admin and security users in the society
    const alertRecipients = Array.from(wss.clients).filter((client: any) => 
      client.societyId === societyId &&
      (client.role === 'admin' || client.role === 'guard') &&
      client.readyState === WebSocket.OPEN
    ) as WebSocketClient[];

    const alertData = {
      type: 'emergency_alert',
      userId,
      location,
      description,
      timestamp: new Date().toISOString(),
      priority: 'high'
    };

    alertRecipients.forEach(client => {
      client.send(JSON.stringify(alertData));
    });

    // In real implementation, also trigger:
    // - SMS to security team
    // - Email to management
    // - Integration with security systems

  } catch (error) {
    console.error('Emergency alert error:', error);
  }
}

async function handleMessage(message: any, wss: WebSocketServer) {
  try {
    const { senderId, receiverId, content, messageType } = message;
    
    // Save message to database
    const newMessage = await storage.createMessage({
      senderId,
      receiverId,
      content,
      messageType: messageType || 'text',
      societyId: message.societyId
    });

    // Find receiver's WebSocket connection
    const receiverWs = Array.from(wss.clients).find((client: any) => 
      client.userId === receiverId && client.readyState === WebSocket.OPEN
    ) as WebSocketClient;

    if (receiverWs) {
      receiverWs.send(JSON.stringify({
        type: 'new_message',
        message: newMessage,
        timestamp: new Date().toISOString()
      }));
    }

  } catch (error) {
    console.error('Message handling error:', error);
  }
}

async function handleVoiceCallRequest(message: any, wss: WebSocketServer) {
  try {
    const { callerId, receiverId, callType } = message;
    
    // Find receiver's WebSocket connection
    const receiverWs = Array.from(wss.clients).find((client: any) => 
      client.userId === receiverId && client.readyState === WebSocket.OPEN
    ) as WebSocketClient;

    if (receiverWs) {
      const caller = await storage.getUser(callerId);
      
      receiverWs.send(JSON.stringify({
        type: 'incoming_voice_call',
        callerId,
        callerName: caller?.name,
        callType,
        timestamp: new Date().toISOString()
      }));
    }

  } catch (error) {
    console.error('Voice call request error:', error);
  }
}

async function handleVoiceCallResponse(message: any, wss: WebSocketServer) {
  try {
    const { callerId, receiverId, response, callType } = message; // response: 'accept' | 'reject'
    
    // Find caller's WebSocket connection
    const callerWs = Array.from(wss.clients).find((client: any) => 
      client.userId === callerId && client.readyState === WebSocket.OPEN
    ) as WebSocketClient;

    if (callerWs) {
      callerWs.send(JSON.stringify({
        type: 'voice_call_response',
        receiverId,
        response,
        timestamp: new Date().toISOString()
      }));
    }

    // Log the call attempt
    await storage.logAuditEntry({
      userId: receiverId,
      societyId: message.societyId,
      action: 'voice_call_response',
      entity: 'call',
      newData: { callerId, response, callType }
    });

  } catch (error) {
    console.error('Voice call response error:', error);
  }
}

// Helper function to broadcast to all clients in a society
export function broadcastToSociety(wss: WebSocketServer, societyId: number, data: any, excludeUserId?: number) {
  const societyClients = Array.from(wss.clients).filter((client: any) => 
    client.societyId === societyId &&
    client.userId !== excludeUserId &&
    client.readyState === WebSocket.OPEN
  ) as WebSocketClient[];

  societyClients.forEach(client => {
    client.send(JSON.stringify(data));
  });
}

// Helper function to send to specific role in society
export function broadcastToRole(wss: WebSocketServer, societyId: number, role: string, data: any) {
  const roleClients = Array.from(wss.clients).filter((client: any) => 
    client.societyId === societyId &&
    client.role === role &&
    client.readyState === WebSocket.OPEN
  ) as WebSocketClient[];

  roleClients.forEach(client => {
    client.send(JSON.stringify(data));
  });
}
