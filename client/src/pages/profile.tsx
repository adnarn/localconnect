import { useState, useRef } from "react";
import { createApiUrl } from "@/lib/api";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NIGERIAN_LOCATIONS } from "@/lib/validation";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/star-rating";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import {
  MapPin,
  Phone,
  Mail,
  Briefcase,
  ArrowLeft,
  Camera,
  Pencil,
  Plus,
  Trash2,
  Image as ImageIcon,
  Star,
  ExternalLink,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

const SKILL_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Tiling",
  "Welding",
  "Mechanic",
  "Tailoring",
  "Hair Styling",
  "Makeup",
  "Photography",
  "Catering",
  "Cleaning",
  "AC Repair",
  "Phone Repair",
  "Web Development",
  "Graphic Design",
  "Tutoring",
  "Driving",
  "Other",
];

const editProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  role: z.enum(["customer", "business_owner", "skilled_worker"], {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return { message: "Invalid role selected" };
      }
      return { message: ctx.defaultError };
    },
  }),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
});

type EditProfileData = z.infer<typeof editProfileSchema>;

export default function Profile() {
  const [, params] = useRoute("/profile/:id");
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingDP, setUploadingDP] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const dpInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.id === params?.id;

  const { data: profileUser, isLoading } = useQuery<any>({
    queryKey: ["/api/users", params?.id],
    enabled: !!params?.id,
  });

  const { data: listings } = useQuery<any[]>({
    queryKey: ["/api/listings", "user", params?.id],
    enabled: !!params?.id,
  });

  const { data: reviews } = useQuery<any[]>({
    queryKey: ["/api/reviews", "provider", params?.id],
    enabled: !!params?.id,
  });

  const { data: galleryImages } = useQuery<any[]>({
    queryKey: ["/api/gallery", params?.id],
    enabled: !!params?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: EditProfileData) => {
      const res = await apiRequest("PATCH", "/api/auth/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditOpen(false);
      toast({ title: "Profile updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadGalleryMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("authToken");
      const uploadRes = await fetch(createApiUrl("/api/upload"), {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();
      const res = await apiRequest("POST", "/api/gallery", { imageUrl: url });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery", params?.id] });
      setUploadingGallery(false);
      toast({ title: "Image added to gallery" });
    },
    onError: (error: Error) => {
      setUploadingGallery(false);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteGalleryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/gallery/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery", params?.id] });
      toast({ title: "Image removed" });
    },
  });

  const uploadDPMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("authToken");
      const uploadRes = await fetch(createApiUrl("/api/upload"), {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();
      const res = await apiRequest("PATCH", "/api/auth/profile", {
        profileImageUrl: url,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setUploadingDP(false);
      toast({ title: "Profile picture updated" });
    },
    onError: (error: Error) => {
      setUploadingDP(false);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingGallery(true);
      uploadGalleryMutation.mutate(file);
    }
    e.target.value = "";
  };

  const handleDPUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingDP(true);
      uploadDPMutation.mutate(file);
    }
    e.target.value = "";
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="flex items-center gap-6 mb-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto p-4 py-16 text-center">
        <p className="text-muted-foreground mb-3">User not found</p>
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    );
  }

  const initials =
    (profileUser.firstName?.[0] || "") + (profileUser.lastName?.[0] || "") ||
    "U";
  const fullName = [profileUser.firstName, profileUser.lastName]
    .filter(Boolean)
    .join(" ");
  const avgRating = reviews?.length
    ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
    : 0;
  const isProvider =
    profileUser.role === "skilled_worker" ||
    profileUser.role === "business_owner";

  return (
    <div className="max-w-4xl mx-auto p-4 py-8">
      <Link href="/">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </Link>

      <Card className="mb-6" data-testid="card-profile-header">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group shrink-0">
              <Avatar className="h-24 w-24">
                {profileUser.profileImageUrl ? (
                  <AvatarImage
                    src={profileUser.profileImageUrl}
                    alt={fullName}
                  />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <button
                  onClick={() => dpInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  disabled={uploadingDP}
                  data-testid="button-change-dp"
                >
                  <Camera className="h-5 w-5 text-white" />
                </button>
              )}
              <input
                ref={dpInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDPUpload}
              />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h1
                className="text-2xl font-bold"
                data-testid="text-profile-name"
              >
                {fullName}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                {profileUser.role && (
                  <Badge
                    variant="secondary"
                    className="capitalize text-xs"
                    data-testid="badge-role"
                  >
                    {profileUser.role.replace("_", " ")}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-muted-foreground">
                {profileUser.location && (
                  <span
                    className="flex items-center gap-1"
                    data-testid="text-profile-location"
                  >
                    <MapPin className="h-3.5 w-3.5" /> {profileUser.location}
                  </span>
                )}
                {profileUser.phone && (
                  <span
                    className="flex items-center gap-1"
                    data-testid="text-profile-phone"
                  >
                    <Phone className="h-3.5 w-3.5" /> {profileUser.phone}
                  </span>
                )}
                {profileUser.email && (
                  <span
                    className="flex items-center gap-1"
                    data-testid="text-profile-email"
                  >
                    <Mail className="h-3.5 w-3.5" /> {profileUser.email}
                  </span>
                )}
              </div>

              {reviews && reviews.length > 0 && (
                <div
                  className="flex items-center justify-center sm:justify-start gap-2 mt-3"
                  data-testid="rating-summary"
                >
                  <StarRating rating={avgRating} />
                  <span className="text-sm font-medium">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({reviews.length}{" "}
                    {reviews.length === 1 ? "review" : "reviews"})
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {isOwnProfile && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setEditOpen(true)}
                    data-testid="button-edit-profile"
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Edit Profile
                  </Button>
                  <Link href={`/profile/${profileUser.id}`}>
                    <Button
                      variant="ghost"
                      className="w-full"
                      data-testid="button-view-public"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" /> View Public
                      Profile
                    </Button>
                  </Link>
                </>
              )}
              {!isOwnProfile && profileUser.phone && (
                <div className="flex gap-2">
                  <a
                    href={`tel:${profileUser.phone}`}
                    data-testid="link-call-user"
                  >
                    <Button variant="outline">
                      <Phone className="h-4 w-4 mr-1" /> Call
                    </Button>
                  </a>
                  <a
                    href={`https://wa.me/${profileUser.phone.replace(/[^0-9]/g, "").replace(/^0/, "234")}?text=${encodeURIComponent(`Hi, I found your profile on LocalHub.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-whatsapp-user"
                  >
                    <Button>
                      <SiWhatsapp className="h-4 w-4 mr-1" /> WhatsApp
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {profileUser.bio && (
        <Card className="mb-6" data-testid="card-about">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="text-sm text-muted-foreground leading-relaxed"
              data-testid="text-profile-bio"
            >
              {profileUser.bio}
            </p>
          </CardContent>
        </Card>
      )}

      {(isProvider || isOwnProfile) && (
        <Card className="mb-6" data-testid="card-gallery">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="text-base">
              {profileUser.role === "business_owner"
                ? "Business Gallery"
                : "Work Gallery"}
            </CardTitle>
            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingGallery}
                data-testid="button-add-gallery-image"
              >
                <Plus className="h-4 w-4 mr-1" />{" "}
                {uploadingGallery ? "Uploading..." : "Add Image"}
              </Button>
            )}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGalleryUpload}
            />
          </CardHeader>
          <CardContent>
            {galleryImages && galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {galleryImages.map((img: any) => (
                  <div
                    key={img.id}
                    className="relative group rounded-md overflow-visible"
                    data-testid={`gallery-image-${img.id}`}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.caption || "Work sample"}
                      className="w-full aspect-square object-cover rounded-md"
                    />
                    {isOwnProfile && (
                      <div className="absolute top-1.5 right-1.5 invisible group-hover:visible">
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => deleteGalleryMutation.mutate(img.id)}
                          data-testid={`button-delete-gallery-${img.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    {img.caption && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {img.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  {profileUser.role === "business_owner"
                    ? "No business photos yet"
                    : "No work images yet"}
                </p>
                {isOwnProfile && (
                  <p className="text-xs text-muted-foreground">
                    {profileUser.role === "business_owner"
                      ? "Upload photos of your business to build trust with customers"
                      : "Uploading images is optional but helps attract customers"}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {listings && listings.length > 0 && (
        <Card className="mb-6" data-testid="card-listings">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {profileUser.role === "business_owner" ? "Posts" : "Services"} (
              {listings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {listings.map((l: any) => (
                <Link key={l.id} href={`/listing/${l.id}`}>
                  <Card
                    className="hover-elevate cursor-pointer"
                    data-testid={`card-profile-listing-${l.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {l.image ? (
                          <img
                            src={l.image}
                            alt={l.title}
                            className="h-14 w-14 rounded-md object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Briefcase className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">{l.title}</h3>
                          <Badge
                            variant="secondary"
                            className="capitalize text-xs mt-1"
                          >
                            {l.category}
                          </Badge>
                          {l.price && (
                            <p className="text-sm font-medium text-primary mt-1">
                              {l.price}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reviews && reviews.length > 0 && (
        <Card className="mb-6" data-testid="card-reviews">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Reviews ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((r: any) => (
                <div key={r.id} data-testid={`review-${r.id}`}>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs">
                        {(r.reviewer?.firstName?.[0] || "") +
                          (r.reviewer?.lastName?.[0] || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">
                          {[r.reviewer?.firstName, r.reviewer?.lastName]
                            .filter(Boolean)
                            .join(" ") || "Anonymous"}
                        </span>
                        <StarRating rating={r.rating} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {r.comment}
                      </p>
                    </div>
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isOwnProfile && profileUser && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          user={profileUser}
          onSubmit={(data) => updateProfileMutation.mutate(data)}
          isPending={updateProfileMutation.isPending}
        />
      )}
    </div>
  );
}

function EditProfileDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onSubmit: (data: EditProfileData) => void;
  isPending: boolean;
}) {
  const form = useForm<EditProfileData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      role: user.role || "customer",
      phone: user.phone || "",
      location: user.location || "",
      bio: user.bio || "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input data-testid="input-edit-firstname" {...field} />
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
                      <Input data-testid="input-edit-lastname" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        data-testid="input-edit-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-role">
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="business_owner">
                          Business Owner
                        </SelectItem>
                        <SelectItem value="skilled_worker">
                          Skilled Worker
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      data-testid="input-edit-phone"
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
                      data-testid="input-edit-location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio / Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell customers about your skills and experience..."
                      className="resize-none"
                      rows={4}
                      data-testid="input-edit-bio"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-save-profile"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
