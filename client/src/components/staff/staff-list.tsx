import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MoreVertical, Clock, Eye, Trash2, Phone, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Staff {
  id: number;
  name: string;
  phone: string;
  category: string;
  shiftTiming: string;
  isActive: boolean;
  photo?: string;
  salary?: string;
  assignedFlats?: string[];
}

interface StaffListProps {
  staff: Staff[];
}

export default function StaffList({ staff }: StaffListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ staffId, status }: { staffId: number; status: string }) => {
      const res = await apiRequest("POST", `/api/staff/${staffId}/attendance`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('attendanceMarked'),
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

  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/staff/${id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: t('success'),
        description: t('staffUpdated'),
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

  const handleMarkAttendance = (staffId: number, status: string) => {
    markAttendanceMutation.mutate({ staffId, status });
  };

  const handleToggleActive = (staffId: number, isActive: boolean) => {
    updateStaffMutation.mutate({ 
      id: staffId, 
      updates: { isActive: !isActive } 
    });
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      'housekeeping': 'bg-blue-100 text-blue-800',
      'security': 'bg-green-100 text-green-800',
      'maintenance': 'bg-orange-100 text-orange-800',
      'gardening': 'bg-emerald-100 text-emerald-800',
      'management': 'bg-purple-100 text-purple-800'
    };
    
    return variants[category as keyof typeof variants] || variants.housekeeping;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'housekeeping': return '🧹';
      case 'security': return '🛡️';
      case 'maintenance': return '🔧';
      case 'gardening': return '🌱';
      case 'management': return '👔';
      default: return '👤';
    }
  };

  const getShiftTime = (timing: string) => {
    const times = {
      'morning': '6:00 AM - 2:00 PM',
      'day': '9:00 AM - 6:00 PM',
      'evening': '2:00 PM - 10:00 PM',
      'night': '8:00 PM - 6:00 AM'
    };
    
    return times[timing as keyof typeof times] || timing;
  };

  const canManageStaff = user?.role === 'admin' || user?.role === 'guard';

  if (!staff.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('noStaffFound')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('addFirstStaff')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {staff.map((member) => (
        <Card key={member.id}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                {member.photo ? (
                  <AvatarImage src={member.photo} alt={member.name} />
                ) : (
                  <AvatarFallback className="bg-gray-200">
                    <span className="text-lg">{getCategoryIcon(member.category)}</span>
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium truncate">{member.name}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge className={getCategoryBadge(member.category)}>
                      {t(member.category)}
                    </Badge>
                    <div className={`w-3 h-3 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span>{member.phone}</span>
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{getShiftTime(member.shiftTiming || '')}</span>
                  </div>
                  
                  {member.assignedFlats && member.assignedFlats.length > 0 && (
                    <p className="text-xs">
                      <strong>{t('assignedFlats')}:</strong> {member.assignedFlats.join(', ')}
                    </p>
                  )}
                  
                  {member.salary && (
                    <p className="text-xs">
                      <strong>{t('salary')}:</strong> ₹{member.salary}
                    </p>
                  )}
                </div>
              </div>

              {canManageStaff && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleMarkAttendance(member.id, 'present')}>
                      <Clock className="w-4 h-4 mr-2" />
                      {t('markPresent')}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleMarkAttendance(member.id, 'absent')}>
                      <Clock className="w-4 h-4 mr-2" />
                      {t('markAbsent')}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      {t('viewProfile')}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleToggleActive(member.id, member.isActive)}>
                      <Users className="w-4 h-4 mr-2" />
                      {member.isActive ? t('deactivate') : t('activate')}
                    </DropdownMenuItem>
                    
                    {user?.role === 'admin' && (
                      <DropdownMenuItem 
                        onClick={() => handleToggleActive(member.id, true)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('remove')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
