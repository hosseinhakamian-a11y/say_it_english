import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Check, Star, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Plan {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    features: string[];
}

export default function Pricing() {
    const { data: plans, isLoading } = useQuery<Plan[]>({
        queryKey: ["/api/payment/plans"],
    });

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 max-w-5xl py-12 space-y-8">
                <div className="text-center space-y-4">
                    <div className="h-10 w-48 bg-muted rounded mx-auto animate-pulse" />
                    <div className="h-4 w-96 bg-muted rounded mx-auto animate-pulse" />
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-96 bg-muted rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-5xl py-12 space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    اشتراک ویژه Say It English
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    با تهیه اشتراک، به تمامی ویدیوها، آزمون‌ها و امکانات پیشرفته دسترسی نامحدود داشته باشید.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-start">
                {plans?.map((plan) => {
                    const isPopular = plan.id === 'silver';
                    return (
                        <Card
                            key={plan.id}
                            className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${isPopular
                                    ? 'border-primary shadow-lg scale-105 z-10'
                                    : 'border-muted hover:border-primary/50'
                                }`}
                        >
                            {isPopular && (
                                <div className="absolute top-0 right-0 left-0 bg-primary text-primary-foreground text-center text-sm font-bold py-1">
                                    محبوب‌ترین
                                </div>
                            )}

                            <CardHeader className={`${isPopular ? 'pt-10' : ''} text-center space-y-2`}>
                                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                <CardDescription>
                                    دسترسی {plan.durationDays} روزه
                                </CardDescription>
                                <div className="pt-4">
                                    <span className="text-4xl font-black text-foreground">
                                        {plan.price.toLocaleString()}
                                    </span>
                                    <span className="text-muted-foreground mr-1">تومان</span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <ul className="space-y-3">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm">
                                            <div className={`rounded-full p-1 ${isPopular ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                <Check className="h-3 w-3" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Link href={`/checkout?planId=${plan.id}`} className="w-full">
                                    <Button
                                        className="w-full font-bold"
                                        variant={isPopular ? "default" : "outline"}
                                        size="lg"
                                    >
                                        {isPopular ? "انتخاب طرح" : "انتخاب"}
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <div className="text-center bg-muted/30 rounded-2xl p-8 border border-muted">
                <h3 className="text-lg font-bold mb-4 flex items-center justify-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    تضامین ما
                </h3>
                <p className="text-muted-foreground">
                    تمامی پرداخت‌ها از طریق درگاه امن زرین‌پال انجام می‌شود. در صورت عدم رضایت تا ۷ روز، مبلغ پرداختی عودت داده می‌شود.
                </p>
            </div>
        </div>
    );
}
