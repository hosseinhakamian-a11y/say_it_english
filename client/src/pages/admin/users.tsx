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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Sparkles, Search } from "lucide-react";
import { motion } from "framer-motion";
import { pageVariants, containerVariants, itemVariants } from "@/lib/animations";
import { ListItemSkeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Card } from "@/components/ui/card";

interface User {
    id: number;
    username: string;
    role: string;
    level: string | null;
    createdAt: string;
}

export default function AdminUsers() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ["/api/users"],
        queryFn: async () => {
            const token = localStorage.getItem("auth_token");
            const res = await fetch("/api/users", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch users");
            return await res.json();
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: number; role: string }) => {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(`/api/users/${id}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role }),
            });
            if (!res.ok) throw new Error("Failed to update role");
            return await res.json();
        },
        onSuccess: () => {
            toast({ title: "نقش کاربر با موفقیت تغییر کرد ✅" });
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        },
        onError: () => {
            toast({ title: "خطا در تغییر نقش ❌", variant: "destructive" });
        },
    });

    const filteredUsers = users?.filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout>
            <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
            >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/30"
                        >
                            <Users className="h-6 w-6" />
                        </motion.div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                مدیریت کاربران
                            </h1>
                            <p className="text-gray-500 mt-1">
                                مشاهده و ویرایش نقش کاربران سیستم
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="جستجوی کاربر..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10 rounded-xl bg-white border-gray-200"
                        />
                    </div>
                </div>

                {/* Users Table */}
                {isLoading ? (
                    <Card className="rounded-2xl p-6 space-y-4">
                        <ListItemSkeleton />
                        <ListItemSkeleton />
                        <ListItemSkeleton />
                        <ListItemSkeleton />
                    </Card>
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
                                        <TableHead className="text-right font-bold">شناسه</TableHead>
                                        <TableHead className="text-right font-bold">نام کاربری</TableHead>
                                        <TableHead className="text-right font-bold">سطح</TableHead>
                                        <TableHead className="text-right font-bold">نقش</TableHead>
                                        <TableHead className="text-right font-bold">تاریخ عضویت</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                                <p>کاربری یافت نشد</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers?.map((user, idx) => (
                                            <motion.tr
                                                key={user.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="hover:bg-muted/50 transition-colors"
                                            >
                                                <TableCell className="font-mono text-gray-500">
                                                    #{user.id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary">
                                                            {user.username.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium">{user.username}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`rounded-lg ${user.level === "beginner"
                                                                ? "bg-green-50 text-green-700 border-green-200"
                                                                : user.level === "intermediate"
                                                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                                    : user.level === "advanced"
                                                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                                                        : "bg-gray-50 text-gray-500"
                                                            }`}
                                                    >
                                                        {user.level === "beginner"
                                                            ? "مبتدی"
                                                            : user.level === "intermediate"
                                                                ? "متوسط"
                                                                : user.level === "advanced"
                                                                    ? "پیشرفته"
                                                                    : "نامشخص"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        defaultValue={user.role}
                                                        onValueChange={(role) =>
                                                            updateRoleMutation.mutate({ id: user.id, role })
                                                        }
                                                    >
                                                        <SelectTrigger className="w-28 rounded-lg">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="student">دانشجو</SelectItem>
                                                            <SelectItem value="admin">ادمین</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-gray-500 text-sm">
                                                    {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </motion.div>
                )}

                {/* Stats Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 text-center text-sm text-muted-foreground"
                >
                    مجموع کاربران: {users?.length || 0} نفر
                </motion.div>
            </motion.div>
        </AdminLayout>
    );
}
