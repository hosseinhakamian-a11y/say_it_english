import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StarRating } from "./StarRating";
import { ReviewCard } from "./ReviewCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Star, Send } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface ReviewsSectionProps {
    contentId: number;
}

interface Review {
    id: number;
    userId: number;
    contentId: number;
    rating: number;
    comment?: string;
    createdAt: string;
    user: {
        username: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
    };
}

interface ReviewsResponse {
    reviews: Review[];
    stats: {
        totalReviews: number;
        averageRating: number;
    };
}

export function ReviewsSection({ contentId }: ReviewsSectionProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    // Fetch reviews
    const { data, isLoading, error } = useQuery<ReviewsResponse>({
        queryKey: ["reviews", contentId],
        queryFn: async () => {
            const res = await fetch(`/api/reviews?contentId=${contentId}`, {
                credentials: "include"
            });
            if (!res.ok) throw new Error("خطا در دریافت نظرات");
            return res.json();
        }
    });

    // Submit review mutation
    const submitMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ contentId, rating, comment })
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "خطا در ثبت نظر");
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "✓ " + data.message,
                variant: "default"
            });
            setRating(0);
            setComment("");
            queryClient.invalidateQueries({ queryKey: ["reviews", contentId] });
        },
        onError: (error: Error) => {
            toast({
                title: "خطا",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    // Delete review mutation
    const deleteMutation = useMutation({
        mutationFn: async (reviewId: number) => {
            const res = await fetch("/api/reviews", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ reviewId })
            });
            if (!res.ok) throw new Error("خطا در حذف نظر");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "نظر حذف شد" });
            queryClient.invalidateQueries({ queryKey: ["reviews", contentId] });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast({
                title: "لطفاً امتیاز دهید",
                description: "برای ثبت نظر، انتخاب امتیاز الزامی است",
                variant: "destructive"
            });
            return;
        }
        submitMutation.mutate();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500">
                خطا در بارگذاری نظرات
            </div>
        );
    }

    const { reviews, stats } = data || { reviews: [], stats: { totalReviews: 0, averageRating: 0 } };

    return (
        <section className="mt-12">
            {/* Header with Stats */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold">نظرات کاربران</h2>
                    <span className="text-sm text-muted-foreground">
                        ({stats.totalReviews} نظر)
                    </span>
                </div>

                {stats.averageRating > 0 && (
                    <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-full">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">
                            {stats.averageRating.toFixed(1)}
                        </span>
                    </div>
                )}
            </div>

            {/* Submit Review Form */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 mb-8 border border-primary/10">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                    ✍️ نظر خود را بنویسید
                </h3>

                {user ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-muted-foreground mb-2">
                                امتیاز شما
                            </label>
                            <StarRating
                                value={rating}
                                onChange={setRating}
                                size="lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-muted-foreground mb-2">
                                نظر شما (اختیاری)
                            </label>
                            <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="تجربه خود را با دیگران به اشتراک بگذارید..."
                                className="min-h-[100px] resize-none"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={submitMutation.isPending || rating === 0}
                            className="gap-2"
                        >
                            {submitMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            ارسال نظر
                        </Button>
                    </form>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">
                            برای ثبت نظر، ابتدا وارد حساب کاربری خود شوید
                        </p>
                        <Link href="/auth">
                            <Button variant="outline">ورود به حساب</Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Reviews List */}
            {reviews.length > 0 ? (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            {...review}
                            canDelete={user?.id === review.userId || user?.role === "admin"}
                            onDelete={(id) => deleteMutation.mutate(id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-muted/30 rounded-xl">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">
                        هنوز نظری ثبت نشده است. اولین نفر باشید!
                    </p>
                </div>
            )}
        </section>
    );
}
