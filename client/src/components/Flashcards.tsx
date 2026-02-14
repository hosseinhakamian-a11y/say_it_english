
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    RotateCw,
    Volume2,
    CheckCircle,
    Info,
    Sparkles
} from "lucide-react";

interface VocabItem {
    word: string;
    meaning: string;
    definition?: string;
    pronunciation?: string;
}

interface FlashcardProps {
    items: VocabItem[];
    onClose?: () => void;
}

export function Flashcards({ items, onClose }: FlashcardProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [direction, setDirection] = useState(0); // -1 for left, 1 for right

    const currentItem = items[currentIndex];

    const handleNext = () => {
        if (currentIndex < items.length - 1) {
            setDirection(1);
            setIsFlipped(false);
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 100);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setDirection(-1);
            setIsFlipped(false);
            setTimeout(() => {
                setCurrentIndex(prev => prev - 1);
            }, 100);
        }
    };

    const toggleFlip = () => setIsFlipped(!isFlipped);

    if (!items || items.length === 0) return null;

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto py-4">
            {/* Progress Header */}
            <div className="w-full flex justify-between items-center bg-muted/30 px-4 py-2 rounded-full border border-border/50 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <span>کارت {currentIndex + 1} از {items.length}</span>
                <div className="flex gap-1">
                    {items.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? "w-4 bg-primary" : "w-1 bg-muted-foreground/30"}`}
                        />
                    ))}
                </div>
            </div>

            {/* Card Container */}
            <div className="relative w-full aspect-[4/5] perspective-1000 cursor-pointer group" onClick={toggleFlip}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: direction * 50, rotateY: 0 }}
                        animate={{ opacity: 1, x: 0, rotateY: isFlipped ? 180 : 0 }}
                        exit={{ opacity: 0, x: -direction * 50 }}
                        transition={{
                            rotateY: { duration: 0.4, ease: "easeOut" },
                            opacity: { duration: 0.2 },
                            x: { duration: 0.2 }
                        }}
                        style={{ transformStyle: "preserve-3d" }}
                        className="w-full h-full relative"
                    >
                        {/* Front Side */}
                        <div className={`absolute inset-0 w-full h-full bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center shadow-2xl border-b-8 border-primary/20 backface-hidden`}>
                            <div className="absolute top-6 left-6 text-primary/20">
                                <Volume2 className="w-6 h-6" />
                            </div>

                            <motion.span
                                className="text-4xl font-black text-primary mb-4 tracking-tight"
                            >
                                {currentItem.word}
                            </motion.span>

                            {currentItem.pronunciation && (
                                <span className="text-sm font-mono text-muted-foreground bg-muted px-3 py-1 rounded-full border">
                                    {currentItem.pronunciation}
                                </span>
                            )}

                            <div className="absolute bottom-8 flex items-center gap-2 text-primary font-bold text-xs uppercase opacity-40 animate-pulse">
                                <RotateCw className="w-3 h-3" />
                                برای مشاهده معنی لمس کنید
                            </div>
                        </div>

                        {/* Back Side */}
                        <div
                            className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary to-primary-dark rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center shadow-2xl backface-hidden"
                            style={{ transform: "rotateY(180px)" }}
                        >
                            <div className="absolute top-6 right-6 text-white/20">
                                <Sparkles className="w-6 h-6" />
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm px-4 py-1 rounded-full text-[10px] text-white/80 font-bold mb-4 border border-white/20">
                                MEANING
                            </div>

                            <h3 className="text-3xl font-bold text-white mb-6 dir-rtl">
                                {currentItem.meaning}
                            </h3>

                            {currentItem.definition && (
                                <p className="text-white/70 text-sm leading-relaxed max-w-[200px] italic">
                                    "{currentItem.definition}"
                                </p>
                            )}

                            <div className="absolute bottom-8 flex items-center gap-2 text-white font-bold text-xs uppercase opacity-40">
                                <RotateCw className="w-3 h-3" />
                                بازگشت به لغت
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 w-full">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    disabled={currentIndex === 0}
                    className="h-14 w-14 rounded-full border-primary/20 hover:bg-primary/5 text-primary disabled:opacity-30 btn-press"
                >
                    <ChevronRight className="w-6 h-6" />
                </Button>

                <Button
                    onClick={(e) => { e.stopPropagation(); toggleFlip(); }}
                    className="flex-1 h-14 rounded-full font-bold text-lg shadow-xl shadow-primary/20 btn-press"
                >
                    {isFlipped ? "مشاهده لغت" : "مشاهده معنی"}
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    disabled={currentIndex === items.length - 1}
                    className="h-14 w-14 rounded-full border-primary/20 hover:bg-primary/5 text-primary disabled:opacity-30 btn-press"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>
            </div>

            {/* Tip */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border border-border/40">
                <Info className="w-3 h-3" />
                <span>نکته: با کلیک روی کارت می‌توانید آن را بچرخانید.</span>
            </div>
        </div>
    );
}
