import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronLeft, AlertCircle, BookOpen, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

const sections = [
  {
    id: "grammar",
    title: "دستور زبان",
    icon: BookOpen,
    questions: [
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
      {
        id: 6,
        question: "By the time you arrive, I _______ dinner.",
        options: ["finish", "will finish", "will have finished", "have finished"],
        correct: "will have finished",
      },
      {
        id: 7,
        question: "She suggested that he _______ the meeting.",
        options: ["attends", "attend", "attended", "to attend"],
        correct: "attend",
      },
    ]
  },
  {
    id: "vocabulary",
    title: "واژگان",
    icon: Zap,
    questions: [
      {
        id: 8,
        question: "The weather is very _______, so I'll take an umbrella.",
        options: ["bright", "stormy", "calm", "clear"],
        correct: "stormy",
      },
      {
        id: 9,
        question: "He is a very _______ student who always completes his work on time.",
        options: ["lazy", "diligent", "careless", "absent"],
        correct: "diligent",
      },
      {
        id: 10,
        question: "The company decided to _______ its operations due to financial difficulties.",
        options: ["expand", "contract", "maintain", "duplicate"],
        correct: "contract",
      },
      {
        id: 11,
        question: "Her _______ attitude towards life helped her overcome many challenges.",
        options: ["negative", "pessimistic", "optimistic", "cynical"],
        correct: "optimistic",
      },
      {
        id: 12,
        question: "The _______ of the old building made it unsafe to enter.",
        options: ["structure", "deterioration", "foundation", "framework"],
        correct: "deterioration",
      },
      {
        id: 13,
        question: "He was _______ at being rejected from the university.",
        options: ["delighted", "furious", "indifferent", "amused"],
        correct: "furious",
      },
    ]
  },
  {
    id: "reading",
    title: "درک مطلب",
    icon: BookOpen,
    questions: [
      {
        id: 14,
        question: 'Read the passage: "Climate change is a serious global issue that affects weather patterns, sea levels, and ecosystems worldwide." What is the main topic?',
        options: ["Weather forecasting", "Global warming and its effects", "Sea level measurement", "Ecosystem types"],
        correct: "Global warming and its effects",
      },
      {
        id: 15,
        question: 'In the passage about climate change, what word best describes the severity of the issue?',
        options: ["minor", "serious", "uncertain", "debatable"],
        correct: "serious",
      },
      {
        id: 16,
        question: '"Technology has revolutionized the way we work and communicate." Based on this sentence, what is the effect of technology?',
        options: ["It has slowed our work", "It has made work impossible", "It has changed how we work and communicate", "It has no effect"],
        correct: "It has changed how we work and communicate",
      },
      {
        id: 17,
        question: '"The population of urban areas has increased dramatically over the past century." What does this suggest about city life?',
        options: ["Cities are becoming emptier", "More people are moving to cities", "People prefer rural areas", "Cities are shrinking"],
        correct: "More people are moving to cities",
      },
      {
        id: 18,
        question: '"Education is the most powerful tool to reduce poverty and inequality." What role does the author assign to education?',
        options: ["It is harmful", "It is unimportant", "It is powerful in reducing poverty", "It is only for the wealthy"],
        correct: "It is powerful in reducing poverty",
      },
      {
        id: 19,
        question: '"The Renaissance was a period of great artistic and intellectual achievement in Europe." Which century would this most likely refer to?',
        options: ["12th century", "14th-16th centuries", "18th century", "20th century"],
        correct: "14th-16th centuries",
      },
      {
        id: 20,
        question: '"Sustainable development requires balancing economic growth with environmental protection." What is essential for sustainable development?',
        options: ["Only economic growth", "Only environmental protection", "Both economic and environmental considerations", "Neither"],
        correct: "Both economic and environmental considerations",
      },
    ]
  }
];

type SectionKey = "grammar" | "vocabulary" | "reading";

