import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const sizeMap = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5" };

export function StarRating({ rating, maxRating = 5, size = "md", interactive = false, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5" data-testid="star-rating">
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <Star
            key={i}
            className={cn(
              sizeMap[size],
              filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
              interactive && "cursor-pointer"
            )}
            onClick={() => interactive && onChange?.(i + 1)}
            data-testid={`star-${i + 1}`}
          />
        );
      })}
    </div>
  );
}
