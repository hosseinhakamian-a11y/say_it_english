
import { AdminLayout } from "./layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users } from "lucide-react";

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

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: [api.users.list.path],
        queryFn: async () => {
            const res = await fetch(api.users.list.path);
            if (!res.ok) throw new Error("Failed to fetch users");
            return await res.json();
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: number; role: string }) => {
            const res = await fetch(`/api/users/${id}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
            });
            if (!res.ok) throw new Error("Failed to update role");
            return await res.json();
        },
        onSuccess: () => {
            toast({ title: "نقش کاربر با موفقیت تغییر کرد ✅" });
            queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
        },
        onError: () => {
            toast({ title: "خطا در تغییر نقش ❌", variant: "destructive" });
        },
    });

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        مدیریت کاربران
                    </h1>
                    <p className="text-gray-500 mt-2">مشاهده و ویرایش نقش کاربران سیستم</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">شناسه</TableHead>
                                <TableHead className="text-right">نام کاربری</TableHead>
                                <TableHead className="text-right">سطح</TableHead>
                                <TableHead className="text-right">نقش</TableHead>
                                <TableHead className="text-right">تاریخ عضویت</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-mono text-gray-500">{user.id}</TableCell>
                                    <TableCell className="font-medium">{user.username}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {user.level === "beginner" ? "مبتدی" :
                                                user.level === "intermediate" ? "متوسط" :
                                                    user.level === "advanced" ? "پیشرفته" : "نامشخص"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            defaultValue={user.role}
                                            onValueChange={(role) => updateRoleMutation.mutate({ id: user.id, role })}
                                        >
                                            <SelectTrigger className="w-28">
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
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </AdminLayout>
    );
}
