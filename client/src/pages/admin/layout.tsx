
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
    LayoutDashboard,
    BookOpen,
    Users,
    LogOut,
    Video,
    Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const [location] = useLocation();
    const { logout } = useAuth();

    const navigation = [
        { name: "داشبورد", href: "/admin", icon: LayoutDashboard },
        { name: "مدیریت محتوا", href: "/admin/content", icon: BookOpen },
        { name: "مدیریت کاربران", href: "/admin/users", icon: Users },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex" dir="rtl">
            {/* Sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-white border-l shadow-sm">
                <div className="p-6 border-b flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">A</div>
                    <span className="font-bold text-lg text-primary-dark">پنل مدیریت</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location === item.href;
                        return (
                            <Link key={item.name} href={item.href}>
                                <a className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}>
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </a>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t">
                    <Button
                        variant="ghost"
                        className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => logout()}
                    >
                        <LogOut className="h-5 w-5" />
                        خروج
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header (TODO) */}

                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
