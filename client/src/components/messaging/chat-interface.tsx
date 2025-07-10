import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Phone, 
  Video,
  Paperclip,
  Smile,
  ArrowLeft,
  MoreVertical,
  Shield,
  User
} from "lucide-react";

interface Message {
  id: number;
  senderId: number;
  content: string;
  messageType: string;
  createdAt: string;
}

interface ChatContact {
  id: number;
  name: string;
  role: string;
  lastMessage?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

interface ChatInterfaceProps {
  contacts: ChatContact[];
  messages: Message[];
  onSendMessage: (content: string, receiverId: number) => void;
}

export default function ChatInterface({ contacts, messages, onSendMessage }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedContact) return;

    onSendMessage(messageText, selectedContact.id);
    setMessageText("");
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <User className="w-4 h-4" />;
      case "guard":
        return <Shield className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "guard":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!selectedContact) {
    return (
      <div className="flex h-[600px]">
        {/* Contacts List */}
        <div className="w-full md:w-1/3 border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold">Messages</h3>
          </div>
          <div className="overflow-y-auto h-full">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {getRoleIcon(contact.role)}
                    </div>
                    {contact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{contact.name}</p>
                      {contact.unreadCount && contact.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center p-0 text-xs">
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className={getRoleColor(contact.role)}>
                        {contact.role}
                      </Badge>
                    </div>
                    {contact.lastMessage && (
                      <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-gray-600">Choose a contact to start messaging</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px]">
      {/* Contacts List - Hidden on mobile when chat is open */}
      <div className="hidden md:block w-1/3 border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold">Messages</h3>
        </div>
        <div className="overflow-y-auto h-full">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 ${
                selectedContact?.id === contact.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {getRoleIcon(contact.role)}
                  </div>
                  {contact.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{contact.name}</p>
                    {contact.unreadCount && contact.unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {contact.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary" className={getRoleColor(contact.role)}>
                    {contact.role}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedContact(null)}
              className="md:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              {getRoleIcon(selectedContact.role)}
            </div>
            <div>
              <p className="font-medium">{selectedContact.name}</p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className={getRoleColor(selectedContact.role)}>
                  {selectedContact.role}
                </Badge>
                {selectedContact.isOnline && (
                  <span className="text-xs text-green-600">Online</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === user?.id
                    ? "bg-green-600 text-white whatsapp-bubble"
                    : "bg-gray-200 text-gray-900 system-bubble"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.senderId === user?.id ? "text-green-100" : "text-gray-500"
                }`}>
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <Button type="button" variant="ghost" size="sm">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="sm">
              <Smile className="w-4 h-4" />
            </Button>
            <Button 
              type="submit" 
              size="sm" 
              className="bg-green-600 hover:bg-green-700"
              disabled={!messageText.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
