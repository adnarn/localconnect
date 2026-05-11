import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Briefcase, Star, Activity, Trash2, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const isAdmin = user?.role === "admin";

  const { data: allUsers, isLoading: loadingUsers } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  });
  const { data: allListings, isLoading: loadingListings } = useQuery<any[]>({
    queryKey: ["/api/admin/listings"],
    enabled: isAdmin,
  });
  const { data: allReviews } = useQuery<any[]>({
    queryKey: ["/api/admin/reviews"],
    enabled: isAdmin,
  });

  const deleteListingMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/listings/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      toast({ title: "Listing removed" });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/reviews/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Review removed" });
    },
  });

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto p-4 py-16 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
        <p className="text-muted-foreground mb-4">Please sign in with an admin account to access this page.</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="default" onClick={() => setLocation("/admin/login")} data-testid="button-go-admin-login">Sign in as Admin</Button>
          <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-go-home">Go home</Button>
        </div>
      </div>
    );
  }

  const totalUsers = allUsers?.length || 0;
  const totalListings = allListings?.length || 0;
  const totalReviews = allReviews?.length || 0;

  return (
    <div className="max-w-7xl mx-auto p-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor and manage platform activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-users">{totalUsers}</p>
              <p className="text-sm text-muted-foreground">Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-listings">{totalListings}</p>
              <p className="text-sm text-muted-foreground">Listings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-reviews">{totalReviews}</p>
              <p className="text-sm text-muted-foreground">Reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">Active</p>
              <p className="text-sm text-muted-foreground">Platform status</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-admin-users">Users</TabsTrigger>
          <TabsTrigger value="listings" data-testid="tab-admin-listings">Listings</TabsTrigger>
          <TabsTrigger value="reviews" data-testid="tab-admin-reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loadingUsers ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers?.map((u: any) => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell className="font-medium">{[u.firstName, u.lastName].filter(Boolean).join(' ')}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize text-xs">{u.role?.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.location || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listings" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loadingListings ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allListings?.map((l: any) => (
                      <TableRow key={l.id} data-testid={`row-listing-${l.id}`}>
                        <TableCell className="font-medium">{l.title}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{l.category}</Badge></TableCell>
                        <TableCell className="capitalize">{l.type}</TableCell>
                        <TableCell>{[l.provider?.firstName, l.provider?.lastName].filter(Boolean).join(' ') || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteListingMutation.mutate(l.id)}
                            data-testid={`button-admin-delete-listing-${l.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allReviews?.map((r: any) => (
                    <TableRow key={r.id} data-testid={`row-review-${r.id}`}>
                      <TableCell className="font-medium">{[r.reviewer?.firstName, r.reviewer?.lastName].filter(Boolean).join(' ') || 'Unknown'}</TableCell>
                      <TableCell>{r.rating}/5</TableCell>
                      <TableCell className="max-w-xs truncate">{r.comment}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteReviewMutation.mutate(r.id)}
                          data-testid={`button-admin-delete-review-${r.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
