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
import { Loader2, Plus, Pencil, Trash2, Video, BookOpen, Upload, CheckCircle2, ShieldCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
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
    fileKey: string | null;
    isPremium: boolean;
    price: number | null;
}

export default function AdminContent() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

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
            videoProvider: "bunny",
            videoId: "",
            arvanVideoProvider: "none",
            arvanVideoId: "",
            fileKey: "",
            contentUrl: "",
            thumbnailUrl: "",
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
            setUploadProgress(0);
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
            setUploadProgress(0);
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(5);

        try {
            const res = await fetch(`/api/content/upload-link?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`);
            if (!res.ok) {
                const errorMsg = await res.text();
                throw new Error(errorMsg || "Could not get upload link");
            }
            const { uploadUrl, fileKey } = await res.json();

            setUploadProgress(20);

            const xhr = new XMLHttpRequest();
            xhr.open("PUT", uploadUrl, true);
            xhr.setRequestHeader("Content-Type", file.type);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 79) + 20;
                    setUploadProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 201) {
                    setUploadProgress(100);
                    form.setValue("fileKey", fileKey);
                    form.setValue("videoProvider", "custom");
                    toast({ title: "فایل با موفقیت در ابرآروان آپلود شد ✅" });
                    setUploading(false);
                } else {
                    console.error("Upload failed with status:", xhr.status, xhr.responseText);
                    throw new Error(`Upload failed (${xhr.status}). Check CORS settings.`);
                }
            };

            xhr.onerror = () => {
                console.error("XHR Network Error. This is usually a CORS issue.");
                throw new Error("Network error. Please ensure CORS is enabled in ArvanCloud bucket settings.");
            };
            xhr.send(file);

        } catch (error: any) {
            toast({ title: "خطا در آپلود ❌", description: error.message, variant: "destructive" });
            setUploading(false);
            setUploadProgress(0);
        }
    };

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
            fileKey: content.fileKey || "",
            videoProvider: content.videoProvider || "aparat",
            isPremium: content.isPremium,
            price: content.price || 0,
        });
    }

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <BookOpen className="h-8 w-8 text-primary" />
                        مدیریت محتوا (یکپارچه با ابرآروان)
                    </h1>
                    <p className="text-gray-500 mt-2">افزودن درس‌ها و آپلود مستقیم ویدیو روی فضای ابری</p>
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
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>عنوان درس</FormLabel>
                                    <FormControl><Input className="py-5" placeholder="مثلاً: آموزش زمان حال ساده" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>توضیحات</FormLabel>
                                    <FormControl><Textarea placeholder="توضیحات کوتاه..." className="resize-none h-24" {...field} value={field.value || ""} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="level" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>سطح</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent className="bg-white z-[120]">
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
                                            <SelectContent className="bg-white z-[120]">
                                                <SelectItem value="false">رایگان 🎁</SelectItem>
                                                <SelectItem value="true">VIP 💎</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            {form.watch("isPremium") && (
                                <FormField control={form.control} name="price" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>قیمت (تومان)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                className="py-5"
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

                            {/* Arvan Section with stronger visual separation */}
                            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold flex items-center gap-2 text-primary">
                                        <Upload className="w-4 h-4" />
                                        آپلود روی ابرآروان (استریم امن)
                                    </h3>
                                    {form.watch("fileKey") && (
                                        <Badge className="bg-green-100 text-green-700 border-green-200">
                                            آماده ✅
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <Input
                                        type="file"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        accept="video/*,audio/*"
                                        className="bg-white file:bg-primary file:text-white file:border-0"
                                    />
                                    {uploading && (
                                        <div className="space-y-2">
                                            <Progress value={uploadProgress} className="h-2" />
                                            <p className="text-[10px] text-center text-primary font-medium animate-pulse">
                                                {uploadProgress >= 99 ? "در حال نهایی‌سازی در ابرآروان..." : `در حال انتقال... ${uploadProgress}%`}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* International Video Source (Bunny/YouTube/etc) */}
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-4 relative">
                                <h3 className="font-medium text-blue-700 flex items-center gap-2">
                                    🌍 سرویس بین‌المللی (برای خارج ایران)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="videoProvider" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>سرویس</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || "bunny"}>
                                                <FormControl><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent className="bg-white border shadow-2xl z-[150]">
                                                    <SelectItem value="bunny">بانی 🐰</SelectItem>
                                                    <SelectItem value="youtube">یوتیوب 🔴</SelectItem>
                                                    <SelectItem value="aparat">آپارات 🇮🇷</SelectItem>
                                                    <SelectItem value="custom">لینک مستقیم 🔗</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="videoId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>آیدی/لینک ویدیو</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="bg-white text-left font-mono"
                                                    placeholder="لینک یوتیوب یا ID ویدیو"
                                                    dir="ltr"
                                                    {...field}
                                                    value={field.value || ""}
                                                    onChange={(e) => {
                                                        let val = e.target.value;
                                                        // Auto-extract YouTube ID if user pastes full URL and provider is youtube
                                                        if (form.getValues("videoProvider") === "youtube") {
                                                            try {
                                                                const url = new URL(val);
                                                                if (url.hostname.includes("youtube.com")) {
                                                                    val = url.searchParams.get("v") || val;
                                                                } else if (url.hostname.includes("youtu.be")) {
                                                                    val = url.pathname.slice(1) || val;
                                                                }
                                                            } catch (err) {
                                                                // Not a valid URL, treat as ID or partial string
                                                            }
                                                        }
                                                        field.onChange(val);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            {form.watch("videoProvider") === "youtube" && field.value && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] text-gray-500">پیش‌نمایش:</span>
                                                    <a
                                                        href={`https://www.youtube.com/watch?v=${field.value}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[10px] text-blue-600 hover:underline truncate max-w-[200px]"
                                                    >
                                                        https://www.youtube.com/watch?v={field.value}
                                                    </a>
                                                </div>
                                            )}
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            {/* ArvanCloud Video Source (for Iran) */}
                            <div className="p-4 bg-green-50 rounded-xl border border-green-200 space-y-4 relative">
                                <h3 className="font-medium text-green-700 flex items-center gap-2">
                                    🇮🇷 ابرآروان (برای کاربران ایرانی - اختیاری)
                                </h3>
                                <p className="text-[11px] text-green-600">
                                    اگر ویدیو را در ابرآروان هم آپلود کرده‌اید، لینک آن را وارد کنید. سیستم برای کاربران ایرانی از این منبع استفاده می‌کند.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="arvanVideoProvider" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>نوع سرویس</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || "none"}>
                                                <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="انتخاب کنید..." /></SelectTrigger></FormControl>
                                                <SelectContent className="bg-white border shadow-2xl z-[150]">
                                                    <SelectItem value="none">بدون ابرآروان</SelectItem>
                                                    <SelectItem value="arvan-vod">پلتفرم ویدیو 🎬</SelectItem>
                                                    <SelectItem value="arvan-storage">فضای ابری (Storage) 📦</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="arvanVideoId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>آیدی/لینک ابرآروان</FormLabel>
                                            <FormControl><Input className="bg-white" placeholder="لینک پخش یا آیدی" {...field} value={field.value || ""} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            {/* Thumbnail URL Field */}
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                                <h3 className="font-medium text-amber-700 flex items-center gap-2">
                                    🖼️ عکس پیش‌نمایش (اختیاری)
                                </h3>
                                <FormField control={form.control} name="thumbnailUrl" render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                className="bg-white"
                                                placeholder="https://example.com/thumbnail.jpg"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-[10px] text-amber-600">
                                            لینک تصویر کاور دوره را وارد کنید. می‌توانید از Bunny Storage یا هر CDN دیگر استفاده کنید.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                {form.watch("thumbnailUrl") && (
                                    <div className="mt-2 rounded-lg overflow-hidden border border-amber-200 max-w-[120px]">
                                        <img
                                            src={form.watch("thumbnailUrl") ?? ""}
                                            alt="Preview"
                                            className="w-full aspect-[9/16] object-cover"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" className="flex-1 py-7 text-lg font-bold" disabled={createMutation.isPending || updateMutation.isPending || uploading}>
                                    {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                                    {editingId ? "ذخیره تغییرات" : "ایجاد نهایی محتوا"}
                                </Button>
                                {editingId && (
                                    <Button type="button" variant="outline" className="py-7" onClick={() => { setEditingId(null); form.reset(); setUploadProgress(0); }}>
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
                        <Table dir="rtl">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">عنوان</TableHead>
                                    <TableHead className="text-right">نوع</TableHead>
                                    <TableHead className="text-right">سرویس</TableHead>
                                    <TableHead className="text-right">عملیات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contentList?.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium max-w-[150px] truncate">{item.title}</TableCell>
                                        <TableCell>
                                            {item.isPremium ? <Badge className="bg-amber-100 text-amber-700">VIP</Badge> : <Badge variant="secondary">رایگان</Badge>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                                {item.fileKey ? <ShieldCheck className="w-3 h-3 text-green-600" /> : null}
                                                {item.videoProvider || "custom"}
                                            </Badge>
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
