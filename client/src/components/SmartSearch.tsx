import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, X, PlayCircle, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
    id: number;
    title: string;
    type: string;
    description?: string;
    thumbnailUrl?: string;
}

export function SmartSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [, setLocation] = useLocation();

    const { data: allContent } = useQuery<SearchResult[]>({
        queryKey: ["/api/content"],
    });

    // Keyboard shortcut: Ctrl+K or Cmd+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setOpen(true);
            }
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const filtered = allContent?.filter((item) => {
        if (!query.trim()) return false;
        const q = query.toLowerCase();
        return (
            item.title.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q)
        );
    })?.slice(0, 8) || [];

    const navigate = useCallback((item: SearchResult) => {
        setOpen(false);
        setQuery("");
        setLocation(item.type === "video" ? `/videos/${item.id}` : `/course/${item.id}`);
    }, [setLocation]);

    return (
        <>
            {/* Trigger Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(true)}
                className="hidden md:flex gap-2 text-muted-foreground hover:text-foreground rounded-full bg-muted/50 px-4 h-9"
            >
                <Search className="h-4 w-4" />
                <span className="text-sm">جستجو...</span>
                <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded border font-mono">⌘K</kbd>
            </Button>

            {/* Overlay */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
                        onClick={() => setOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.15 }}
                            className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Search Input */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b">
                                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                                <input
                                    type="text"
                                    placeholder="جستجوی ویدیو، دوره، مقاله..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    autoFocus
                                    className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                                />
                                {query && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQuery("")}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            {/* Results */}
                            <div className="max-h-80 overflow-y-auto p-2">
                                {query.trim() && filtered.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p className="text-sm">نتیجه‌ای یافت نشد.</p>
                                    </div>
                                )}

                                {filtered.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => navigate(item)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-right"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            {item.type === "video" ? (
                                                <PlayCircle className="h-5 w-5 text-primary" />
                                            ) : (
                                                <BookOpen className="h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate text-foreground">{item.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {item.type === "video" ? "ویدیو" : "دوره"}
                                                {item.description && ` • ${item.description.slice(0, 40)}...`}
                                            </p>
                                        </div>
                                        <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                                    </button>
                                ))}

                                {!query.trim() && (
                                    <div className="text-center py-8 text-muted-foreground space-y-2">
                                        <Search className="h-8 w-8 mx-auto opacity-30" />
                                        <p className="text-sm">عبارت مورد نظر خود را تایپ کنید</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
