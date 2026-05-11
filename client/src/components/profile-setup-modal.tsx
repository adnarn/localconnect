import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { Loader2, ShoppingBag, Wrench, Store } from "lucide-react";

const roles = [
  {
    value: "customer",
    label: "Customer",
    description: "Browse and discover local services",
    icon: ShoppingBag,
  },
  {
    value: "skilled_worker",
    label: "Skilled Worker",
    description: "Offer your skills and services",
    icon: Wrench,
  },
  {
    value: "business_owner",
    label: "Business Owner",
    description: "Promote your business and offers",
    icon: Store,
  },
];

interface ProfileSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export function ProfileSetupModal({ open, onComplete }: ProfileSetupModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"role" | "details">("role");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  const setupMutation = useMutation({
    mutationFn: async (data: { role: string; location?: string; phone?: string; bio?: string }) => {
      console.log("Submitting profile data:", data);
      try {
        const res = await apiRequest("PATCH", "/api/auth/profile", data);
        const result = await res.json();
        console.log("Profile setup response:", result);
        return result;
      } catch (error) {
        console.error("Profile setup error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Profile setup successful:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile setup complete!" });
      onComplete();
    },
    onError: (err: any) => {
      console.error("Profile setup failed:", err);
      const errorMessage = err?.message || "Failed to setup profile. Please try again.";
      toast({ 
        title: "Setup failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    },
  });

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    if (role === "customer") {
      setupMutation.mutate({ role });
    } else {
      setStep("details");
    }
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    console.log("Form submission triggered");
    e.preventDefault();
    
    if (!selectedRole) {
      console.error("No role selected");
      toast({ 
        title: "Error", 
        description: "Please select a role first", 
        variant: "destructive" 
      });
      return;
    }
    
    const submitData = {
      role: selectedRole,
      location: location.trim() || undefined,
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
    };
    
    console.log("Submitting profile data:", submitData);
    setupMutation.mutate(submitData);
  };

  const handleSkipDetails = () => {
    setupMutation.mutate({ role: selectedRole });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange => !onOpenChange && onComplete()}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        {step === "role" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Welcome to LocalHub</DialogTitle>
              <DialogDescription>
                How would you like to use LocalHub? You can change this later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {roles.map((role) => (
                <Card
                  key={role.value}
                  className="cursor-pointer hover-elevate overflow-visible"
                  onClick={() => handleRoleSelect(role.value)}
                  data-testid={`card-role-${role.value}`}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <role.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{role.label}</p>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {setupMutation.isPending && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Complete your profile</DialogTitle>
              <DialogDescription>
                Add details so customers can find and contact you. All fields are optional.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleDetailsSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Location</Label>
                <LocationAutocomplete
                  value={location}
                  onChange={setLocation}
                  placeholder="e.g. Victoria Island, Lagos"
                  data-testid="input-setup-location"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +234 801 234 5678"
                  data-testid="input-setup-phone"
                />
              </div>
              <div className="space-y-2">
                <Label>About you</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell customers about your experience and services..."
                  data-testid="input-setup-bio"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleSkipDetails}
                  disabled={setupMutation.isPending}
                  data-testid="button-skip-details"
                >
                  Skip for now
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={setupMutation.isPending}
                  data-testid="button-save-profile"
                  onClick={() => console.log("Submit button clicked")}
                >
                  {setupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save profile
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
