import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Crown, Clock, CheckCircle2, XCircle, BookOpen,
    CreditCard, ArrowRight, Loader2, User
} from "lucide-react";

export default function Dashboard() {
    const [, navigate] = useLocation();

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ["/api/user"],
        queryFn: async () => {
            const res = await fetch("/api/user", { credentials: "include" });
            if (!res.ok) return null;
            return res.json();
        }
    });

    const { data: purchases } = useQuery<{ contentId: number }[]>({
        queryKey: ["/api/purchases"],
        queryFn: async () => {
            const res = await fetch("/api/purchases", { credentials: "include" });
            return res.json();
        },
        enabled: !!user
    });

    // Note: For full implementation, we'd also fetch user's pending payments
    // For now, we'll show a placeholder or use query param

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">لطفاً وارد شوید</h1>
                <Button onClick={() => navigate("/auth")}>ورود / ثبت‌نام</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 py-12">
            <SEO title="داشبورد من" description="مدیریت اشتراک و دسترسی‌ها" />

            <div className="container mx-auto px-4 max-w-5xl">
                {/* Welcome */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold mb-2">
                        سلام، <span className="text-primary">{user.name || user.username}</span> 👋
                    </h1>
                    <p className="text-muted-foreground">خوش آمدید به داشبورد شخصی شما</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Stats Cards */}
                    <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">وضعیت اشتراک</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <Crown className="w-8 h-8" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {purchases && purchases.length > 0 ? "فعال" : "ندارید"}
                                    </p>
                                    <p className="text-xs opacity-80">
                                        {purchases && purchases.length > 0 ? "دسترسی به محتوای پریمیوم" : "هنوز اشتراکی ندارید"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">محتوای دسترسی</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-8 h-8 text-blue-500" />
                                <div>
                                    <p className="text-2xl font-bold">{purchases?.length || 0}</p>
                                    <p className="text-xs text-muted-foreground">دوره/محتوا</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">پرداخت‌ها</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-8 h-8 text-green-500" />
                                <div>
                                    <p className="text-2xl font-bold">-</p>
                                    <p className="text-xs text-muted-foreground">تراکنش موفق</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Pending Notice */}
                {new URLSearchParams(window.location.search).get("payment") === "pending" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-8"
                    >
                        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                            <CardContent className="flex items-center gap-4 p-6">
                                <Clock className="w-10 h-10 text-amber-600" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-amber-800 dark:text-amber-200">پرداخت شما در انتظار تایید است</h3>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        پس از بررسی توسط پشتیبانی، دسترسی شما فعال خواهد شد. معمولاً کمتر از ۲ ساعت طول می‌کشد.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Actions */}
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/content")}>
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                                    <BookOpen className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold">محتوای آموزشی</h3>
                                    <p className="text-sm text-muted-foreground">مشاهده دروس و ویدیوها</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-180" />
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/pricing")}>
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl">
                                    <Crown className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold">ارتقا اشتراک</h3>
                                    <p className="text-sm text-muted-foreground">مشاهده پلن‌ها و قیمت‌ها</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-180" />
                        </CardContent>
                    </Card>
                </div>

                {/* Profile Link */}
                <div className="mt-8 text-center">
                    <Button variant="ghost" onClick={() => navigate("/profile")} className="gap-2">
                        <User className="w-4 h-4" />
                        مشاهده و ویرایش پروفایل
                    </Button>
                </div>
            </div>
        </div>
    );
}
