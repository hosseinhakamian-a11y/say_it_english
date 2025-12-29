
import { AdminLayout } from "./layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContentSchema, type InsertContent } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Loader2, Plus, Pencil, Trash2, Video, BookOpen } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Content {
    id: number;
    title: string;
    description: string | null;
    type: string;
    level: string;
    videoId: string | null;
    videoProvider: string | null;
    isPremium: boolean;
    price: number | null;
}

export default function AdminContent() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: contentList, isLoading: isListLoading } = useQuery<Content[]>({
        queryKey: [api.content.list.path],
        queryFn: async () => {
            const res = await fetch(api.content.list.path);
            if (!res.ok) throw new Error("Failed to fetch");
            return await res.json();
        },
    });

    const form = useForm<InsertContent>({
        resolver: zodResolver(insertContentSchema),
        defaultValues: {
            title: "",
            description: "",
            type: "video",
            level: "beginner",
            videoProvider: "aparat",
            videoId: "",
            contentUrl: "",
            isPremium: false,
            price: 0,
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertContent) => {
            const res = await fetch(api.content.create.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create content");
            return await res.json();
        },
        onSuccess: () => {
            toast({ title: "محتوا با موفقیت ایجاد شد ✅" });
            form.reset();
            queryClient.invalidateQueries({ queryKey: [api.content.list.path] });
        },
        onError: (error) => {
            toast({ title: "خطا در ایجاد محتوا ❌", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<InsertContent> }) => {
            const res = await fetch(`/api/content/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update");
            return await res.json();
        },
        onSuccess: () => {
            toast({ title: "محتوا ویرایش شد ✅" });
            setEditingId(null);
            form.reset();
            queryClient.invalidateQueries({ queryKey: [api.content.list.path] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            return await res.json();
        },
        onSuccess: () => {
            toast({ title: "محتوا حذف شد 🗑️" });
            setDeleteId(null);
            queryClient.invalidateQueries({ queryKey: [api.content.list.path] });
        },
    });

    function onSubmit(data: InsertContent) {
        if (editingId) {
            updateMutation.mutate({ id: editingId, data });
        } else {
            createMutation.mutate(data);
        }
    }

    function startEdit(content: Content) {
        setEditingId(content.id);
        form.reset({
            title: content.title,
            description: content.description || "",
            type: content.type,
            level: content.level,
            videoId: content.videoId || "",
            videoProvider: content.videoProvider || "aparat",
            isPremium: content.isPremium,
            price: content.price || 0,
        });
    }

    const provider = form.watch("videoProvider");

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <BookOpen className="h-8 w-8 text-primary" />
                        مدیریت محتوا
                    </h1>
                    <p className="text-gray-500 mt-2">افزودن، ویرایش و حذف درس‌ها</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        {editingId ? <Pencil className="h-5 w-5 text-amber-500" /> : <Plus className="h-5 w-5 text-primary" />}
                        {editingId ? "ویرایش درس" : "افزودن درس جدید"}
                    </h2>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>عنوان درس</FormLabel>
                                    <FormControl><Input placeholder="مثلاً: آموزش زمان حال ساده" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>توضیحات</FormLabel>
                                    <FormControl><Textarea placeholder="توضیحات کوتاه..." className="resize-none" {...field} value={field.value || ""} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="level" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>سطح</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="beginner">مبتدی</SelectItem>
                                                <SelectItem value="intermediate">متوسط</SelectItem>
                                                <SelectItem value="advanced">پیشرفته</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="isPremium" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>نوع دسترسی</FormLabel>
                                        <Select onValueChange={(v) => field.onChange(v === "true")} value={field.value ? "true" : "false"}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="false">رایگان 🎁</SelectItem>
                                                <SelectItem value="true">VIP 💎</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            {/* Price field - show when VIP is selected */}
                            {form.watch("isPremium") && (
                                <FormField control={form.control} name="price" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>قیمت (تومان)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="مثلاً: 500000"
                                                {...field}
                                                value={field.value || 0}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            )}

                            <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
                                <h3 className="font-medium text-gray-700">تنظیمات ویدیو</h3>
                                <FormField control={form.control} name="videoProvider" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>سرویس</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || "aparat"}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="aparat">آپارات 🇮🇷</SelectItem>
                                                <SelectItem value="youtube">یوتیوب 🔴</SelectItem>
                                                <SelectItem value="bunny">بانی 🐰</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="videoId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>کد ویدیو</FormLabel>
                                        <FormControl><Input placeholder={provider === "aparat" ? "XyZw1" : "video-id"} {...field} value={field.value || ""} /></FormControl>
                                        <FormDescription className="text-xs">
                                            {provider === "aparat" && "آیدی از انتهای لینک آپارات"}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                                    {editingId ? "ذخیره تغییرات" : "ایجاد محتوا"}
                                </Button>
                                {editingId && (
                                    <Button type="button" variant="outline" onClick={() => { setEditingId(null); form.reset(); }}>
                                        انصراف
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Form>
                </div>

                {/* Content List */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b flex items-center gap-2">
                        <Video className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold">لیست محتواها ({contentList?.length || 0})</h2>
                    </div>
                    {isListLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : contentList?.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">هنوز محتوایی اضافه نشده</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">عنوان</TableHead>
                                    <TableHead className="text-right">سطح</TableHead>
                                    <TableHead className="text-right">نوع</TableHead>
                                    <TableHead className="text-right">عملیات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contentList?.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {item.level === "beginner" ? "مبتدی" : item.level === "intermediate" ? "متوسط" : "پیشرفته"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {item.isPremium ? <Badge className="bg-amber-100 text-amber-700">VIP</Badge> : <Badge variant="secondary">رایگان</Badge>}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => startEdit(item)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => setDeleteId(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                        <AlertDialogDescription>این عمل قابل بازگشت نیست و محتوا برای همیشه حذف می‌شود.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
                            حذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}

