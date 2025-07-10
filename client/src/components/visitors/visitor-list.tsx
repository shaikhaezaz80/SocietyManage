import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MoreVertical, QrCode, LogOut, Ban, Phone, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";

interface Visitor {
  id: number;
  name: string;
  phone: string;
  visitorType: string;
  status: string;
  entryTime: string | null;
  exitTime: string | null;
  purpose: string;
  vehicleNumber: string | null;
  createdAt: string;
}

interface VisitorListProps {
  visitors: Visitor[];
}

export default function VisitorList({ visitors }: VisitorListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const updateVisitorMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/visitors/${id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitors"] });
      toast({
        title: t('success'),
        description: t('visitorStatusUpdated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (visitorId: number, newStatus: string) => {
    const updates: any = { status: newStatus };
    
    if (newStatus === 'approved') {
      updates.entryTime = new Date().toISOString();
    } else if (newStatus === 'exited') {
      updates.exitTime = new Date().toISOString();
    }

    updateVisitorMutation.mutate({ id: visitorId, updates });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'bg-amber-100 text-amber-800',
      'approved': 'bg-blue-100 text-blue-800',
      'inside': 'bg-green-100 text-green-800',
      'exited': 'bg-gray-100 text-gray-800',
      'blocked': 'bg-red-100 text-red-800'
    };
    
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getVisitorTypeIcon = (type: string) => {
    switch (type) {
      case 'delivery': return '📦';
      case 'service': return '🔧';
      case 'cab': return '🚗';
      case 'vendor': return '🏪';
      default: return '👤';
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '-';
    }
  };

  const canApprove = (visitor: Visitor) => {
    return visitor.status === 'pending' && (user?.role === 'admin' || user?.role === 'guard');
  };

  const canMarkEntry = (visitor: Visitor) => {
    return visitor.status === 'approved' && (user?.role === 'admin' || user?.role === 'guard');
  };

  const canMarkExit = (visitor: Visitor) => {
    return visitor.status === 'inside' && (user?.role === 'admin' || user?.role === 'guard');
  };

  if (!visitors.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('noVisitorsFound')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('addFirstVisitor')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {visitors.map((visitor) => (
        <Card key={visitor.id}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-gray-200">
                  <span className="text-lg">{getVisitorTypeIcon(visitor.visitorType)}</span>
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium truncate">{visitor.name}</h3>
                  <Badge className={getStatusBadge(visitor.status)}>
                    {t(visitor.status)}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span>{visitor.phone}</span>
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{t(visitor.visitorType)}</span>
                  </div>
                  
                  {visitor.vehicleNumber && (
                    <p className="text-xs">🚗 {visitor.vehicleNumber}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs">
                    <span>
                      {t('created')}: {formatTime(visitor.createdAt)}
                    </span>
                    {visitor.entryTime && (
                      <span>
                        {t('entered')}: {formatTime(visitor.entryTime)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canApprove(visitor) && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(visitor.id, 'approved')}>
                      <QrCode className="w-4 h-4 mr-2" />
                      {t('approve')}
                    </DropdownMenuItem>
                  )}
                  
                  {canMarkEntry(visitor) && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(visitor.id, 'inside')}>
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('markEntry')}
                    </DropdownMenuItem>
                  )}
                  
                  {canMarkExit(visitor) && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(visitor.id, 'exited')}>
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('markExit')}
                    </DropdownMenuItem>
                  )}
                  
                  {visitor.status === 'pending' && (
                    <DropdownMenuItem 
                      onClick={() => handleStatusUpdate(visitor.id, 'blocked')}
                      className="text-red-600"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      {t('block')}
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem>
                    <QrCode className="w-4 h-4 mr-2" />
                    {t('viewQR')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {visitor.purpose && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  <strong>{t('purpose')}:</strong> {visitor.purpose}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
