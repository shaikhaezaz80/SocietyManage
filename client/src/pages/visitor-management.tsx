import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import VisitorForm from "@/components/visitors/visitor-form";
import VisitorList from "@/components/visitors/visitor-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Search, Filter, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Visitor {
  id: number;
  name: string;
  phone: string;
  visitorType: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  createdAt: string;
}

export default function VisitorManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: visitors = [], isLoading } = useQuery<Visitor[]>({
    queryKey: ["/api/visitors", statusFilter],
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  const updateVisitorMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/visitors/${id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitors"] });
      toast({
        title: "Success",
        description: "Visitor status updated successfully",
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

  const exportVisitorsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/visitors/export");
      return await res.blob();
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `visitors-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: "Visitor logs exported successfully",
      });
    },
  });

  const filteredVisitors = visitors.filter((visitor) => {
    const matchesStatus = statusFilter === "all" || visitor.status === statusFilter;
    const matchesSearch = visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visitor.phone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const visitorStats = {
    total: visitors.length,
    inside: visitors.filter(v => v.status === "inside").length,
    pending: visitors.filter(v => v.status === "pending").length,
    exited: visitors.filter(v => v.status === "exited").length,
  };

  const handleStatusUpdate = (visitorId: number, newStatus: string) => {
    updateVisitorMutation.mutate({
      id: visitorId,
      updates: { status: newStatus }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <main className="lg:ml-64 pt-16 pb-20 lg:pb-4">
          <div className="p-4 flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-whatsapp mx-auto mb-4"></div>
              <p className="text-gray-600">Loading visitors...</p>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      
      <main className="lg:ml-64 pt-16 pb-20 lg:pb-4">
        <div className="p-4 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Visitor Management</h1>
              <p className="text-gray-600">Track and manage society visitors</p>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-2">
              <Button
                onClick={() => exportVisitorsMutation.mutate()}
                variant="outline"
                disabled={exportVisitorsMutation.isPending}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Logs
              </Button>
              
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button className="bg-whatsapp hover:bg-whatsapp-dark">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Visitor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Visitor</DialogTitle>
                  </DialogHeader>
                  <VisitorForm 
                    onSuccess={() => {
                      setShowForm(false);
                      queryClient.invalidateQueries({ queryKey: ["/api/visitors"] });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{visitorStats.total}</p>
                  <p className="text-sm text-gray-600">Total Today</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{visitorStats.inside}</p>
                  <p className="text-sm text-gray-600">Currently Inside</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{visitorStats.pending}</p>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">{visitorStats.exited}</p>
                  <p className="text-sm text-gray-600">Exited</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search visitors by name or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inside">Inside</SelectItem>
                    <SelectItem value="exited">Exited</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Visitor List */}
          <VisitorList 
            visitors={filteredVisitors}
            onStatusUpdate={handleStatusUpdate}
            isUpdating={updateVisitorMutation.isPending}
          />
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
