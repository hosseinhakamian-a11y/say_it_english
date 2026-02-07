import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    containerClassName?: string;
}

export function OptimizedImage({
    src,
    alt,
    className,
    containerClassName,
    ...props
}: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    // Auto-optimize Unsplash URLs if they don't already have formatting params
    const optimizedSrc = src.includes("unsplash.com") && !src.includes("fm=")
        ? `${src}${src.includes("?") ? "&" : "?"}auto=format&fm=webp&q=80`
        : src;

    return (
        <div className={cn("relative overflow-hidden bg-muted/20", containerClassName)}>
            <AnimatePresence>
                {!isLoaded && !error && (
                    <motion.div
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted"
                    />
                )}
            </AnimatePresence>

            <img
                src={optimizedSrc}
                alt={alt}
                loading="lazy"
                onLoad={() => setIsLoaded(true)}
                onError={() => setError(true)}
                className={cn(
                    "transition-all duration-700 ease-out",
                    !isLoaded ? "scale-105 blur-sm opacity-0" : "scale-100 blur-0 opacity-100",
                    className
                )}
                {...props}
            />

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xs text-center p-2">
                    خطا در بارگذاری تصویر
                </div>
            )}
        </div>
    );
}
