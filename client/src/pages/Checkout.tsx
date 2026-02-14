import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, ArrowRight, Tag, ShieldCheck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

    // Fetch plans
    const { data: plans, isLoading } = useQuery<Plan[]>({
        queryKey: ["/api/payment/plans"],
    });

    const selectedPlan = plans?.find(p => p.id === planId);

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

    // Request Payment Mutation
    const paymentMutation = useMutation({
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
        <div className="container mx-auto p-4 max-w-2xl py-12">
            <Button variant="ghost" onClick={() => setLocation("/pricing")} className="mb-6 gap-2">
                <ArrowRight className="h-4 w-4" />
                بازگشت
            </Button>

            <Card className="border-2 border-primary/20 shadow-xl">
                <CardHeader className="bg-muted/30 pb-8">
                    <CardTitle>تکمیل خرید</CardTitle>
                    <CardDescription>جزئیات سفارش خود را بررسی کنید</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="flex justify-between items-center text-lg font-medium">
                        <span>طرح انتخابی:</span>
                        <span className="font-bold text-primary">{selectedPlan.name} ({selectedPlan.durationDays} روزه)</span>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                            <span>مبلغ پایه:</span>
                            <span>{selectedPlan.price.toLocaleString()} تومان</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-green-600 font-medium">
                                <span>تخفیف ({discount}%):</span>
                                <span>- {Math.round(selectedPlan.price * (discount / 100)).toLocaleString()} تومان</span>
                            </div>
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between text-xl font-black">
                            <span>مبلغ قابل پرداخت:</span>
                            <span>{finalPrice.toLocaleString()} تومان</span>
                        </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            کد تخفیف دارید؟
                        </label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="nawrooz1404"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                                disabled={!!appliedPromo}
                            />
                            {appliedPromo ? (
                                <Button variant="destructive" onClick={() => { setAppliedPromo(null); setDiscount(0); setPromoCode(""); }}>
                                    حذف
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
                </CardContent>
                <CardFooter className="flex-col gap-4 bg-muted/10 pt-6">
                    <Button
                        className="w-full text-lg h-12 gap-2"
                        onClick={() => paymentMutation.mutate()}
                        disabled={paymentMutation.isPending}
                    >
                        {paymentMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                        پرداخت آنلاین
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                        <ShieldCheck className="h-3 w-3" />
                        پرداخت امن زرین‌پال با ضمانت بازگشت وجه
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
