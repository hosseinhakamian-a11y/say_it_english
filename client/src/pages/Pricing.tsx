import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Star, Zap, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function Pricing() {
    const [, navigate] = useLocation();

    const plans = [
        {
            name: "دوره خودآموز",
            description: "یادگیری با سرعت خودتان",
            price: "۲,۹۰۰,۰۰۰",
            period: "یکبار پرداخت",
            icon: <Star className="w-6 h-6 text-blue-500" />,
            features: [
                "دسترسی نامحدود به ویدیوهای دوره",
                "فایل‌های تمرینی PDF",
                "ویدیو پلیر هوشمند",
                "دسترسی همیشگی",
                "بدون پشتیبانی مستقیم مدرس",
            ],
            cta: "خرید دوره",
            popular: false,
            action: () => navigate("/shop"),
            color: "blue"
        },
        {
            name: "کلاس خصوصی",
            description: "یادگیری تعاملی و سریع",
            price: "۴۵۰,۰۰۰",
            period: "هر جلسه",
            icon: <Zap className="w-6 h-6 text-amber-500" />,
            features: [
                "تعیین سطح دقیق و رایگان",
                "برنامه آموزشی اختصاصی",
                "تمرین مکالمه زنده",
                "تصحیح اشتباهات در لحظه",
                "پشتیبانی واتساپ",
            ],
            cta: "رزرو کلاس",
            popular: true,
            action: () => navigate("/bookings"),
            color: "amber"
        },
        {
            name: "مشاوره مهاجرت",
            description: "نقشه راه اختصاصی شما",
            price: "۸۰۰,۰۰۰",
            period: "هر جلسه",
            icon: <Crown className="w-6 h-6 text-purple-500" />,
            features: [
                "بررسی شرایط زبانی مهاجرت",
                "معرفی منابع آزمون آیلتس/تافل",
                "برنامه‌ریزی فشرده ۶ ماهه",
                "مصاحبه ماک (Mock)",
                "ضبط جلسه مشاوره"
            ],
            cta: "درخواست مشاوره",
            popular: false,
            action: () => navigate("/bookings"),
            color: "purple"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background py-20 px-4">
            <div className="container mx-auto max-w-6xl">

                <div className="text-center mb-16 space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-extrabold gradient-text"
                    >
                        سرمایه‌گذاری روی آینده
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground max-w-2xl mx-auto"
                    >
                        بهترین روش یادگیری را متناسب با هدف و زمان خود انتخاب کنید
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.2 }}
                            className="relative"
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 right-0 left-0 flex justify-center z-10">
                                    <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                        پیشنهاد ویژه
                                    </span>
                                </div>
                            )}

                            <Card className={`h-full flex flex-col hover:shadow-xl transition-all duration-300 border-2 ${plan.popular ? 'border-amber-500/50 shadow-amber-500/10' : 'border-transparent hover:border-primary/20'
                                }`}>
                                <CardHeader className="text-center pb-2">
                                    <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-${plan.color}-500/10`}>
                                        {plan.icon}
                                    </div>
                                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                                </CardHeader>

                                <CardContent className="flex-1 flex flex-col pt-6">
                                    <div className="text-center mb-8">
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="text-3xl font-black">{plan.price}</span>
                                            <span className="text-sm text-muted-foreground">تومان</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md mt-2 inline-block">
                                            {plan.period}
                                        </span>
                                    </div>

                                    <ul className="space-y-4 mb-8 flex-1">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm">
                                                <CheckCircle2 className={`w-5 h-5 shrink-0 text-${plan.color}-500/80`} />
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        className={`w-full py-6 text-lg font-bold shadow-lg shadow-${plan.color}-500/20`}
                                        variant={plan.popular ? "default" : "outline"}
                                        onClick={plan.action}
                                    >
                                        {plan.cta}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20 text-center bg-muted/30 p-8 rounded-3xl border border-dashed border-primary/20">
                    <h3 className="text-xl font-bold mb-4">سوالات بیشتری دارید؟</h3>
                    <p className="text-muted-foreground mb-6">
                        تیم پشتیبانی ما آماده پاسخگویی به سوالات شما درباره انتخاب بهترین مسیر یادگیری است.
                    </p>
                    <Button variant="link" onClick={() => navigate("/contact")} className="text-primary font-bold">
                        تماس با ما &rarr;
                    </Button>
                </div>
            </div>
        </div>
    );
}
