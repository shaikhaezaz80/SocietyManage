import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MoreVertical, Clock, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";

interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  location?: string;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
  resolution?: string;
  rating?: number;
}

interface ComplaintListProps {
  complaints: Complaint[];
}

export default function ComplaintList({ complaints }: ComplaintListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const updateComplaintMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/complaints/${id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({
        title: t('success'),
        description: t('complaintUpdated'),
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

  const handleStatusUpdate = (complaintId: number, newStatus: string) => {
    const updates: any = { status: newStatus };
    
    if (newStatus === 'resolved') {
      updates.resolvedAt = new Date().toISOString();
    }

    updateComplaintMutation.mutate({ id: complaintId, updates });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'open': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800',
      'escalated': 'bg-red-100 text-red-800'
    };
    
    return variants[status as keyof typeof variants] || variants.open;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800'
    };
    
    return variants[priority as keyof typeof variants] || variants.medium;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance': return '🔧';
      case 'plumbing': return '🚰';
      case 'electrical': return '⚡';
      case 'security': return '🛡️';
      case 'cleanliness': return '🧹';
      case 'noise': return '🔊';
      case 'parking': return '🚗';
      default: return '📝';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '-';
    }
  };

  const canManageComplaints = user?.role === 'admin';

  if (!complaints.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('noComplaintsFound')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('raiseFirstComplaint')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {complaints.map((complaint) => (
        <Card key={complaint.id} className={complaint.priority === 'critical' ? 'border-l-4 border-l-red-500' : ''}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{getCategoryIcon(complaint.category)}</div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium truncate">{complaint.title}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityBadge(complaint.priority)}>
                      {t(complaint.priority)}
                    </Badge>
                    <Badge className={getStatusBadge(complaint.status)}>
                      {t(complaint.status)}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {complaint.description}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>#{complaint.id.toString().padStart(4, '0')}</span>
                  </span>
                  <span>{t(complaint.category)}</span>
                  {complaint.location && (
                    <>
                      <span>•</span>
                      <span>{complaint.location}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{formatTime(complaint.createdAt)}</span>
                </div>
                
                {complaint.photos && complaint.photos.length > 0 && (
                  <div className="flex items-center space-x-1 mt-2">
                    <span className="text-xs text-gray-500">📷 {complaint.photos.length} photo(s)</span>
                  </div>
                )}
                
                {complaint.resolution && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>{t('resolution')}:</strong> {complaint.resolution}
                    </p>
                    {complaint.rating && (
                      <div className="flex items-center space-x-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < complaint.rating! ? 'text-yellow-500' : 'text-gray-300'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canManageComplaints && complaint.status === 'open' && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(complaint.id, 'in_progress')}>
                      <Clock className="w-4 h-4 mr-2" />
                      {t('markInProgress')}
                    </DropdownMenuItem>
                  )}
                  
                  {canManageComplaints && complaint.status === 'in_progress' && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(complaint.id, 'resolved')}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('markResolved')}
                    </DropdownMenuItem>
                  )}
                  
                  {canManageComplaints && ['open', 'in_progress'].includes(complaint.status) && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(complaint.id, 'escalated')}>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {t('escalate')}
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    {t('viewDetails')}
                  </DropdownMenuItem>
                  
                  {complaint.status === 'resolved' && !complaint.rating && (
                    <DropdownMenuItem>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('rateService')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
