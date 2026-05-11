import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { ProfileSetupModal } from "@/components/profile-setup-modal";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import ListingDetail from "@/pages/listing-detail";

import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import { LoginPage, SignupPage } from "@/pages/auth";
import { AdminLoginPage, AdminSignupPage } from "@/pages/admin-auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/listing/:id" component={ListingDetail} />

      <Route path="/profile/:id" component={Profile} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/signup" component={AdminSignupPage} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && !user.role) {
      setShowSetup(true);
    }
  }, [isAuthenticated, user]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground">
        <Router />
      </div>
      <Toaster />
      <ProfileSetupModal
        open={showSetup}
        onComplete={() => setShowSetup(false)}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
