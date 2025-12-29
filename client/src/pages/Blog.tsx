import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    status: string;
    createdAt: string;
}

export default function Blog() {
    const { data: posts, isLoading } = useQuery<Post[]>({
        queryKey: ["/api/posts"],
        queryFn: async () => {
            const res = await fetch("/api/posts");
            if (!res.ok) return [];
            return await res.json();
        },
    });

    const publishedPosts = posts?.filter(p => p.status === 'published') || [];

    return (
        <div className="container mx-auto px-4 py-12" dir="rtl">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-l from-primary to-teal-600 bg-clip-text text-transparent">
                        وبلاگ آموزشی
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        مقالات و نکات کاربردی برای یادگیری زبان انگلیسی
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : publishedPosts.length === 0 ? (
                    <div className="text-center py-16 bg-muted/30 rounded-3xl">
                        <p className="text-muted-foreground text-lg">هنوز مقاله‌ای منتشر نشده است.</p>
                        <p className="text-muted-foreground mt-2">به زودی مقالات جدید اضافه خواهند شد!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {publishedPosts.map((post) => (
                            <Card key={post.id} className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group">
                                <div className="flex flex-col md:flex-row">
                                    {post.coverImage && (
                                        <div className="md:w-64 h-48 md:h-auto bg-muted overflow-hidden">
                                            <img
                                                src={post.coverImage}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 p-6">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(post.createdAt).toLocaleDateString('fa-IR')}
                                        </div>
                                        <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                            {post.title}
                                        </h2>
                                        {post.excerpt && (
                                            <p className="text-muted-foreground mb-4 line-clamp-2">
                                                {post.excerpt}
                                            </p>
                                        )}
                                        <Link href={`/blog/${post.slug}`}>
                                            <a className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
                                                ادامه مطلب
                                                <ArrowLeft className="h-4 w-4" />
                                            </a>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
