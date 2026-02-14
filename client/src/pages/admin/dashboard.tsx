import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";
import { StatsSkeleton, ListItemSkeleton } from "@/components/ui/skeleton";
import {
    Users,
    BookOpen,
    CreditCard,
    TrendingUp,
    Clock,
    Sparkles,
    ArrowUpRight,
    Crown,
    Tag,
    Wallet,
    DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface DashboardStats {
    totalUsers: number;
    totalContent: number;
    totalPayments: number;
    totalRevenue: number;
    activeSubscriptions: number;
    totalPromos: number;
    weekRevenue: number;
    recentPayments: {
        id: number;
        userId: number;
        amount: number;
        status: string;
        createdAt: string;
    }[];
}

export default function AdminDashboard() {
    const { user } = useAuth();

    const { data: stats, isLoading } = useQuery<DashboardStats>({
        queryKey: ["/api/admin/stats"],
        queryFn: async () => {
            const res = await fetch("/api/admin/stats", { credentials: "include" });
            if (!res.ok) {
                return {
                    totalUsers: 0,
                    totalContent: 0,
                    totalPayments: 0,
                    totalRevenue: 0,
                    activeSubscriptions: 0,
                    totalPromos: 0,
                    weekRevenue: 0,
                    recentPayments: [],
                };
            }
            return res.json();
        },
    });

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
    };

    const statsCards = [
        {
            title: "تعداد کاربران",
            value: stats?.totalUsers ?? "--",
            icon: Users,
            bgColor: "bg-blue-50 dark:bg-blue-950/50",
            textColor: "text-blue-600 dark:text-blue-400",
            href: "/admin/users",
        },
        {
            title: "تعداد محتواها",
            value: stats?.totalContent ?? "--",
            icon: BookOpen,
            bgColor: "bg-green-50 dark:bg-green-950/50",
            textColor: "text-green-600 dark:text-green-400",
            href: "/admin/content",
        },
        {
            title: "اشتراک‌های فعال",
            value: stats?.activeSubscriptions ?? "--",
            icon: Crown,
            bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
            textColor: "text-yellow-600 dark:text-yellow-400",
            href: "/admin/subscriptions",
        },
        {
            title: "کل پرداخت‌ها",
            value: stats?.totalPayments ?? "--",
            icon: CreditCard,
            bgColor: "bg-purple-50 dark:bg-purple-950/50",
            textColor: "text-purple-600 dark:text-purple-400",
            href: "/admin/payments",
        },
    ];

    const revenueCards = [
        {
            title: "درآمد کل",
            value: stats ? formatPrice(stats.totalRevenue) : "--",
            icon: DollarSign,
            bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
            textColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
            title: "درآمد ۷ روز اخیر",
            value: stats ? formatPrice(stats.weekRevenue) : "--",
            icon: TrendingUp,
            bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
            textColor: "text-cyan-600 dark:text-cyan-400",
        },
        {
            title: "کدهای تخفیف",
            value: stats?.totalPromos ?? "--",
            icon: Tag,
            bgColor: "bg-pink-50 dark:bg-pink-950/50",
            textColor: "text-pink-600 dark:text-pink-400",
        },
    ];

    const quickActions = [
        { title: "مدیریت محتوا", href: "/admin/content", icon: BookOpen },
        { title: "مدیریت زمان‌ها", href: "/admin/slots", icon: Clock },
        { title: "مشاهده پرداخت‌ها", href: "/admin/payments", icon: CreditCard },
        { title: "کاربران", href: "/admin/users", icon: Users },
        { title: "اشتراک‌ها", href: "/admin/subscriptions", icon: Crown },
        { title: "کدهای تخفیف", href: "/admin/promos", icon: Tag },
        { title: "تنظیمات پرداخت", href: "/admin/payment-settings", icon: Wallet },
    ];

    return (
        <AdminLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Welcome Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl text-white shadow-lg shadow-primary/30"
                        >
                            <Sparkles className="w-6 h-6" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">
                                خوش آمدید، {user?.username} 👋
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                اینجا مرکز کنترل سیستم آموزشی شماست.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                        <StatsSkeleton /><StatsSkeleton /><StatsSkeleton /><StatsSkeleton />
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="initial"
                        animate="animate"
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6"
                    >
                        {statsCards.map((stat, idx) => (
                            <motion.div key={idx} variants={itemVariants}>
                                <Link href={stat.href}>
                                    <Card className="rounded-2xl border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden card-hover cursor-pointer">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                                                    <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                                                </div>
                                                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                                            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Revenue Stats */}
                {!isLoading && (
                    <motion.div
                        variants={containerVariants}
                        initial="initial"
                        animate="animate"
                        className="grid gap-6 md:grid-cols-3 mb-8"
                    >
                        {revenueCards.map((stat, idx) => (
                            <motion.div key={idx} variants={itemVariants}>
                                <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                                                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">{stat.title}</p>
                                                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Quick Actions & Recent Payments */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="lg:col-span-1"
                    >
                        <Card className="rounded-2xl border-0 shadow-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ArrowUpRight className="w-5 h-5 text-primary" />
                                    دسترسی سریع
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {quickActions.map((action, idx) => (
                                    <Link key={idx} href={action.href}>
                                        <motion.a
                                            whileHover={{ x: -5 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-primary/10 transition-all cursor-pointer"
                                        >
                                            <div className="p-2 bg-card rounded-lg shadow-sm border">
                                                <action.icon className="w-4 h-4 text-primary" />
                                            </div>
                                            <span className="font-medium text-foreground text-sm">{action.title}</span>
                                        </motion.a>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Recent Payments */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="lg:col-span-2"
                    >
                        <Card className="rounded-2xl border-0 shadow-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <CreditCard className="w-5 h-5 text-primary" />
                                    آخرین پرداخت‌ها
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <ListItemSkeleton /><ListItemSkeleton /><ListItemSkeleton />
                                    </div>
                                ) : stats?.recentPayments && stats.recentPayments.length > 0 ? (
                                    <motion.div
                                        variants={containerVariants}
                                        initial="initial"
                                        animate="animate"
                                        className="space-y-3"
                                    >
                                        {stats.recentPayments.map((payment) => (
                                            <motion.div
                                                key={payment.id}
                                                variants={itemVariants}
                                                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${payment.status === 'approved' ? 'bg-green-100 dark:bg-green-950/50' : payment.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-950/50' : 'bg-red-100 dark:bg-red-950/50'}`}>
                                                        <CreditCard className={`w-4 h-4 ${payment.status === 'approved' ? 'text-green-600' : payment.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground text-sm">
                                                            {formatPrice(payment.amount)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {payment.status === 'approved' ? 'تایید شده' : payment.status === 'pending' ? 'در انتظار' : 'رد شده'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(payment.createdAt).toLocaleDateString('fa-IR')}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                        <p>هنوز پرداختی ثبت نشده است.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </motion.div>
        </AdminLayout>
    );
}
