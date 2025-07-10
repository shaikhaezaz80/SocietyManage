import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  MessageCircle, 
  Share2,
  Calendar,
  AlertTriangle,
  Users,
  BarChart3,
  ThumbsUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  priority: string;
  createdAt: string;
  attachmentUrls?: string[];
  pollOptions?: Array<{
    id: string;
    text: string;
    votes: number;
  }>;
}

interface AnnouncementFeedProps {
  announcements: Announcement[];
  onVote?: (announcementId: number, optionId: string) => void;
}

export default function AnnouncementFeed({ announcements, onVote }: AnnouncementFeedProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "emergency":
        return "bg-red-100 text-red-800 border-red-200";
      case "event":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "poll":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "notice":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "emergency":
        return <AlertTriangle className="w-5 h-5" />;
      case "event":
        return <Calendar className="w-5 h-5" />;
      case "poll":
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  if (announcements.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements yet</h3>
        <p className="text-gray-600">Community announcements will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card 
          key={announcement.id} 
          className={`${
            announcement.type === "emergency" ? "border-l-4 border-l-red-500" :
            announcement.priority === "high" ? "border-l-4 border-l-orange-500" :
            ""
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                announcement.type === "emergency" ? "bg-red-100" :
                announcement.type === "event" ? "bg-blue-100" :
                announcement.type === "poll" ? "bg-purple-100" :
                "bg-gray-100"
              }`}>
                {getTypeIcon(announcement.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="secondary" className={getTypeColor(announcement.type)}>
                    {announcement.type}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <p className="text-gray-700 mb-4">{announcement.content}</p>

            {/* Poll Options */}
            {announcement.type === "poll" && announcement.pollOptions && (
              <div className="space-y-3 mb-4">
                {announcement.pollOptions.map((option) => {
                  const totalVotes = announcement.pollOptions!.reduce((sum, opt) => sum + opt.votes, 0);
                  const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                  
                  return (
                    <div key={option.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => onVote?.(announcement.id, option.id)}
                          className="text-left text-sm font-medium hover:text-blue-600"
                        >
                          {option.text}
                        </button>
                        <span className="text-sm text-gray-500">{percentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-gray-500">{option.votes} votes</p>
                    </div>
                  );
                })}
                <p className="text-sm text-gray-600 mt-3">
                  Total votes: {announcement.pollOptions.reduce((sum, opt) => sum + opt.votes, 0)}
                </p>
              </div>
            )}

            {/* Attachments */}
            {announcement.attachmentUrls && announcement.attachmentUrls.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Attachments:</p>
                <div className="space-y-1">
                  {announcement.attachmentUrls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline block"
                    >
                      Download Attachment {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 pt-3 border-t border-gray-100">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600">
                <Heart className="w-4 h-4 mr-1" />
                <span className="text-sm">Like</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                <MessageCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">Comment</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-600">
                <Share2 className="w-4 h-4 mr-1" />
                <span className="text-sm">Share</span>
              </Button>

              {announcement.type === "event" && (
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600 ml-auto">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">Attending</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
