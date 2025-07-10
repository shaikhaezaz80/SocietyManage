import { useAuth } from "@/hooks/use-auth";
import ResidentDashboard from "./resident-dashboard";
import GuardDashboard from "./guard-dashboard";
import AdminDashboard from "./admin-dashboard";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // ProtectedRoute will handle redirect
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case "guard":
      return <GuardDashboard />;
    case "admin":
      return <AdminDashboard />;
    case "auditor":
      return <AdminDashboard />; // Auditors use admin dashboard with restricted access
    default:
      return <ResidentDashboard />;
  }
}
