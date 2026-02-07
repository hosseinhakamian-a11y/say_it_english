import { AdminLayout } from "./layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Check, X, Clock, TrendingUp, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { pageVariants, containerVariants, itemVariants } from "@/lib/animations";
import { ListItemSkeleton, StatsSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface Payment {
    id: number;
    userId: number;
    contentId: number;
    amount: number;
    trackingCode: string;
    status: string;
    notes: string | null;
    createdAt: string;
}

export default function AdminPayments() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: payments, isLoading } = useQuery<Payment[]>({
        queryKey: ["/api/payments"],
        queryFn: async () => {
            const res = await fetch("/api/payments");
            if (!res.ok) throw new Error("Failed to fetch");
            return await res.json();
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await fetch(`/api/payments/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed to update");
            return await res.json();
        },
        onSuccess: (_, { status }) => {
            toast({
                title: status === "approved" ? "پرداخت تأیید شد ✅" : "پرداخت رد شد ❌",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
        },
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("fa-IR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return (
                    <Badge className="bg-green-100 text-green-700 rounded-lg">
                        تأیید شده
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge className="bg-red-100 text-red-700 rounded-lg">رد شده</Badge>
                );
            default:
                return (
                    <Badge className="bg-amber-100 text-amber-700 rounded-lg">
                        در انتظار
                    </Badge>
                );
        }
    };

    // Calculate stats
    const totalAmount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const approvedCount =
        payments?.filter((p) => p.status === "approved").length || 0;
    const pendingCount =
        payments?.filter((p) => p.status === "pending").length || 0;

    const statsCards = [
        {
            title: "کل درآمد",
            value: formatPrice(totalAmount),
            icon: Wallet,
            color: "bg-green-500",
            bgColor: "bg-green-50",
            textColor: "text-green-600",
        },
        {
            title: "تأیید شده",
            value: approvedCount,
            icon: Check,
            color: "bg-blue-500",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
        },
        {
            title: "در انتظار",
            value: pendingCount,
            icon: Clock,
            color: "bg-amber-500",
            bgColor: "bg-amber-50",
            textColor: "text-amber-600",
        },
    ];

    return (
        <AdminLayout>
            <motion.div variants={pageVariants} initial="initial" animate="animate">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-purple-500/30"
                    >
                        <CreditCard className="h-6 w-6" />
                    </motion.div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                            مدیریت پرداخت‌ها
                        </h1>
                        <p className="text-gray-500 mt-1">
                            بررسی و تأیید درخواست‌های پرداخت کاربران
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-3 mb-8">
                        <StatsSkeleton />
                        <StatsSkeleton />
                        <StatsSkeleton />
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="initial"
                        animate="animate"
                        className="grid gap-6 md:grid-cols-3 mb-8"
                    >
                        {statsCards.map((stat, idx) => (
                            <motion.div key={idx} variants={itemVariants}>
                                <Card className="rounded-2xl border-0 shadow-md">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                                                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">{stat.title}</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {stat.value}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Payments Table */}
                {isLoading ? (
                    <Card className="rounded-2xl p-6 space-y-4">
                        <ListItemSkeleton />
                        <ListItemSkeleton />
                        <ListItemSkeleton />
                    </Card>
                ) : payments?.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="rounded-2xl shadow-md border-0 p-12 text-center text-gray-400">
                            <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="text-xl">هنوز درخواست پرداختی وجود ندارد.</p>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="rounded-2xl shadow-md border-0 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="text-right font-bold">
                                            شناسه
                                        </TableHead>
                                        <TableHead className="text-right font-bold">
                                            کاربر
                                        </TableHead>
                                        <TableHead className="text-right font-bold">دوره</TableHead>
                                        <TableHead className="text-right font-bold">مبلغ</TableHead>
                                        <TableHead className="text-right font-bold">
                                            کد رهگیری
                                        </TableHead>
                                        <TableHead className="text-right font-bold">
                                            وضعیت
                                        </TableHead>
                                        <TableHead className="text-right font-bold">
                                            تاریخ
                                        </TableHead>
                                        <TableHead className="text-right font-bold">
                                            عملیات
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments?.map((payment, idx) => (
                                        <motion.tr
                                            key={payment.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="hover:bg-muted/50 transition-colors"
                                        >
                                            <TableCell className="font-mono text-gray-500">
                                                #{payment.id}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                        U{payment.userId}
                                                    </div>
                                                    <span>کاربر #{payment.userId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>دوره #{payment.contentId}</TableCell>
                                            <TableCell className="font-bold text-green-600">
                                                {formatPrice(payment.amount)}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm" dir="ltr">
                                                {payment.trackingCode}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                            <TableCell className="text-gray-500 text-sm">
                                                {formatDate(payment.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                {payment.status === "pending" && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 border-green-300 hover:bg-green-50 rounded-lg btn-press"
                                                            onClick={() =>
                                                                updateStatusMutation.mutate({
                                                                    id: payment.id,
                                                                    status: "approved",
                                                                })
                                                            }
                                                            disabled={updateStatusMutation.isPending}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 border-red-300 hover:bg-red-50 rounded-lg btn-press"
                                                            onClick={() =>
                                                                updateStatusMutation.mutate({
                                                                    id: payment.id,
                                                                    status: "rejected",
                                                                })
                                                            }
                                                            disabled={updateStatusMutation.isPending}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </motion.div>
                )}
            </motion.div>
        </AdminLayout>
    );
}
