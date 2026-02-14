import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
    LayoutDashboard,
    BookOpen,
    Users,
    LogOut,
    CreditCard,
    User,
    Clock,
    Menu,
    X,
    Sparkles,
    Wallet,
    Crown,
    Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const [location] = useLocation();
    const { logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigation = [
        { name: "داشبورد", href: "/admin", icon: LayoutDashboard },
        { name: "مدیریت زمان‌ها", href: "/admin/slots", icon: Clock },
        { name: "مدیریت محتوا", href: "/admin/content", icon: BookOpen },
        { name: "مدیریت کاربران", href: "/admin/users", icon: Users },
        { name: "مدیریت پرداخت‌ها", href: "/admin/payments", icon: CreditCard },
        { name: "تنظیمات پرداخت", href: "/admin/payment-settings", icon: Wallet },
        { name: "مدیریت اشتراک‌ها", href: "/admin/subscriptions", icon: Crown },
        { name: "کدهای تخفیف", href: "/admin/promos", icon: Tag },
    ];

    const sidebarContent = (
        <>
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30"
                >
                    <Sparkles className="w-5 h-5" />
                </motion.div>
                <span className="font-bold text-lg text-foreground">پنل مدیریت</span>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navigation.map((item, idx) => {
                    const isActive = location === item.href;
                    return (
                        <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Link href={item.href}>
                                <a
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </a>
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border space-y-2">
                <Link href="/profile">
                    <a className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground text-sm font-medium transition-all">
                        <User className="h-5 w-5" />
                        بازگشت به پروفایل
                    </a>
                </Link>
                <Button
                    variant="ghost"
                    className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                    onClick={() => logout()}
                >
                    <LogOut className="h-5 w-5" />
                    خروج
                </Button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-background flex" dir="rtl">
            {/* Desktop Sidebar */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="hidden md:flex flex-col w-72 bg-card/80 backdrop-blur-xl border-l border-border/50 shadow-xl"
            >
                {sidebarContent}
            </motion.div>

            {/* Mobile Menu Button */}
            <div className="md:hidden fixed top-4 right-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl bg-card/80 backdrop-blur-xl shadow-lg"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </Button>
            </div>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="md:hidden fixed inset-0 bg-black/50 z-40"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="md:hidden fixed top-0 right-0 h-full w-72 bg-card shadow-2xl z-50 flex flex-col"
                        >
                            {sidebarContent}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="max-w-7xl mx-auto"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
