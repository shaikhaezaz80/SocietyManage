import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Home, Users, UserCheck, Building, Megaphone, AlertTriangle, 
  CreditCard, Package, Dumbbell, FileText, TrendingUp, Shield,
  MessageCircle, Boxes, Settings, X
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [location, setLocation] = useLocation();

  const getMenuItems = () => {
    const baseItems = [
      { icon: Home, label: t('dashboard'), path: '/', roles: ['admin', 'guard', 'resident', 'auditor'] },
      { icon: UserCheck, label: t('visitors'), path: '/visitors', roles: ['admin', 'guard', 'resident'] },
      { icon: Users, label: t('staff'), path: '/staff', roles: ['admin', 'guard'] },
      { icon: Building, label: t('residents'), path: '/residents', roles: ['admin'] },
      { icon: AlertTriangle, label: t('complaints'), path: '/complaints', roles: ['admin', 'resident'] },
      { icon: CreditCard, label: t('payments'), path: '/payments', roles: ['admin', 'resident', 'auditor'] },
      { icon: Package, label: t('deliveries'), path: '/deliveries', roles: ['admin', 'guard'] },
      { icon: Dumbbell, label: t('amenities'), path: '/amenities', roles: ['admin', 'resident'] },
      { icon: Megaphone, label: t('announcements'), path: '/announcements', roles: ['admin', 'resident'] },
      { icon: FileText, label: t('documents'), path: '/documents', roles: ['admin', 'resident', 'auditor'] },
      { icon: TrendingUp, label: t('finance'), path: '/finance', roles: ['admin', 'auditor'] },
      { icon: Shield, label: t('security'), path: '/security', roles: ['admin', 'guard'] },
      { icon: Boxes, label: t('inventory'), path: '/inventory', roles: ['admin'] },
      { icon: MessageCircle, label: t('messages'), path: '/messages', roles: ['admin', 'guard', 'resident'] },
    ];

    return baseItems.filter(item => item.roles.includes(user?.role || 'resident'));
  };

  const menuItems = getMenuItems();

  const handleNavigation = (path: string) => {
    setLocation(path);
    onClose();
  };

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
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 z-50",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:static lg:z-auto"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-bold">GateSphere</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {t(user?.role || 'user')}
                  </Badge>
                  {user?.flatNumber && (
                    <span className="text-xs text-muted-foreground">{user.flatNumber}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Greenwood Heights</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant={location === item.path ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start space-x-3",
                  location === item.path && "bg-green-500 text-white hover:bg-green-600"
                )}
                onClick={() => handleNavigation(item.path)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Button>
            ))}
          </nav>

          {/* Emergency Button (Guards only) */}
          {user?.role === 'guard' && (
            <div className="p-4 border-t border-gray-200">
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                <AlertTriangle className="w-4 h-4 mr-2" />
                {t('emergency')}
              </Button>
            </div>
          )}

          {/* Settings */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start space-x-3"
              onClick={() => handleNavigation('/settings')}
            >
              <Settings className="w-5 h-5" />
              <span>{t('settings')}</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
