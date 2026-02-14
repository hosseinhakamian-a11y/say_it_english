import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, Medal, Star, Zap, Flame, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

export default function Leaderboard() {
    const { user } = useAuth();

    const { data, isLoading } = useQuery<any>({
        queryKey: ["/api/leaderboard"],
        queryFn: async () => {
            const res = await fetch("/api/leaderboard", { credentials: "include" });
            if (!res.ok) return { leaderboard: [], myRank: null, myXp: 0 };
            return res.json();
        },
    });

    const leaderboard = data?.leaderboard || [];
    const myRank = data?.myRank;

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
        if (rank === 2) return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
        if (rank === 3) return <Medal className="w-6 h-6 text-amber-700 fill-amber-700" />;
        return <span className="text-lg font-black text-gray-400">{rank}</span>;
    };

    const getRankBg = (rank: number, isMe: boolean) => {
        if (isMe) return "bg-primary/5 border-primary/20 border-2";
        if (rank === 1) return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 border";
        if (rank === 2) return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 border";
        if (rank === 3) return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 border";
        return "bg-white border border-gray-100";
    };

    return (
        <div className="min-h-screen bg-gray-50/50 py-8 pb-20">
            <Helmet>
                <title>جدول امتیازات | Say It English</title>
            </Helmet>
            <div className="container mx-auto px-4 max-w-2xl">

                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full shadow-lg mb-4"
                    >
                        <Trophy className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">جدول امتیازات</h1>
                    <p className="text-gray-500">رتبه‌بندی هفتگی بر اساس امتیاز (XP)</p>
                </div>

                {/* My Rank Banner */}
                {user && myRank && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="rounded-2xl mb-6 bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg overflow-hidden relative">
                            <div className="absolute left-0 top-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
                            <CardContent className="p-6 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black">
                                        #{myRank}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">رتبه شما</p>
                                        <p className="text-white/80 text-sm flex items-center gap-1">
                                            <Zap className="w-4 h-4" />
                                            {data?.myXp || 0} XP
                                        </p>
                                    </div>
                                </div>
                                <Star className="w-8 h-8 text-white/30" />
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Leaderboard */}
                <div className="space-y-3">
                    {leaderboard.map((entry: any, idx: number) => {
                        const rank = idx + 1;
                        const isMe = user && entry.id === user.id;
                        const displayName = entry.firstName && entry.lastName
                            ? `${entry.firstName} ${entry.lastName}`
                            : entry.firstName || entry.username;

                        return (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${getRankBg(rank, !!isMe)}`}>
                                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                        {getRankIcon(rank)}
                                    </div>
                                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                                        <AvatarImage src={entry.avatar || ""} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-cyan-600 text-white font-bold">
                                            {(entry.firstName || entry.username || "U").charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate flex items-center gap-2">
                                            {displayName}
                                            {isMe && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">شما</Badge>}
                                        </h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Flame className="w-3.5 h-3.5 text-orange-500" />
                                                {entry.streak || 0} روز
                                            </span>
                                            <span className="text-gray-300">•</span>
                                            <span className="capitalize">{entry.level || 'beginner'}</span>
                                        </div>
                                    </div>
                                    <div className="text-left shrink-0">
                                        <span className="text-xl font-black text-primary">{entry.xp || 0}</span>
                                        <span className="text-xs text-gray-400 block">XP</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {leaderboard.length === 0 && !isLoading && (
                    <Card className="rounded-2xl border-none shadow-sm text-center p-12">
                        <Trophy className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">هنوز کسی در جدول امتیازات نیست!</p>
                        <Link href="/videos">
                            <Button className="rounded-xl mt-4 gap-2">
                                شروع یادگیری
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </Card>
                )}

            </div>
        </div>
    );
}
