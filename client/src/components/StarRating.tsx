import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    value: number;
    onChange?: (value: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function StarRating({
    value,
    onChange,
    readonly = false,
    size = "md",
    className
}: StarRatingProps) {
    const sizes = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6"
    };

    const handleClick = (rating: number) => {
        if (!readonly && onChange) {
            onChange(rating);
        }
    };

    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => handleClick(star)}
                    disabled={readonly}
                    className={cn(
                        "transition-all duration-200",
                        !readonly && "hover:scale-110 cursor-pointer",
                        readonly && "cursor-default"
                    )}
                >
                    <Star
                        className={cn(
                            sizes[size],
                            "transition-colors",
                            star <= value
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-200"
                        )}
                    />
                </button>
            ))}
        </div>
    );
}
