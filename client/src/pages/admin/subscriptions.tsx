import { AdminLayout } from "./layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CreditCard, XCircle, Crown, Loader2 } from "lucide-react";
import { ListItemSkeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Subscription {
    id: number;
    userId: number;
    planId: string;
    status: string;
    startDate: string;
    endDate: string;
    paymentId: number | null;
    createdAt: string;
    user: { id: number; username: string; phone: string | null } | null;
}

export default function AdminSubscriptions() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: subs, isLoading } = useQuery<Subscription[]>({
        queryKey: ["/api/admin/subscriptions"],
        queryFn: async () => {
            const res = await fetch("/api/admin/subscriptions", { credentials: "include" });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
    });

    const cancelMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("POST", `/api/admin/subscriptions/${id}/cancel`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
            toast({ title: "اشتراک لغو شد" });
        },
    });

    const planName = (id: string) => {
        if (id === "gold") return "طلایی";
        if (id === "silver") return "نقره‌ای";
        return "برنزی";
    };

    const planColor = (id: string) => {
        if (id === "gold") return "bg-yellow-100 text-yellow-800 border-yellow-300";
        if (id === "silver") return "bg-gray-100 text-gray-700 border-gray-300";
        return "bg-orange-100 text-orange-800 border-orange-300";
    };

    return (
        <AdminLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3">
                            <Crown className="h-8 w-8 text-yellow-500" />
                            مدیریت اشتراک‌ها
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            مشاهده و مدیریت تمام اشتراک‌های فعال و غیرفعال
                        </p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                        {subs?.filter(s => s.status === 'active').length || 0} فعال
                    </Badge>
                </div>

                <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-6 space-y-4">
                                <ListItemSkeleton />
                                <ListItemSkeleton />
                                <ListItemSkeleton />
                            </div>
                        ) : subs && subs.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="text-right">کاربر</TableHead>
                                        <TableHead className="text-right">پلن</TableHead>
                                        <TableHead className="text-right">وضعیت</TableHead>
                                        <TableHead className="text-right">تاریخ شروع</TableHead>
                                        <TableHead className="text-right">تاریخ پایان</TableHead>
                                        <TableHead className="text-right">عملیات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {subs.map((sub) => (
                                        <TableRow key={sub.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium">
                                                <div>
                                                    <span className="font-bold">{sub.user?.username || '—'}</span>
                                                    {sub.user?.phone && (
                                                        <span className="text-xs text-muted-foreground block ltr">{sub.user.phone}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={planColor(sub.planId)}>
                                                    {planName(sub.planId)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                                                    {sub.status === 'active' ? 'فعال' : sub.status === 'cancelled' ? 'لغو شده' : 'منقضی'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(sub.startDate).toLocaleDateString('fa-IR')}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(sub.endDate).toLocaleDateString('fa-IR')}
                                            </TableCell>
                                            <TableCell>
                                                {sub.status === 'active' && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => cancelMutation.mutate(sub.id)}
                                                        disabled={cancelMutation.isPending}
                                                        className="gap-1"
                                                    >
                                                        {cancelMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                                        لغو
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>هنوز اشتراکی ثبت نشده است.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </AdminLayout>
    );
}
