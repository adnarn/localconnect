import { useState, useRef, useEffect } from "react";
import { createApiUrl, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/star-rating";
import {
  Plus,
  MapPin,
  Briefcase,
  Star,
  Loader2,
  Trash2,
  Eye,
  Search,
  Phone,
  Upload,
  X,
  ImageIcon,
  Store,
  TrendingUp,
  Settings,
  ArrowRight,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Link, useLocation } from "wouter";
import type { Listing, Review } from "@shared/schema";

const categoryOptions = [
  "Plumbing",
  "Cleaning",
  "Electrical",
  "Landscaping",
  "Painting",
  "Auto Repair",
  "Food & Bakery",
  "Coffee & Cafe",
  "Other",
];

const avatarColors = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "customer") return <CustomerDashboard />;
  if (user.role === "business_owner") return <BusinessDashboard />;
  if (user.role === "skilled_worker") return <SkilledWorkerDashboard />;
  if (user.role === "admin") return <AdminRedirect />;

  return null;
}

function AdminRedirect() {
  return (
    <div className="max-w-7xl mx-auto p-4 py-8 text-center">
      <p className="text-muted-foreground">
        You are an admin.{" "}
        <Link href="/admin" className="text-primary font-medium">
          Go to Admin Panel
        </Link>
      </p>
    </div>
  );
}

function CustomerDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: listings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/listings"],
  });

  const filteredListings = listings?.filter((l: any) => {
    const matchQuery =
      !searchQuery ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      [l.provider?.firstName, l.provider?.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchLoc =
      !searchLocation ||
      l.location?.toLowerCase().includes(searchLocation.toLowerCase());
    const matchCat =
      selectedCategory === "all" || l.category === selectedCategory;
    return matchQuery && matchLoc && matchCat;
  });

  const hasFilters =
    searchQuery || searchLocation || selectedCategory !== "all";
  const resultCount = filteredListings?.length || 0;

  return (
    <div className="max-w-7xl mx-auto p-4 py-8">
      <div className="mb-6">
        <p className="text-muted-foreground">
          Search for skilled workers and businesses in your area
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or service..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-dashboard-search"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger
                className="w-full sm:w-[180px]"
                data-testid="select-dashboard-category"
              >
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions
                  .filter((c) => c !== "Other")
                  .map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 sm:max-w-[180px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Location..."
                className="pl-9"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                data-testid="input-dashboard-location"
              />
            </div>
            <Button className="shrink-0" data-testid="button-dashboard-search">
              <Search className="h-4 w-4 mr-1" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasFilters && (
        <p
          className="text-sm text-muted-foreground mb-4"
          data-testid="text-result-count"
        >
          Found {resultCount} {resultCount === 1 ? "result" : "results"}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-center py-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : resultCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              No results found. Try adjusting your search or filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings?.map((listing: any) =>
            listing.type === "service" ? (
              <ServiceResultCard key={listing.id} listing={listing} />
            ) : (
              <BusinessResultCard key={listing.id} listing={listing} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function ServiceResultCard({ listing }: { listing: any }) {
  const providerName =
    [listing.provider?.firstName, listing.provider?.lastName]
      .filter(Boolean)
      .join(" ") || "Provider";
  const initial = providerName.charAt(0).toUpperCase();
  const colorClass = getAvatarColor(providerName);
  const imageCount = listing.imageCount || 0;

  return (
    <Link href={`/listing/${listing.id}`}>
      <Card
        className="overflow-visible hover-elevate cursor-pointer h-full"
        data-testid={`card-listing-${listing.id}`}
      >
        {listing.image ? (
          <div className="relative overflow-hidden rounded-t-md">
            <img
              src={
                listing.image.startsWith("http")
                  ? listing.image
                  : `${API_BASE_URL}${listing.image}`
              }
              alt={listing.title}
              className="h-40 w-full object-cover"
              data-testid={`img-listing-${listing.id}`}
            />
            {imageCount > 1 && (
              <div
                className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-white text-xs backdrop-blur-sm"
                data-testid={`badge-image-count-${listing.id}`}
              >
                <ImageIcon className="h-3 w-3" /> {imageCount}
              </div>
            )}
          </div>
        ) : null}
        <CardContent className="p-4">
          {!listing.image && (
            <div className="flex justify-center py-4">
              <Avatar
                className={`h-16 w-16 ${colorClass}`}
                data-testid={`avatar-provider-${listing.id}`}
              >
                <AvatarFallback
                  className={`${colorClass} text-2xl font-bold text-white`}
                >
                  {initial}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="font-semibold truncate"
              data-testid={`text-provider-name-${listing.id}`}
            >
              {providerName}
            </h3>
            <Badge
              variant="outline"
              className="text-xs border-emerald-500 text-emerald-600 dark:text-emerald-400 shrink-0"
              data-testid={`badge-available-${listing.id}`}
            >
              Available
            </Badge>
          </div>
          <Badge
            variant="secondary"
            className="mt-2 text-xs capitalize"
            data-testid={`badge-category-${listing.id}`}
          >
            {listing.category}
          </Badge>
          <p
            className="text-sm text-muted-foreground mt-2 line-clamp-2"
            data-testid={`text-description-${listing.id}`}
          >
            {listing.description}
          </p>
          {listing.location && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span
                className="truncate"
                data-testid={`text-location-${listing.id}`}
              >
                {listing.location}
              </span>
            </div>
          )}
          <div
            className="flex items-center gap-2 mt-2"
            data-testid={`rating-info-${listing.id}`}
          >
            <StarRating rating={listing.avgRating || 0} size="sm" />
            <span className="text-xs text-muted-foreground">
              {(listing.avgRating || 0).toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              {listing.reviewCount || 0}{" "}
              {(listing.reviewCount || 0) === 1 ? "review" : "reviews"}
            </span>
          </div>
          {listing.provider?.phone && (
            <div
              className="flex items-center gap-2 mt-3"
              data-testid={`contact-icons-${listing.id}`}
            >
              <a
                href={`tel:${listing.provider.phone}`}
                onClick={(e) => e.stopPropagation()}
                data-testid={`link-call-${listing.id}`}
              >
                <Button variant="outline" size="sm">
                  <Phone className="h-3.5 w-3.5 mr-1" /> Call
                </Button>
              </a>
              <a
                href={`https://wa.me/${listing.provider.phone.replace(/[^0-9]/g, "").replace(/^0/, "234")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                data-testid={`link-whatsapp-${listing.id}`}
              >
                <Button size="sm">
                  <SiWhatsapp className="h-3.5 w-3.5 mr-1" /> WhatsApp
                </Button>
              </a>
            </div>
          )}
          {!listing.provider?.phone && (
            <div
              className="flex items-center gap-1 mt-2 text-xs text-muted-foreground"
              data-testid={`text-contact-${listing.id}`}
            >
              <Phone className="h-3 w-3 shrink-0" />
              <span>Contact available</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function BusinessResultCard({ listing }: { listing: any }) {
  const imageCount = listing.imageCount || 0;
  return (
    <Link href={`/listing/${listing.id}`}>
      <Card
        className="overflow-visible hover-elevate cursor-pointer group h-full"
        data-testid={`card-listing-${listing.id}`}
      >
        <div className="relative overflow-hidden rounded-t-md">
          {listing.image ? (
            <img
              src={
                listing.image.startsWith("http")
                  ? listing.image
                  : `${API_BASE_URL}${listing.image}`
              }
              alt={listing.title}
              className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              data-testid={`img-listing-${listing.id}`}
            />
          ) : (
            <div className="h-48 w-full bg-muted flex items-center justify-center">
              <Briefcase className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 capitalize text-xs"
            data-testid={`badge-category-${listing.id}`}
          >
            {listing.category}
          </Badge>
          {imageCount > 1 && (
            <div
              className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-white text-xs backdrop-blur-sm"
              data-testid={`badge-image-count-${listing.id}`}
            >
              <ImageIcon className="h-3 w-3" /> {imageCount}
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="font-semibold truncate"
              data-testid={`text-title-${listing.id}`}
            >
              {listing.title}
            </h3>
            <Badge
              variant="outline"
              className="text-xs border-emerald-500 text-emerald-600 dark:text-emerald-400 shrink-0"
              data-testid={`badge-open-${listing.id}`}
            >
              Open
            </Badge>
          </div>
          {listing.location && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span
                className="truncate"
                data-testid={`text-location-${listing.id}`}
              >
                {listing.location}
              </span>
            </div>
          )}
          <div
            className="flex items-center gap-2 mt-2"
            data-testid={`rating-info-${listing.id}`}
          >
            <StarRating rating={listing.avgRating || 0} size="sm" />
            <span className="text-xs text-muted-foreground">
              {(listing.avgRating || 0).toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              {listing.reviewCount || 0}{" "}
              {(listing.reviewCount || 0) === 1 ? "review" : "reviews"}
            </span>
          </div>
          {listing.price && (
            <p
              className="mt-2 text-sm font-medium text-primary"
              data-testid={`text-price-${listing.id}`}
            >
              {listing.price}
            </p>
          )}
          {listing.provider?.phone && (
            <div
              className="flex items-center gap-2 mt-3"
              data-testid={`contact-icons-${listing.id}`}
            >
              <a
                href={`tel:${listing.provider.phone}`}
                onClick={(e) => e.stopPropagation()}
                data-testid={`link-call-${listing.id}`}
              >
                <Button variant="outline" size="sm">
                  <Phone className="h-3.5 w-3.5 mr-1" /> Call
                </Button>
              </a>
              <a
                href={`https://wa.me/${listing.provider.phone.replace(/[^0-9]/g, "").replace(/^0/, "234")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                data-testid={`link-whatsapp-${listing.id}`}
              >
                <Button size="sm">
                  <SiWhatsapp className="h-3.5 w-3.5 mr-1" /> WhatsApp
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function BusinessDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Other",
    price: "",
    location: user?.location || "",
    image: "",
    websiteUrl: "",
  });
  const [uploadedImages, setUploadedImages] = useState<
    { url: string; preview: string }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const businessName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "");

  const MAX_IMAGES = 6;
  const MIN_IMAGES = 3;

  const handleImageUpload = async (files: FileList) => {
    const remaining = MAX_IMAGES - uploadedImages.length;
    if (remaining <= 0) {
      toast({
        title: `Maximum ${MAX_IMAGES} images allowed`,
        variant: "destructive",
      });
      return;
    }
    const filesToUpload = Array.from(files).slice(0, remaining);
    if (filesToUpload.length < files.length) {
      toast({
        title: `Only ${remaining} more image${remaining === 1 ? "" : "s"} can be added (max ${MAX_IMAGES})`,
      });
    }
    setUploading(true);
    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("image", file);
        const token = localStorage.getItem("authToken");
        const res = await fetch(createApiUrl("/api/upload"), {
          method: "POST",
          body: formData,
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        setUploadedImages((prev) => [
          ...prev,
          { url: data.url, preview: URL.createObjectURL(file) },
        ]);
      }
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const { data: myListings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/listings", "mine"],
  });

  const { data: myReviews } = useQuery<any[]>({
    queryKey: ["/api/reviews", "mine"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Images are now optional - can create post without images
      const mainImage =
        uploadedImages.length > 0 ? uploadedImages[0].url : null;
      const res = await apiRequest("POST", createApiUrl("/api/listings"), {
        ...data,
        type: "business",
        userId: user?.id,
        image: mainImage,
      });
      const listing = await res.json();
      if (uploadedImages.length > 1) {
        for (let i = 1; i < uploadedImages.length; i++) {
          await apiRequest(
            "POST",
            createApiUrl(`/api/listings/${listing.id}/images`),
            {
              imageUrl: uploadedImages[i].url,
              sortOrder: i,
            },
          );
        }
      }
      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: "Post created successfully!" });
      setDialogOpen(false);
      setForm({
        title: "",
        description: "",
        category: "Other",
        price: "",
        location: user?.location || "",
        image: "",
        websiteUrl: "",
      });
      setUploadedImages([]);
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create post",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", createApiUrl(`/api/listings/${id}`));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: "Post removed" });
    },
  });

  const update = (key: string, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));
  const avgRating = myReviews?.length
    ? myReviews.reduce((s: number, r: any) => s + r.rating, 0) /
      myReviews.length
    : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            {user?.profileImageUrl ? (
              <AvatarImage src={user.profileImageUrl} alt={businessName} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1
              className="text-2xl font-semibold"
              data-testid="text-business-name"
            >
              {businessName}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <Badge variant="secondary" className="text-xs">
                <Store className="h-3 w-3 mr-1" /> Business Owner
              </Badge>
              {user?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {user.location}
                </span>
              )}
              {user?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {user.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/profile/${user?.id}`}>
            <Button
              variant="outline"
              size="sm"
              data-testid="button-view-profile"
            >
              <Settings className="h-4 w-4 mr-1" /> Profile
            </Button>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-listing">
                <Plus className="h-4 w-4 mr-1" /> New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Business Post</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate(form);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="e.g. Weekend Special Menu"
                    data-testid="input-listing-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Describe your product or service..."
                    className="resize-none"
                    rows={4}
                    data-testid="input-listing-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => update("category", v)}
                    >
                      <SelectTrigger data-testid="select-listing-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Price{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      value={form.price}
                      onChange={(e) => update("price", e.target.value)}
                      placeholder="e.g. ₦10,000"
                      data-testid="input-listing-price"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="City, State"
                    data-testid="input-listing-location"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Images (Optional)</Label>
                    <span
                      className={`text-xs ${uploadedImages.length >= MAX_IMAGES ? "text-destructive" : "text-primary"}`}
                      data-testid="text-image-count"
                    >
                      {uploadedImages.length}/{MAX_IMAGES} photos
                    </span>
                  </div>
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-md overflow-hidden border aspect-square"
                        >
                          <img
                            src={img.preview}
                            alt={`Upload ${idx + 1}`}
                            className="w-full h-full object-cover"
                            data-testid={`img-upload-preview-${idx}`}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => removeImage(idx)}
                            data-testid={`button-remove-image-${idx}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {idx === 0 && (
                            <Badge
                              variant="secondary"
                              className="absolute bottom-1 left-1 text-[10px]"
                            >
                              Cover
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {uploadedImages.length < MAX_IMAGES && (
                    <label
                      className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover-elevate"
                      data-testid="label-upload-area"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        multiple
                        onChange={(e) => {
                          if (e.target.files?.length)
                            handleImageUpload(e.target.files);
                          e.target.value = "";
                        }}
                        data-testid="input-listing-image"
                      />
                      {uploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground/50 mb-1" />
                          <span className="text-xs text-muted-foreground">
                            Upload up to {MAX_IMAGES} photos to showcase your
                            products (optional)
                          </span>
                        </>
                      )}
                    </label>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Website URL{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    value={form.websiteUrl}
                    onChange={(e) => update("websiteUrl", e.target.value)}
                    placeholder="https://www.example.com"
                    data-testid="input-listing-website"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-listing"
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Publish Post
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p
                className="text-2xl font-bold"
                data-testid="text-listings-count"
              >
                {myListings?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-avg-rating">
                {avgRating ? avgRating.toFixed(1) : "0"}
              </p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-review-count">
                {myReviews?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts" data-testid="tab-listings">
            My Posts
          </TabsTrigger>
          <TabsTrigger value="reviews" data-testid="tab-reviews">
            Reviews ({myReviews?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-32 w-full rounded-md mb-3" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !myListings?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Store className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold mb-1">No posts yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first post to showcase your products or services
                </p>
                <Button
                  onClick={() => setDialogOpen(true)}
                  data-testid="button-create-first"
                >
                  <Plus className="h-4 w-4 mr-1" /> Create your first post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myListings.map((listing: any) => (
                <Card
                  key={listing.id}
                  data-testid={`card-my-listing-${listing.id}`}
                >
                  <CardContent className="p-0">
                    {listing.image ? (
                      <div className="relative overflow-hidden rounded-t-md">
                        <img
                          src={listing.image}
                          alt={listing.title}
                          className="h-40 w-full object-cover"
                        />
                        <Badge
                          variant="secondary"
                          className="absolute top-2 right-2 capitalize text-xs"
                        >
                          {listing.category}
                        </Badge>
                      </div>
                    ) : (
                      <div className="h-32 bg-muted rounded-t-md flex items-center justify-center">
                        <Store className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-semibold truncate"
                            data-testid={`text-listing-title-${listing.id}`}
                          >
                            {listing.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {listing.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {!listing.image && (
                          <Badge
                            variant="secondary"
                            className="text-xs capitalize"
                          >
                            {listing.category}
                          </Badge>
                        )}
                        {listing.price && (
                          <span className="text-sm font-medium text-primary">
                            {listing.price}
                          </span>
                        )}
                        {listing.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {listing.location}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <Link href={`/listing/${listing.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-view-${listing.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(listing.id)}
                          data-testid={`button-delete-${listing.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1 text-destructive" />{" "}
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          {!myReviews?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">
                  No reviews yet. Share your posts to start getting feedback.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myReviews.map((review: any) => (
                <Card key={review.id} data-testid={`card-review-${review.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs">
                          {(review.reviewer?.firstName?.[0] || "") +
                            (review.reviewer?.lastName?.[0] || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {[
                              review.reviewer?.firstName,
                              review.reviewer?.lastName,
                            ]
                              .filter(Boolean)
                              .join(" ") || "Customer"}
                          </span>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SkilledWorkerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Other",
    price: "",
    location: user?.location || "",
    image: "",
  });
  const [uploadedImages, setUploadedImages] = useState<
    { url: string; preview: string }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const workerName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "");

  const MAX_IMAGES = 6;
  const MIN_IMAGES = 3;

  const handleImageUpload = async (files: FileList) => {
    const remaining = MAX_IMAGES - uploadedImages.length;
    if (remaining <= 0) {
      toast({
        title: `Maximum ${MAX_IMAGES} images allowed`,
        variant: "destructive",
      });
      return;
    }
    const filesToUpload = Array.from(files).slice(0, remaining);
    if (filesToUpload.length < files.length) {
      toast({
        title: `Only ${remaining} more image${remaining === 1 ? "" : "s"} can be added (max ${MAX_IMAGES})`,
      });
    }
    setUploading(true);
    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("image", file);
        const token = localStorage.getItem("authToken");
        const res = await fetch(createApiUrl("/api/upload"), {
          method: "POST",
          body: formData,
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        setUploadedImages((prev) => [
          ...prev,
          { url: data.url, preview: URL.createObjectURL(file) },
        ]);
      }
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const { data: myListings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/listings", "mine"],
  });

  const { data: myReviews } = useQuery<any[]>({
    queryKey: ["/api/reviews", "mine"],
  });

  const { data: galleryImages } = useQuery<any[]>({
    queryKey: ["/api/gallery", user?.id],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Images are now optional - can create service without images
      const mainImage =
        uploadedImages.length > 0 ? uploadedImages[0].url : null;
      const res = await apiRequest("POST", "/api/listings", {
        ...data,
        type: "service",
        userId: user?.id,
        image: mainImage,
      });
      const listing = await res.json();
      if (uploadedImages.length > 1) {
        for (let i = 1; i < uploadedImages.length; i++) {
          await apiRequest("POST", `/api/listings/${listing.id}/images`, {
            imageUrl: uploadedImages[i].url,
            sortOrder: i,
          });
        }
      }
      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: "Service created successfully!" });
      setDialogOpen(false);
      setForm({
        title: "",
        description: "",
        category: "Other",
        price: "",
        location: user?.location || "",
        image: "",
      });
      setUploadedImages([]);
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create service",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/listings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: "Service removed" });
    },
  });

  const update = (key: string, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));
  const avgRating = myReviews?.length
    ? myReviews.reduce((s: number, r: any) => s + r.rating, 0) /
      myReviews.length
    : 0;
  const galleryCount = galleryImages?.length || 0;

  return (
    <div className="max-w-7xl mx-auto p-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            {user?.profileImageUrl ? (
              <AvatarImage src={user.profileImageUrl} alt={workerName} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1
              className="text-2xl font-semibold"
              data-testid="text-worker-name"
            >
              {workerName}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <Badge variant="secondary" className="text-xs">
                <Briefcase className="h-3 w-3 mr-1" /> Skilled Worker
              </Badge>
              {user?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {user.location}
                </span>
              )}
              {user?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {user.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/profile/${user?.id}`}>
            <Button
              variant="outline"
              size="sm"
              data-testid="button-view-profile"
            >
              <Settings className="h-4 w-4 mr-1" /> Profile
            </Button>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-listing">
                <Plus className="h-4 w-4 mr-1" /> New Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Service Listing</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate(form);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Service Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="e.g. Professional Plumbing Service"
                    data-testid="input-listing-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Describe your skills, experience, and what you offer..."
                    className="resize-none"
                    rows={4}
                    data-testid="input-listing-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => update("category", v)}
                    >
                      <SelectTrigger data-testid="select-listing-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Price{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      value={form.price}
                      onChange={(e) => update("price", e.target.value)}
                      placeholder="e.g. ₦10,000"
                      data-testid="input-listing-price"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="City, State"
                    data-testid="input-listing-location"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Photos (Optional)</Label>
                    <span
                      className={`text-xs ${uploadedImages.length >= MAX_IMAGES ? "text-destructive" : "text-primary"}`}
                      data-testid="text-image-count"
                    >
                      {uploadedImages.length}/{MAX_IMAGES} photos
                    </span>
                  </div>
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-md overflow-hidden border aspect-square"
                        >
                          <img
                            src={img.preview}
                            alt={`Upload ${idx + 1}`}
                            className="w-full h-full object-cover"
                            data-testid={`img-upload-preview-${idx}`}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => removeImage(idx)}
                            data-testid={`button-remove-image-${idx}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {idx === 0 && (
                            <Badge
                              variant="secondary"
                              className="absolute bottom-1 left-1 text-[10px]"
                            >
                              Cover
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {uploadedImages.length < MAX_IMAGES && (
                    <label
                      className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover-elevate"
                      data-testid="label-upload-area"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        multiple
                        onChange={(e) => {
                          if (e.target.files?.length)
                            handleImageUpload(e.target.files);
                          e.target.value = "";
                        }}
                        data-testid="input-listing-image"
                      />
                      {uploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground/50 mb-1" />
                          <span className="text-xs text-muted-foreground">
                            Upload up to {MAX_IMAGES} photos to showcase your
                            work (optional)
                          </span>
                        </>
                      )}
                    </label>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-listing"
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Publish Service
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p
                className="text-2xl font-bold"
                data-testid="text-listings-count"
              >
                {myListings?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Services</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-avg-rating">
                {avgRating ? avgRating.toFixed(1) : "0"}
              </p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-review-count">
                {myReviews?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services" data-testid="tab-listings">
            My Services
          </TabsTrigger>
          <TabsTrigger value="reviews" data-testid="tab-reviews">
            Reviews ({myReviews?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="gallery" data-testid="tab-gallery">
            Gallery ({galleryCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-32 w-full rounded-md mb-3" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !myListings?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold mb-1">No services yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first service listing to start getting customers
                </p>
                <Button
                  onClick={() => setDialogOpen(true)}
                  data-testid="button-create-first"
                >
                  <Plus className="h-4 w-4 mr-1" /> Create your first service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myListings.map((listing: any) => (
                <Card
                  key={listing.id}
                  data-testid={`card-my-listing-${listing.id}`}
                >
                  <CardContent className="p-0">
                    {listing.image ? (
                      <div className="relative overflow-hidden rounded-t-md">
                        <img
                          src={listing.image}
                          alt={listing.title}
                          className="h-40 w-full object-cover"
                        />
                        <Badge
                          variant="secondary"
                          className="absolute top-2 right-2 capitalize text-xs"
                        >
                          {listing.category}
                        </Badge>
                      </div>
                    ) : (
                      <div className="h-32 bg-muted rounded-t-md flex items-center justify-center">
                        <Briefcase className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-semibold truncate"
                            data-testid={`text-listing-title-${listing.id}`}
                          >
                            {listing.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {listing.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {!listing.image && (
                          <Badge
                            variant="secondary"
                            className="text-xs capitalize"
                          >
                            {listing.category}
                          </Badge>
                        )}
                        {listing.price && (
                          <span className="text-sm font-medium text-primary">
                            {listing.price}
                          </span>
                        )}
                        {listing.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {listing.location}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <Link href={`/listing/${listing.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-view-${listing.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(listing.id)}
                          data-testid={`button-delete-${listing.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1 text-destructive" />{" "}
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          {!myReviews?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-semibold mb-1">No reviews yet</h3>
                <p className="text-sm text-muted-foreground">
                  Share your services to start getting feedback from customers
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myReviews.map((review: any) => (
                <Card key={review.id} data-testid={`card-review-${review.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs">
                          {(review.reviewer?.firstName?.[0] || "") +
                            (review.reviewer?.lastName?.[0] || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {[
                              review.reviewer?.firstName,
                              review.reviewer?.lastName,
                            ]
                              .filter(Boolean)
                              .join(" ") || "Customer"}
                          </span>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gallery" className="mt-4">
          {!galleryImages?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold mb-1">
                  Your work gallery is empty
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload photos of completed projects to attract more customers
                </p>
                <Link href={`/profile/${user?.id}`}>
                  <Button variant="outline" data-testid="button-go-to-gallery">
                    <Upload className="h-4 w-4 mr-1" /> Upload from Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
                  {img.caption && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {img.caption}
                    </p>
                  )}
                </div>
              ))}
              <Link href={`/profile/${user?.id}`}>
                <div
                  className="w-full aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover-elevate"
                  data-testid="button-add-gallery-from-dashboard"
                >
                  <Plus className="h-6 w-6 text-muted-foreground/50 mb-1" />
                  <span className="text-xs text-muted-foreground">
                    Add More
                  </span>
                </div>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
