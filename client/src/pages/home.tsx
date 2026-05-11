import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StarRating } from "@/components/star-rating";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Briefcase,
  Wrench,
  Sparkles,
  ArrowRight,
  Shield,
  Star,
  Phone,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { Listing, User, Review } from "@shared/schema";

interface ListingWithProvider extends Listing {
  provider?: User;
  avgRating?: number;
  reviewCount?: number;
}

const categories = [
  { name: "Plumbing", icon: Wrench },
  { name: "Cleaning", icon: Sparkles },
  { name: "Electrical", icon: Briefcase },
  { name: "Landscaping", icon: MapPin },
  { name: "Painting", icon: Briefcase },
  { name: "Auto Repair", icon: Wrench },
  { name: "Food & Bakery", icon: Sparkles },
  { name: "Coffee & Cafe", icon: Briefcase },
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

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [, setLocation] = useLocation();

  const { data: listings, isLoading } = useQuery<ListingWithProvider[]>({
    queryKey: ["/api/listings"],
  });

  const filteredListings = listings?.filter((l) => {
    const matchQuery =
      !searchQuery ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const services = filteredListings?.filter((l) => l.type === "service") || [];
  const businesses =
    filteredListings?.filter((l) => l.type === "business") || [];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/30 dark:from-primary/10 dark:via-background dark:to-accent/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.1),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <MapPin className="mr-1 h-3 w-3" /> Your local marketplace
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find trusted <span className="text-primary">local services</span>{" "}
              near you
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with skilled workers and local businesses in your area.
              Search, compare, and contact providers directly.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <Card className="border-0 bg-card/80 backdrop-blur">
              <CardContent className="p-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or service..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-query"
                    />
                  </div>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger
                      className="w-full sm:w-[180px]"
                      data-testid="select-category"
                    >
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.name} value={cat.name}>
                          {cat.name}
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
                      data-testid="input-search-location"
                    />
                  </div>
                  <Button
                    className="shrink-0"
                    data-testid="button-search"
                    onClick={() => {
                      document
                        .getElementById("services-section")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <Search className="h-4 w-4 mr-1" /> Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="services-section" className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold">Services Near You</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Skilled professionals ready to help
            </p>
          </div>
          {services.length > 4 && (
            <Button variant="ghost" size="sm">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
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
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Wrench className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                No services found. Try adjusting your search.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((listing) => (
              <ServiceCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold">Recommended Businesses</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Top-rated local businesses
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full rounded-t-md rounded-b-none" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                No businesses found nearby.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {businesses.map((listing) => (
              <BusinessCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-accent/30 dark:bg-accent/10">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-semibold text-center mb-10">
            Why choose LocalHub?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Verified Providers</h3>
                <p className="text-sm text-muted-foreground">
                  All providers are reviewed and rated by real customers in your
                  community.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Direct Contact</h3>
                <p className="text-sm text-muted-foreground">
                  Call or WhatsApp providers directly to negotiate pricing,
                  discuss details, and confirm availability.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Honest Reviews</h3>
                <p className="text-sm text-muted-foreground">
                  Read real reviews from customers to make informed decisions
                  about local services.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <MapPin className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold">LocalHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Connecting communities with trusted local services.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function useContactGuard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const guard = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      e.stopPropagation();
      toast({
        title: "Please login to contact service providers.",
        variant: "destructive",
      });
      setLocation("/login");
      return true;
    }
    return false;
  };
  return guard;
}

function ServiceCard({ listing }: { listing: ListingWithProvider }) {
  const contactGuard = useContactGuard();
  const providerName =
    [listing.provider?.firstName, listing.provider?.lastName]
      .filter(Boolean)
      .join(" ") || "Provider";
  const initial = providerName.charAt(0).toUpperCase();
  const colorClass = getAvatarColor(providerName);

  return (
    <Link href={`/listing/${listing.id}`}>
      <Card
        className="overflow-visible hover-elevate cursor-pointer"
        data-testid={`card-listing-${listing.id}`}
      >
        {listing.image ? (
          <div className="relative overflow-hidden rounded-t-md">
            <img
              src={listing.image}
              alt={listing.title}
              className="h-40 w-full object-cover"
              data-testid={`img-listing-${listing.id}`}
            />
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
                onClick={(e) => {
                  e.stopPropagation();
                  contactGuard(e);
                }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  contactGuard(e);
                }}
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

function BusinessCard({ listing }: { listing: ListingWithProvider }) {
  const contactGuard = useContactGuard();
  return (
    <Link href={`/listing/${listing.id}`}>
      <Card
        className="overflow-visible hover-elevate cursor-pointer group"
        data-testid={`card-listing-${listing.id}`}
      >
        <div className="relative overflow-hidden rounded-t-md">
          {listing.image ? (
            <img
              src={listing.image}
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
          <p
            className="text-sm text-muted-foreground mt-1 truncate"
            data-testid={`text-provider-${listing.id}`}
          >
            {[listing.provider?.firstName, listing.provider?.lastName]
              .filter(Boolean)
              .join(" ") || "Business"}
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
                onClick={(e) => {
                  e.stopPropagation();
                  contactGuard(e);
                }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  contactGuard(e);
                }}
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
