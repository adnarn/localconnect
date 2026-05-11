import { useState, useRef, useMemo } from "react";
import { createApiUrl, API_BASE_URL } from "@/lib/api";
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
  ExternalLink,
  Lock,
  Globe,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

// ============== TYPE DEFINITIONS ==============
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "customer" | "business_owner" | "skilled_worker";
  phone?: string;
  location?: string;
  bio?: string;
  profileImageUrl?: string;
  isPrivate?: boolean;
  skills?: string[];
  createdAt?: string;
}

interface GalleryImage {
  id: string;
  imageUrl: string;
  caption?: string;
  createdAt?: string;
}

interface Listing {
  id: string;
  title: string;
  category: string;
  price?: string;
  image?: string;
  description?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt?: string;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

interface EditProfileData {
  firstName: string;
  lastName: string;
  email: string;
  role: "customer" | "business_owner" | "skilled_worker";
  phone: string;
  location: string;
  bio: string;
  skills: string[];
  isPrivate: boolean;
}

// ============== CONSTANTS ==============
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

const MAX_IMAGE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

// ============== VALIDATION SCHEMA ==============
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
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  skills: z.array(z.string()).max(10, "Maximum 10 skills allowed").optional(),
  isPrivate: z.boolean().optional(),
});

// ============== HELPER FUNCTIONS ==============
const formatWhatsAppNumber = (phone: string): string => {
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned.replace(/^\+/, "");
  }
  if (cleaned.startsWith("234")) return cleaned;
  if (cleaned.startsWith("0")) return "234" + cleaned.substring(1);
  return "234" + cleaned;
};

const validateImageFile = (
  file: File,
): { isValid: boolean; error?: string } => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: "Only JPEG, PNG, and WebP images are allowed",
    };
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return {
      isValid: false,
      error: `Image must be less than ${MAX_IMAGE_SIZE_MB}MB`,
    };
  }
  return { isValid: true };
};

