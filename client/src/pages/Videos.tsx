
import { useQuery } from "@tanstack/react-query";
import { VideoCard } from "@/components/VideoCard";
import { Loader2, Youtube } from "lucide-react";
import { motion } from "framer-motion";

export default function VideosPage() {
    // Fetch videos from our internal API
    const { data: videos, isLoading, error } = useQuery<any[]>({
        queryKey: ["/api/youtube"],
        // Default to mock data if API fails to prevent empty page during setup
        retry: 1
    });

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header Section */}
            <div className="relative bg-primary/5 py-16 md:py-24 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="p-4 bg-background rounded-2xl shadow-lg mb-4"
                        >
                            <Youtube className="w-10 h-10 text-red-600" />
                        </motion.div>
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="text-4xl md:text-5xl font-bold text-foreground"
                        >
                            ویدیوهای آموزشی رایگان
                        </motion.h1>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="text-lg text-muted-foreground max-w-2xl"
                        >
                            مجموعه‌ای از بهترین ویدیوهای آموزشی کانال یوتیوب ما برای تقویت زبان انگلیسی شما
                        </motion.p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 relative z-20">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20 bg-card rounded-3xl shadow-sm border border-border/50">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            <p className="text-muted-foreground">در حال بارگزاری ویدیوها...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-card rounded-3xl shadow-sm border border-border/50">
                        <h3 className="text-xl font-bold text-destructive mb-2">خطا در دریافت ویدیوها</h3>
                        <p className="text-muted-foreground">لطفا اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {videos?.map((video: any, idx: number) => (
                            <motion.div
                                key={typeof video.id === 'string' ? video.id : video.id.videoId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.05 }}
                            >
                                <VideoCard video={video} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