export default function PlacementTest() {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<number, string>>>({});
  const [showResult, setShowResult] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-3xl p-10">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-50 mb-4">نیاز به ورود</h2>
          <p className="text-amber-800 dark:text-amber-200 mb-8">برای شرکت در آزمون تعیین سطح، لطفاً ابتدا وارد حساب کاربری خود شوید.</p>
          <Button onClick={() => setLocation("/auth")} size="lg" className="w-full rounded-xl">
            ورود / ثبت نام
          </Button>
        </div>
      </div>
    );
  }

  const currentSection = sections[sectionIndex];
  const currentQ = currentSection.questions[currentQuestion];

  const handleAnswer = (value: string) => {
    const sectionId = currentSection.id as SectionKey;
    setAnswers({
      ...answers,
      [sectionId]: { ...(answers[sectionId] || {}), [currentQuestion]: value }
    });
  };

  const handleNext = () => {
    if (currentQuestion < currentSection.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (sectionIndex < sections.length - 1) {
      setSectionIndex(sectionIndex + 1);
      setCurrentQuestion(0);
    } else {
      calculateResults();
    }
  };

  const calculateResults = () => {
    const newScores: Record<string, number> = {};
    sections.forEach((section) => {
      const sectionId = section.id as SectionKey;
      let correctCount = 0;
      section.questions.forEach((q, index) => {
        if (answers[sectionId]?.[index] === q.correct) {
          correctCount++;
        }
      });
      newScores[sectionId] = (correctCount / section.questions.length) * 100;
    });
    setScores(newScores);
    setShowResult(true);
  };

  const getOverallLevel = () => {
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
    if (avgScore <= 40) return { level: "مبتدی", text: "Beginner", color: "from-blue-500 to-blue-600" };
    if (avgScore <= 70) return { level: "متوسط", text: "Intermediate", color: "from-amber-500 to-amber-600" };
    return { level: "پیشرفته", text: "Advanced", color: "from-emerald-500 to-emerald-600" };
  };

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredQuestions = Object.values(answers).reduce((sum, section) => sum + Object.keys(section).length, 0);
  const progress = (answeredQuestions / totalQuestions) * 100;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      {!showResult ? (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">آزمون تعیین سطح</h1>
            <p className="text-muted-foreground">بخش {sectionIndex + 1} از {sections.length}: {currentSection.title}</p>
            <div className="mt-6">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{answeredQuestions} از {totalQuestions} سوال</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${sectionIndex}-${currentQuestion}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="rounded-2xl shadow-lg border-0 overflow-hidden">
                <div className="h-2 bg-muted w-full">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${((currentQuestion + 1) / currentSection.questions.length) * 100}%` }}
                  />
                </div>
                <CardContent className="p-8 md:p-12">
                  <div className="mb-8">
                    <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      سوال {currentQuestion + 1} از {currentSection.questions.length}
                    </span>
                    <h3 className="text-xl font-bold mt-6 leading-relaxed" style={{ direction: "ltr", textAlign: "left" }}>
                      {currentQ.question}
                    </h3>
                  </div>

                  <RadioGroup
                    onValueChange={handleAnswer}
                    value={answers[currentSection.id as SectionKey]?.[currentQuestion] || ""}
                    className="space-y-3"
                  >
                    {currentQ.options.map((option) => (
                      <div key={option} className="flex items-center gap-3" style={{ direction: "ltr" }}>
                        <RadioGroupItem
                          value={option}
                          id={`option-${option}-${currentQuestion}`}
                          className="peer"
                        />
                        <Label
                          htmlFor={`option-${option}-${currentQuestion}`}
                          className="flex-1 p-4 rounded-lg border-2 border-muted cursor-pointer hover:border-primary/50 hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all font-medium text-left"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="mt-10 flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (currentQuestion > 0) {
                          setCurrentQuestion(currentQuestion - 1);
                        } else if (sectionIndex > 0) {
                          setSectionIndex(sectionIndex - 1);
                          setCurrentQuestion(sections[sectionIndex - 1].questions.length - 1);
                        }
                      }}
                      disabled={sectionIndex === 0 && currentQuestion === 0}
                      className="rounded-lg"
                    >
                      <ChevronLeft className="ml-2 h-4 w-4" />
                      قبلی
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={!answers[currentSection.id as SectionKey]?.[currentQuestion]}
                      size="lg"
                      className="rounded-lg px-8"
                    >
                      {sectionIndex === sections.length - 1 && currentQuestion === currentSection.questions.length - 1 ? "مشاهده نتیجه" : "بعدی"}
                      <ChevronLeft className="mr-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-center overflow-hidden">
              <CardContent className="p-12 md:p-16">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-4xl font-bold mb-6">تبریک!</h2>
                <div className="inline-block bg-white/20 backdrop-blur-md rounded-2xl p-8 mb-10 border border-white/30">
                  <p className="text-sm uppercase tracking-wider opacity-80 mb-2">سطح تشخیص شده</p>
                  <p className="text-3xl font-bold mb-2">{getOverallLevel().level}</p>
                  <p className="text-sm opacity-80">{getOverallLevel().text}</p>
                </div>
                <p className="opacity-90 max-w-md mx-auto mb-6 leading-relaxed text-sm">
                  بر اساس پاسخ‌های شما در این آزمون جامع، سطح بالا تعیین شده است. شما می‌توانید از محتوای آموزشی مناسب استفاده کنید.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sections.map((section) => (
                <Card key={section.id} className="rounded-2xl border-0 shadow-md overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <section.icon className="w-6 h-6 text-primary" />
                      <h3 className="font-bold text-lg">{section.title}</h3>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {Math.round(scores[section.id] || 0)}%
                      </div>
                      <Progress value={scores[section.id] || 0} className="h-2 mb-2" />
                      <p className="text-xs text-muted-foreground">عملکرد شما</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="rounded-2xl border-0 shadow-md p-6 md:p-8 bg-muted/50">
              <h3 className="font-bold text-lg mb-4">نکات برای پیشرفت:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>روزانه حداقل 30 دقیقه زبان انگلیسی مطالعه کنید</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>از محتوای آموزشی مرتبط با سطح خود استفاده کنید</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>در کلاس‌های گروهی یا خصوصی شرکت کنید</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>پادکست‌ها و فیلم‌های آموزشی را منظم تماشا کنید</span>
                </li>
              </ul>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                size="lg"
                className="rounded-lg"
                onClick={() => {
                  setSectionIndex(0);
                  setCurrentQuestion(0);
                  setAnswers({});
                  setShowResult(false);
                }}
              >
                آزمون دوباره
              </Button>
              <Button
                size="lg"
                className="rounded-lg"
                onClick={() => setLocation("/content")}
              >
                مشاهده مطالب آموزشی
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
