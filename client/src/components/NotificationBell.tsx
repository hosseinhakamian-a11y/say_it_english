import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, X, Info, Award, AlertCircle, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data } = useQuery<any>({
        queryKey: ["/api/notifications"],
        queryFn: async () => {
            const res = await fetch("/api/notifications", { credentials: "include" });
            if (!res.ok) return { notifications: [], unreadCount: 0 };
            return res.json();
        },
        enabled: !!user,
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const markAllRead = useMutation({
        mutationFn: async () => {
            await fetch("/api/notifications/read-all", { method: "PATCH", credentials: "include" });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
    });

    const markOneRead = useMutation({
        mutationFn: async (id: number) => {
            await fetch(`/api/notifications/${id}/read`, { method: "PATCH", credentials: "include" });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
    });

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    if (!user) return null;

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    const getIcon = (type: string) => {
        switch (type) {
            case 'achievement': return <Award className="w-4 h-4 text-amber-500" />;
            case 'warning': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'announcement': return <Megaphone className="w-4 h-4 text-blue-500" />;
            default: return <Info className="w-4 h-4 text-primary" />;
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "الان";
        if (mins < 60) return `${mins} دقیقه پیش`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} ساعت پیش`;
        const days = Math.floor(hours / 24);
        return `${days} روز پیش`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="اعلان‌ها"
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center"
                    >
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-2 w-80 max-h-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Bell className="w-4 h-4" />
                                اعلان‌ها
                                {unreadCount > 0 && (
                                    <Badge className="bg-red-500 text-white text-[10px] px-1.5">{unreadCount}</Badge>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllRead.mutate()}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    خوانده شد
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-72 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    <Bell className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                                    اعلان جدیدی ندارید
                                </div>
                            ) : (
                                notifications.slice(0, 20).map((notif: any) => (
                                    <div
                                        key={notif.id}
                                        className={`flex items-start gap-3 p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-primary/5' : ''
                                            }`}
                                        onClick={() => {
                                            if (!notif.isRead) markOneRead.mutate(notif.id);
                                        }}
                                    >
                                        <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 line-clamp-1">{notif.title}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.message}</p>
                                            <span className="text-[10px] text-gray-400 mt-1 block">
                                                {notif.createdAt ? timeAgo(notif.createdAt) : ""}
                                            </span>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
