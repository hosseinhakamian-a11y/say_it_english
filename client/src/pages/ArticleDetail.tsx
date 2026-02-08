import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Calendar, User, Clock, ArrowRight, Share2, Tag,
    ChevronUp, Bookmark, MessageSquare
} from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export default function ArticleDetail() {
    const [, params] = useRoute("/article/:slug");
    const [, navigate] = useLocation();
    const slug = params?.slug;
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const { data: article, isLoading } = useQuery<any>({
        queryKey: [`/api/content/slug/${slug}`],
        queryFn: async () => {
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

    const { data: relatedArticles } = useQuery<any[]>({
        queryKey: ["related-articles", article?.id],
        queryFn: async () => {
            if (!article) return [];
            const res = await fetch("/api/content");
            const all = await res.json();
            return all
                .filter((c: any) => c.type === 'article' && c.id !== article.id)
                .slice(0, 3);
        },
        enabled: !!article
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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-20 bg-background min-h-screen"
        >
            <SEO
                title={article.title}
                description={article.description}
                image={article.thumbnailUrl}
                type="article"
                schema={{
                    "author": { "@type": "Person", "name": article.author || "Say It English Team" },
                    "datePublished": article.createdAt,
                    "headline": article.title,
                }}
            />

            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 origin-left"
                style={{ scaleX }}
            />

            {/* Article Header */}
            <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-black/50 to-black/30 z-10" />
                <img
                    src={article.thumbnailUrl || "/bg-pattern.png"}
                    alt={article.title}
                    className="w-full h-full object-cover animate-ken-burns"
                />

                <div className="absolute inset-0 z-20 container mx-auto px-4 flex flex-col justify-end pb-16">
                    <div className="max-w-4xl mx-auto w-full text-center md:text-right">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Badge className="mb-6 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1 text-sm">
                                {article.level === 'beginner' ? 'سطح مبتدی' : article.level === 'intermediate' ? 'سطح متوسط' : 'سطح پیشرفته'}
                            </Badge>
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-8 leading-tight drop-shadow-lg">
                                {article.title}
                            </h1>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-white/90 text-sm font-medium bg-black/30 backdrop-blur-sm p-4 rounded-full inline-flex border border-white/10">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border-2 border-primary">
                                        <AvatarImage src="/avatar-placeholder.png" />
                                        <AvatarFallback>HH</AvatarFallback>
                                    </Avatar>
                                    <span>{article.author || "تیم محتوا"}</span>
                                </div>
                                <Separator orientation="vertical" className="h-4 bg-white/20" />
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(article.createdAt).toLocaleDateString('fa-IR')}</span>
                                </div>
                                <Separator orientation="vertical" className="h-4 bg-white/20" />
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>زمان مطالعه: ۷ دقیقه</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container mx-auto px-4 -mt-10 relative z-30">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-7xl mx-auto">

                    {/* Article Body */}
                    <div className="lg:col-span-8">
                        <Card className="rounded-[2rem] border-0 shadow-xl overflow-hidden mb-12">
                            <div className="p-8 md:p-12">
                                <p className="text-xl md:text-2xl text-muted-foreground mb-12 font-medium leading-relaxed border-l-4 border-primary pl-6 py-2 bg-muted/30 rounded-r-xl italic">
                                    {article.description}
                                </p>

                                <article className="prose prose-lg md:prose-xl dark:prose-invert max-w-none 
                                    prose-headings:font-bold prose-headings:text-foreground prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:flex prose-h2:items-center prose-h2:gap-2
                                    prose-p:leading-loose prose-p:text-muted-foreground prose-p:mb-6
                                    prose-ul:list-disc prose-ul:pr-6 prose-ul:mb-6
                                    prose-li:text-muted-foreground prose-li:mb-2
                                    prose-strong:text-foreground prose-strong:font-bold
                                    prose-blockquote:border-r-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:p-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:font-medium
                                    prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-8
                                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                ">
                                    <div dangerouslySetInnerHTML={{ __html: article.body || "<p>محتوای کامل مقاله به زودی اضافه می‌شود...</p>" }} />
                                </article>

                                {/* Tags */}
                                {article.tags && article.tags.length > 0 && (
                                    <div className="mt-16 pt-8 border-t border-border/50">
                                        <div className="flex flex-wrap gap-3">
                                            {article.tags.map((tag: string, i: number) => (
                                                <Badge key={i} variant="secondary" className="px-4 py-2 text-sm hover:bg-primary/10 transition-colors cursor-pointer">
                                                    <Tag className="w-3 h-3 mr-2" />
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Interaction Bar */}
                                <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 bg-muted/30 p-6 rounded-2xl border border-border/50">
                                    <div className="flex items-center gap-4">
                                        <Button variant="ghost" size="sm" className="gap-2 hover:text-primary">
                                            <Bookmark className="w-5 h-5" />
                                            ذخیره مقاله
                                        </Button>
                                        <Button variant="ghost" size="sm" className="gap-2 hover:text-primary">
                                            <MessageSquare className="w-5 h-5" />
                                            نظرات
                                        </Button>
                                    </div>
                                    <Button variant="outline" className="gap-2 w-full sm:w-auto">
                                        <Share2 className="w-4 h-4" />
                                        اشتراک‌گذاری با دوستان
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Author Box */}
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-8 mb-12 flex flex-col md:flex-row items-center gap-6 text-center md:text-right border border-primary/10">
                            <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                                <AvatarImage src="/avatar-placeholder.png" />
                                <AvatarFallback className="text-2xl bg-primary text-white">HH</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="font-bold text-xl mb-2">{article.author || "تیم تولید محتوا Say It English"}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                                    ما در تلاشیم تا با ارائه به‌روزترین متدهای آموزشی، مسیر یادگیری زبان انگلیسی را برای شما هموارتر و لذت‌بخش‌تر کنیم.
                                </p>
                                <Button variant="link" className="text-primary p-0 h-auto font-bold">
                                    مشاهده سایر مقالات نویسنده &larr;
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="sticky top-24 space-y-8">

                            {/* CTA Box */}
                            <div className="bg-primary text-primary-foreground rounded-[2rem] p-8 shadow-xl shadow-primary/20 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

                                <div className="relative z-10 text-center">
                                    <h3 className="font-black text-2xl mb-4">یادگیری را شروع کنید!</h3>
                                    <p className="text-primary-foreground/90 mb-8 leading-relaxed text-sm">
                                        اگر از خواندن مقاله خسته شدید و می‌خواهید سریع‌تر نتیجه بگیرید، همین حالا یک جلسه مشاوره رایگان رزرو کنید.
                                    </p>
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        className="w-full font-bold shadow-lg hover:scale-105 transition-transform"
                                        onClick={() => navigate("/bookings")}
                                    >
                                        زیرو وقت مشاوره رایگان
                                    </Button>
                                </div>
                            </div>

                            {/* Related Articles */}
                            {relatedArticles && relatedArticles.length > 0 && (
                                <div className="bg-card rounded-[2rem] p-6 border shadow-sm">
                                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                                        <Separator orientation="vertical" className="h-4 bg-primary w-1 rounded-full" />
                                        مقالات پیشنهادی
                                    </h4>
                                    <div className="space-y-6">
                                        {relatedArticles.map((item) => (
                                            <div
                                                key={item.id}
                                                className="group cursor-pointer flex gap-4 items-start"
                                                onClick={() => navigate(`/article/${item.slug || item.id}`)}
                                            >
                                                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                                                    <img
                                                        src={item.thumbnailUrl}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors mb-2 line-clamp-2">
                                                        {item.title}
                                                    </h5>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> ۵ دقیقه
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>

            {/* Scroll To Top Button */}
            {showScrollTop && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={scrollToTop}
                    className="fixed bottom-8 left-8 bg-primary text-primary-foreground p-3 rounded-full shadow-2xl hover:bg-primary/90 transition-colors z-50"
                >
                    <ChevronUp className="w-6 h-6" />
                </motion.button>
            )}
        </motion.div>
    );
}
