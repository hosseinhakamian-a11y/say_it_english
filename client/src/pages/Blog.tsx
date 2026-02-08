import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight, Tag } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Blog() {
    const [, navigate] = useLocation();

    const { data: articles, isLoading } = useQuery<any[]>({
        queryKey: ["/api/content"],
        queryFn: async () => {
            const res = await fetch("/api/content");
            const all = await res.json();
            return all.filter((c: any) => c.type === 'article');
        }
    });

    return (
        <div className="min-h-screen bg-background">
            <SEO
                title="وبلاگ آموزش زبان"
                description="جدیدترین مقالات آموزش زبان انگلیسی، تکنیک‌های یادگیری و نکات آیلتس"
            />

            {/* Hero Section */}
            <section className="bg-primary/5 py-16 border-b border-primary/10">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl font-extrabold gradient-text mb-4">
                        مجله آموزشی Say It English
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        تکنیک‌های روز دنیا برای یادگیری سریع‌تر زبان انگلیسی
                    </p>
                </div>
            </section>

            {/* Articles Grid */}
            <div className="container mx-auto px-4 py-16">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-96 bg-muted/20 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : articles && articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article, index) => (
                            <motion.div
                                key={article.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-xl group h-full flex flex-col">
                                    <div className="relative h-48 overflow-hidden bg-muted">
                                        <img
                                            src={article.thumbnailUrl || "/bg-pattern.png"}
                                            alt={article.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute top-4 right-4">
                                            <Badge variant="secondary" className="backdrop-blur-md bg-black/50 text-white border-0">
                                                {article.level === 'beginner' ? 'مبتدی' : article.level === 'intermediate' ? 'متوسط' : 'پیشرفته'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <CardContent className="p-6 flex-1">
                                        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(article.createdAt).toLocaleDateString('fa-IR')}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {article.author || "تیم محتوا"}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                            {article.title}
                                        </h3>

                                        <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed mb-4">
                                            {article.description}
                                        </p>

                                        {article.tags && (
                                            <div className="flex flex-wrap gap-2 mt-auto">
                                                {article.tags.slice(0, 2).map((tag: string) => (
                                                    <span key={tag} className="bg-primary/5 text-primary text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Tag className="w-2 h-2" />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>

                                    <CardFooter className="p-6 pt-0 mt-auto">
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-between hover:bg-primary/5 hover:text-primary group/btn"
                                            onClick={() => navigate(`/article/${article.slug || article.id}`)}
                                        >
                                            مطالعه کامل
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:-translate-x-1" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-xl text-muted-foreground">هنوز مقاله‌ای منتشر نشده است.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
