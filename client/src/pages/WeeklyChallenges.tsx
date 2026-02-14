import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Target,
    Zap,
    CheckCircle2,
    Clock,
    Trophy,
    Sparkles,
    ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";

export default function WeeklyChallenges() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: challenges, isLoading } = useQuery<any[]>({
        queryKey: ["/api/challenges"],
        queryFn: async () => {
            const res = await fetch("/api/challenges", { credentials: "include" });
            if (!res.ok) return [];
            return res.json();
        },
    });

    const { data: report } = useQuery<any>({
        queryKey: ["/api/user/weekly-report"],
        queryFn: async () => {
            const res = await fetch("/api/user/weekly-report", { credentials: "include" });
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !!user,
    });

    const joinMutation = useMutation({
        mutationFn: async (challengeId: number) => {
            const res = await fetch(`/api/challenges/${challengeId}/join`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "خطا");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
            toast({ title: "✅ با موفقیت در چالش شرکت کردید!" });
        },
        onError: (err: any) => {
            toast({ title: err.message, variant: "destructive" });
        },
    });

    const getStatusColor = (ch: any) => {
        if (ch.isCompleted) return "text-green-600 bg-green-50 border-green-200";
        if (ch.isJoined) return "text-primary bg-primary/5 border-primary/20";
        return "text-gray-500 bg-gray-50 border-gray-200";
    };

    return (
        <div className="min-h-screen bg-gray-50/50 py-8 pb-20">
            <Helmet>
                <title>چالش‌های هفتگی | Say It English</title>
            </Helmet>
            <div className="container mx-auto px-4 max-w-3xl">

                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-700 rounded-full shadow-lg mb-4"
                    >
                        <Target className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">چالش‌های هفتگی</h1>
                    <p className="text-gray-500">با شرکت در چالش‌ها، XP بیشتری کسب کنید!</p>
                </div>

                {/* Weekly Report Summary */}
                {report && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="rounded-2xl mb-8 bg-gradient-to-r from-violet-600 to-purple-700 text-white border-none shadow-lg overflow-hidden relative">
                            <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <CardContent className="p-6 relative z-10">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5" />
                                    خلاصه عملکرد هفتگی شما
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <span className="text-2xl font-black">{report.xpEarned}</span>
                                        <p className="text-white/70 text-xs mt-1">XP کسب شده</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-2xl font-black">{report.lessonsCompleted}</span>
                                        <p className="text-white/70 text-xs mt-1">درس کامل‌شده</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-2xl font-black">{report.vocabSaved}</span>
                                        <p className="text-white/70 text-xs mt-1">لغت ذخیره‌شده</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-2xl font-black">{report.avgQuizScore}%</span>
                                        <p className="text-white/70 text-xs mt-1">میانگین آزمون</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Challenges List */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {challenges?.map((ch: any, idx: number) => (
                            <motion.div
                                key={ch.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Card className={`rounded-2xl border shadow-sm overflow-hidden ${getStatusColor(ch)}`}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="text-3xl shrink-0">{ch.icon || "🎯"}</div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-gray-900">{ch.title}</h3>
                                                        {ch.isCompleted && (
                                                            <Badge className="bg-green-500 text-white text-[10px] px-1.5 gap-0.5">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                تکمیل
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mb-3">{ch.description}</p>

                                                    {/* Progress Bar */}
                                                    {ch.isJoined && (
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-xs text-gray-600">
                                                                <span>پیشرفت</span>
                                                                <span className="font-bold">{ch.percentDone}%</span>
                                                            </div>
                                                            <Progress
                                                                value={ch.percentDone}
                                                                className={`h-2.5 rounded-full ${ch.isCompleted ? '[&>div]:bg-green-500' : ''}`}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
                                                    <Zap className="w-3 h-3" />
                                                    {ch.xpReward} XP
                                                </Badge>
                                                {!ch.isJoined && user && (
                                                    <Button
                                                        size="sm"
                                                        className="rounded-xl text-xs gap-1"
                                                        onClick={() => joinMutation.mutate(ch.id)}
                                                        disabled={joinMutation.isPending}
                                                    >
                                                        شرکت
                                                        <ArrowRight className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {challenges?.length === 0 && !isLoading && (
                    <Card className="rounded-2xl border-none shadow-sm text-center p-12">
                        <Target className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">هنوز چالشی فعال نیست!</p>
                        <p className="text-gray-400 text-sm mt-1">به زودی چالش‌های جدید اضافه می‌شوند.</p>
                    </Card>
                )}

                {/* Login CTA */}
                {!user && (
                    <Card className="rounded-2xl border-none shadow-sm text-center p-8 mt-8">
                        <p className="text-gray-500 mb-4">برای شرکت در چالش‌ها وارد شوید</p>
                        <Link href="/auth">
                            <Button className="rounded-xl">ورود / ثبت‌نام</Button>
                        </Link>
                    </Card>
                )}

            </div>
        </div>
    );
}
