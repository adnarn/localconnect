import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  loginSchema,
  adminSignupSchema,
  type LoginData,
  type AdminSignupData,
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
import { Shield, Eye, EyeOff } from "lucide-react";

export function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/admin/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      // Store JWT token after admin login
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/admin");
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-destructive">
            <Shield className="h-6 w-6 text-destructive-foreground" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-admin-page-title">
            Admin Sign In
          </CardTitle>
          <CardDescription>Sign in to the LocalHub admin panel</CardDescription>
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
                        placeholder="admin@example.com"
                        data-testid="input-admin-login-email"
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
                          data-testid="input-admin-login-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-admin-toggle-password"
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
                data-testid="button-admin-login-submit"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in as Admin"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Need an admin account?{" "}
            <Link
              href="/admin/signup"
              className="font-medium text-primary underline-offset-4 hover:underline"
              data-testid="link-admin-signup"
            >
              Create admin account
            </Link>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-muted-foreground underline-offset-4 hover:underline"
              data-testid="link-user-login"
            >
              Back to user login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminSignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AdminSignupData>({
    resolver: zodResolver(adminSignupSchema),
    defaultValues: { email: "", password: "", firstName: "", lastName: "" },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: AdminSignupData) => {
      const res = await apiRequest("POST", "/api/auth/admin/signup", data);
      return res.json();
    },
    onSuccess: (data) => {
      // Store JWT token for auto-login after admin signup
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/admin");
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-destructive">
            <Shield className="h-6 w-6 text-destructive-foreground" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-admin-page-title">
            Create Admin Account
          </CardTitle>
          <CardDescription>
            Set up a new admin account for LocalHub
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
                          data-testid="input-admin-signup-firstname"
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
                          data-testid="input-admin-signup-lastname"
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
                        placeholder="admin@example.com"
                        data-testid="input-admin-signup-email"
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
                          placeholder="At least 6 characters"
                          data-testid="input-admin-signup-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-admin-toggle-password"
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
                data-testid="button-admin-signup-submit"
              >
                {signupMutation.isPending
                  ? "Creating account..."
                  : "Create admin account"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an admin account?{" "}
            <Link
              href="/admin/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
              data-testid="link-admin-login"
            >
              Sign in
            </Link>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-muted-foreground underline-offset-4 hover:underline"
              data-testid="link-user-login"
            >
              Back to user login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
