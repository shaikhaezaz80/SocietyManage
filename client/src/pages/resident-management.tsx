import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { 
  UserPlus, 
  Search, 
  Building,
  Users,
  Home,
  Phone,
  Mail,
  MapPin,
  Edit,
  MessageSquare,
  CreditCard,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ResidentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Mock data for demonstration
  const flats = [
    {
      id: 1,
      flatNumber: "A-101",
      building: "A",
      floor: 1,
      type: "2 BHK",
      area: 1200,
      isOccupied: true,
      owner: { name: "Priya Sharma", phone: "+91 98765 43210", email: "priya@email.com" },
      tenant: null,
      monthlyMaintenance: 3500,
      parkingSlots: 1
    },
    {
      id: 2,
      flatNumber: "A-102",
      building: "A", 
      floor: 1,
      type: "3 BHK",
      area: 1500,
      isOccupied: true,
      owner: { name: "Rohit Gupta", phone: "+91 87654 32109", email: "rohit@email.com" },
      tenant: null,
      monthlyMaintenance: 4200,
      parkingSlots: 2
    },
    {
      id: 3,
      flatNumber: "B-205",
      building: "B",
      floor: 2,
      type: "3 BHK", 
      area: 1450,
      isOccupied: true,
      owner: { name: "Rajesh Kumar", phone: "+91 76543 21098", email: "rajesh@email.com" },
      tenant: { name: "Amit Patel", phone: "+91 65432 10987", email: "amit@email.com" },
      monthlyMaintenance: 4000,
      parkingSlots: 1
    },
    {
      id: 4,
      flatNumber: "C-302",
      building: "C",
      floor: 3,
      type: "2 BHK",
      area: 1100,
      isOccupied: false,
      owner: null,
      tenant: null,
      monthlyMaintenance: 3200,
      parkingSlots: 1
    }
  ];

  const buildings = [
    { id: "A", name: "Building A", floors: 4, flatsPerFloor: 4, totalFlats: 16 },
    { id: "B", name: "Building B", floors: 5, flatsPerFloor: 4, totalFlats: 20 },
    { id: "C", name: "Building C", floors: 3, flatsPerFloor: 6, totalFlats: 18 }
  ];

  const filteredFlats = flats.filter((flat) => {
    const matchesSearch = flat.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flat.owner?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flat.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBuilding = buildingFilter === "all" || flat.building === buildingFilter;
    const matchesType = typeFilter === "all" || 
      (typeFilter === "owner" && flat.owner && !flat.tenant) ||
      (typeFilter === "tenant" && flat.tenant) ||
      (typeFilter === "vacant" && !flat.isOccupied);
    
    return matchesSearch && matchesBuilding && matchesType;
  });

  const getOverviewStats = () => {
    return {
      totalFlats: flats.length,
      occupied: flats.filter(f => f.isOccupied).length,
      vacant: flats.filter(f => !f.isOccupied).length,
      maintenanceDue: flats.filter(f => Math.random() > 0.8).length // Mock due flats
    };
  };

  const stats = getOverviewStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      
      <main className="lg:ml-64 pt-16 pb-20 lg:pb-4">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold">Flat & Resident Management</h1>
              <p className="text-muted-foreground">
                Manage residents and flat allocations
              </p>
            </div>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button className="bg-whatsapp hover:bg-whatsapp-dark">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Resident
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Resident</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Resident Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="tenant">Tenant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input placeholder="Enter full name" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input placeholder="+91 XXXXX XXXXX" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input type="email" placeholder="email@example.com" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Flat Number</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select flat" />
                      </SelectTrigger>
                      <SelectContent>
                        {flats.filter(f => !f.isOccupied).map(flat => (
                          <SelectItem key={flat.id} value={flat.flatNumber}>
                            {flat.flatNumber} - {flat.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Family Members</Label>
                    <Input type="number" placeholder="Number of family members" />
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button className="flex-1 bg-whatsapp hover:bg-whatsapp-dark">
                      Add Resident
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stats.totalFlats}</p>
                <p className="text-sm text-muted-foreground">Total Flats</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.occupied}</p>
                <p className="text-sm text-muted-foreground">Occupied</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.vacant}</p>
                <p className="text-sm text-muted-foreground">Vacant</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{stats.maintenanceDue}</p>
                <p className="text-sm text-muted-foreground">Maintenance Due</p>
              </CardContent>
            </Card>
          </div>

          {/* Building Layout */}
          <Card>
            <CardHeader>
              <CardTitle>Building Layout</CardTitle>
              <CardDescription>Overview of all buildings and occupancy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {buildings.map(building => (
                  <div key={building.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Building className="w-4 h-4 mr-2" />
                      {building.name}
                    </h4>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {Array.from({ length: 12 }, (_, i) => {
                        const flatNumber = `${building.id}-${Math.floor(i/4) + 1}0${(i%4) + 1}`;
                        const flatData = flats.find(f => f.flatNumber === flatNumber);
                        const isOccupied = flatData?.isOccupied;
                        const hasMaintenanceDue = Math.random() > 0.8;
                        
                        return (
                          <div 
                            key={i}
                            className={`h-8 rounded text-xs flex items-center justify-center text-white font-medium ${
                              hasMaintenanceDue ? 'bg-red-500' : 
                              isOccupied ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            {flatNumber}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{building.floors} floors</span>
                      <span>{building.totalFlats} total flats</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Occupied</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                  <span>Vacant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Maintenance Due</span>
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
                      placeholder="Search by flat number or resident name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="All Buildings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Buildings</SelectItem>
                    {buildings.map(building => (
                      <SelectItem key={building.id} value={building.id}>
                        Building {building.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="vacant">Vacant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Residents Directory */}
          <Card>
            <CardHeader>
              <CardTitle>Resident Directory</CardTitle>
              <CardDescription>All residents and flat details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Flat Details</TableHead>
                      <TableHead>Resident</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Maintenance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFlats.map((flat) => (
                      <TableRow key={flat.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{flat.flatNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {flat.type} • {flat.area} sq ft
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Floor {flat.floor} • {flat.parkingSlots} parking
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {flat.isOccupied ? (
                            <div>
                              <p className="font-medium">{flat.owner?.name || flat.tenant?.name}</p>
                              {flat.tenant && (
                                <p className="text-sm text-muted-foreground">
                                  Owner: {flat.owner?.name}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Vacant</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {flat.isOccupied ? (
                            <Badge variant={flat.tenant ? "secondary" : "default"}>
                              {flat.tenant ? "Tenant" : "Owner"}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Vacant</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {flat.isOccupied && (
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <Phone className="w-3 h-3 mr-1" />
                                {flat.owner?.phone || flat.tenant?.phone}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Mail className="w-3 h-3 mr-1" />
                                {flat.owner?.email || flat.tenant?.email}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">₹{flat.monthlyMaintenance?.toLocaleString()}</p>
                            <Badge variant={Math.random() > 0.8 ? "destructive" : "secondary"} className="text-xs">
                              {Math.random() > 0.8 ? "Due" : "Paid"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              {flat.isOccupied && (
                                <>
                                  <DropdownMenuItem>
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Send Message
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    View Bills
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem className="text-red-600">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Report Issue
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
