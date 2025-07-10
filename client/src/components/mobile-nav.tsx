import { Link, useLocation } from "wouter";
import { Home, Users, AlertTriangle, CreditCard, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/visitors", icon: Users, label: "Visitors" },
    { href: "/complaints", icon: AlertTriangle, label: "Issues" },
    { href: "/maintenance", icon: CreditCard, label: "Bills" },
    { href: "/messaging", icon: MessageSquare, label: "Messages" },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (item.href === "/visitors" && user?.role === "resident") {
      return false; // Residents see visitor management differently
    }
    if (item.href === "/maintenance" && (user?.role === "guard")) {
      return false; // Guards don't need bill payment
    }
    return true;
  });

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around py-2">
        {filteredNavItems.map((item) => {
          const isActive = location === item.href || 
            (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <button className={`flex flex-col items-center space-y-1 p-2 ${
                isActive ? "text-green-600" : "text-gray-500"
              }`}>
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
