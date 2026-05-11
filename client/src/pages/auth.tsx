import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  signupSchema,
  loginSchema,
  type SignupData,
  type LoginData,
  NIGERIAN_LOCATIONS,
} from "@/lib/validation";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MapPin, Eye, EyeOff } from "lucide-react";
import { LocationAutocomplete } from "@/components/location-autocomplete";

export function LoginPage() {
  console.log("🚀 LOGIN PAGE LOADED - JWT VERSION"); // Obvious debug
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      console.log("Sending login data:", data);
      const res = await apiRequest("POST", "/api/auth/login", data);
      const responseText = await res.text();
      console.log("Login server response:", responseText);
      try {
        // Try to parse the entire response first
        return JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse login JSON:", e);
        // If that fails, try to extract JSON from the beginning of the response
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonData = jsonMatch[0];
            console.log("Extracted JSON:", jsonData);
            return JSON.parse(jsonData);
          }
        } catch (extractError) {
          console.error("Failed to extract JSON:", extractError);
        }
        throw new Error("Invalid JSON response from server");
      }
    },
    onSuccess: (data) => {
      console.log("Login success data:", data); // Debug
      // Store JWT token in localStorage
      if (data.token) {
        console.log("Storing token:", data.token); // Debug
        localStorage.setItem("authToken", data.token);
        console.log(
          "Token stored, checking:",
          localStorage.getItem("authToken"),
        ); // Debug
      } else {
        console.log("No token in response data"); // Debug
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-page-title">
            Sign in to LocalHub
          </CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        data-testid="input-login-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          data-testid="input-login-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login-submit"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary underline-offset-4 hover:underline"
              data-testid="link-signup"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      location: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      console.log("Sending signup data:", data);
      const res = await apiRequest("POST", "/api/auth/signup", data);
      const responseText = await res.text();
      console.log("Server response:", responseText);
      try {
        // Try to parse the entire response first
        return JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        // If that fails, try to extract JSON from the beginning of the response
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonData = jsonMatch[0];
            console.log("Extracted JSON:", jsonData);
            return JSON.parse(jsonData);
          }
        } catch (extractError) {
          console.error("Failed to extract JSON:", extractError);
        }
        throw new Error("Invalid JSON response from server");
      }
    },
    onSuccess: (data) => {
      // Store JWT token for auto-login after signup
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-page-title">
            Create your account
          </CardTitle>
          <CardDescription>
            Join LocalHub to discover and offer local services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                signupMutation.mutate(data),
              )}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          data-testid="input-signup-firstname"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          data-testid="input-signup-lastname"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        data-testid="input-signup-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+234 800 000 0000"
                        data-testid="input-signup-phone"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <LocationAutocomplete
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Enter your location (e.g., Lagos, Nigeria)"
                        data-testid="input-signup-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 6 characters"
                          data-testid="input-signup-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={signupMutation.isPending}
                data-testid="button-signup-submit"
              >
                {signupMutation.isPending
                  ? "Creating account..."
                  : "Create account"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
              data-testid="link-login"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
