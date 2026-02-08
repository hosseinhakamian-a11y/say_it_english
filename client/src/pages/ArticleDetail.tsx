import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User, Clock, ArrowRight, Share2, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";
import { motion } from "framer-motion";

export default function ArticleDetail() {
    const [, params] = useRoute("/blog/:slug");
    const [, navigate] = useLocation();
    const slug = params?.slug;

    const { data: article, isLoading } = useQuery<any>({
        queryKey: [`/api/content/slug/${slug}`], // Need backend support for this query
        queryFn: async () => {
            // Check if slug is ID (old system) or text (new SEO system)
            const isId = /^\d+$/.test(slug || "");
            const res = await fetch(`/api/content`);
            const all = await res.json();

            if (isId) {
                return all.find((c: any) => c.id === parseInt(slug!));
            } else {
                return all.find((c: any) => c.slug === slug);
            }
        },
        enabled: !!slug
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!article) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">مقاله یافت نشد</h1>
                <Button onClick={() => navigate("/blog")}>بازگشت به وبلاگ</Button>
            </div>
        );
    }

    // Article Content Rendering
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-20"
        >
            <SEO
                title={article.title}
                description={article.description}
                image={article.thumbnailUrl}
                type="article"
                schema={{
                    "author": {
                        "@type": "Person",
                        "name": article.author || "Say It English Team"
                    },
                    "datePublished": article.createdAt,
                    "dateModified": article.createdAt,
                    "headline": article.title,
                }}
            />

            {/* Article Header */}
            <div className="relative h-[400px] w-full overflow-hidden">
                <div className="absolute inset-0 bg-black/50 z-10" />
                <img
                    src={article.thumbnailUrl || "/bg-pattern.png"}
                    alt={article.title}
                    className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 z-20 container mx-auto px-4 flex flex-col justify-end pb-12">
                    <div className="max-w-3xl">
                        <Badge className="mb-4 bg-primary text-primary-foreground hover:bg-primary/90">
                            {article.level === 'beginner' ? 'مبتدی' : article.level === 'intermediate' ? 'متوسط' : 'پیشرفته'}
                        </Badge>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                            {article.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-white/90 text-sm">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 border border-white/20">
                                    <AvatarImage src="/avatar-placeholder.png" />
                                    <AvatarFallback>HH</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{article.author || "تیم محتوا"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{article.createdAt ? new Date(article.createdAt).toLocaleDateString('fa-IR') : "امروز"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>زمان مطالعه: ۵ دقیقه</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Article Body */}
            <div className="container mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8">
                    <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary">
                        <p className="lead text-xl text-muted-foreground mb-8 font-medium">
                            {article.description}
                        </p>

                        {/* Only render raw HTML if it's trusted content. In a real app use dompurify */}
                        <div dangerouslySetInnerHTML={{ __html: article.body || "<p>محتوای کامل مقاله به زودی اضافه می‌شود...</p>" }} />
                    </article>

                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                        <div className="mt-12 pt-6 border-t flex flex-wrap gap-2">
                            {article.tags.map((tag: string, i: number) => (
                                <Badge key={i} variant="secondary" className="px-3 py-1 flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Share & Feedback */}
                    <div className="mt-12 bg-muted/30 p-6 rounded-2xl flex items-center justify-between">
                        <div>
                            <h3 className="font-bold mb-1">این مقاله مفید بود؟</h3>
                            <p className="text-sm text-muted-foreground">با دوستان خود به اشتراک بگذارید</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Share2 className="w-4 h-4" />
                            اشتراک‌گذاری
                        </Button>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="sticky top-24">
                        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                            <h3 className="font-bold text-lg mb-4">می‌خواهید انگلیسی را سریع‌تر یاد بگیرید؟</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                با شرکت در کلاس‌های خصوصی، مسیر یادگیری خود را ۶ ماه جلو بیندازید.
                            </p>
                            <Button className="w-full font-bold" onClick={() => navigate("/bookings")}>
                                رزرو کلاس آزمایشی
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div >
    );
}
