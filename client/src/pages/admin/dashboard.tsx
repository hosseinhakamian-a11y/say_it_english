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
    Calendar,
    CreditCard,
    TrendingUp,
    Clock,
    CheckCircle2,
    Sparkles,
    ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface DashboardStats {
    totalUsers: number;
    totalContent: number;
    activeBookings: number;
    totalPayments: number;
    recentActivity: {
        type: string;
        title: string;
        time: string;
    }[];
}

export default function AdminDashboard() {
    const { user } = useAuth();

    // Fetch dashboard stats
    const { data: stats, isLoading } = useQuery<DashboardStats>({
        queryKey: ["/api/admin/stats"],
        queryFn: async () => {
            const res = await fetch("/api/admin/stats");
            if (!res.ok) {
                // Return default stats if endpoint doesn't exist yet
                return {
                    totalUsers: 0,
                    totalContent: 0,
                    activeBookings: 0,
                    totalPayments: 0,
                    recentActivity: [],
                };
            }
            return res.json();
        },
    });

    const statsCards = [
        {
            title: "تعداد دانش‌آموزان",
            value: stats?.totalUsers ?? "--",
            icon: Users,
            color: "bg-blue-500",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
            change: "+12%",
        },
        {
            title: "تعداد محتواها",
            value: stats?.totalContent ?? "--",
            icon: BookOpen,
            color: "bg-green-500",
            bgColor: "bg-green-50",
            textColor: "text-green-600",
            change: "+5%",
        },
        {
            title: "رزروهای فعال",
            value: stats?.activeBookings ?? "--",
            icon: Calendar,
            color: "bg-orange-500",
            bgColor: "bg-orange-50",
            textColor: "text-orange-600",
            change: "+8%",
        },
        {
            title: "کل پرداخت‌ها",
            value: stats?.totalPayments ?? "--",
            icon: CreditCard,
            color: "bg-purple-500",
            bgColor: "bg-purple-50",
            textColor: "text-purple-600",
            change: "+23%",
        },
    ];

    const quickActions = [
        { title: "افزودن محتوا", href: "/admin/content", icon: BookOpen },
        { title: "مدیریت زمان‌ها", href: "/admin/slots", icon: Clock },
        { title: "مشاهده پرداخت‌ها", href: "/admin/payments", icon: CreditCard },
        { title: "کاربران", href: "/admin/users", icon: Users },
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
                            <h1 className="text-3xl font-bold text-gray-900">
                                خوش آمدید، {user?.username} 👋
                            </h1>
                            <p className="text-gray-500 mt-1">
                                اینجا مرکز کنترل سیستم آموزشی شماست.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                        <StatsSkeleton />
                        <StatsSkeleton />
                        <StatsSkeleton />
                        <StatsSkeleton />
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="initial"
                        animate="animate"
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8"
                    >
                        {statsCards.map((stat, idx) => (
                            <motion.div key={idx} variants={itemVariants}>
                                <Card className="rounded-2xl border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden card-hover">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                                                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                                            </div>
                                            <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                <TrendingUp className="w-4 h-4" />
                                                {stat.change}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {stat.value}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Quick Actions & Recent Activity */}
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
                            <CardContent className="space-y-3">
                                {quickActions.map((action, idx) => (
                                    <Link key={idx} href={action.href}>
                                        <motion.a
                                            whileHover={{ x: -5 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-primary/10 transition-all cursor-pointer"
                                        >
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <action.icon className="w-5 h-5 text-primary" />
                                            </div>
                                            <span className="font-medium text-gray-700">
                                                {action.title}
                                            </span>
                                        </motion.a>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="lg:col-span-2"
                    >
                        <Card className="rounded-2xl border-0 shadow-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Clock className="w-5 h-5 text-primary" />
                                    فعالیت‌های اخیر
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <ListItemSkeleton />
                                        <ListItemSkeleton />
                                        <ListItemSkeleton />
                                    </div>
                                ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                                    <motion.div
                                        variants={containerVariants}
                                        initial="initial"
                                        animate="animate"
                                        className="space-y-4"
                                    >
                                        {stats.recentActivity.map((activity, idx) => (
                                            <motion.div
                                                key={idx}
                                                variants={itemVariants}
                                                className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl"
                                            >
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">
                                                        {activity.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {activity.type}
                                                    </p>
                                                </div>
                                                <span className="text-sm text-gray-400">
                                                    {activity.time}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                        <p>هنوز فعالیتی ثبت نشده است</p>
                                        <p className="text-sm mt-2">
                                            با افزودن محتوا یا دریافت رزرو، فعالیت‌ها اینجا نمایش داده
                                            می‌شوند
                                        </p>
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
