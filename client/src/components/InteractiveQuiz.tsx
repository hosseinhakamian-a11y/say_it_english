
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trophy, ArrowRight, RotateCcw, HelpCircle, Lock } from "lucide-react";

interface QuizQuestion {
    question: string;
    options: string[];
    answer: number; // index of correct option
}

interface InteractiveQuizProps {
    questions: QuizQuestion[];
    hasFullAccess: boolean;
}

export function InteractiveQuiz({ questions, hasFullAccess }: InteractiveQuizProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);

    const currentQuestion = questions[currentStep];

    const handleOptionSelect = (idx: number) => {
        if (isAnswered) return;
        setSelectedOption(idx);
    };

    const handleCheckAnswer = () => {
        if (selectedOption === null) return;

        const isCorrect = selectedOption === currentQuestion.answer;
        if (isCorrect) {
            setScore(prev => prev + 1);
        }
        setIsAnswered(true);
    };

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setShowResult(true);
        }
    };

    const handleRestart = () => {
        setCurrentStep(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);
        setShowResult(false);
    };

    if (!questions || questions.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>آزمونی برای این درس ثبت نشده است.</p>
            </div>
        );
    }

    if (showResult) {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl border border-primary/20 shadow-xl"
            >
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-black mb-2">نتیجه آزمون!</h3>
                <p className="text-muted-foreground mb-6">
                    شما به {score} از {questions.length} سوال پاسخ صحیح دادید.
                </p>

                <div className="flex justify-center items-end gap-2 mb-8">
                    <span className="text-5xl font-black text-primary">{percentage}%</span>
                    <span className="text-sm font-bold text-muted-foreground mb-2">امتیاز نهایی</span>
                </div>

                <div className="w-full bg-muted h-3 rounded-full mb-8 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-primary h-full"
                    />
                </div>

                <Button onClick={handleRestart} className="rounded-xl gap-2 h-12 px-8 btn-press">
                    <RotateCcw className="w-4 h-4" />
                    تلاش مجدد
                </Button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header / Progress */}
            <div className="flex items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">سوال {currentStep + 1} از {questions.length}</span>
                </div>
                <div className="flex-1 max-w-[200px] h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                    <h4 className="text-xl font-bold leading-relaxed">{currentQuestion.question}</h4>

                    <div className="grid gap-3">
                        {currentQuestion.options.map((opt, idx) => {
                            const isSelected = selectedOption === idx;
                            const isCorrect = idx === currentQuestion.answer;
                            const isWrongAttempt = isAnswered && isSelected && !isCorrect;

                            let variantStyles = "border hover:border-primary/50 hover:bg-primary/5";
                            if (isSelected) variantStyles = "border-2 border-primary bg-primary/5";
                            if (isAnswered && isCorrect) variantStyles = "border-2 border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
                            if (isWrongAttempt) variantStyles = "border-2 border-red-500 bg-red-500/10 text-red-700 dark:text-red-400";

                            return (
                                <motion.div
                                    key={idx}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleOptionSelect(idx)}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between group ${variantStyles} ${isAnswered && !isSelected && !isCorrect ? "opacity-40 grayscale" : ""}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-colors ${isSelected ? "bg-primary text-white border-primary" : "border-border/60 group-hover:border-primary/40"}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className="font-medium">{opt}</span>
                                    </div>

                                    {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                    {isAnswered && isWrongAttempt && <XCircle className="w-5 h-5 text-red-500" />}
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Footer / Controls */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                {!isAnswered ? (
                    <Button
                        disabled={selectedOption === null}
                        onClick={handleCheckAnswer}
                        className="rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20"
                    >
                        بررسی پاسخ
                    </Button>
                ) : (
                    <Button
                        onClick={handleNext}
                        className="rounded-xl px-8 h-12 font-bold bg-primary text-white hover:bg-primary/90 gap-2"
                    >
                        {currentStep < questions.length - 1 ? "سوال بعدی" : "مشاهده نتیجه"}
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                )}
            </div>
        </div>
    );
}

