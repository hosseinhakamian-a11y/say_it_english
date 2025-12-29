
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Calendar, Share2, Clock, CheckCircle, Play } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function VideoDetailPage() {
    const [, params] = useRoute("/videos/:videoId");
    // Safely handle potentially undefined videoId, though routing should prevent this
    const videoId = params?.videoId || "";

    // In a real app with many videos, we'd have a specific endpoint for single video details
    // For now/mock mode, we fetch the list and find the item
    const { data: videos, isLoading } = useQuery<any[]>({
        queryKey: ["/api/youtube/videos"],
    });

    const video = videos?.find((v: any) =>
        (typeof v.id === 'string' ? v.id : v.snippet.resourceId?.videoId) === videoId
    );

    // Get related videos (all except current)
    const relatedVideos = videos?.filter((v: any) =>
        (typeof v.id === 'string' ? v.id : v.snippet.resourceId?.videoId) !== videoId
    ).slice(0, 4);

    if (isLoading) {
        return <div className="min-h-screen pt-24 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
    }

    if (!video) {
        return (
            <div className="min-h-screen pt-32 text-center container">
                <h1 className="text-2xl font-bold mb-4">ویدیو یافت نشد</h1>
                <Link href="/videos"><Button>بازگشت به لیست ویدیوها</Button></Link>
            </div>
        );
    }

    // Schema.org VideoObject for SEO
    const videoSchema = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": video.snippet.title,
        "description": video.snippet.description,
        "thumbnailUrl": [video.snippet.thumbnails.high.url],
        "uploadDate": video.snippet.publishedAt,
        "embedUrl": `https://www.youtube.com/embed/${videoId}`
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <Helmet>
                <title>{video.snippet.title} | Say It English</title>
                <meta name="description" content={video.snippet.description.slice(0, 150) + "..."} />
                <script type="application/ld+json">{JSON.stringify(videoSchema)}</script>
            </Helmet>

            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Video Player */}
                        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                                title={video.snippet.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute top-0 left-0 w-full h-full border-0"
                            />
                        </div>

                        {/* Video Info */}
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{video.snippet.title}</h1>
                            <div className="flex items-center gap-4 text-muted-foreground text-sm mb-6 pb-6 border-b border-border">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{format(new Date(video.snippet.publishedAt), "PPP")}</span>
                                </div>
                                {/* Placeholder for duration if we had it */}
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>10:00</span>
                                </div>
                            </div>

                            <div className="prose prose-lg dark:prose-invert max-w-none dir-rtl">
                                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{video.snippet.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* CTA Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
                        >
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold mb-2">یادگیری را جدی‌تر دنبال کنید</h3>
                                <p className="text-muted-foreground text-sm">همین حالا یک کلاس خصوصی رزرو کنید و پیشرفت خود را سرعت ببخشید.</p>
                            </div>

                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-3 text-sm">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>برنامه ریزی اختصاصی</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>مکالمه محور</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>اصلاح فوری اشتباهات</span>
                                </li>
                            </ul>

                            <Link href="/bookings">
                                <Button size="lg" className="w-full text-lg shadow-lg shadow-primary/20">
                                    رزرو کلاس خصوصی
                                </Button>
                            </Link>
                        </motion.div>

                        {/* Related Videos */}
                        {relatedVideos && relatedVideos.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
                            >
                                <h3 className="text-lg font-bold mb-4">ویدیوهای مرتبط</h3>
                                <div className="space-y-4">
                                    {relatedVideos.map((rv: any) => {
                                        const rvId = typeof rv.id === 'string' ? rv.id : rv.snippet.resourceId?.videoId;
                                        return (
                                            <Link key={rvId} href={`/videos/${rvId}`}>
                                                <div className="flex gap-3 group cursor-pointer hover:bg-muted/50 p-2 rounded-xl transition-colors -mx-2">
                                                    <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                                                        <img
                                                            src={rv.snippet.thumbnails.medium.url}
                                                            alt={rv.snippet.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Play className="w-5 h-5 text-white fill-white" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                                            {rv.snippet.title}
                                                        </h4>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
