import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Home, UserCheck, AlertTriangle, CreditCard, MessageCircle, Menu
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";

interface MobileNavProps {
  onMenuToggle: () => void;
}

export default function MobileNav({ onMenuToggle }: MobileNavProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [location, setLocation] = useLocation();

  const navItems = [
    { icon: Home, label: t('home'), path: '/' },
    { icon: UserCheck, label: t('visitors'), path: '/visitors' },
    { icon: AlertTriangle, label: t('issues'), path: '/complaints' },
    { icon: CreditCard, label: t('bills'), path: '/payments' },
    { icon: MessageCircle, label: t('messages'), path: '/messages', badge: 2 },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            className={cn(
              "flex flex-col items-center space-y-1 px-3 py-2 h-auto",
              location === item.path ? "text-green-600" : "text-gray-500"
            )}
            onClick={() => setLocation(item.path)}
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.badge && (
                <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                  {item.badge}
                </Badge>
              )}
            </div>
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
        
        {/* More Menu */}
        <Button
          variant="ghost"
          className="flex flex-col items-center space-y-1 px-3 py-2 h-auto text-gray-500"
          onClick={onMenuToggle}
        >
          <Menu className="w-5 h-5" />
          <span className="text-xs">{t('more')}</span>
        </Button>
      </div>
    </nav>
  );
}
