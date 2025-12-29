import { AdminLayout } from "./layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Check, X, Clock } from "lucide-react";

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
                title: status === "approved" ? "پرداخت تأیید شد ✅" : "پرداخت رد شد ❌"
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
                return <Badge className="bg-green-100 text-green-700">تأیید شده</Badge>;
            case "rejected":
                return <Badge className="bg-red-100 text-red-700">رد شده</Badge>;
            default:
                return <Badge className="bg-amber-100 text-amber-700">در انتظار</Badge>;
        }
    };

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-primary" />
                        مدیریت پرداخت‌ها
                    </h1>
                    <p className="text-gray-500 mt-2">بررسی و تأیید درخواست‌های پرداخت کاربران</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : payments?.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
                    <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl">هنوز درخواست پرداختی وجود ندارد.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">شناسه</TableHead>
                                <TableHead className="text-right">کاربر</TableHead>
                                <TableHead className="text-right">دوره</TableHead>
                                <TableHead className="text-right">مبلغ</TableHead>
                                <TableHead className="text-right">کد رهگیری</TableHead>
                                <TableHead className="text-right">وضعیت</TableHead>
                                <TableHead className="text-right">تاریخ</TableHead>
                                <TableHead className="text-right">عملیات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments?.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-mono text-gray-500">#{payment.id}</TableCell>
                                    <TableCell>کاربر #{payment.userId}</TableCell>
                                    <TableCell>دوره #{payment.contentId}</TableCell>
                                    <TableCell className="font-medium">{formatPrice(payment.amount)}</TableCell>
                                    <TableCell className="font-mono" dir="ltr">{payment.trackingCode}</TableCell>
                                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                    <TableCell className="text-gray-500 text-sm">{formatDate(payment.createdAt)}</TableCell>
                                    <TableCell>
                                        {payment.status === "pending" && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-green-600 border-green-300 hover:bg-green-50"
                                                    onClick={() => updateStatusMutation.mutate({ id: payment.id, status: "approved" })}
                                                    disabled={updateStatusMutation.isPending}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                                    onClick={() => updateStatusMutation.mutate({ id: payment.id, status: "rejected" })}
                                                    disabled={updateStatusMutation.isPending}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </AdminLayout>
    );
}
