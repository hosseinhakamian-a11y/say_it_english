import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, ArrowRight, Tag, ShieldCheck, CreditCard, Coins, Banknote, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SiBinance } from "react-icons/si";

// Payment Info
const BANK_CARD = "6104-3379-6429-8218";
const BANK_NAME = "بانک ملت";
const CARD_HOLDER = "Say It English";
const CRYPTO_WALLET = "0x2ca84105e9e3f3a91f0385acbd497923d743a342";
const CRYPTO_NETWORK = "BEP20 (BNB Smart Chain)";

interface Plan {
    id: string;
    name: string;
    price: number;
    durationDays: number;
}

export default function Checkout() {
    const [location, setLocation] = useLocation();
    const searchParams = new URLSearchParams(window.location.search);
    const planId = searchParams.get("planId");
    const { toast } = useToast();

    const [promoCode, setPromoCode] = useState("");
    const [discount, setDiscount] = useState(0);
    const [appliedPromo, setAppliedPromo] = useState<any>(null);

    const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto" | "gateway">("card");
    const [trackingCode, setTrackingCode] = useState("");
    const [transactionHash, setTransactionHash] = useState("");
    const [copied, setCopied] = useState(false);
    const [copiedWallet, setCopiedWallet] = useState(false);

    // Fetch plans
    const { data: plans, isLoading } = useQuery<Plan[]>({
        queryKey: ["/api/payment/plans"],
    });

    const selectedPlan = plans?.find(p => p.id === planId);

    const copyCardNumber = () => {
        navigator.clipboard.writeText(BANK_CARD.replace(/-/g, ""));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "شماره کارت کپی شد 📋" });
    };

    const copyWalletAddress = () => {
        navigator.clipboard.writeText(CRYPTO_WALLET);
        setCopiedWallet(true);
        setTimeout(() => setCopiedWallet(false), 2000);
        toast({ title: "آدرس ولت کپی شد 📋" });
    };

    // Validate Promo Mutation
    const validatePromoMutation = useMutation({
        mutationFn: async (code: string) => {
            const res = await apiRequest("POST", "/api/promo/validate", { code });
            return await res.json();
        },
        onSuccess: (data) => {
            setAppliedPromo(data);
            setDiscount(data.discountPercent);
            toast({ title: "کد تخفیف اعمال شد", description: `${data.discountPercent}% تخفیف روی مبلغ نهایی.` });
        },
        onError: (err: any) => {
            setAppliedPromo(null);
            setDiscount(0);
            toast({ title: "خطا", description: err.message || "کد تخفیف نامعتبر است", variant: "destructive" });
        }
    });

    // Request Payment Mutation (Online)
    const onlinePaymentMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/payment/request", {
                planId,
                promoCode: appliedPromo?.code
            });
            return await res.json();
        },
        onSuccess: (data) => {
            if (data.url) {
                window.location.href = data.url;
            }
        },
        onError: (err: any) => {
            toast({ title: "خطا در پرداخت", description: err.message, variant: "destructive" });
        }
    });

    // Manual Payment Mutation (Card/Crypto)
    const manualPaymentMutation = useMutation({
        mutationFn: async () => {
            const finalPrice = Math.round(selectedPlan!.price * (1 - discount / 100));

            const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contentId: 0, // 0 for subscription/plan
                    amount: finalPrice,
                    paymentMethod,
                    trackingCode: paymentMethod === "card" ? trackingCode : null,
                    transactionHash: paymentMethod === "crypto" ? transactionHash : null,
                    notes: `Subscription Plan: ${selectedPlan!.name} (${selectedPlan!.id})`
                }),
            });
            if (!res.ok) throw new Error("Failed to submit payment");
            return await res.json();
        },
        onSuccess: () => {
            toast({
                title: "درخواست پرداخت ثبت شد ✅",
                description: "پس از تأیید ادمین، اشتراک شما فعال خواهد شد.",
            });
            setLocation("/dashboard?payment=pending");
        },
        onError: () => {
            toast({
                title: "خطا در ثبت درخواست ❌",
                variant: "destructive",
            });
        },
    });

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    if (!selectedPlan) {
        return (
            <div className="container p-12 text-center">
                <h2 className="text-xl font-bold text-destructive">طرح انتخابی نامعتبر است.</h2>
                <Button variant="link" onClick={() => setLocation("/pricing")}>بازگشت به لیست قیمت‌ها</Button>
            </div>
        );
    }

    const finalPrice = Math.round(selectedPlan.price * (1 - discount / 100));

    return (
        <div className="container mx-auto p-4 max-w-3xl py-12">
            <Button variant="ghost" onClick={() => setLocation("/pricing")} className="mb-6 gap-2">
                <ArrowRight className="h-4 w-4" />
                بازگشت
            </Button>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-lg border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Banknote className="w-5 h-5 text-primary" />
                                روش پرداخت
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                                <TabsList className="grid w-full grid-cols-3 mb-6">
                                    <TabsTrigger value="card" className="gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        کارت به کارت
                                    </TabsTrigger>
                                    <TabsTrigger value="crypto" className="gap-2">
                                        <Coins className="w-4 h-4" />
                                        رمز ارز
                                    </TabsTrigger>
                                    <TabsTrigger value="gateway" disabled className="gap-2 relative opacity-80">
                                        <ShieldCheck className="w-4 h-4" />
                                        آنلاین
                                        <Badge className="absolute -top-2 -left-2 text-[10px] px-1.5 py-0.5 pointer-events-none">
                                            به‌زودی
                                        </Badge>
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="card" className="space-y-6">
                                    <div className="p-4 bg-muted/40 rounded-xl border space-y-4">
                                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            اطلاعات کارت بانکی
                                        </h3>

                                        <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                                            <div>
                                                <p className="text-sm text-muted-foreground">شماره کارت</p>
                                                <p className="text-xl font-mono font-bold tracking-wider text-foreground" dir="ltr">{BANK_CARD}</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={copyCardNumber}>
                                                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="p-3 bg-card rounded-lg border">
                                                <p className="text-muted-foreground">نام بانک</p>
                                                <p className="font-medium text-foreground">{BANK_NAME}</p>
                                            </div>
                                            <div className="p-3 bg-card rounded-lg border">
                                                <p className="text-muted-foreground">نام صاحب حساب</p>
                                                <p className="font-medium text-foreground">{CARD_HOLDER}</p>
                                            </div>
                                        </div>
                                    </div>

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

                                    {/* Instructions */}
                                    <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm space-y-2">
                                        <p className="font-semibold">راهنمای پرداخت:</p>
                                        <ol className="list-decimal list-inside space-y-1 mr-2">
                                            <li>مبلغ را به کارت بالا واریز کنید.</li>
                                            <li>کد رهگیری را در کادر بالا وارد کنید.</li>
                                            <li>دکمه ثبت درخواست را بزنید.</li>
                                        </ol>
                                    </div>

                                    <Button
                                        className="w-full py-6 text-lg"
                                        disabled={!trackingCode.trim() || manualPaymentMutation.isPending}
                                        onClick={() => manualPaymentMutation.mutate()}
                                    >
                                        {manualPaymentMutation.isPending ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : "ثبت درخواست بررسی"}
                                    </Button>
                                </TabsContent>

                                <TabsContent value="crypto" className="space-y-6">
                                    <div className="p-4 bg-muted/40 rounded-xl border space-y-4">
                                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                                            <SiBinance className="h-5 w-5 text-yellow-500" />
                                            پرداخت USDT (شبکه BEP20)
                                        </h3>

                                        <div className="p-3 bg-card rounded-lg border">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm text-muted-foreground">آدرس ولت (BEP20)</p>
                                                <Button variant="outline" size="sm" onClick={copyWalletAddress}>
                                                    {copiedWallet ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <p className="text-xs font-mono break-all font-bold tracking-tight bg-muted p-2 rounded text-foreground" dir="ltr">
                                                {CRYPTO_WALLET}
                                            </p>
                                        </div>

                                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-800 italic text-xs text-blue-700 dark:text-blue-300">
                                            ⚠️ لطفا فقط USDT روی شبکه {CRYPTO_NETWORK} ارسال کنید.
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="transactionHash" className="text-base font-medium">
                                            هش تراکنش (Transaction ID / TxID)
                                        </Label>
                                        <Input
                                            id="transactionHash"
                                            placeholder="0x..."
                                            value={transactionHash}
                                            onChange={(e) => setTransactionHash(e.target.value)}
                                            className="text-lg py-6"
                                            dir="ltr"
                                        />
                                    </div>

                                    <Button
                                        className="w-full py-6 text-lg"
                                        disabled={!transactionHash.trim() || manualPaymentMutation.isPending}
                                        onClick={() => manualPaymentMutation.mutate()}
                                    >
                                        {manualPaymentMutation.isPending ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : "ثبت درخواست بررسی"}
                                    </Button>
                                </TabsContent>

                                <TabsContent value="gateway" className="space-y-4">
                                    <div className="text-center py-12 text-muted-foreground">
                                        <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>درگاه پرداخت آنلاین در حال بروزرسانی و فعال‌سازی است.</p>
                                        <p className="text-sm mt-2">لطفاً از روش‌های کارت به کارت یا رمز ارز استفاده کنید.</p>
                                    </div>
                                    <Button
                                        className="w-full text-lg h-12 gap-2"
                                        onClick={() => onlinePaymentMutation.mutate()}
                                        disabled={true} // Explicitly disabled
                                    >
                                        {onlinePaymentMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                                        پرداخت آنلاین (غیرفعال)
                                    </Button>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-1">
                    <Card className="border-2 border-primary/20 shadow-xl sticky top-24">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-base">خلاصه سفارش</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span>طرح انتخابی:</span>
                                <span className="font-bold text-primary">{selectedPlan.name}</span>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between text-muted-foreground text-sm">
                                    <span>مبلغ پایه:</span>
                                    <span>{selectedPlan.price.toLocaleString()} تومان</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium text-sm">
                                        <span>تخفیف ({discount}%):</span>
                                        <span>- {Math.round(selectedPlan.price * (discount / 100)).toLocaleString()} تومان</span>
                                    </div>
                                )}
                                <Separator className="my-2" />
                                <div className="flex justify-between text-lg font-black">
                                    <span>مبلغ قابل پرداخت:</span>
                                    <span>{finalPrice.toLocaleString()} تومان</span>
                                </div>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Tag className="h-4 w-4" />
                                    کد تخفیف
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="kodetakhfif"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        disabled={!!appliedPromo}
                                        className="text-center"
                                    />
                                    {appliedPromo ? (
                                        <Button variant="destructive" size="icon" onClick={() => { setAppliedPromo(null); setDiscount(0); setPromoCode(""); }}>
                                            &times;
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            onClick={() => validatePromoMutation.mutate(promoCode)}
                                            disabled={!promoCode || validatePromoMutation.isPending}
                                        >
                                            {validatePromoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "اعمال"}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground text-center">
                                <ShieldCheck className="h-3 w-3 inline-block mr-1" />
                                ضمانت بازگشت وجه تا ۷ روز
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


