import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useToast } from "@/hooks/use-toast";
import {
    User,
    Save,
    Loader2,
    Lock,
    Calendar,
    Phone,
    Mail,
    ArrowRight,
    Eye,
    EyeOff,
    Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/animations";
import { Link } from "wouter";

interface ProfileFormData {
    firstName: string;
    lastName: string;
    birthDate: string;
    bio: string;
    level: string;
}

export default function EditProfile() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<ProfileFormData>({
        firstName: "",
        lastName: "",
        birthDate: "",
        bio: "",
        level: "beginner",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: (user as any).firstName || "",
                lastName: (user as any).lastName || "",
                birthDate: (user as any).birthDate || "",
                bio: (user as any).bio || "",
                level: user.level || "beginner",
            });
        }
    }, [user]);

    const updateProfileMutation = useMutation({
        mutationFn: async (data: ProfileFormData) => {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update profile");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "✅ پروفایل با موفقیت به‌روزرسانی شد" });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        },
        onError: () => {
            toast({ title: "❌ خطا در به‌روزرسانی پروفایل", variant: "destructive" });
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: async (data: { currentPassword?: string; newPassword: string }) => {
            const res = await fetch("/api/profile/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "✅ رمز عبور با موفقیت تغییر کرد" });
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        },
        onError: (error: Error) => {
            toast({ title: `❌ ${error.message}`, variant: "destructive" });
        },
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData);
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({ title: "❌ رمز عبور جدید و تکرار آن یکسان نیستند", variant: "destructive" });
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast({ title: "❌ رمز عبور باید حداقل ۶ کاراکتر باشد", variant: "destructive" });
            return;
        }
        changePasswordMutation.mutate({
            currentPassword: (user as any)?.password ? passwordData.currentPassword : undefined,
            newPassword: passwordData.newPassword,
        });
    };

    const hasExistingPassword = !!(user as any)?.password;

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            className="min-h-screen bg-gradient-to-br from-muted/50 to-background py-8 px-4"
            dir="rtl"
        >
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Back Button */}
                <Link href="/profile">
                    <a className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <ArrowRight className="w-4 h-4" />
                        بازگشت به پروفایل
                    </a>
                </Link>

                {/* Profile Info Card */}
                <Card className="rounded-2xl border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            اطلاعات شخصی
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">نام</Label>
                                    <Input
                                        id="firstName"
                                        placeholder="نام خود را وارد کنید"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">نام خانوادگی</Label>
                                    <Input
                                        id="lastName"
                                        placeholder="نام خانوادگی خود را وارد کنید"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="birthDate">تاریخ تولد</Label>
                                    <div className="relative">
                                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="birthDate"
                                            type="date"
                                            value={formData.birthDate}
                                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                            className="rounded-xl pr-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>سطح زبان (از آزمون تعیین سطح)</Label>
                                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium">
                                            {formData.level === 'advanced' ? 'پیشرفته' : formData.level === 'intermediate' ? 'متوسط' : formData.level === 'beginner' ? 'مبتدی' : 'تعیین نشده'}
                                        </span>
                                    </div>
                                    <Link href="/placement">
                                        <a className="text-xs text-primary hover:underline">شرکت در آزمون تعیین سطح ←</a>
                                    </Link>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">درباره من</Label>
                                <Textarea
                                    id="bio"
                                    placeholder="توضیحات کوتاه درباره خودتان..."
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="rounded-xl min-h-[100px]"
                                />
                            </div>

                            {/* Read-only info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">نام کاربری</Label>
                                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">{user?.username}</span>
                                    </div>
                                </div>
                                {user?.phone && (
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">شماره تلفن</Label>
                                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl" dir="ltr">
                                            <Phone className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm">{user.phone}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={updateProfileMutation.isPending}
                                className="w-full rounded-xl btn-press"
                            >
                                {updateProfileMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                ) : (
                                    <Save className="w-4 h-4 ml-2" />
                                )}
                                ذخیره تغییرات
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Password Card */}
                <Card className="rounded-2xl border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" />
                            {hasExistingPassword ? "تغییر رمز عبور" : "ایجاد رمز عبور"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            {!hasExistingPassword && (
                                <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm">
                                    شما از طریق پیامک وارد شده‌اید. می‌توانید یک رمز عبور برای ورود آسان‌تر تنظیم کنید.
                                </div>
                            )}

                            {hasExistingPassword && (
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">رمز عبور فعلی</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showCurrentPassword ? "text" : "password"}
                                            placeholder="رمز عبور فعلی خود را وارد کنید"
                                            value={passwordData.currentPassword}
                                            onChange={(e) =>
                                                setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                            }
                                            className="rounded-xl pl-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">رمز عبور جدید</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="حداقل ۶ کاراکتر"
                                        value={passwordData.newPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                                        }
                                        className="rounded-xl pl-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">تکرار رمز عبور جدید</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="رمز عبور جدید را تکرار کنید"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                    }
                                    className="rounded-xl"
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="outline"
                                disabled={changePasswordMutation.isPending}
                                className="w-full rounded-xl"
                            >
                                {changePasswordMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                ) : (
                                    <Lock className="w-4 h-4 ml-2" />
                                )}
                                {hasExistingPassword ? "تغییر رمز عبور" : "ایجاد رمز عبور"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}
