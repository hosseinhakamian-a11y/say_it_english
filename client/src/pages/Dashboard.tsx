import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Flame,
    Trophy,
    Clock,
    PlayCircle,
    BookOpen,
    Target,
    ChevronLeft,
    Settings,
    LogOut
} from "lucide-react";
import { api } from "@shared/routes";
import { useContent } from "@/hooks/use-content";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { data: content, isLoading: contentLoading } = useContent(); // Fetch real content

    // Use first 3 items as "Recommended/Continue Watching" fallback
    const recentActivities = content?.slice(0, 3) || [];

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Link href="/auth">
                    <Button size="lg" className="rounded-2xl">لطفاً ابتدا وارد شوید</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-8 pb-20">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary shadow-lg">
                            <AvatarImage src={user.avatar || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                                {user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">سلام، {user.firstName || user.username}! 👋</h1>
                            <p className="text-gray-500">خوش آمدید، بیایید یادگیری را ادامه دهیم.</p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Link href="/profile">
                            <Button variant="outline" className="rounded-xl gap-2 flex-1 md:flex-none">
                                <Settings className="w-4 h-4" />
                                تنظیمات
                            </Button>
                        </Link>
                        <Button variant="ghost" className="rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 gap-2 flex-1 md:flex-none" onClick={() => logout()}>
                            <LogOut className="w-4 h-4" />
                            خروج
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <motion.div whileHover={{ y: -5 }} className="col-span-1">
                        <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-orange-50 to-orange-100/50 border-b-4 border-orange-400">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="bg-orange-500/10 p-3 rounded-full mb-3">
                                    <Flame className="w-8 h-8 text-orange-600 fill-orange-600 animate-pulse" />
                                </div>
                                <span className="text-3xl font-black text-gray-900">{user.streak || 0}</span>
                                <span className="text-sm font-medium text-gray-600 mt-1">روز پشت‌سرهم</span>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="col-span-1">
                        <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50 border-b-4 border-blue-400">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="bg-blue-500/10 p-3 rounded-full mb-3">
                                    <Trophy className="w-8 h-8 text-blue-600" />
                                </div>
                                <span className="text-3xl font-black text-gray-900">{user.level === 'beginner' ? 'LVL 1' : user.level === 'intermediate' ? 'LVL 2' : 'LVL 3'}</span>
                                <span className="text-sm font-medium text-gray-600 mt-1">سطح فعلی</span>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="col-span-1">
                        <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-green-50 to-green-100/50 border-b-4 border-green-400">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="bg-green-500/10 p-3 rounded-full mb-3">
                                    <Target className="w-8 h-8 text-green-600" />
                                </div>
                                <span className="text-3xl font-black text-gray-900">{content?.length || 0}</span>
                                <span className="text-sm font-medium text-gray-600 mt-1">درس موجود</span>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="col-span-1">
                        <Card className="rounded-2xl border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50 border-b-4 border-purple-400">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="bg-purple-500/10 p-3 rounded-full mb-3">
                                    <Clock className="w-8 h-8 text-purple-600" />
                                </div>
                                <span className="text-3xl font-black text-gray-900">∞</span>
                                <span className="text-sm font-medium text-gray-600 mt-1">زمان یادگیری</span>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Continue Learning - Now using REAL Data */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <PlayCircle className="w-6 h-6 text-primary" />
                                    ادامه یادگیری (جدیدترین درس‌ها)
                                </h2>
                                <Link href="/videos">
                                    <Button variant="link" className="text-primary p-0 h-auto font-bold">مشاهده همه</Button>
                                </Link>
                            </div>

                            <div className="grid gap-4">
                                {contentLoading ? (
                                    <div className="bg-white p-4 h-24 rounded-2xl animate-pulse"></div>
                                ) : recentActivities.length > 0 ? (
                                    recentActivities.map((item: any, i: number) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <Link href={`/videos/${item.id}`}>
                                                <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group overflow-hidden">
                                                    <div className="flex h-24">
                                                        <div className="w-32 bg-gray-200 relative aspect-video">
                                                            {item.thumbnailUrl ? (
                                                                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                                    <PlayCircle className="w-8 h-8 text-white opacity-80" />
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                                                                <PlayCircle className="w-8 h-8 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="font-bold text-gray-900 line-clamp-1">{item.title}</h3>
                                                                <Badge variant="outline" className="text-xs">{item.level}</Badge>
                                                            </div>

                                                            <div className="w-full flex justify-between items-center text-xs text-gray-500 mt-2">
                                                                <span>{item.type === 'video' ? 'ویدیو آموزشی' : 'مقاله'}</span>
                                                                <span className="text-primary font-bold">نمایش درس →</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Link>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 bg-white rounded-2xl">
                                        هیچ درسی یافت نشد. به زودی اضافه می‌شود!
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recommended */}
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <BookOpen className="w-6 h-6 text-amber-500" />
                                پیشنهاد ویژه برای شما
                            </h2>
                            <Card className="rounded-2xl bg-gradient-to-r from-primary/90 to-primary text-white border-none shadow-lg overflow-hidden relative">
                                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div>
                                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-3">سطح متوسط</Badge>
                                        <h3 className="text-2xl font-black mb-2">تسلط بر اصطلاحات ۳۰۰۰ دلاری!</h3>
                                        <p className="text-primary-foreground/90 max-w-sm mb-6">
                                            در این دوره فشرده، اصطلاحات تجاری و پول‌ساز دنیای بیزنس را یاد می‌گیرید.
                                        </p>
                                        <Button variant="secondary" className="rounded-xl font-bold px-6">شروع یادگیری</Button>
                                    </div>
                                    <div className="w-32 h-32 bg-white/20 rounded-2xl rotate-3 flex items-center justify-center shadow-xl backdrop-blur-sm">
                                        <Trophy className="w-16 h-16 text-white" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-1">
                        {/* Profile Completion */}
                        <Card className="rounded-2xl border-none shadow-sm mb-6 sticky top-24">
                            <CardHeader>
                                <CardTitle className="text-lg">وضعیت پروفایل</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="relative pt-2">
                                    <div className="flex justify-between text-sm font-medium mb-2">
                                        <span className="text-gray-600">تکمیل اطلاعات</span>
                                        <span className="text-primary">65%</span>
                                    </div>
                                    <Progress value={65} className="h-3 rounded-full" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</div>
                                        <span>تایید ایمیل و موبایل</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</div>
                                        <span>تعیین سطح اولیه</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-xs"></div>
                                        <span>افزودن عکس پروفایل</span>
                                    </div>
                                </div>

                                <Link href="/profile">
                                    <Button variant="outline" className="w-full rounded-xl border-dashed">تکمیل پروفایل</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
