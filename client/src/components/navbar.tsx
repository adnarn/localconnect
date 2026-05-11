import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/theme-provider";
import {
  MapPin,
  Sun,
  Moon,
  Menu,
  LogOut,
  LayoutDashboard,
  User,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

function getUserDisplayName(user: any): string {
  if (user?.firstName && user?.lastName)
    return `${user.firstName} ${user.lastName}`;
  if (user?.firstName) return user.firstName;
  if (user?.email) return user.email.split("@")[0];
  return "User";
}

function getUserInitials(user: any): string {
  const first = user?.firstName?.[0] || "";
  const last = user?.lastName?.[0] || "";
  if (first && last) return `${first}${last}`.toUpperCase();
  if (first) return first.toUpperCase();
  if (user?.email) return user.email[0].toUpperCase();
  return "U";
}

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const dashboardPath = user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2"
          data-testid="link-home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight hidden sm:inline">
            LocalHub
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="link-explore">
              Explore
            </Button>
          </Link>
          {user && (
            <Link href={dashboardPath}>
              <Button variant="ghost" size="sm" data-testid="link-dashboard">
                Dashboard
              </Button>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-8 w-8">
                    {user.profileImageUrl && (
                      <AvatarImage
                        src={user.profileImageUrl}
                        alt={displayName}
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-sm font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-background border shadow-lg"
              >
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    {user.profileImageUrl && (
                      <AvatarImage
                        src={user.profileImageUrl}
                        alt={displayName}
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span
                      className="text-sm font-medium"
                      data-testid="text-username"
                    >
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {user.role?.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLocation(dashboardPath)}
                  data-testid="menu-dashboard"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation(`/profile/${user.id}`)}
                  data-testid="menu-profile"
                >
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setLocation("/admin")}
                      data-testid="menu-admin"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Panel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => logout()}
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" data-testid="button-signup">
                  Sign up
                </Button>
              </Link>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-2 mt-8">
                <Link href="/" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    Explore
                  </Button>
                </Link>
                {user && (
                  <>
                    <Link href={dashboardPath} onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        Dashboard
                      </Button>
                    </Link>
                  </>
                )}
                {!user && (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setOpen(false)}>
                      <Button className="w-full justify-start">Sign up</Button>
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
