import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  Calendar, 
  UserPlus, 
  MessageSquare,
  CreditCard,
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: visitors = [] } = useQuery({
    queryKey: ["/api/visitors"],
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["/api/complaints"],
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ["/api/announcements"],
  });

  // Calculate stats
  const visitorStats = {
    total: visitors.length,
    inside: visitors.filter((v: any) => v.status === 'inside').length,
    pending: visitors.filter((v: any) => v.status === 'pending').length,
    today: visitors.filter((v: any) => {
      const today = new Date().toDateString();
      return new Date(v.createdAt).toDateString() === today;
    }).length
  };

  const complaintStats = {
    total: complaints.length,
    open: complaints.filter((c: any) => c.status === 'open').length,
    inProgress: complaints.filter((c: any) => c.status === 'in_progress').length,
    resolved: complaints.filter((c: any) => c.status === 'resolved').length
  };

  const staffStats = {
    total: staff.length,
    active: staff.filter((s: any) => s.isActive).length,
    present: Math.floor(staff.length * 0.85), // Mock attendance
    absent: Math.floor(staff.length * 0.15)
  };

  const getQuickActions = () => {
    const actions = [
      {
        icon: UserPlus,
        label: "Add Visitor",
        href: "/visitors",
        color: "bg-blue-500",
        available: ["admin", "guard", "resident"]
      },
      {
        icon: AlertTriangle,
        label: "Raise Complaint",
        href: "/complaints",
        color: "bg-orange-500",
        available: ["admin", "resident"]
      },
      {
        icon: CreditCard,
        label: "Pay Bills",
        href: "/maintenance",
        color: "bg-green-500",
        available: ["admin", "resident"]
      },
      {
        icon: Calendar,
        label: "Book Amenity",
        href: "/amenities",
        color: "bg-purple-500",
        available: ["admin", "resident"]
      },
      {
        icon: MessageSquare,
        label: "Send Notice",
        href: "/announcements",
        color: "bg-indigo-500",
        available: ["admin"]
      },
      {
        icon: ClipboardList,
        label: "Staff Check-in",
        href: "/staff",
        color: "bg-teal-500",
        available: ["admin", "guard"]
      }
    ];

    return actions.filter(action => action.available.includes(user?.role || "resident"));
  };

  const getRecentActivities = () => {
    const activities = [
      {
        type: "visitor",
        icon: Users,
        title: "New Visitor Entry",
        description: "Amazon Delivery - A-101",
        time: "2 min ago",
        color: "text-green-600 bg-green-100"
      },
      {
        type: "announcement",
        icon: MessageSquare,
        title: "New Announcement",
        description: "Water supply maintenance scheduled",
        time: "1 hour ago",
        color: "text-blue-600 bg-blue-100"
      },
      {
        type: "complaint",
        icon: AlertTriangle,
        title: "Complaint Resolved",
        description: "Elevator repair completed - B Block",
        time: "3 hours ago",
        color: "text-orange-600 bg-orange-100"
      },
      {
        type: "payment",
        icon: CreditCard,
        title: "Payment Received",
        description: "Maintenance fee - C-205",
        time: "5 hours ago",
        color: "text-purple-600 bg-purple-100"
      }
    ];

    return activities;
  };

  const getRoleSpecificStats = () => {
    switch (user?.role) {
      case "guard":
        return [
          {
            title: "Active Visitors",
            value: visitorStats.inside,
            icon: Users,
            color: "text-green-600",
            change: "+2 from yesterday"
          },
          {
            title: "Pending Approvals",
            value: visitorStats.pending,
            icon: Clock,
            color: "text-orange-600",
            change: "3 waiting"
          },
          {
            title: "Staff Present",
            value: staffStats.present,
            icon: CheckCircle,
            color: "text-blue-600",
            change: `${staffStats.active} total active`
          },
          {
            title: "Security Status",
            value: "Normal",
            icon: Shield,
            color: "text-green-600",
            change: "All systems operational"
          }
        ];
      
      case "admin":
        return [
          {
            title: "Total Residents",
            value: 156,
            icon: Users,
            color: "text-blue-600",
            change: "+3 this month"
          },
          {
            title: "Open Complaints",
            value: complaintStats.open,
            icon: AlertTriangle,
            color: "text-orange-600",
            change: `${complaintStats.inProgress} in progress`
          },
          {
            title: "Collection Rate",
            value: "87%",
            icon: TrendingUp,
            color: "text-green-600",
            change: "+5% from last month"
          },
          {
            title: "Pending Dues",
            value: "₹45K",
            icon: XCircle,
            color: "text-red-600",
            change: "8 flats pending"
          }
        ];
      
      default: // resident
        return [
          {
            title: "My Visitors",
            value: visitorStats.today,
            icon: Users,
            color: "text-blue-600",
            change: "Today's count"
          },
          {
            title: "My Complaints",
            value: 2,
            icon: AlertTriangle,
            color: "text-orange-600",
            change: "1 resolved this week"
          },
          {
            title: "Due Amount",
            value: "₹5,500",
            icon: CreditCard,
            color: "text-red-600",
            change: "Overdue by 3 days"
          },
          {
            title: "Bookings",
            value: 1,
            icon: Calendar,
            color: "text-purple-600",
            change: "Swimming pool tomorrow"
          }
        ];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      
      <main className="lg:ml-64 pt-16 pb-20 lg:pb-4">
        <div className="p-4 space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-whatsapp to-green-600 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-green-100">
              {user?.role === 'guard' && "Ready to manage today's security operations."}
              {user?.role === 'admin' && "Here's your society overview for today."}
              {user?.role === 'resident' && "Stay connected with your society updates."}
              {user?.role === 'auditor' && "Financial reports and audit trails await."}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {getRoleSpecificStats().map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color} bg-opacity-10`}>
                        <IconComponent className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground truncate">{stat.title}</p>
                        <p className="text-lg font-semibold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.change}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {getQuickActions().map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <Link key={index} href={action.href}>
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center space-y-2 hover:bg-muted/50 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-center">{action.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest updates from your society</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getRecentActivities().map((activity, index) => {
                  const IconComponent = activity.icon;
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Announcements */}
          {announcements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Announcements</CardTitle>
                <CardDescription>Important updates from management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {announcements.slice(0, 3).map((announcement: any, index: number) => (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{announcement.title}</h4>
                        <Badge variant={announcement.priority === 'high' ? 'destructive' : 'secondary'}>
                          {announcement.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
