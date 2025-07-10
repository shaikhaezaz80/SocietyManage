import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  UserCheck, 
  Building, 
  Megaphone, 
  AlertTriangle,
  CreditCard,
  Calendar,
  FileText,
  BarChart3,
  Shield,
  Package,
  MessageSquare,
  Settings,
  LogOut
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const getMenuItems = () => {
    const baseItems = [
      { href: "/", icon: Home, label: "Dashboard" },
    ];

    switch (user?.role) {
      case "admin":
        return [
          ...baseItems,
          { href: "/visitors", icon: UserCheck, label: "Visitor Management" },
          { href: "/staff", icon: Users, label: "Staff Management" },
          { href: "/residents", icon: Building, label: "Residents" },
          { href: "/announcements", icon: Megaphone, label: "Announcements" },
          { href: "/complaints", icon: AlertTriangle, label: "Complaints" },
          { href: "/maintenance", icon: CreditCard, label: "Maintenance & Bills" },
          { href: "/amenities", icon: Calendar, label: "Amenities" },
          { href: "/documents", icon: FileText, label: "Documents" },
          { href: "/finance", icon: BarChart3, label: "Finance" },
          { href: "/security", icon: Shield, label: "Security" },
          { href: "/messaging", icon: MessageSquare, label: "Messages" },
          { href: "/settings", icon: Settings, label: "Settings" },
        ];
      
      case "guard":
        return [
          ...baseItems,
          { href: "/visitors", icon: UserCheck, label: "Visitor Entry" },
          { href: "/staff", icon: Users, label: "Staff Check-in" },
          { href: "/security", icon: Shield, label: "Security Watchlist" },
          { href: "/messaging", icon: MessageSquare, label: "Messages" },
        ];
      
      case "auditor":
        return [
          ...baseItems,
          { href: "/finance", icon: BarChart3, label: "Finance Reports" },
          { href: "/documents", icon: FileText, label: "Audit Documents" },
        ];
      
      default: // resident
        return [
          ...baseItems,
          { href: "/visitors", icon: UserCheck, label: "My Visitors" },
          { href: "/complaints", icon: AlertTriangle, label: "Complaints" },
          { href: "/maintenance", icon: CreditCard, label: "Payments" },
          { href: "/amenities", icon: Calendar, label: "Amenities" },
          { href: "/announcements", icon: Megaphone, label: "Announcements" },
          { href: "/documents", icon: FileText, label: "Documents" },
          { href: "/messaging", icon: MessageSquare, label: "Messages" },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 bottom-0 w-64 bg-white shadow-lg transform transition-transform duration-300 z-50
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-0
      `}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{user?.name}</h3>
              <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
              <p className="text-xs text-gray-500">Greenwood Heights</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start space-x-3 ${
                    isActive 
                      ? "bg-green-600 text-white hover:bg-green-700" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={onClose}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 text-red-600 hover:bg-red-50"
            onClick={() => {
              logoutMutation.mutate();
              onClose();
            }}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
