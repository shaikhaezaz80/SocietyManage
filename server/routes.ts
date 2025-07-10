import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import multer from "multer";
import { z } from "zod";
import { insertVisitorSchema, insertStaffSchema, insertComplaintSchema, insertAnnouncementSchema } from "@shared/schema";

// File upload configuration
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  setupAuth(app);

  // Middleware for authenticated routes
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  // OTP generation endpoint (mock for demo)
  app.post("/api/otp/send", async (req, res) => {
    const { phone, role } = req.body;
    
    // In production, integrate with SMS service like Twilio
    console.log(`Sending OTP to ${phone} for role ${role}`);
    
    res.json({ success: true, message: "OTP sent successfully" });
  });

  app.post("/api/otp/verify", async (req, res) => {
    const { phone, otp, role } = req.body;
    
    // Mock verification - in production, verify with actual OTP
    if (otp === "123456") {
      // Create or get user
      let user = await storage.getUserByUsername(phone);
      
      if (!user) {
        // Create new user for first-time login
        user = await storage.createUser({
          username: phone,
          password: "temp", // Will be updated with proper auth
          name: role === 'guard' ? 'Security Guard' : 'New User',
          phone,
          role: role as any,
          societyId: 1 // Default society for demo
        });
      }
      
      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Login failed" });
        res.json({ user, success: true });
      });
    } else {
      res.status(400).json({ error: "Invalid OTP" });
    }
  });

  // Visitor Management Routes
  app.get("/api/visitors", requireAuth, async (req: any, res) => {
    try {
      const { status, date } = req.query;
      const filters = { status, date };
      
      const visitors = await storage.getVisitorsBySociety(req.user.societyId, filters);
      res.json(visitors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch visitors" });
    }
  });

  app.post("/api/visitors", requireAuth, upload.single('photo'), async (req: any, res) => {
    try {
      const visitorData = insertVisitorSchema.parse({
        ...req.body,
        societyId: req.user.societyId,
        photoUrl: req.file ? `/uploads/${req.file.filename}` : null
      });
      
      const visitor = await storage.createVisitor(visitorData);
      
      // Log audit entry
      await storage.logAuditEntry({
        userId: req.user.id,
        societyId: req.user.societyId,
        action: 'create_visitor',
        entity: 'visitor',
        entityId: visitor.id,
        newData: visitor
      });
      
      res.status(201).json(visitor);
    } catch (error) {
      console.error("Visitor creation error:", error);
      res.status(400).json({ error: "Failed to create visitor" });
    }
  });

  app.patch("/api/visitors/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Add timestamp for status changes
      if (updates.status === 'approved') {
        updates.approvedBy = req.user.id;
        updates.checkInTime = new Date();
      } else if (updates.status === 'exited') {
        updates.checkOutTime = new Date();
      }
      
      const visitor = await storage.updateVisitor(id, updates);
      
      if (!visitor) {
        return res.status(404).json({ error: "Visitor not found" });
      }
      
      await storage.logAuditEntry({
        userId: req.user.id,
        societyId: req.user.societyId,
        action: 'update_visitor',
        entity: 'visitor',
        entityId: visitor.id,
        newData: updates
      });
      
      res.json(visitor);
    } catch (error) {
      res.status(500).json({ error: "Failed to update visitor" });
    }
  });

  app.get("/api/visitors/export", requireAuth, async (req: any, res) => {
    try {
      const visitors = await storage.getVisitorsBySociety(req.user.societyId);
      
      // Generate CSV
      const csv = [
        'Name,Phone,Type,Flat,Status,Entry Time,Exit Time',
        ...visitors.map(v => 
          `"${v.name}","${v.phone}","${v.visitorType}","${v.flatId}","${v.status}","${v.checkInTime || ''}","${v.checkOutTime || ''}"`
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=visitors.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to export visitors" });
    }
  });

  // Staff Management Routes
  app.get("/api/staff", requireAuth, async (req: any, res) => {
    try {
      const staff = await storage.getStaffBySociety(req.user.societyId);
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", requireAuth, upload.single('photo'), async (req: any, res) => {
    try {
      const staffData = insertStaffSchema.parse({
        ...req.body,
        societyId: req.user.societyId,
        photoUrl: req.file ? `/uploads/${req.file.filename}` : null
      });
      
      const staff = await storage.createStaff(staffData);
      
      await storage.logAuditEntry({
        userId: req.user.id,
        societyId: req.user.societyId,
        action: 'create_staff',
        entity: 'staff',
        entityId: staff.id,
        newData: staff
      });
      
      res.status(201).json(staff);
    } catch (error) {
      console.error("Staff creation error:", error);
      res.status(400).json({ error: "Failed to create staff member" });
    }
  });

  app.post("/api/staff/:id/attendance", requireAuth, async (req: any, res) => {
    try {
      const staffId = parseInt(req.params.id);
      const { status } = req.body;
      
      await storage.markStaffAttendance(staffId, status, req.user.societyId);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark attendance" });
    }
  });

  // Complaint Management Routes
  app.get("/api/complaints", requireAuth, async (req: any, res) => {
    try {
      const { status, category } = req.query;
      const filters = { status, category };
      
      const complaints = await storage.getComplaintsBySociety(req.user.societyId, filters);
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch complaints" });
    }
  });

  app.post("/api/complaints", requireAuth, upload.array('images', 5), async (req: any, res) => {
    try {
      const images = req.files ? req.files.map((file: any) => `/uploads/${file.filename}`) : [];
      
      const complaintData = insertComplaintSchema.parse({
        ...req.body,
        societyId: req.user.societyId,
        raisedBy: req.user.id,
        images
      });
      
      const complaint = await storage.createComplaint(complaintData);
      
      await storage.logAuditEntry({
        userId: req.user.id,
        societyId: req.user.societyId,
        action: 'create_complaint',
        entity: 'complaint',
        entityId: complaint.id,
        newData: complaint
      });
      
      res.status(201).json(complaint);
    } catch (error) {
      console.error("Complaint creation error:", error);
      res.status(400).json({ error: "Failed to create complaint" });
    }
  });

  app.patch("/api/complaints/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.status === 'resolved') {
        updates.resolvedAt = new Date();
      }
      
      const complaint = await storage.updateComplaint(id, updates);
      
      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      
      res.json(complaint);
    } catch (error) {
      res.status(500).json({ error: "Failed to update complaint" });
    }
  });

  // Announcement Routes
  app.get("/api/announcements", requireAuth, async (req: any, res) => {
    try {
      const announcements = await storage.getAnnouncementsBySociety(req.user.societyId);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", requireAuth, async (req: any, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse({
        ...req.body,
        societyId: req.user.societyId,
        createdBy: req.user.id
      });
      
      const announcement = await storage.createAnnouncement(announcementData);
      res.status(201).json(announcement);
    } catch (error) {
      res.status(400).json({ error: "Failed to create announcement" });
    }
  });

  // Finance Routes
  app.get("/api/finance/bills", requireAuth, async (req: any, res) => {
    try {
      const { status, month, year } = req.query;
      const filters = { status, month: month ? parseInt(month as string) : undefined, year: year ? parseInt(year as string) : undefined };
      
      const bills = await storage.getMaintenanceBillsBySociety(req.user.societyId, filters);
      res.json(bills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bills" });
    }
  });

  app.get("/api/finance/expenses", requireAuth, async (req: any, res) => {
    try {
      const { category } = req.query;
      const filters = { category };
      
      const expenses = await storage.getExpensesBySociety(req.user.societyId, filters);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  // Amenity Routes
  app.get("/api/amenities", requireAuth, async (req: any, res) => {
    try {
      const amenities = await storage.getAmenitiesBySociety(req.user.societyId);
      res.json(amenities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch amenities" });
    }
  });

  app.get("/api/amenity-bookings", requireAuth, async (req: any, res) => {
    try {
      const { status } = req.query;
      const filters = { status };
      
      const bookings = await storage.getAmenityBookingsBySociety(req.user.societyId, filters);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Document Routes
  app.get("/api/documents", requireAuth, async (req: any, res) => {
    try {
      const { category } = req.query;
      const documents = await storage.getDocumentsBySociety(req.user.societyId, category as string);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Messaging Routes
  app.get("/api/messages/:userId", requireAuth, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const messages = await storage.getMessagesBetweenUsers(req.user.id, userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const messageData = {
        ...req.body,
        senderId: req.user.id,
        societyId: req.user.societyId
      };
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Failed to send message" });
    }
  });

  // Security Routes
  app.post("/api/security/alert", requireAuth, async (req: any, res) => {
    try {
      const alertData = {
        ...req.body,
        societyId: req.user.societyId,
        triggeredBy: req.user.id
      };
      
      const alert = await storage.createSecurityAlert(alertData);
      
      // TODO: Send real-time alerts via WebSocket
      
      res.status(201).json(alert);
    } catch (error) {
      res.status(400).json({ error: "Failed to create security alert" });
    }
  });

  // Inventory Routes
  app.get("/api/inventory", requireAuth, async (req: any, res) => {
    try {
      const inventory = await storage.getInventoryBySociety(req.user.societyId);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // Static file serving for uploads
  app.use('/uploads', express.static('uploads'));

  // Create HTTP server and setup WebSocket
  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  return httpServer;
}
