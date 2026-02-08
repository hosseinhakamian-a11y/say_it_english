import { lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/lib/protected-route";
import { Loader2 } from "lucide-react";
import { HelmetProvider } from "react-helmet-async";

// Lazy load pages
// ... (rest of imports remains same)
const Home = lazy(() => import("@/pages/Home"));
const PlacementTest = lazy(() => import("@/pages/PlacementTest"));
const ContentLibrary = lazy(() => import("@/pages/ContentLibrary"));
const Bookings = lazy(() => import("@/pages/Bookings"));
const Classes = lazy(() => import("@/pages/Classes"));
const AuthPage = lazy(() => import("@/pages/Auth"));
const Profile = lazy(() => import("@/pages/Profile"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));
const NotFound = lazy(() => import("@/pages/not-found"));
const VideosPage = lazy(() => import("@/pages/Videos"));
const VideoDetailPage = lazy(() => import("@/pages/VideoDetail"));
const Blog = lazy(() => import("@/pages/Blog"));
const PaymentPage = lazy(() => import("@/pages/Payment"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const Pricing = lazy(() => import("@/pages/Pricing"));

// Lazy load admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminContent = lazy(() => import("@/pages/admin/content"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminPayments = lazy(() => import("@/pages/admin/payments"));
const AdminSlots = lazy(() => import("@/pages/admin/slots"));
const AdminPaymentSettings = lazy(() => import("@/pages/admin/payment-settings"));

// Premium Loading Fallback
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <Loader2 className="w-6 h-6 text-primary animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-muted-foreground font-medium animate-pulse">در حال بارگذاری...</p>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <ProtectedRoute path="/admin" component={AdminDashboard} shouldCheckAdmin={true} />
          <ProtectedRoute path="/admin/content" component={AdminContent} shouldCheckAdmin={true} />
          <ProtectedRoute path="/admin/users" component={AdminUsers} shouldCheckAdmin={true} />
          <ProtectedRoute path="/admin/payments" component={AdminPayments} shouldCheckAdmin={true} />
          <ProtectedRoute path="/admin/slots" component={AdminSlots} shouldCheckAdmin={true} />
          <ProtectedRoute path="/admin/payment-settings" component={AdminPaymentSettings} shouldCheckAdmin={true} />
        </Switch>
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/placement" component={PlacementTest} />
            <Route path="/content" component={ContentLibrary} />
            <Route path="/bookings" component={Bookings} />
            <Route path="/classes" component={Classes} />
            <Route path="/auth" component={AuthPage} />
            <Route path="/profile" component={Profile} />
            <Route path="/edit-profile" component={EditProfile} />
            <Route path="/videos" component={VideosPage} />
            <Route path="/videos/:videoId" component={VideoDetailPage} />
            <Route path="/payment/:id" component={PaymentPage} />
            <Route path="/course/:id" component={CourseDetail} />
            <Route path="/blog" component={Blog} />
            <Route path="/pricing" component={Pricing} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
