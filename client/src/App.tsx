import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Toaster } from "@/components/ui/toaster";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import VisitorManagement from "@/pages/visitor-management";
import StaffManagement from "@/pages/staff-management";
import ResidentManagement from "@/pages/resident-management";
import Announcements from "@/pages/announcements";
import Complaints from "@/pages/complaints";
import Maintenance from "@/pages/maintenance";
import Deliveries from "@/pages/deliveries";
import Amenities from "@/pages/amenities";
import Documents from "@/pages/documents";
import Finance from "@/pages/finance";
import Security from "@/pages/security";
import Inventory from "@/pages/inventory";
import Messaging from "@/pages/messaging";
import NotFound from "@/pages/not-found";
import LoadingScreen from "@/components/common/loading-screen";
import OfflineIndicator from "@/components/common/offline-indicator";
import { queryClient } from "@/lib/queryClient";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <OfflineIndicator />
          <LoadingScreen />
          
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <ProtectedRoute path="/" component={Dashboard} />
            <ProtectedRoute path="/visitors" component={VisitorManagement} />
            <ProtectedRoute path="/staff" component={StaffManagement} />
            <ProtectedRoute path="/residents" component={ResidentManagement} />
            <ProtectedRoute path="/announcements" component={Announcements} />
            <ProtectedRoute path="/complaints" component={Complaints} />
            <ProtectedRoute path="/maintenance" component={Maintenance} />
            <ProtectedRoute path="/deliveries" component={Deliveries} />
            <ProtectedRoute path="/amenities" component={Amenities} />
            <ProtectedRoute path="/documents" component={Documents} />
            <ProtectedRoute path="/finance" component={Finance} />
            <ProtectedRoute path="/security" component={Security} />
            <ProtectedRoute path="/inventory" component={Inventory} />
            <ProtectedRoute path="/messaging" component={Messaging} />
            <Route component={NotFound} />
          </Switch>
          
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
