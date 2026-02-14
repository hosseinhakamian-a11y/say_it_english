import { AdminLayout } from "./layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { ListItemSkeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface PromoCode {
    id: number;
    code: string;
    discountPercent: number;
    maxUses: number | null;
    usedCount: number;
    expiresAt: string | null;
    isActive: boolean;
    createdAt: string;
}

export default function AdminPromos() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [newDiscount, setNewDiscount] = useState("");
    const [newMaxUses, setNewMaxUses] = useState("");
    const [newExpires, setNewExpires] = useState("");

    const { data: promos, isLoading } = useQuery<PromoCode[]>({
        queryKey: ["/api/admin/promos"],
        queryFn: async () => {
            const res = await fetch("/api/admin/promos", { credentials: "include" });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/admin/promos", {
                code: newCode,
                discountPercent: newDiscount,
                maxUses: newMaxUses || undefined,
                expiresAt: newExpires || undefined,
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/promos"] });
            toast({ title: "کد تخفیف ایجاد شد" });
            setDialogOpen(false);
            setNewCode(""); setNewDiscount(""); setNewMaxUses(""); setNewExpires("");
        },
        onError: () => toast({ title: "خطا", variant: "destructive" }),
    });

    const toggleMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("POST", `/api/admin/promos/${id}/toggle`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/promos"] }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/admin/promos/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/promos"] });
            toast({ title: "کد تخفیف حذف شد" });
        },
    });

    return (
        <AdminLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3">
                            <Tag className="h-8 w-8 text-purple-500" />
                            مدیریت کدهای تخفیف
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            ایجاد، ویرایش و مدیریت کدهای تخفیف
                        </p>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                کد جدید
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>ایجاد کد تخفیف جدید</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label>کد تخفیف</Label>
                                    <Input placeholder="SUMMER2026" value={newCode} onChange={e => setNewCode(e.target.value)} className="mt-1 uppercase" />
                                </div>
                                <div>
                                    <Label>درصد تخفیف</Label>
                                    <Input type="number" placeholder="20" value={newDiscount} onChange={e => setNewDiscount(e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label>حداکثر استفاده (اختیاری)</Label>
                                    <Input type="number" placeholder="100" value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label>تاریخ انقضا (اختیاری)</Label>
                                    <Input type="date" value={newExpires} onChange={e => setNewExpires(e.target.value)} className="mt-1" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => createMutation.mutate()} disabled={!newCode || !newDiscount || createMutation.isPending}>
                                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "ایجاد"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-6 space-y-4">
                                <ListItemSkeleton /><ListItemSkeleton /><ListItemSkeleton />
                            </div>
                        ) : promos && promos.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="text-right">کد</TableHead>
                                        <TableHead className="text-right">تخفیف</TableHead>
                                        <TableHead className="text-right">استفاده</TableHead>
                                        <TableHead className="text-right">وضعیت</TableHead>
                                        <TableHead className="text-right">انقضا</TableHead>
                                        <TableHead className="text-right">عملیات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {promos.map((promo) => (
                                        <TableRow key={promo.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell>
                                                <code className="bg-muted px-2 py-1 rounded font-mono font-bold text-primary">
                                                    {promo.code}
                                                </code>
                                            </TableCell>
                                            <TableCell className="font-bold text-lg text-green-600">
                                                {promo.discountPercent}%
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">
                                                    {promo.usedCount} / {promo.maxUses || '∞'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={promo.isActive ? "default" : "secondary"}>
                                                    {promo.isActive ? "فعال" : "غیرفعال"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString('fa-IR') : 'بدون انقضا'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => toggleMutation.mutate(promo.id)}
                                                        title={promo.isActive ? "غیرفعال" : "فعال"}
                                                    >
                                                        {promo.isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() => deleteMutation.mutate(promo.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <Tag className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>هنوز کد تخفیفی ایجاد نشده است.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </AdminLayout>
    );
}
