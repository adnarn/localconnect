import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/star-rating";
import { ImageCarousel } from "@/components/image-carousel";
import {
  MapPin,
  ArrowLeft,
  Loader2,
  Briefcase,
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

// Helper function to get the correct image URL
const getImageUrl = (url: string | undefined) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
};

export default function ListingDetail() {
  const [, params] = useRoute("/listing/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: listing, isLoading } = useQuery<any>({
    queryKey: ["/api/listings", params?.id],
    enabled: !!params?.id,
  });

  const { data: reviews } = useQuery<any[]>({
    queryKey: ["/api/reviews", "listing", params?.id],
    enabled: !!params?.id,
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/reviews", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/reviews", "listing", params?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/listings", params?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: "Review submitted!" });
      setRating(0);
      setComment("");
    },
    onError: (err: any) => {
      toast({
        title: "Failed to submit review",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !comment) {
      toast({
        title: "Please provide a rating and comment",
        variant: "destructive",
      });
      return;
    }
    reviewMutation.mutate({
      listingId: params?.id,
      reviewerId: user?.id,
      providerId: listing?.userId,
      rating,
      comment,
    });
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "234" + cleaned.substring(1);
    }
    return cleaned;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full rounded-md mb-4" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto p-4 py-16 text-center">
        <Briefcase className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Listing not found</h2>
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    );
  }

  const provider = listing.provider;
  const initials =
    (provider?.firstName?.[0] || "") + (provider?.lastName?.[0] || "") ||
    provider?.email?.[0]?.toUpperCase() ||
    "P";
  const providerName = [provider?.firstName, provider?.lastName]
    .filter(Boolean)
    .join(" ");

  // Fix: Process images with proper URL handling
  const allImages: string[] = [];
  if (listing.image) {
    const imageUrl = getImageUrl(listing.image);
    if (imageUrl) allImages.push(imageUrl);
  }
  if (listing.images?.length) {
    listing.images.forEach((img: any) => {
      if (img.imageUrl) {
        const imageUrl = getImageUrl(img.imageUrl);
        if (imageUrl && !allImages.includes(imageUrl)) {
          allImages.push(imageUrl);
        }
      }
    });
  }

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

      {allImages.length > 0 ? (
        <div className="mb-6">
          <ImageCarousel
            images={allImages}
            alt={listing.title}
            showThumbnails={allImages.length > 1}
            showDots={allImages.length > 1}
            overlay={
              <Badge
                variant="secondary"
                className="absolute top-3 right-3 capitalize z-10"
              >
                {listing.category}
              </Badge>
            }
          />
        </div>
      ) : (
        // Show placeholder when no images
        <div className="mb-6 rounded-md bg-muted h-64 flex items-center justify-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/40" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="capitalize">
                {listing.type === "business" ? "business" : "service"}
              </Badge>
              {listing.category && (
                <Badge variant="secondary" className="capitalize">
                  {listing.category}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold" data-testid="text-listing-title">
              {listing.title}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="flex items-center gap-1">
                <StarRating rating={listing.avgRating || 0} size="md" />
                <span className="text-sm text-muted-foreground">
                  ({listing.reviewCount || 0} reviews)
                </span>
              </div>
              {listing.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {listing.location}
                </div>
              )}
            </div>
            {listing.price && (
              <p
                className="mt-3 text-xl font-semibold text-primary"
                data-testid="text-listing-price"
              >
                {listing.price}
              </p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p
              className="text-muted-foreground leading-relaxed"
              data-testid="text-listing-description"
            >
              {listing.description}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">
              Reviews ({reviews?.length || 0})
            </h2>
            {!reviews?.length ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No reviews yet. Be the first to review!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reviews.map((r: any) => (
                  <Card key={r.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs bg-primary/10">
                              {r.reviewer?.firstName?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {[r.reviewer?.firstName, r.reviewer?.lastName]
                              .filter(Boolean)
                              .join(" ") || "Customer"}
                          </span>
                        </div>
                        <StarRating rating={r.rating} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {r.comment}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {user && user.id !== listing.userId && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3">Leave a Review</h3>
                  <form onSubmit={handleReview} className="space-y-3">
                    <div>
                      <StarRating
                        rating={rating}
                        interactive
                        onChange={setRating}
                        size="lg"
                      />
                    </div>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience..."
                      className="resize-none"
                      data-testid="input-review-comment"
                    />
                    <Button
                      type="submit"
                      disabled={reviewMutation.isPending}
                      data-testid="button-submit-review"
                    >
                      {reviewMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Submit Review
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3">
                <Link href={`/profile/${provider?.id}`}>
                  <p
                    className="font-medium text-primary cursor-pointer hover:underline"
                    data-testid="link-provider-name"
                  >
                    {providerName}
                  </p>
                </Link>
                <p className="text-sm text-muted-foreground capitalize">
                  {provider?.role?.replace("_", " ")}
                </p>
              </div>
              
              {provider?.bio && (
                <p
                  className="text-sm text-muted-foreground mb-3 line-clamp-3"
                  data-testid="text-provider-bio"
                >
                  {provider.bio}
                </p>
              )}
              
              {provider?.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> {provider.location}
                </div>
              )}
              
              {provider?.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" /> {provider.phone}
                </div>
              )}
              
              {provider?.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" /> {provider.email}
                </div>
              )}
              
              {listing.websiteUrl && (
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <a
                    href={
                      listing.websiteUrl.startsWith("http")
                        ? listing.websiteUrl
                        : `https://${listing.websiteUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary truncate hover:underline"
                    data-testid="link-listing-website"
                  >
                    {listing.websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              
              {provider?.phone && (
                <div className="flex gap-2 mt-3">
                  <a
                    href={`tel:${provider.phone}`}
                    className="flex-1"
                    data-testid="link-call-provider"
                  >
                    <Button variant="outline" className="w-full">
                      <Phone className="h-4 w-4 mr-1" /> Call
                    </Button>
                  </a>
                  <a
                    href={`https://wa.me/${formatPhoneForWhatsApp(provider.phone)}?text=${encodeURIComponent(
                      `Hi, I'm interested in your listing "${listing.title}" on LocalHub.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                    data-testid="link-whatsapp-provider"
                  >
                    <Button className="w-full">
                      <SiWhatsapp className="h-4 w-4 mr-1" /> WhatsApp
                    </Button>
                  </a>
                </div>
              )}
              
              {!provider?.phone && (
                <p
                  className="text-xs text-muted-foreground mt-2 text-center"
                  data-testid="text-no-phone"
                >
                  Contact info not available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}