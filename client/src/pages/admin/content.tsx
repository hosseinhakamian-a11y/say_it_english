
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Loader2, Plus } from "lucide-react";

export default function AdminContent() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

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
            toast({
                title: "خطا در ایجاد محتوا ❌",
                description: error.message,
                variant: "destructive"
            });
        },
    });

    function onSubmit(data: InsertContent) {
        createMutation.mutate(data);
    }

    const provider = form.watch("videoProvider");

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">مدیریت محتوا</h1>
                    <p className="text-gray-500 mt-2">افزودن و ویرایش درس‌های ویدیویی</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border max-w-2xl">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    افزودن درس جدید
                </h2>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>عنوان درس</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثلاً: آموزش زمان حال ساده" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>توضیحات</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="توضیحات کوتاهی درباره این درس..."
                                            className="resize-none"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="level"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>سطح</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="انتخاب سطح" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="beginner">مبتدی (Beginner)</SelectItem>
                                                <SelectItem value="intermediate">متوسط (Intermediate)</SelectItem>
                                                <SelectItem value="advanced">پیشرفته (Advanced)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isPremium"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>نوع دسترسی</FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(val === "true")}
                                            defaultValue={field.value ? "true" : "false"}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="انتخاب دسترسی" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="false">رایگان 🎁</SelectItem>
                                                <SelectItem value="true">ویژه (VIP) 💎</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
                            <h3 className="font-medium text-gray-700">تنظیمات ویدیو</h3>

                            <FormField
                                control={form.control}
                                name="videoProvider"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>سرویس دهنده ویدیو</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || "aparat"}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="انتخاب سرویس" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="aparat">آپارات (Aparat) 🇮🇷</SelectItem>
                                                <SelectItem value="youtube">یوتیوب (YouTube) 🔴</SelectItem>
                                                <SelectItem value="bunny">بانی (Bunny.net) 🐰</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {field.value === "aparat" && "مناسب برای ویدیوهای رایگان و عمومی."}
                                            {field.value === "bunny" && "امن‌ترین گزینه برای دوره‌های پولی (غیرقابل دانلود)."}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="videoId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {provider === "aparat" ? "کد ویدیو آپارات (Video ID)" :
                                                provider === "youtube" ? "لینک یا آی‌دی یوتیوب" :
                                                    "Bunny Video ID"}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={
                                                    provider === "aparat" ? "مثلاً: XyZw1" :
                                                        provider === "bunny" ? "video-id-from-bunny-panel" :
                                                            "youtube-link"
                                                }
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            {provider === "aparat" && "آیدی ویدیو را از انتهای لینک آپارات کپی کنید. مثال: aparat.com/v/XyZw1 -> XyZw1"}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                    در حال ثبت...
                                </>
                            ) : (
                                "ایجاد محتوا"
                            )}
                        </Button>
                    </form>
                </Form>
            </div>
        </AdminLayout>
    );
}
