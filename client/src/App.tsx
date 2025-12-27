import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";
import PlacementTest from "@/pages/PlacementTest";
import ContentLibrary from "@/pages/ContentLibrary";
import Bookings from "@/pages/Bookings";
import Classes from "@/pages/Classes";
import AuthPage from "@/pages/Auth";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/placement" component={PlacementTest} />
          <Route path="/content" component={ContentLibrary} />
          <Route path="/bookings" component={Bookings} />
          <Route path="/classes" component={Classes} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/profile" component={Profile} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
