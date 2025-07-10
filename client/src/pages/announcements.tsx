import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { 
  Plus, 
  Megaphone,
  Calendar,
  AlertTriangle,
  Info,
  Heart,
  MessageSquare,
  Share,
  Users,
  Clock,
  CheckCircle,
  TrendingUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertAnnouncementSchema } from "@shared/schema";

export default function Announcements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["/api/announcements"],
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/announcements", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setShowCreateModal(false);
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateAnnouncement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      title: formData.get("title"),
      content: formData.get("content"),
      type: formData.get("type"),
      priority: formData.get("priority"),
      targetAudience: formData.get("targetAudience") || "all",
    };

    createAnnouncementMutation.mutate(data);
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case "emergency":
        return <AlertTriangle className="w-5 h-5" />;
      case "event":
        return <Calendar className="w-5 h-5" />;
      case "poll":
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getAnnouncementColor = (type: string, priority: string) => {
    if (type === "emergency" || priority === "high") {
      return "border-l-red-500 bg-red-50";
    }
    if (type === "event") {
      return "border-l-blue-500 bg-blue-50";
    }
    if (type === "poll") {
      return "border-l-green-500 bg-green-50";
    }
    return "border-l-gray-500 bg-gray-50";
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "emergency":
        return "destructive";
      case "event":
        return "default";
      case "poll":
        return "secondary";
      default:
        return "outline";
    }
  };

  const announcementStats = {
    total: announcements.length,
    emergency: announcements.filter((a: any) => a.type === "emergency").length,
    events: announcements.filter((a: any) => a.type === "event").length,
    polls: announcements.filter((a: any) => a.type === "poll").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      
      <main className="lg:ml-64 pt-16 pb-20 lg:pb-4">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold">Announcements & Community</h1>
              <p className="text-muted-foreground">
                Share updates and engage with residents
              </p>
            </div>
            {(user?.role === "admin" || user?.role === "guard") && (
              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button className="bg-whatsapp hover:bg-whatsapp-dark">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Announcement</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select name="type" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select announcement type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Notice</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="emergency">Emergency Alert</SelectItem>
                          <SelectItem value="poll">Community Poll</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select name="priority" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input 
                        id="title" 
                        name="title" 
                        required 
                        placeholder="Enter announcement title" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea 
                        id="content" 
                        name="content" 
                        required 
                        placeholder="Write your announcement..."
                        rows={4}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="targetAudience">Target Audience</Label>
                      <Select name="targetAudience">
                        <SelectTrigger>
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Residents</SelectItem>
                          <SelectItem value="owners">Owners Only</SelectItem>
                          <SelectItem value="tenants">Tenants Only</SelectItem>
                          <SelectItem value="committee">Committee Members</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowCreateModal(false)} 
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createAnnouncementMutation.isPending} 
                        className="flex-1 bg-whatsapp hover:bg-whatsapp-dark"
                      >
                        {createAnnouncementMutation.isPending ? "Creating..." : "Create"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                    <p className="text-2xl font-bold">{announcementStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Emergency Alerts</p>
                    <p className="text-2xl font-bold">{announcementStats.emergency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Events</p>
                    <p className="text-2xl font-bold">{announcementStats.events}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Polls</p>
                    <p className="text-2xl font-bold">{announcementStats.polls}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Community Feed */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp"></div>
              </div>
            ) : announcements.length > 0 ? (
              announcements.map((announcement: any, index: number) => (
                <Card key={announcement.id || index} className={`border-l-4 ${getAnnouncementColor(announcement.type, announcement.priority)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        announcement.type === "emergency" ? "bg-red-500 text-white" :
                        announcement.type === "event" ? "bg-blue-500 text-white" :
                        announcement.type === "poll" ? "bg-green-500 text-white" :
                        "bg-gray-500 text-white"
                      }`}>
                        {getAnnouncementIcon(announcement.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{announcement.title}</h3>
                            <Badge variant={getBadgeVariant(announcement.type)}>
                              {announcement.type}
                            </Badge>
                            {announcement.priority === "high" && (
                              <Badge variant="destructive">High Priority</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(announcement.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {announcement.content}
                        </p>
                        
                        {announcement.type === "poll" && (
                          <div className="mb-4 p-4 bg-white rounded-lg border">
                            <h4 className="font-medium mb-3">Community Poll</h4>
                            <div className="space-y-3">
                              <div className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium">Yes, proceed with the proposal</span>
                                  <span className="text-sm text-muted-foreground">68%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="bg-green-500 h-2 rounded-full" style={{width: "68%"}}></div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">42 votes</p>
                              </div>
                              
                              <div className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium">No, need more information</span>
                                  <span className="text-sm text-muted-foreground">32%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="bg-orange-500 h-2 rounded-full" style={{width: "32%"}}></div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">20 votes</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <p className="text-sm text-muted-foreground">62 total votes • Poll ends in 3 days</p>
                              <Button size="sm" className="bg-whatsapp hover:bg-whatsapp-dark">
                                Vote Now
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          <button className="flex items-center space-x-1 hover:text-primary transition-colors">
                            <Heart className="w-4 h-4" />
                            <span>{Math.floor(Math.random() * 50) + 10}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-primary transition-colors">
                            <MessageSquare className="w-4 h-4" />
                            <span>{Math.floor(Math.random() * 20) + 2} Comments</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-primary transition-colors">
                            <Share className="w-4 h-4" />
                            <span>Share</span>
                          </button>
                          <div className="flex items-center space-x-1 ml-auto">
                            <Users className="w-4 h-4" />
                            <span>{Math.floor(Math.random() * 100) + 50} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Announcements Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to share an update with the community
                  </p>
                  {(user?.role === "admin" || user?.role === "guard") && (
                    <Button 
                      onClick={() => setShowCreateModal(true)}
                      className="bg-whatsapp hover:bg-whatsapp-dark"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Announcement
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
