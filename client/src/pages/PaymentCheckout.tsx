import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
    CreditCard, Bitcoin, Banknote, Copy, CheckCircle2,
    Clock, AlertCircle, Loader2, ArrowRight
} from "lucide-react";

// Payment Info (You can move this to env or config)
const PAYMENT_INFO = {
    card: {
        number: "6104-3379-6429-8218",
        accountNumber: "1781839276",
        owner: "حسین حکمیان",
        bank: "بانک ملت",
    },
    crypto: {
        address: "0x2ca84105e9e3f3a91f0385acbd497923d743a342",
        network: "BNB Smart Chain (BEP20)",
        coin: "USDT / BNB",
    }
};

const plans: Record<string, { name: string; price: number }> = {
    bronze: { name: "پلن برنزی", price: 299000 },
    silver: { name: "پلن نقره‌ای", price: 599000 },
    gold: { name: "پلن طلایی", price: 1299000 },
};

export default function PaymentCheckout() {
    const [, navigate] = useLocation();
    const search = useSearch();
    const params = new URLSearchParams(search);
    const planId = params.get("plan") || "silver";
    const plan = plans[planId] || plans.silver;

    const [trackingCode, setTrackingCode] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("card");
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const formatPrice = (price: number) => new Intl.NumberFormat('fa-IR').format(price);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text.replace(/-/g, ""));
        setCopied(true);
        toast({ title: "کپی شد!", description: "شماره کارت در کلیپبورد ذخیره شد." });
        setTimeout(() => setCopied(false), 2000);
    };

    const submitPayment = useMutation({
        mutationFn: async (data: { trackingCode: string; method: string; planId: string; amount: number }) => {
            const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "خطا در ثبت پرداخت");
            }
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "پرداخت ثبت شد ✅",
                description: "پس از تایید ادمین، دسترسی شما فعال می‌شود."
            });
            navigate("/dashboard?payment=pending");
        },
        onError: (err: Error) => {
            toast({ title: "خطا", description: err.message, variant: "destructive" });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingCode.trim()) {
            toast({ title: "خطا", description: "لطفاً کد پیگیری را وارد کنید.", variant: "destructive" });
            return;
        }
        submitPayment.mutate({
            trackingCode,
            method: paymentMethod,
            planId,
            amount: plan.price,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12">
            <SEO title="تکمیل پرداخت" description="پرداخت امن برای فعال‌سازی اشتراک" />

            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-3xl font-bold mb-2">تکمیل پرداخت</h1>
                    <p className="text-muted-foreground">
                        مبلغ <span className="font-bold text-primary">{formatPrice(plan.price)} تومان</span> برای{" "}
                        <span className="font-bold">{plan.name}</span>
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Payment Methods */}
                    <div className="md:col-span-2">
                        <Card className="shadow-lg border-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Banknote className="w-5 h-5 text-primary" />
                                    روش پرداخت
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="card" onValueChange={(v) => setPaymentMethod(v as "card" | "crypto")}>
                                    <TabsList className="grid w-full grid-cols-3 mb-6">
                                        <TabsTrigger value="card" className="gap-2">
                                            <CreditCard className="w-4 h-4" />
                                            کارت به کارت
                                        </TabsTrigger>
                                        <TabsTrigger value="crypto" className="gap-2">
                                            <Bitcoin className="w-4 h-4" />
                                            رمزارز
                                        </TabsTrigger>
                                        <TabsTrigger value="gateway" disabled className="gap-2 relative">
                                            <Banknote className="w-4 h-4" />
                                            درگاه بانکی
                                            <Badge className="absolute -top-2 -left-2 text-[10px] bg-muted text-muted-foreground">
                                                به زودی
                                            </Badge>
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Card Payment */}
                                    <TabsContent value="card" className="space-y-6">
                                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />

                                            <div className="relative z-10">
                                                <p className="text-sm opacity-80 mb-4">شماره کارت</p>
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-2xl font-mono tracking-widest">{PAYMENT_INFO.card.number}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-white hover:bg-white/20"
                                                        onClick={() => copyToClipboard(PAYMENT_INFO.card.number)}
                                                    >
                                                        {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                                    </Button>
                                                </div>
                                                <div className="bg-white/10 rounded-lg px-3 py-2 mb-4">
                                                    <p className="text-xs opacity-70">شماره حساب (برای انتقال ساتنا/پایا)</p>
                                                    <p className="font-mono text-lg">{PAYMENT_INFO.card.accountNumber}</p>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <div>
                                                        <p className="opacity-70">صاحب حساب</p>
                                                        <p className="font-medium">{PAYMENT_INFO.card.owner}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="opacity-70">بانک</p>
                                                        <p className="font-medium">{PAYMENT_INFO.card.bank}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-medium text-amber-800 dark:text-amber-200">نکته مهم</p>
                                                <p className="text-amber-700 dark:text-amber-300">
                                                    پس از واریز، کد پیگیری تراکنش را در فرم زیر وارد کنید. فعال‌سازی حداکثر ۲ ساعت طول می‌کشد.
                                                </p>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Crypto Payment */}
                                    <TabsContent value="crypto" className="space-y-6">
                                        <div className="bg-gradient-to-br from-orange-500 to-yellow-600 text-white rounded-2xl p-6 shadow-xl">
                                            <p className="text-sm opacity-80 mb-2">آدرس کیف پول ({PAYMENT_INFO.crypto.network})</p>
                                            <div className="bg-white/10 backdrop-blur rounded-lg p-3 mb-4">
                                                <code className="text-sm break-all">{PAYMENT_INFO.crypto.address}</code>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm opacity-70">ارزهای قابل قبول</p>
                                                    <p className="font-bold">{PAYMENT_INFO.crypto.coin}</p>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(PAYMENT_INFO.crypto.address);
                                                        toast({ title: "آدرس کپی شد!" });
                                                    }}
                                                >
                                                    <Copy className="w-4 h-4 ml-2" />
                                                    کپی آدرس
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-medium text-blue-800 dark:text-blue-200">تبدیل قیمت</p>
                                                <p className="text-blue-700 dark:text-blue-300">
                                                    معادل تقریبی: حدود <strong>{Math.ceil(plan.price / 60000)} USDT</strong> (نرخ تقریبی ۶۰,۰۰۰ تومان)
                                                </p>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Gateway - Coming Soon */}
                                    <TabsContent value="gateway">
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>درگاه پرداخت بانکی به زودی فعال می‌شود.</p>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                <Separator className="my-6" />

                                {/* Tracking Code Form */}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="tracking">کد پیگیری / Transaction ID</Label>
                                        <Input
                                            id="tracking"
                                            placeholder="مثال: 123456789"
                                            value={trackingCode}
                                            onChange={(e) => setTrackingCode(e.target.value)}
                                            className="mt-2 text-lg h-12"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-base font-bold"
                                        disabled={submitPayment.isPending}
                                    >
                                        {submitPayment.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                ثبت پرداخت و فعال‌سازی
                                                <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="md:col-span-1">
                        <Card className="sticky top-24 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg">خلاصه سفارش</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">پلن انتخابی</span>
                                    <span className="font-medium">{plan.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">مدت اشتراک</span>
                                    <span>۳۰ روز</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>مبلغ قابل پرداخت</span>
                                    <span className="text-primary">{formatPrice(plan.price)} تومان</span>
                                </div>

                                <div className="pt-4 text-xs text-muted-foreground space-y-1">
                                    <p>✓ فعال‌سازی پس از تایید ادمین</p>
                                    <p>✓ پشتیبانی ۲۴ ساعته</p>
                                    <p>✓ ضمانت بازگشت وجه</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
