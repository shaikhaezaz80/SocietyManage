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
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Camera,
  MapPin,
  Star,
  TrendingUp,
  Wrench,
  Droplets,
  Zap,
  Fan,
  Volume2,
  Car
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const COMPLAINT_CATEGORIES = {
  maintenance: { icon: Wrench, label: "Maintenance", color: "bg-orange-100 text-orange-800" },
  plumbing: { icon: Droplets, label: "Plumbing", color: "bg-blue-100 text-blue-800" },
  electrical: { icon: Zap, label: "Electrical", color: "bg-yellow-100 text-yellow-800" },
  security: { icon: AlertTriangle, label: "Security", color: "bg-red-100 text-red-800" },
  cleanliness: { icon: Fan, label: "Cleanliness", color: "bg-green-100 text-green-800" },
  noise: { icon: Volume2, label: "Noise", color: "bg-purple-100 text-purple-800" },
  parking: { icon: Car, label: "Parking", color: "bg-indigo-100 text-indigo-800" },
  other: { icon: AlertTriangle, label: "Other", color: "bg-gray-100 text-gray-800" }
};

export default function Complaints() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["/api/complaints", statusFilter, categoryFilter],
  });

  const createComplaintMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/complaints", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to create complaint");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      setShowCreateModal(false);
      toast({
        title: "Success",
        description: "Complaint submitted successfully",
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

  const updateComplaintMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/complaints/${id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({
        title: "Success",
        description: "Complaint updated successfully",
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

  const handleCreateComplaint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createComplaintMutation.mutate(formData);
  };

  const filteredComplaints = complaints.filter((complaint: any) => {
    const matchesSearch = complaint.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || complaint.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "destructive",
      in_progress: "default", 
      resolved: "secondary",
      escalated: "outline",
      closed: "outline"
    } as const;
    
    return variants[status as keyof typeof variants] || "outline";
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "outline",
      medium: "default",
      high: "destructive", 
      critical: "destructive"
    } as const;
    
    return variants[priority as keyof typeof variants] || "outline";
  };

  const complaintStats = {
    total: complaints.length,
    open: complaints.filter((c: any) => c.status === "open").length,
    inProgress: complaints.filter((c: any) => c.status === "in_progress").length,
    resolved: complaints.filter((c: any) => c.status === "resolved").length,
    escalated: complaints.filter((c: any) => c.status === "escalated").length,
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
              <h1 className="text-2xl font-bold">Complaint Management</h1>
              <p className="text-muted-foreground">
                Track and resolve society issues
              </p>
            </div>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="bg-whatsapp hover:bg-whatsapp-dark">
                  <Plus className="w-4 h-4 mr-2" />
                  Raise Complaint
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Raise New Complaint</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateComplaint} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(COMPLAINT_CATEGORIES).map(([key, category]) => (
                          <SelectItem key={key} value={key}>
                            {category.label}
                          </SelectItem>
                        ))}
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
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Issue Title</Label>
                    <Input 
                      id="title" 
                      name="title" 
                      required 
                      placeholder="Brief description of the issue" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      required 
                      placeholder="Provide detailed information about the issue..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location" 
                      name="location" 
                      placeholder="e.g., A-Block lift, Swimming pool area" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="flatId">Your Flat</Label>
                    <Select name="flatId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your flat" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">A-101</SelectItem>
                        <SelectItem value="2">A-102</SelectItem>
                        <SelectItem value="3">B-205</SelectItem>
                        <SelectItem value="4">C-302</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="images">Photo Evidence</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input 
                        type="file" 
                        name="images" 
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        id="complaint-images"
                      />
                      <label 
                        htmlFor="complaint-images" 
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Camera className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Tap to add photos</span>
                      </label>
                    </div>
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
                      disabled={createComplaintMutation.isPending} 
                      className="flex-1 bg-whatsapp hover:bg-whatsapp-dark"
                    >
                      {createComplaintMutation.isPending ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{complaintStats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{complaintStats.open}</p>
                <p className="text-sm text-muted-foreground">Open</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{complaintStats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{complaintStats.resolved}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{complaintStats.escalated}</p>
                <p className="text-sm text-muted-foreground">Escalated</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Complaint Categories</CardTitle>
              <CardDescription>Issues by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(COMPLAINT_CATEGORIES).map(([key, category]) => {
                  const IconComponent = category.icon;
                  const count = complaints.filter((c: any) => c.category === key).length;
                  
                  return (
                    <div key={key} className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setCategoryFilter(key)}>
                      <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-gray-100 flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="font-medium text-sm">{category.label}</p>
                      <p className="text-xs text-muted-foreground">{count} open</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search complaints..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(COMPLAINT_CATEGORIES).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Complaints List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp"></div>
              </div>
            ) : filteredComplaints.length > 0 ? (
              filteredComplaints.map((complaint: any) => {
                const category = COMPLAINT_CATEGORIES[complaint.category as keyof typeof COMPLAINT_CATEGORIES];
                const IconComponent = category?.icon || AlertTriangle;
                
                return (
                  <Card key={complaint.id} className={`border-l-4 ${
                    complaint.priority === 'critical' || complaint.priority === 'high' ? 'border-l-red-500' :
                    complaint.status === 'resolved' ? 'border-l-green-500' :
                    complaint.status === 'in_progress' ? 'border-l-blue-500' :
                    'border-l-gray-500'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          complaint.priority === 'critical' || complaint.priority === 'high' ? 'bg-red-100 text-red-600' :
                          complaint.status === 'resolved' ? 'bg-green-100 text-green-600' :
                          complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{complaint.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {complaint.flatId} • Ticket #{complaint.id.toString().padStart(4, '0')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={getPriorityBadge(complaint.priority)}>
                                {complaint.priority}
                              </Badge>
                              <Badge variant={getStatusBadge(complaint.status)}>
                                {complaint.status?.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mb-3 leading-relaxed">
                            {complaint.description}
                          </p>
                          
                          {complaint.location && (
                            <div className="flex items-center text-sm text-muted-foreground mb-3">
                              <MapPin className="w-4 h-4 mr-1" />
                              {complaint.location}
                            </div>
                          )}
                          
                          {complaint.status === 'resolved' && (
                            <div className="mb-3 p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-800">Resolution</span>
                              </div>
                              <p className="text-sm text-green-700">
                                {complaint.resolutionNotes || "Issue has been resolved successfully."}
                              </p>
                              {complaint.satisfactionRating && (
                                <div className="flex items-center space-x-1 mt-2">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`w-4 h-4 ${
                                        i < complaint.satisfactionRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`} 
                                    />
                                  ))}
                                  <span className="text-sm text-green-600 ml-2">Excellent feedback</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {new Date(complaint.createdAt).toLocaleDateString()}
                              </span>
                              <span>Category: {category?.label}</span>
                            </div>
                            
                            {user?.role === "admin" && complaint.status !== 'resolved' && (
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateComplaintMutation.mutate({
                                    id: complaint.id,
                                    updates: { status: 'in_progress' }
                                  })}
                                  disabled={updateComplaintMutation.isPending}
                                >
                                  Assign
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateComplaintMutation.mutate({
                                    id: complaint.id,
                                    updates: { status: 'resolved', resolvedAt: new Date() }
                                  })}
                                  disabled={updateComplaintMutation.isPending}
                                >
                                  Mark Resolved
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Complaints Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== "all" || categoryFilter !== "all" 
                      ? "Try adjusting your filters to see more results" 
                      : "No complaints have been submitted yet"
                    }
                  </p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-whatsapp hover:bg-whatsapp-dark"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Raise Complaint
                  </Button>
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