// ============== MAIN COMPONENT ==============
export default function Profile() {
  const [, params] = useRoute("/profile/:id");
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingDP, setUploadingDP] = useState(false);
  const [selectedGalleryCaption, setSelectedGalleryCaption] = useState("");
  const [showCaptionDialog, setShowCaptionDialog] = useState(false);
  const [pendingGalleryFile, setPendingGalleryFile] = useState<File | null>(
    null,
  );
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const dpInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.id === params?.id;

  // Queries - MOVED BEFORE useMemo that depends on them
  const { data: profileUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/users", params?.id],
    enabled: !!params?.id,
  });

  // Check if profile is accessible (not private or is owner)
  // MOVED THIS AFTER profileUser is defined
  const canViewProfile = useMemo(() => {
    if (!profileUser) return false;
    if (isOwnProfile) return true;
    return !profileUser.isPrivate;
  }, [profileUser, isOwnProfile]);

  const { data: listings, isLoading: isLoadingListings } = useQuery<Listing[]>({
    queryKey: ["/api/listings", "user", params?.id],
    enabled: !!params?.id && canViewProfile,
  });

  const { data: reviews, isLoading: isLoadingReviews } = useQuery<Review[]>({
    queryKey: ["/api/reviews", "provider", params?.id],
    enabled: !!params?.id && canViewProfile,
  });

  const { data: galleryImages, isLoading: isLoadingGallery } = useQuery<
    GalleryImage[]
  >({
    queryKey: ["/api/gallery", params?.id],
    enabled:
      !!params?.id &&
      canViewProfile &&
      (profileUser?.role === "skilled_worker" ||
        profileUser?.role === "business_owner"),
  });

  // Mutations
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
    mutationFn: async ({ file, caption }: { file: File; caption?: string }) => {
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

      const res = await apiRequest("POST", "/api/gallery", {
        imageUrl: url,
        caption: caption || "",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery", params?.id] });
      setUploadingGallery(false);
      setShowCaptionDialog(false);
      setPendingGalleryFile(null);
      setSelectedGalleryCaption("");
      toast({ title: "Image added to gallery" });
    },
    onError: (error: Error) => {
      setUploadingGallery(false);
      setShowCaptionDialog(false);
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
      toast({ title: "Image removed successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
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

  // Handlers
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }

      setPendingGalleryFile(file);
      setShowCaptionDialog(true);
    }
    e.target.value = "";
  };

  const handleConfirmGalleryUpload = () => {
    if (pendingGalleryFile) {
      setUploadingGallery(true);
      uploadGalleryMutation.mutate({
        file: pendingGalleryFile,
        caption: selectedGalleryCaption,
      });
    }
  };

  const handleDPUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }

      setUploadingDP(true);
      uploadDPMutation.mutate(file);
    }
    e.target.value = "";
  };

  // Loading state
  if (isLoadingUser) {
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

  // User not found
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

  // Private profile check
  if (!canViewProfile) {
    return (
      <div className="max-w-4xl mx-auto p-4 py-16 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold">Private Profile</h2>
          <p className="text-muted-foreground max-w-md">
            This profile is private. Only the profile owner can view their
            information.
          </p>
          {!currentUser && (
            <Link href="/auth/login">
              <Button>Login to view</Button>
            </Link>
          )}
        </div>
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
    ? reviews.reduce((s: number, r: Review) => s + r.rating, 0) / reviews.length
    : 0;
  const isProvider =
    profileUser.role === "skilled_worker" ||
    profileUser.role === "business_owner";
  const isLoading =
    isLoadingUser || isLoadingListings || isLoadingReviews || isLoadingGallery;

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

      {/* Profile Header Card */}
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
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1
                  className="text-2xl font-bold"
                  data-testid="text-profile-name"
                >
                  {fullName}
                </h1>
                {profileUser.isPrivate && (
                  <Lock
                    className="h-4 w-4 text-muted-foreground"
                    title="Private profile"
                  />
                )}
              </div>

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
                {profileUser.skills && profileUser.skills.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {profileUser.skills.length} skill
                    {profileUser.skills.length !== 1 ? "s" : ""}
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
                {isOwnProfile && profileUser.phone && (
                  <span
                    className="flex items-center gap-1"
                    data-testid="text-profile-phone"
                  >
                    <Phone className="h-3.5 w-3.5" /> {profileUser.phone}
                  </span>
                )}
                {isOwnProfile && profileUser.email && (
                  <span
                    className="flex items-center gap-1"
                    data-testid="text-profile-email"
                  >
                    <Mail className="h-3.5 w-3.5" /> {profileUser.email}
                  </span>
                )}
                {profileUser.createdAt && (
                  <span className="flex items-center gap-1 text-xs">
                    <Globe className="h-3.5 w-3.5" />
                    Member since {new Date(profileUser.createdAt).getFullYear()}
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
                    href={`https://wa.me/${formatWhatsAppNumber(profileUser.phone)}?text=${encodeURIComponent(
                      `Hi, I found your profile on LocalHub.`,
                    )}`}
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

      {/* Bio Section */}
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

      {/* Skills Section for Skilled Workers */}
      {profileUser.role === "skilled_worker" &&
        profileUser.skills &&
        profileUser.skills.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileUser.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Gallery Section */}
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
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={handleGalleryUpload}
            />
          </CardHeader>
          <CardContent>
            {galleryImages && galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {galleryImages.map((img: GalleryImage) => (
                  <div
                    key={img.id}
                    className="relative group rounded-lg overflow-hidden border bg-background"
                    data-testid={`gallery-image-${img.id}`}
                  >
                    <img
                      src={
                        img.imageUrl.startsWith("http")
                          ? img.imageUrl
                          : `${API_BASE_URL}${img.imageUrl}`
                      }
                      alt={img.caption || "Work sample"}
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                        {img.caption}
                      </div>
                    )}
                    {isOwnProfile && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteGalleryMutation.mutate(img.id)}
                          data-testid={`button-delete-gallery-${img.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

      {/* Listings/Services Section */}
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
              {listings.map((l: Listing) => (
                <Link key={l.id} href={`/listing/${l.id}`}>
                  <Card
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    data-testid={`card-profile-listing-${l.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {l.image ? (
                          <img
                            src={l.image}
                            alt={l.title}
                            className="h-14 w-14 rounded-md object-cover shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Briefcase className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
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

      {/* Reviews Section */}
      {reviews && reviews.length > 0 && (
        <Card className="mb-6" data-testid="card-reviews">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Reviews ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((r: Review, index: number) => (
                <div key={r.id} data-testid={`review-${r.id}`}>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      {r.reviewer?.profileImageUrl ? (
                        <AvatarImage
                          src={
                            r.reviewer.profileImageUrl.startsWith("http")
                              ? r.reviewer.profileImageUrl
                              : `${API_BASE_URL}${r.reviewer.profileImageUrl}`
                          }
                          alt={`${r.reviewer.firstName} ${r.reviewer.lastName}`}
                        />
                      ) : null}
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
                        {r.createdAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {r.comment}
                      </p>
                    </div>
                  </div>
                  {index < reviews.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Profile Dialog */}
      {isOwnProfile && profileUser && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          user={profileUser}
          onSubmit={(data) => updateProfileMutation.mutate(data)}
          isPending={updateProfileMutation.isPending}
        />
      )}

      {/* Gallery Caption Dialog */}
      <Dialog open={showCaptionDialog} onOpenChange={setShowCaptionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add caption (optional)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Add a description for this image..."
              value={selectedGalleryCaption}
              onChange={(e) => setSelectedGalleryCaption(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCaptionDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmGalleryUpload}
                disabled={uploadingGallery}
              >
                {uploadingGallery ? "Uploading..." : "Upload Image"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== EDIT PROFILE DIALOG COMPONENT ==============
function EditProfileDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onSubmit: (data: EditProfileData) => void;
  isPending: boolean;
}) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    user.skills || [],
  );

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
      skills: user.skills || [],
      isPrivate: user.isPrivate || false,
    },
  });

  const handleAddSkill = (skill: string) => {
    if (!selectedSkills.includes(skill) && selectedSkills.length < 10) {
      const newSkills = [...selectedSkills, skill];
      setSelectedSkills(newSkills);
      form.setValue("skills", newSkills);
    }
  };

  const handleRemoveSkill = (skill: string) => {
    const newSkills = selectedSkills.filter((s) => s !== skill);
    setSelectedSkills(newSkills);
    form.setValue("skills", newSkills);
  };

  const watchRole = form.watch("role");

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
                      placeholder="0800 000 0000"
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
                      maxLength={500}
                      data-testid="input-edit-bio"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground text-right">
                    {field.value?.length || 0}/500 characters
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Skills Section - Only show for skilled workers */}
            {watchRole === "skilled_worker" && (
              <FormField
                control={form.control}
                name="skills"
                render={() => (
                  <FormItem>
                    <FormLabel>Skills & Expertise</FormLabel>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {selectedSkills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="gap-1"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Select onValueChange={handleAddSkill}>
                        <SelectTrigger>
                          <SelectValue placeholder="Add a skill..." />
                        </SelectTrigger>
                        <SelectContent>
                          {SKILL_CATEGORIES.filter(
                            (s) => !selectedSkills.includes(s),
                          ).map((skill) => (
                            <SelectItem key={skill} value={skill}>
                              {skill}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedSkills.length === 10 && (
                        <p className="text-xs text-muted-foreground">
                          Maximum 10 skills reached
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Privacy Setting */}
            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Private Profile</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      When enabled, only you can view your profile and listings
                    </p>
                  </div>
                  <FormControl>
                    <button
                      type="button"
                      onClick={() => field.onChange(!field.value)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        field.value ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          field.value ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </FormControl>
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
