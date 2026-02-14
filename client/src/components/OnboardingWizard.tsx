import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookOpen, PlayCircle, Trophy, ArrowLeft, Sparkles } from "lucide-react";

const steps = [
    {
        icon: PlayCircle,
        title: "ویدیوهای آموزشی",
        description: "با ویدیوهای کاربردی، هر روز یه قدم به زبان انگلیسی نزدیک‌تر شو.",
        color: "from-blue-500 to-cyan-500",
    },
    {
        icon: BookOpen,
        title: "لغات و آزمون",
        description: "لغات کلیدی هر درس رو ذخیره کن و با آزمون‌ها دانشتو بسنج.",
        color: "from-green-500 to-emerald-500",
    },
    {
        icon: Trophy,
        title: "چالش و رقابت",
        description: "با چالش‌های هفتگی XP جمع کن و در جدول لیدربورد بدرخش!",
        color: "from-purple-500 to-pink-500",
    },
];

export function OnboardingWizard() {
    const [show, setShow] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const seen = localStorage.getItem("onboarding_done");
        if (!seen) setShow(true);
    }, []);

    const finish = () => {
        localStorage.setItem("onboarding_done", "true");
        setShow(false);
    };

    if (!show) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.3 }}
                    className="bg-card rounded-3xl shadow-2xl border max-w-md w-full overflow-hidden"
                >
                    {/* Header Gradient */}
                    <div className={`bg-gradient-to-br ${steps[step].color} p-8 text-white text-center`}>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
                        >
                            {(() => {
                                const Icon = steps[step].icon;
                                return <Icon className="h-10 w-10" />;
                            })()}
                        </motion.div>
                        <h2 className="text-2xl font-bold">{steps[step].title}</h2>
                    </div>

                    {/* Body */}
                    <div className="p-6 text-center space-y-6">
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            {steps[step].description}
                        </p>

                        {/* Step Indicators */}
                        <div className="flex justify-center gap-2">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-2 rounded-full transition-all duration-300 ${idx === step ? "w-8 bg-primary" : "w-2 bg-muted"
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            {step < steps.length - 1 ? (
                                <>
                                    <Button variant="ghost" onClick={finish} className="flex-1 text-muted-foreground">
                                        رد کردن
                                    </Button>
                                    <Button onClick={() => setStep(step + 1)} className="flex-1 gap-2">
                                        بعدی
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={finish} className="w-full gap-2 text-lg h-12">
                                    <Sparkles className="h-5 w-5" />
                                    شروع یادگیری!
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
