import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, Sparkles } from "lucide-react";

const plans = [
    {
        id: "bronze",
        name: "برنزی",
        nameEn: "Bronze",
        price: 299000,
        originalPrice: 450000,
        duration: "ماهانه",
        icon: Star,
        color: "from-amber-600 to-amber-800",
        popular: false,
        features: [
            "دسترسی به دروس ویدیویی پایه",
            "مقالات آموزشی رایگان",
            "تست‌های تعیین سطح",
            "پشتیبانی ایمیلی",
        ],
        limitations: [
            "بدون دسترسی به کلاس‌های گروهی",
            "بدون جلسه مشاوره",
        ]
    },
    {
        id: "silver",
        name: "نقره‌ای",
        nameEn: "Silver",
        price: 599000,
        originalPrice: 900000,
        duration: "ماهانه",
        icon: Zap,
        color: "from-slate-400 to-slate-600",
        popular: true,
        features: [
            "همه امکانات پلن برنزی",
            "دسترسی به کلاس‌های گروهی هفتگی",
            "۱ جلسه مشاوره خصوصی در ماه",
            "دانلود فایل‌های صوتی",
            "گروه تلگرام VIP",
        ],
        limitations: []
    },
    {
        id: "gold",
        name: "طلایی",
        nameEn: "Gold",
        price: 1299000,
        originalPrice: 1800000,
        duration: "ماهانه",
        icon: Crown,
        color: "from-yellow-500 to-amber-600",
        popular: false,
        features: [
            "همه امکانات پلن نقره‌ای",
            "کلاس‌های گروهی نامحدود",
            "۴ جلسه مشاوره خصوصی در ماه",
            "بررسی رایتینگ توسط مدرس",
            "دسترسی زودتر به محتوای جدید",
            "گواهینامه پایان دوره",
        ],
        limitations: []
    }
];

export default function Pricing() {
    const [, navigate] = useLocation();

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background py-20">
            <SEO
                title="پلن‌های اشتراک"
                description="با انتخاب پلن مناسب، سریع‌تر انگلیسی یاد بگیرید. پلن‌های ماهانه با امکانات متنوع."
            />

            {/* Hero */}
            <div className="container mx-auto px-4 text-center mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1">
                        <Sparkles className="w-4 h-4 ml-2 inline" />
                        ۳۰٪ تخفیف ویژه بهمن‌ماه
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black mb-6 gradient-text">
                        پلن مناسب خودتان را انتخاب کنید
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        هر پلنی که انتخاب کنید، ما همراه شما هستیم تا به اهدافتان برسید.
                        <br />
                        <span className="text-primary font-semibold">لغو اشتراک هر زمان بدون جریمه.</span>
                    </p>
                </motion.div>
            </div>

            {/* Pricing Cards */}
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.15 }}
                            className={plan.popular ? "md:-mt-4 md:mb-4" : ""}
                        >
                            <Card className={`relative overflow-hidden border-2 h-full flex flex-col ${plan.popular ? 'border-primary shadow-2xl shadow-primary/20' : 'border-border/50 hover:border-primary/30'} transition-all duration-300`}>
                                {plan.popular && (
                                    <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-2 text-sm font-bold">
                                        🔥 محبوب‌ترین انتخاب
                                    </div>
                                )}

                                <CardHeader className={`text-center pt-${plan.popular ? '14' : '8'} pb-6`}>
                                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                                        <plan.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                                    <p className="text-sm text-muted-foreground">{plan.nameEn}</p>
                                </CardHeader>

                                <CardContent className="flex-1 px-6">
                                    {/* Price */}
                                    <div className="text-center mb-8">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <span className="text-muted-foreground line-through text-lg">
                                                {formatPrice(plan.originalPrice)}
                                            </span>
                                            <Badge variant="destructive" className="text-xs">
                                                تخفیف
                                            </Badge>
                                        </div>
                                        <div className="flex items-baseline justify-center gap-1">
                                            <span className="text-4xl font-black text-foreground">
                                                {formatPrice(plan.price)}
                                            </span>
                                            <span className="text-muted-foreground">تومان</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">{plan.duration}</p>
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-3 mb-6">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm">
                                                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                        {plan.limitations.map((limit, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground/60">
                                                <span className="w-5 h-5 text-center shrink-0">✕</span>
                                                <span className="line-through">{limit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <CardFooter className="p-6 pt-0">
                                    <Button
                                        className={`w-full h-12 text-base font-bold ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                                        variant={plan.popular ? "default" : "outline"}
                                        onClick={() => navigate(`/payment/checkout?plan=${plan.id}&amount=${plan.price}`)}
                                    >
                                        انتخاب پلن {plan.name}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Trust Badges */}
            <div className="container mx-auto px-4 mt-16">
                <div className="flex flex-wrap justify-center gap-8 text-muted-foreground text-sm">
                    <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        پرداخت امن
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        پشتیبانی ۲۴/۷
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        ضمانت بازگشت وجه
                    </div>
                </div>
            </div>

            {/* FAQ Teaser */}
            <div className="container mx-auto px-4 mt-20 text-center">
                <p className="text-muted-foreground">
                    سوالی دارید؟{" "}
                    <button onClick={() => navigate("/contact")} className="text-primary font-medium hover:underline">
                        با ما تماس بگیرید
                    </button>
                </p>
            </div>
        </div>
    );
}
