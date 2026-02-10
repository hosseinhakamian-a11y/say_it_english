import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    Lock,
    PlayCircle,
    Users,
    Star,
    ShieldCheck,
    ArrowRight
} from "lucide-react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SecureVideoPlayer } from "@/components/SecureVideoPlayer";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { pageVariants, containerVariants, itemVariants } from "@/lib/animations";
import { ReviewsSection } from "@/components/ReviewsSection";

export default function CourseDetail() {
    const [, params] = useRoute("/course/:id");
    const { user } = useAuth();
    const [, navigate] = useLocation();
    const courseId = parseInt(params?.id || "0");

    const { data: course, isLoading } = useQuery<any>({
        queryKey: [`/api/content/${courseId}`],
        queryFn: async () => {
            const res = await fetch(`/api/content`);
            const all = await res.json();
            return all.find((c: any) => c.id === courseId);
        }
    });

    const { data: purchases } = useQuery<{ contentId: number }[]>({
        queryKey: ["/api/purchases"],
        enabled: !!user,
    });

    const hasPurchased = purchases?.some(p => p.contentId === courseId) || user?.role === 'admin';

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full shadow-lg" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-3xl font-bold mb-6">دوره مورد نظر یافت نشد</h1>
                <Button onClick={() => navigate("/content")}>بازگشت به محتوا</Button>
            </div>
        );
    }

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            className="pb-20"
        >
            <SEO title={course.title} description={course.description || ""} />

            {/* Hero Section */}
            <div className="bg-gradient-to-b from-primary/10 via-background to-background pt-12 pb-8 border-b border-border/40">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-7 space-y-6">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-primary/20 text-primary border-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                                    {course.level === 'beginner' ? 'مبتدی' : course.level === 'intermediate' ? 'متوسط' : 'پیشرفته'}
                                </Badge>
                                <div className="flex gap-1 text-amber-500">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                                </div>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight gradient-text">
                                {course.title}
                            </h1>

                            <div className="flex flex-wrap gap-6 pt-4">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                                        <Users size={18} className="text-primary" />
                                    </div>
                                    <span>+۵۰۰ دانشجو</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                                        <ShieldCheck size={18} className="text-green-600" />
                                    </div>
                                    <span>تایید شده توسط آکادمی</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 relative group">
                            <div className="absolute -inset-4 bg-primary/20 rounded-[2.5rem] blur-3xl opacity-30 group-hover:opacity-50 transition-all duration-700" />
                            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
                                {/* Trial Video Section */}
                                <VideoPlayer
                                    videoId={course.videoId}
                                    provider={course.videoProvider || 'custom'}
                                    title={course.title}
                                />
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                                    پیش‌نمایش درس
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Content & Purchase */}
            <div className="container mx-auto px-4 mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Dynamic Content Display with styling */}
                        <div className="prose prose-lg dark:prose-invert max-w-none prose-tr:border-b prose-thead:bg-muted/50 prose-th:p-4 prose-td:p-4 prose-headings:gradient-text prose-headings:font-black">
                            {/* Basic display of Markdown content - using a div with white-space pre-wrap for simplicity without adding new libraries */}
                            <div className="space-y-10">
                                {course.description?.split('##').map((section: string, idx: number) => {
                                    if (!section.trim()) return null;
                                    const [title, ...contentLines] = section.split('\n');
                                    const content = contentLines.join('\n');

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            className="bg-card/50 backdrop-blur-sm rounded-3xl p-8 border border-border/40 shadow-sm"
                                        >
                                            {idx > 0 && <h2 className="text-2xl font-black mb-6 flex items-center gap-3">{title}</h2>}
                                            <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                                                {idx === 0 ? section : content}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <PlayCircle className="text-primary" />
                                سرفصل‌های دوره
                            </h2>

                            <div className="space-y-4">
                                {/* Sample Lesson Row */}
                                <Card className={`rounded-2xl border-border/40 overflow-hidden transition-all duration-300 ${hasPurchased ? 'hover:border-primary/40' : 'opacity-80'}`}>
                                    <CardContent className="p-0">
                                        <div className="flex items-center justify-between p-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasPurchased ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                    {hasPurchased ? <PlayCircle /> : <Lock size={20} />}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold">قسمت اول: معرفی و مفاهیم پایه</h3>
                                                    <p className="text-xs text-muted-foreground mt-1">تایم پخش: ۱۵ دقیقه</p>
                                                </div>
                                            </div>
                                            {hasPurchased && (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">تایید دسترسی</Badge>
                                            )}
                                        </div>

                                        {/* If purchased, show the ArvanCloud Player */}
                                        {hasPurchased && (
                                            <div className="px-6 pb-6 mt-2">
                                                <SecureVideoPlayer contentId={course.id} />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {!hasPurchased && (
                                    <div className="p-10 text-center bg-muted/30 rounded-3xl border-2 border-dashed border-border/50">
                                        <Lock size={40} className="mx-auto mb-4 text-muted-foreground" />
                                        <p className="font-bold text-lg mb-2">محتوای کامل دوره قفل است</p>
                                        <p className="text-muted-foreground text-sm">برای دسترسی به تمام ویدیوهای آموزشی این دوره، باید آن را خریداری کنید.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <ShieldCheck className="text-primary" />
                                ویژگی‌های این آموزش
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    "دسترسی مادام‌العمر",
                                    "پشتیبانی مستقیم مدرس",
                                    "آپدیت‌های رایگان",
                                    "فایل‌های مکمل"
                                ].map((text, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-muted/30 p-4 rounded-2xl">
                                        <CheckCircle2 className="text-green-500 w-5 h-5" />
                                        <span className="font-medium text-sm">{text}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Reviews Section */}
                        <ReviewsSection contentId={courseId} />
                    </div>

                    {/* Sidebar Purchase Card */}
                    <div className="lg:col-span-4 relative">
                        <div className="sticky top-24 space-y-6">
                            <Card className="rounded-[2.5rem] shadow-2xl border-0 overflow-hidden glass">
                                <CardHeader className="p-8 pb-4 text-center">
                                    <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground mb-4">هزینه سرمایه‌گذاری</CardTitle>
                                    <div className="flex items-baseline justify-center gap-2">
                                        <span className="text-5xl font-black gradient-text">
                                            {hasPurchased ? 'پرداخت شده' : new Intl.NumberFormat("fa-IR").format(course.price || 0)}
                                        </span>
                                        <span className="text-sm font-bold text-muted-foreground">{!hasPurchased && 'تومان'}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <div className="h-[1px] bg-gradient-to-r from-transparent via-border to-transparent my-6" />

                                    {!hasPurchased ? (
                                        <Button
                                            size="lg"
                                            className="w-full rounded-2xl py-8 text-xl font-bold bg-primary hover:bg-primary/90 btn-press shadow-xl shadow-primary/20"
                                            onClick={() => navigate(`/payment/${course.id}`)}
                                        >
                                            خرید و شروع یادگیری
                                            <ArrowRight className="mr-2 w-5 h-5" />
                                        </Button>
                                    ) : (
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="w-full rounded-2xl py-8 text-xl font-bold border-primary text-primary hover:bg-primary/5 btn-press"
                                            disabled
                                        >
                                            <ShieldCheck className="ml-2" />
                                            دسترسی مادام‌العمر
                                        </Button>
                                    )}

                                    <p className="mt-6 text-center text-[10px] text-muted-foreground leading-relaxed">
                                        ۷ روز ضمانت بازگشت وجه در صورت عدم رضایت از کیفیت دوره
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[2rem] border-primary/20 bg-primary/5 p-6 border-2 border-dashed">
                                <p className="text-sm font-bold text-primary mb-2">مشاوره رایگان قبل از خرید؟</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                                    اگر هنوز در انتخاب این دوره مردد هستید، می‌توانید یک جلسه مشاوره رایگان رزرو کنید.
                                </p>
                                <Button
                                    variant="link"
                                    className="p-0 h-auto text-primary font-bold text-xs"
                                    onClick={() => navigate("/bookings")}
                                >
                                    رزرو وقت مشاوره
                                </Button>
                            </Card>
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
