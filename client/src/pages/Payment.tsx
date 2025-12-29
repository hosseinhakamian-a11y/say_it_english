import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Copy, CheckCircle, ArrowRight } from "lucide-react";

// Bank Card Info - Update this with actual card number
const BANK_CARD = "6104-3379-6429-8218";
const BANK_NAME = "بانک ملت";
const CARD_HOLDER = "Say It English";

interface Content {
    id: number;
    title: string;
    description: string | null;
    price: number | null;
    isPremium: boolean;
}

export default function PaymentPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { toast } = useToast();
    const [, navigate] = useLocation();
    const [trackingCode, setTrackingCode] = useState("");
    const [copied, setCopied] = useState(false);

    const { data: content, isLoading } = useQuery<Content>({
        queryKey: [`/api/content/${id}`],
        queryFn: async () => {
            const res = await fetch(api.content.list.path);
            if (!res.ok) throw new Error("Failed to fetch");
            const all = await res.json();
            return all.find((c: Content) => c.id === parseInt(id!));
        },
        enabled: !!id,
    });

    const submitPayment = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contentId: parseInt(id!),
                    amount: content?.price || 0,
                    trackingCode,
                }),
            });
            if (!res.ok) throw new Error("Failed to submit payment");
            return await res.json();
        },
        onSuccess: () => {
            toast({
                title: "درخواست پرداخت ثبت شد ✅",
                description: "پس از تأیید، دسترسی شما فعال خواهد شد.",
            });
            navigate("/content");
        },
        onError: () => {
            toast({
                title: "خطا در ثبت درخواست ❌",
                variant: "destructive",
            });
        },
    });

    const copyCardNumber = () => {
        navigator.clipboard.writeText(BANK_CARD.replace(/-/g, ""));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "شماره کارت کپی شد 📋" });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">برای خرید دوره ابتدا وارد شوید</h1>
                <Button onClick={() => navigate("/auth")}>ورود / ثبت‌نام</Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!content) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold">دوره یافت نشد</h1>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
            <Button variant="ghost" onClick={() => navigate("/content")} className="mb-6">
                <ArrowRight className="ml-2 h-4 w-4" />
                بازگشت به لیست دوره‌ها
            </Button>

            <Card className="shadow-xl">
                <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-xl">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <CreditCard className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">خرید دوره</CardTitle>
                    <CardDescription className="text-lg font-medium text-foreground">
                        {content.title}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {/* Price */}
                    <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-sm text-amber-700 mb-1">مبلغ قابل پرداخت:</p>
                        <p className="text-3xl font-bold text-amber-800">
                            {formatPrice(content.price || 0)}
                        </p>
                    </div>

                    {/* Bank Card Info */}
                    <div className="p-4 bg-gray-50 rounded-xl border space-y-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            اطلاعات کارت بانکی
                        </h3>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div>
                                <p className="text-sm text-gray-500">شماره کارت</p>
                                <p className="text-xl font-mono font-bold tracking-wider" dir="ltr">{BANK_CARD}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={copyCardNumber}>
                                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-white rounded-lg border">
                                <p className="text-gray-500">نام بانک</p>
                                <p className="font-medium">{BANK_NAME}</p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border">
                                <p className="text-gray-500">نام صاحب حساب</p>
                                <p className="font-medium">{CARD_HOLDER}</p>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-blue-800 text-sm space-y-2">
                        <p className="font-semibold">راهنمای پرداخت:</p>
                        <ol className="list-decimal list-inside space-y-1 mr-2">
                            <li>مبلغ فوق را به شماره کارت بالا واریز کنید.</li>
                            <li>کد رهگیری (پیگیری) را از رسید بانکی کپی کنید.</li>
                            <li>کد رهگیری را در کادر زیر وارد و ثبت کنید.</li>
                            <li>پس از تأیید توسط ادمین، دسترسی شما فعال می‌شود.</li>
                        </ol>
                    </div>

                    {/* Tracking Code Input */}
                    <div className="space-y-2">
                        <Label htmlFor="trackingCode" className="text-base font-medium">
                            کد رهگیری / پیگیری بانکی
                        </Label>
                        <Input
                            id="trackingCode"
                            placeholder="کد رهگیری را وارد کنید..."
                            value={trackingCode}
                            onChange={(e) => setTrackingCode(e.target.value)}
                            className="text-lg py-6"
                            dir="ltr"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        className="w-full py-6 text-lg"
                        disabled={!trackingCode.trim() || submitPayment.isPending}
                        onClick={() => submitPayment.mutate()}
                    >
                        {submitPayment.isPending ? (
                            <>
                                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                                در حال ثبت...
                            </>
                        ) : (
                            "ثبت درخواست پرداخت"
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
