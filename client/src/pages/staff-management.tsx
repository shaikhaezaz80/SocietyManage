import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { 
  UserPlus, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle,
  Edit,
  MoreVertical,
  Camera,
  Phone,
  Users,
  Fan,
  Shield,
  Wrench,
  Leaf,
  Bus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";

const STAFF_CATEGORIES = {
  housekeeping: { icon: Fan, label: "Housekeeping", color: "bg-blue-100 text-blue-800" },
  security: { icon: Shield, label: "Security", color: "bg-green-100 text-green-800" },
  maintenance: { icon: Wrench, label: "Maintenance", color: "bg-orange-100 text-orange-800" },
  gardening: { icon: Leaf, label: "Gardening", color: "bg-emerald-100 text-emerald-800" },
  management: { icon: Bus, label: "Management", color: "bg-purple-100 text-purple-800" },
};

export default function StaffManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const { data: staff, isLoading } = useQuery({
    queryKey: ["/api/staff"],
  });

  const addStaffMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/staff", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to add staff");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setShowAddModal(false);
      toast({
        title: "Success",
        description: "Staff member added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add staff member",
        variant: "destructive",
      });
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: async ({ staffId, status }: { staffId: number; status: string }) => {
      const response = await apiRequest("POST", `/api/staff/${staffId}/attendance`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    },
  });

  const handleAddStaff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addStaffMutation.mutate(formData);
  };

  const markAttendance = (staffId: number, status: string) => {
    attendanceMutation.mutate({ staffId, status });
  };

  const filteredStaff = staff?.filter((member: any) => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);
    const matchesCategory = categoryFilter === "all" || member.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getStaffStats = () => {
    if (!staff) return { total: 0, present: 0, absent: 0 };
    
    return {
      total: staff.length,
      present: staff.filter((s: any) => s.isActive).length,
      absent: staff.filter((s: any) => !s.isActive).length,
    };
  };

  const stats = getStaffStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      
      <main className="lg:ml-64 pt-16 pb-20 lg:pb-4">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold">Staff Management</h1>
              <p className="text-muted-foreground">
                Manage and track all staff members
              </p>
            </div>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button className="bg-whatsapp hover:bg-whatsapp-dark">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Staff Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" required placeholder="Enter staff name" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" required placeholder="+91 XXXXX XXXXX" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STAFF_CATEGORIES).map(([key, category]) => (
                          <SelectItem key={key} value={key}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="shiftTiming">Shift Timing</Label>
                    <Select name="shiftTiming">
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (6 AM - 2 PM)</SelectItem>
                        <SelectItem value="day">Day (9 AM - 6 PM)</SelectItem>
                        <SelectItem value="evening">Evening (2 PM - 10 PM)</SelectItem>
                        <SelectItem value="night">Night (8 PM - 6 AM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="salary">Monthly Salary</Label>
                    <Input id="salary" name="salary" type="number" placeholder="Enter salary amount" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="idProofType">ID Proof Type</Label>
                    <Select name="idProofType">
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID proof" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aadhar">Aadhar Card</SelectItem>
                        <SelectItem value="voter">Voter ID</SelectItem>
                        <SelectItem value="pan">PAN Card</SelectItem>
                        <SelectItem value="driving">Driving License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="idProofNumber">ID Proof Number</Label>
                    <Input id="idProofNumber" name="idProofNumber" placeholder="Enter ID number" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" name="address" placeholder="Enter residential address" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input id="emergencyContact" name="emergencyContact" type="tel" placeholder="+91 XXXXX XXXXX" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="photo">Photo</Label>
                    <Input id="photo" name="photo" type="file" accept="image/*" />
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addStaffMutation.isPending} className="flex-1 bg-whatsapp hover:bg-whatsapp-dark">
                      {addStaffMutation.isPending ? "Adding..." : "Add Staff"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Staff Categories Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(STAFF_CATEGORIES).map(([key, category]) => {
              const IconComponent = category.icon;
              const count = staff?.filter((s: any) => s.category === key).length || 0;
              
              return (
                <Card key={key} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCategoryFilter(key)}>
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-gray-100 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-sm">{category.label}</h3>
                    <p className="text-xs text-muted-foreground">{count} active</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
              <CardDescription>Staff attendance summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">2</p>
                  <p className="text-sm text-muted-foreground">Late</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search staff by name or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(STAFF_CATEGORIES).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Staff Directory */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Directory</CardTitle>
              <CardDescription>All staff members and their details</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp"></div>
                </div>
              ) : filteredStaff && filteredStaff.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaff.map((member: any) => {
                        const category = STAFF_CATEGORIES[member.category as keyof typeof STAFF_CATEGORIES];
                        return (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  {member.photoUrl ? (
                                    <img src={member.photoUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                                  ) : (
                                    <Users className="w-5 h-5 text-gray-500" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{member.name}</p>
                                  <p className="text-sm text-muted-foreground">{member.phone}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={category?.color}>
                                {category?.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{member.shiftTiming}</p>
                                <p className="text-xs text-muted-foreground">
                                  {member.shiftTiming === 'morning' && '6:00 AM - 2:00 PM'}
                                  {member.shiftTiming === 'day' && '9:00 AM - 6:00 PM'}
                                  {member.shiftTiming === 'evening' && '2:00 PM - 10:00 PM'}
                                  {member.shiftTiming === 'night' && '8:00 PM - 6:00 AM'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={member.isActive ? "default" : "secondary"}>
                                {member.isActive ? "Present" : "Absent"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAttendance(member.id, member.isActive ? "absent" : "present")}
                                  disabled={attendanceMutation.isPending}
                                >
                                  <Clock className="w-4 h-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Phone className="w-4 h-4 mr-2" />
                                      Call
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Remove
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No staff members found</p>
                  <p className="text-sm text-gray-400">Add staff members to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
