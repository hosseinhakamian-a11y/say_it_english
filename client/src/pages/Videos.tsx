import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { VideoCard } from "@/components/VideoCard";
import { Loader2, Youtube, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@shared/routes";
import { SEO } from "@/components/SEO";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterType = "all" | "free" | "premium" | "instagram" | "youtube";

export default function VideosPage() {
    const [filter, setFilter] = useState<FilterType>("all");

    // Fetch videos from our internal API
    const { data: contentList, isLoading, error } = useQuery<any[]>({
        queryKey: [api.content.list.path],
        queryFn: async () => {
            const res = await fetch(api.content.list.path);
            if (!res.ok) throw new Error("Failed to fetch content");
            return await res.json();
        },
    });

    const videos = contentList?.filter((c: any) => c.type === 'video') || [];

    const filteredContent = videos?.filter(item => {
        if (filter === "all") return true;
        if (filter === "free") return !item.isPremium;
        if (filter === "premium") return item.isPremium;
        if (filter === "instagram") return item.videoProvider === "instagram";
        if (filter === "youtube") return item.videoProvider === "youtube";
        return true;
    });

    return (
        <div className="min-h-screen bg-background pb-20">
            <SEO
                title="ویدیوهای آموزشی"
                description="مجموعه‌ای از بهترین ویدیوهای آموزشی کانال یوتیوب Say It English برای یادگیری زبان انگلیسی"
                keywords="ویدیو آموزشی, یوتیوب انگلیسی, مکالمه انگلیسی, آموزش تصویری, Say It English"
            />

            {/* Header Section */}
            <div className="relative bg-gradient-to-br from-red-600/5 via-primary/5 to-blue-600/5 py-16 md:py-24 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-red-500/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="p-5 bg-white shadow-xl rounded-3xl mb-2 flex items-center justify-center relative group cursor-pointer hover:shadow-2xl transition-all"
                            onClick={() => window.open('https://youtube.com/@say.it.english', '_blank')}
                        >
                            <Youtube className="w-12 h-12 text-red-600 group-hover:scale-110 transition-transform" />
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                                Subscribe
                            </div>
                        </motion.div>

                        <div className="space-y-4 max-w-2xl">
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                                className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight"
                            >
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-primary">ویدیوهای آموزشی</span> Say It
                            </motion.h1>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="text-lg text-muted-foreground leading-relaxed"
                            >
                                مجموعه‌ای از ویدیوهای منتخب کانال یوتیوب برای تقویت مهارت‌های شنیداری و گفتاری شما، همراه با فایل‌های تمرین و نکات تکمیلی
                            </motion.p>
                        </div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/10 px-4 py-2 rounded-full border border-primary/20"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>آپدیت هفتگی ویدیوها</span>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 mt-10" dir="rtl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-2">
                            آرشیو ویدیوها
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            دسترسی سریع به محتوای ویدیویی
                        </p>
                    </div>

                    <Tabs defaultValue="all" onValueChange={(v) => setFilter(v as FilterType)} className="w-full md:w-auto">
                        <TabsList className="grid w-full grid-cols-5 md:w-auto bg-muted/50 p-1.5 rounded-2xl h-auto">
                            <TabsTrigger value="all" className="rounded-xl py-2 px-4 text-xs sm:text-sm">همه</TabsTrigger>
                            <TabsTrigger value="instagram" className="rounded-xl py-2 px-4 text-xs sm:text-sm gap-1">
                                <span className="hidden sm:inline">اینستاگرام</span>
                                <span className="sm:hidden">IG</span>
                            </TabsTrigger>
                            <TabsTrigger value="youtube" className="rounded-xl py-2 px-4 text-xs sm:text-sm gap-1">
                                <span className="hidden sm:inline">یوتیوب</span>
                                <span className="sm:hidden">YT</span>
                            </TabsTrigger>
                            <TabsTrigger value="free" className="rounded-xl py-2 px-4 text-xs sm:text-sm text-green-600">رایگان</TabsTrigger>
                            <TabsTrigger value="premium" className="rounded-xl py-2 px-4 text-xs sm:text-sm text-amber-600">VIP</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-[300px] bg-card rounded-3xl shadow-sm border border-border/50 animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-card rounded-3xl shadow-sm border border-border/50">
                        <h3 className="text-xl font-bold text-destructive mb-2">خطا در دریافت ویدیوها</h3>
                        <p className="text-muted-foreground">لطفا اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.</p>
                    </div>
                ) : filteredContent.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-3xl shadow-sm border border-border/50">
                        <Youtube className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-muted-foreground mb-2">ویدیویی با این فیلتر یافت نشد</h3>
                        <p className="text-muted-foreground text-sm">لطفا فیلترهای خود را تغییر دهید.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredContent.map((video: any, idx: number) => (
                            <motion.div
                                key={video.id}
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
