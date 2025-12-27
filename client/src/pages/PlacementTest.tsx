import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronLeft, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

const questions = [
  {
    id: 1,
    question: "I _______ very happy to see you.",
    options: ["am", "is", "are", "be"],
    correct: "am",
  },
  {
    id: 2,
    question: "She _______ to the gym every morning.",
    options: ["go", "goes", "going", "gone"],
    correct: "goes",
  },
  {
    id: 3,
    question: "They _______ finished their homework yet.",
    options: ["haven't", "hasn't", "didn't", "don't"],
    correct: "haven't",
  },
  {
    id: 4,
    question: "If I _______ you, I would accept the offer.",
    options: ["was", "am", "were", "be"],
    correct: "were",
  },
  {
    id: 5,
    question: "The book _______ was written by Hemingway is famous.",
    options: ["who", "which", "where", "whose"],
    correct: "which",
  },
];

export default function PlacementTest() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-10">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-amber-900 mb-4">نیاز به ورود</h2>
          <p className="text-amber-800 mb-8">برای شرکت در آزمون تعیین سطح، لطفاً ابتدا وارد حساب کاربری خود شوید.</p>
          <Button onClick={() => setLocation("/auth")} size="lg" className="w-full rounded-xl">
            ورود / ثبت نام
          </Button>
        </div>
      </div>
    );
  }

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    let correctCount = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correct) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setShowResult(true);
    // Here you would typically send the result to the backend to update user level
  };

  const getLevel = (score: number) => {
    if (score <= 2) return "Mubtadi (Beginner)";
    if (score <= 4) return "Mutavaset (Intermediate)";
    return "Pishrafte (Advanced)";
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">آزمون تعیین سطح</h1>
        <p className="text-muted-foreground">با پاسخ به سوالات زیر، سطح زبان انگلیسی خود را بسنجید.</p>
      </div>

      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div
            key="question"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="rounded-[2rem] shadow-xl border-0 overflow-hidden">
              <div className="h-2 bg-muted w-full">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} 
                />
              </div>
              <CardContent className="p-8 md:p-12">
                <div className="mb-8">
                  <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    سوال {currentQuestion + 1} از {questions.length}
                  </span>
                  <h3 className="text-2xl font-bold mt-6 dir-ltr text-left" style={{ direction: "ltr" }}>
                    {questions[currentQuestion].question}
                  </h3>
                </div>

                <RadioGroup 
                  onValueChange={handleAnswer} 
                  value={answers[currentQuestion]}
                  className="space-y-4"
                >
                  {questions[currentQuestion].options.map((option) => (
                    <div key={option} className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem 
                        value={option} 
                        id={`option-${option}`}
                        className="peer sr-only" 
                      />
                      <Label
                        htmlFor={`option-${option}`}
                        className="flex-1 p-4 rounded-xl border-2 border-muted cursor-pointer hover:border-primary/50 hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all text-lg font-medium text-left dir-ltr"
                        style={{ direction: "ltr" }}
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="mt-10 flex justify-end">
                  <Button 
                    onClick={handleNext} 
                    disabled={!answers[currentQuestion]}
                    size="lg"
                    className="rounded-xl px-8"
                  >
                    {currentQuestion === questions.length - 1 ? "مشاهده نتیجه" : "سوال بعدی"}
                    <ChevronLeft className="mr-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="rounded-[2rem] shadow-xl border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-center overflow-hidden">
              <CardContent className="p-12 md:p-16">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-4xl font-bold mb-4">نتیجه آزمون</h2>
                <div className="text-6xl font-black mb-6 tracking-tight">
                  {score} <span className="text-2xl font-medium opacity-80">/ {questions.length}</span>
                </div>
                <div className="inline-block bg-white/20 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/30">
                  <p className="text-sm uppercase tracking-wider opacity-80 mb-2">سطح پیشنهادی</p>
                  <p className="text-2xl font-bold">{getLevel(score)}</p>
                </div>
                <p className="opacity-90 max-w-md mx-auto mb-10 leading-relaxed">
                  بر اساس پاسخ‌های شما، این سطح برای شروع یادگیری مناسب است. می‌توانید از بخش محتوای آموزشی مطالب مرتبط را مشاهده کنید.
                </p>
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="rounded-xl text-primary font-bold bg-white hover:bg-white/90"
                    onClick={() => setLocation("/content")}
                  >
                    مشاهده مطالب آموزشی
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
