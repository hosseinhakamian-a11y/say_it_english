
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
    Calendar, CheckCircle, Clock, Share2,
    BookOpen, HelpCircle, MessageSquare,
    ListVideo, Play, Loader2, ArrowLeft, Lock, Crown
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { format } from "date-fns-jalali";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import { VideoPlayer } from "@/components/VideoPlayer";
import { api } from "@shared/routes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VideoMetadata {
    vocabulary?: {
        word: string;
        meaning: string;
        time?: string;
        definition?: string;
        pronunciation?: string;
    }[];
    quiz?: { question: string; options: string[]; answer: number }[];
    phrases?: { phrase: string; meaning: string }[];
}

export default function VideoDetailPage() {
    const [, params] = useRoute("/videos/:videoId");
    const videoId = params?.videoId ? parseInt(params.videoId) : 0;

    // All hooks MUST be called before any conditional returns (React Rules of Hooks)
    const { user } = useAuth();
    const [, navigate] = useLocation();

    // Fetch single video details
    const { data: video, isLoading } = useQuery({
        queryKey: [`/api/content/${videoId}`],
        queryFn: async () => {
            if (!videoId) return null;
            const res = await fetch(`/api/content/${videoId}`);
            if (!res.ok) throw new Error("Failed to fetch video");
            return await res.json();
        },
        enabled: !!videoId
    });

    // Fetch related videos
    const { data: allContent } = useQuery<any[]>({
        queryKey: [api.content.list.path],
        queryFn: async () => {
            const res = await fetch(api.content.list.path);
            return await res.json();
        }
    });

    // Check if user has purchased this specific content
    const { data: purchases } = useQuery<{ contentId: number }[]>({
        queryKey: ["/api/purchases"],
        queryFn: async () => {
            const res = await fetch("/api/purchases", { credentials: "include" });
            if (!res.ok) return [];
            return await res.json();
        },
        enabled: !!user
    });

    const relatedVideos = allContent
        ?.filter((c: any) => c.type === 'video' && c.id !== videoId)
        .slice(0, 4) || [];

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen pt-32 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">در حال آماده‌سازی کلاس درس...</p>
            </div>
        );
    }

    // Not found state
    if (!video) {
        return (
            <div className="min-h-screen pt-32 text-center container px-4">
                <div className="max-w-md mx-auto bg-card p-8 rounded-3xl shadow-lg border border-border/50">
                    <h1 className="text-2xl font-bold mb-4 text-destructive">ویدیو پیدا نشد!</h1>
                    <p className="text-muted-foreground mb-6">ممکن است این ویدیو حذف شده باشد یا لینک اشتباه است.</p>
                    <Link href="/videos">
                        <Button className="w-full rounded-xl">
                            <ArrowLeft className="ml-2 h-4 w-4" />
                            بازگشت به لیست ویدیوها
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Premium Content Lock Logic
    const metadata = (video.metadata || {}) as VideoMetadata;
    const hasLearningMaterials = metadata.vocabulary?.length || metadata.quiz?.length || metadata.phrases?.length;
    const isPremium = video.isPremium;
    const hasPurchased = purchases?.some(p => p.contentId === videoId) || false;
    const hasFullAccess = !isPremium || hasPurchased;

    // Free preview limits
    const FREE_VOCAB_LIMIT = 2;
    const FREE_QUIZ_LIMIT = 1;

    return (
        <div className="min-h-screen bg-background pb-20">
            <SEO
                title={video.title}
                description={video.description?.substring(0, 150)}
                keywords={video.tags?.join(", ") || "ویدیو آموزشی, انگلیسی, مکالمه"}
                type="article"
                image={video.thumbnailUrl}
            />

            <div className="container mx-auto px-4 py-8 md:py-12">

                {/* Breakcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-2">
                    <Link href="/">صفحه اصلی</Link>
                    <span>/</span>
                    <Link href="/videos">ویدیوهای آموزشی</Link>
                    <span>/</span>
                    <span className="text-foreground font-medium truncate">{video.title}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Video Player Section */}
                        <div className="space-y-4">
                            <VideoPlayer
                                videoId={video.videoId}
                                provider={video.videoProvider}
                                arvanVideoId={video.arvanVideoId}
                                arvanProvider={video.arvanVideoProvider}
                                title={video.title}
                            />

                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <h1 className="text-2xl md:text-3xl font-bold leading-tight">{video.title}</h1>
                                    <div className="flex items-center gap-4 text-muted-foreground text-sm">
                                        <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-lg">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{new Date(video.createdAt).toLocaleDateString('fa-IR')}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-lg">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>ویدیو آموزشی</span>
                                        </div>
                                    </div>
                                </div>

                                <Button variant="outline" size="sm" className="rounded-xl gap-2 hover:bg-primary/5 hover:text-primary border-primary/20">
                                    <Share2 className="w-4 h-4" />
                                    اشتراک‌گذاری
                                </Button>
                            </div>
                        </div>

                        {/* Learning Tabs (Desktop) */}
                        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                            <Tabs defaultValue="description" className="w-full">
                                <TabsList className="w-full flex justify-start p-1 bg-muted/30 border-b overflow-x-auto">
                                    <TabsTrigger value="description" className="rounded-lg flex-1 min-w-[100px]">توضیحات</TabsTrigger>
                                    <TabsTrigger value="vocab" className="rounded-lg flex-1 min-w-[100px]" disabled={!metadata.vocabulary?.length}>
                                        لغات ({metadata.vocabulary?.length || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="quiz" className="rounded-lg flex-1 min-w-[100px]" disabled={!metadata.quiz?.length}>
                                        آزمون ({metadata.quiz?.length || 0})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="description" className="p-6">
                                    <div className="prose prose-lg dark:prose-invert max-w-none dir-rtl">
                                        <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                                            {video.description || "توضیحاتی برای این ویدیو ثبت نشده است."}
                                        </p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="vocab" className="p-6">
                                    <div className="relative">
                                        <div className="grid gap-4 sm:grid-cols-1">
                                            {metadata.vocabulary?.slice(0, hasFullAccess ? undefined : FREE_VOCAB_LIMIT).map((vocab, idx) => (
                                                <div key={idx} className="bg-card p-5 rounded-2xl border border-border/60 shadow-sm flex flex-col gap-3 hover:border-primary/20 transition-colors group">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                <span className="font-black text-2xl text-primary tracking-tight">{vocab.word}</span>
                                                                {vocab.pronunciation && (
                                                                    <span className="text-xs text-muted-foreground/80 font-mono bg-muted/50 border px-2 py-1 rounded-md tracking-wider">
                                                                        {vocab.pronunciation}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {vocab.definition && (
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 dir-ltr text-left italic">
                                                                    "{vocab.definition}"
                                                                </p>
                                                            )}
                                                        </div>
                                                        {vocab.time && (
                                                            <div className="flex items-center gap-1.5 text-[10px] bg-secondary/50 px-2.5 py-1 rounded-full font-mono text-muted-foreground whitespace-nowrap">
                                                                <Clock className="w-3 h-3" />
                                                                {vocab.time}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                                        <p className="text-foreground font-medium text-base">{vocab.meaning}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Locked Content Overlay */}
                                        {!hasFullAccess && metadata.vocabulary && metadata.vocabulary.length > FREE_VOCAB_LIMIT && (
                                            <div className="mt-8">
                                                {/* Blurred Preview */}
                                                <div className="grid gap-4 sm:grid-cols-1 blur-sm opacity-50 pointer-events-none select-none grayscale">
                                                    {metadata.vocabulary.slice(FREE_VOCAB_LIMIT, FREE_VOCAB_LIMIT + 1).map((vocab, idx) => (
                                                        <div key={idx} className="bg-card p-5 rounded-2xl border flex flex-col gap-3">
                                                            <div className="flex justify-between items-start">
                                                                <span className="font-black text-2xl text-primary">{vocab.word}</span>
                                                            </div>
                                                            <p className="text-foreground font-medium">{vocab.meaning}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Lock CTA Card */}
                                                <div className="relative -mt-20 z-10 text-center p-8 bg-gradient-to-b from-white/95 to-white/90 dark:from-black/95 dark:to-black/90 backdrop-blur-md border border-amber-500/20 rounded-3xl shadow-2xl">
                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl rotate-3 shadow-lg flex items-center justify-center">
                                                        <Lock className="w-8 h-8 text-white" />
                                                    </div>

                                                    <h3 className="font-black text-xl mt-6 mb-2">دسترسی به تمام لغات</h3>
                                                    <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                                                        {metadata.vocabulary.length - FREE_VOCAB_LIMIT} لغت کلیدی دیگر در این درس وجود دارد که با تهیه اشتراک یا خرید تکی باز خواهند شد.
                                                    </p>

                                                    <Button
                                                        size="lg"
                                                        className="w-full max-w-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl shadow-orange-500/20 rounded-xl h-12 text-base font-bold"
                                                        onClick={() => navigate(`/payment/${videoId}`)}
                                                    >
                                                        <Crown className="w-5 h-5 ml-2 animate-pulse" />
                                                        خرید دسترسی کامل
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="quiz" className="p-6">
                                    <div className="relative">
                                        <div className="space-y-6">
                                            {metadata.quiz?.slice(0, hasFullAccess ? undefined : FREE_QUIZ_LIMIT).map((q, idx) => (
                                                <div key={idx} className="space-y-3">
                                                    <p className="font-medium flex gap-2">
                                                        <span className="text-primary font-bold">{idx + 1}.</span>
                                                        {q.question}
                                                    </p>
                                                    <div className="grid gap-2 pr-6">
                                                        {q.options.map((opt, optIdx) => (
                                                            <div key={optIdx} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                                                                <div className="w-4 h-4 rounded-full border border-primary/50" />
                                                                <span className="text-sm">{opt}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Locked Quiz Overlay */}
                                        {!hasFullAccess && metadata.quiz && metadata.quiz.length > FREE_QUIZ_LIMIT && (
                                            <div className="mt-6 p-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl text-center">
                                                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Lock className="w-8 h-8 text-amber-600" />
                                                </div>
                                                <p className="font-bold text-xl mb-2">+{metadata.quiz.length - FREE_QUIZ_LIMIT} سوال دیگر</p>
                                                <p className="text-muted-foreground mb-6">آزمون کامل و جواب سوالات فقط برای کاربران پریمیوم</p>
                                                <Button
                                                    size="lg"
                                                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                                                    onClick={() => navigate(`/payment/${videoId}`)}
                                                >
                                                    <Crown className="w-5 h-5 ml-2" />
                                                    خرید دسترسی کامل
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Teacher's Note / CTA */}
                        {hasLearningMaterials ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white/20 rounded-xl">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-lg">نکات آموزشی این درس</h3>
                                    </div>
                                    <p className="text-white/80 text-sm mb-6 leading-relaxed">
                                        برای یادگیری بهتر، حتماً لغات جدید را در دفترچه خود یادداشت کنید و در آزمون پایان درس شرکت کنید.
                                    </p>
                                    <div className="space-y-2">
                                        {metadata.vocabulary && (
                                            <div className="flex items-center gap-2 text-sm bg-white/10 p-2 rounded-lg">
                                                <CheckCircle className="w-4 h-4 text-green-300" />
                                                <span>{metadata.vocabulary.length} لغت جدید</span>
                                            </div>
                                        )}
                                        {metadata.quiz && (
                                            <div className="flex items-center gap-2 text-sm bg-white/10 p-2 rounded-lg">
                                                <HelpCircle className="w-4 h-4 text-amber-300" />
                                                <span>آزمون درک مطلب</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            // Default CTA for Private Classes
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                                <div className="relative z-10 text-center mb-6">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">نیاز به تمرین مکالمه داری؟</h3>
                                    <p className="text-muted-foreground text-sm">
                                        همین حالا یک کلاس مکالمه خصوصی رزرو کن و با مدرس نیتیو تمرین کن.
                                    </p>
                                </div>
                                <Link href="/bookings">
                                    <Button className="w-full text-lg py-6 rounded-xl shadow-lg shadow-primary/20 btn-press">
                                        رزرو کلاس خصوصی
                                    </Button>
                                </Link>
                            </motion.div>
                        )}

                        {/* Related Videos */}
                        {relatedVideos && relatedVideos.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary font-bold px-1">
                                    <ListVideo className="w-5 h-5" />
                                    <h3>ویدیوهای پیشنهادی</h3>
                                </div>
                                {relatedVideos.map((rv: any) => (
                                    <Link key={rv.id} href={`/videos/${rv.id}`}>
                                        <div className="flex gap-3 group cursor-pointer bg-card hover:bg-muted/50 p-2 rounded-xl transition-all border border-transparent hover:border-border/50">
                                            <div className="relative w-28 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                                                {rv.thumbnailUrl ? (
                                                    <img
                                                        src={rv.thumbnailUrl}
                                                        alt={rv.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                        <Play className="w-6 h-6 opacity-50" />
                                                    </div>
                                                )}
                                                {/* Duration badge placeholder */}
                                                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                                                    Video
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <h4 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                                                    {rv.title}
                                                </h4>
                                                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                                                    {rv.description || "بدون توضیحات"}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
