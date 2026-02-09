import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, Trash2, Loader2, Check, X, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "./layout";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, containerVariants, itemVariants } from "@/lib/animations";
import { CardSkeleton, StatsSkeleton } from "@/components/ui/skeleton";

interface TimeSlot {
    id: number;
    date: string;
    duration: number;
    isBooked: boolean;
}

// Persian date formatting helper
const toPersianDate = (date: Date): string => {
    return new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
};

const toPersianDateShort = (date: Date): string => {
    return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
};

export default function AdminSlotsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    const { data: slots, isLoading } = useQuery<TimeSlot[]>({
        queryKey: ["/api/slots"],
    });

    const addSlotMutation = useMutation({
        mutationFn: async (data: { date: string }) => {
            const res = await fetch("/api/slots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to add slot");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
        },
        onError: () => {
            toast({ title: "❌ خطا در افزودن زمان", variant: "destructive" });
        },
    });

    const deleteSlotMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/slots?id=${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to delete slot");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
            toast({ title: "✅ زمان حذف شد" });
        },
    });

    const handleToggleTime = (time: string) => {
        setSelectedTimes(prev =>
            prev.includes(time)
                ? prev.filter(t => t !== time)
                : [...prev, time].sort()
        );
    };

    const handleAddAllSlots = async () => {
        if (!selectedDate || selectedTimes.length === 0) {
            toast({
                title: "لطفاً تاریخ و حداقل یک ساعت انتخاب کنید",
                variant: "destructive",
            });
            return;
        }

        setIsAdding(true);
        let successCount = 0;

        for (const time of selectedTimes) {
            const dateTime = `${selectedDate}T${time}:00+03:30`;
            try {
                await addSlotMutation.mutateAsync({ date: dateTime });
                successCount++;
            } catch (e) {
                // Continue with others
            }
        }

        setIsAdding(false);
        if (successCount > 0) {
            toast({
                title: `✅ ${successCount} زمان جدید اضافه شد`,
                description: `تاریخ: ${toPersianDateShort(new Date(selectedDate))}`
            });
            setSelectedTimes([]);
        }
    };

    const handleSelectAllTimes = () => {
        if (selectedTimes.length === quickTimes.length) {
            setSelectedTimes([]);
        } else {
            setSelectedTimes([...quickTimes]);
        }
    };

    const quickTimes = [
        "09:00", "09:30",
        "10:00", "10:30",
        "11:00", "11:30",
        "14:00", "14:30",
        "15:00", "15:30",
        "16:00", "16:30",
        "17:00", "17:30",
        "18:00", "18:30",
        "19:00", "19:30",
        "20:00", "20:30",
        "21:00",
    ];

    const morningTimes = quickTimes.filter(t => parseInt(t.split(':')[0]) < 12);
    const afternoonTimes = quickTimes.filter(t => parseInt(t.split(':')[0]) >= 12 && parseInt(t.split(':')[0]) < 17);
    const eveningTimes = quickTimes.filter(t => parseInt(t.split(':')[0]) >= 17);

    const slotsByDate =
        slots?.reduce((acc, slot) => {
            const dateKey = format(new Date(slot.date), "yyyy-MM-dd");
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(slot);
            return acc;
        }, {} as Record<string, TimeSlot[]>) || {};

    // Stats
    const totalSlots = slots?.length || 0;
    const bookedSlots = slots?.filter((s) => s.isBooked).length || 0;
    const availableSlots = totalSlots - bookedSlots;

    // Check existing times for selected date
    const existingTimesForDate = selectedDate
        ? (slotsByDate[selectedDate] || []).map(s => format(new Date(s.date), "HH:mm"))
        : [];

    return (
        <AdminLayout>
            <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex items-center gap-3">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl text-white shadow-lg shadow-orange-500/30"
                    >
                        <Clock className="h-6 w-6" />
                    </motion.div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                            مدیریت زمان‌های کلاس
                        </h1>
                        <p className="text-gray-500 mt-1">
                            زمان‌های خالی خود را برای رزرو کلاس خصوصی اضافه کنید
                        </p>
                    </div>
                </div>

                {/* Stats */}
                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-3">
                        <StatsSkeleton />
                        <StatsSkeleton />
                        <StatsSkeleton />
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="initial"
                        animate="animate"
                        className="grid gap-4 md:grid-cols-3"
                    >
                        <motion.div variants={itemVariants}>
                            <Card className="rounded-2xl border-0 shadow-md">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 rounded-xl">
                                        <Calendar className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">کل زمان‌ها</p>
                                        <p className="text-2xl font-bold">{totalSlots}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <Card className="rounded-2xl border-0 shadow-md">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="p-3 bg-green-50 rounded-xl">
                                        <Clock className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">خالی</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {availableSlots}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <Card className="rounded-2xl border-0 shadow-md">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="p-3 bg-red-50 rounded-xl">
                                        <Calendar className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">رزرو شده</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {bookedSlots}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}

                {/* Add New Slot Form - IMPROVED */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-primary" />
                                افزودن زمان‌های جدید
                                {selectedTimes.length > 0 && (
                                    <Badge variant="secondary" className="mr-2">
                                        {selectedTimes.length} ساعت انتخاب شده
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Step 1: Date Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">۱</div>
                                    <Label className="text-base font-semibold">انتخاب تاریخ</Label>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <Input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            setSelectedTimes([]);
                                        }}
                                        min={format(new Date(), "yyyy-MM-dd")}
                                        className="w-48 rounded-xl"
                                    />
                                    {selectedDate && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl"
                                        >
                                            <CalendarDays className="w-4 h-4 text-primary" />
                                            <span className="font-medium text-primary">
                                                {toPersianDate(new Date(selectedDate))}
                                            </span>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Step 2: Time Selection - Multi Select */}
                            <AnimatePresence>
                                {selectedDate && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">۲</div>
                                                <Label className="text-base font-semibold">انتخاب ساعت‌ها (چند انتخابی)</Label>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSelectAllTimes}
                                                className="text-xs"
                                            >
                                                {selectedTimes.length === quickTimes.length ? "لغو همه" : "انتخاب همه"}
                                            </Button>
                                        </div>

                                        {/* Morning */}
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground font-medium">🌅 صبح</p>
                                            <div className="flex flex-wrap gap-2">
                                                {morningTimes.map((time) => {
                                                    const isExisting = existingTimesForDate.includes(time);
                                                    const isSelected = selectedTimes.includes(time);
                                                    return (
                                                        <motion.button
                                                            key={time}
                                                            whileHover={{ scale: isExisting ? 1 : 1.05 }}
                                                            whileTap={{ scale: isExisting ? 1 : 0.95 }}
                                                            onClick={() => !isExisting && handleToggleTime(time)}
                                                            disabled={isExisting}
                                                            className={`px-4 py-2.5 rounded-xl border-2 transition-all font-medium text-sm
                                                                ${isExisting
                                                                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through"
                                                                    : isSelected
                                                                        ? "border-primary bg-primary text-white shadow-lg shadow-primary/30"
                                                                        : "border-gray-200 hover:border-primary hover:bg-primary/5"
                                                                }`}
                                                        >
                                                            {isSelected && <Check className="inline w-3 h-3 ml-1" />}
                                                            {time}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Afternoon */}
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground font-medium">☀️ بعدازظهر</p>
                                            <div className="flex flex-wrap gap-2">
                                                {afternoonTimes.map((time) => {
                                                    const isExisting = existingTimesForDate.includes(time);
                                                    const isSelected = selectedTimes.includes(time);
                                                    return (
                                                        <motion.button
                                                            key={time}
                                                            whileHover={{ scale: isExisting ? 1 : 1.05 }}
                                                            whileTap={{ scale: isExisting ? 1 : 0.95 }}
                                                            onClick={() => !isExisting && handleToggleTime(time)}
                                                            disabled={isExisting}
                                                            className={`px-4 py-2.5 rounded-xl border-2 transition-all font-medium text-sm
                                                                ${isExisting
                                                                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through"
                                                                    : isSelected
                                                                        ? "border-primary bg-primary text-white shadow-lg shadow-primary/30"
                                                                        : "border-gray-200 hover:border-primary hover:bg-primary/5"
                                                                }`}
                                                        >
                                                            {isSelected && <Check className="inline w-3 h-3 ml-1" />}
                                                            {time}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Evening */}
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground font-medium">🌙 عصر و شب</p>
                                            <div className="flex flex-wrap gap-2">
                                                {eveningTimes.map((time) => {
                                                    const isExisting = existingTimesForDate.includes(time);
                                                    const isSelected = selectedTimes.includes(time);
                                                    return (
                                                        <motion.button
                                                            key={time}
                                                            whileHover={{ scale: isExisting ? 1 : 1.05 }}
                                                            whileTap={{ scale: isExisting ? 1 : 0.95 }}
                                                            onClick={() => !isExisting && handleToggleTime(time)}
                                                            disabled={isExisting}
                                                            className={`px-4 py-2.5 rounded-xl border-2 transition-all font-medium text-sm
                                                                ${isExisting
                                                                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through"
                                                                    : isSelected
                                                                        ? "border-primary bg-primary text-white shadow-lg shadow-primary/30"
                                                                        : "border-gray-200 hover:border-primary hover:bg-primary/5"
                                                                }`}
                                                        >
                                                            {isSelected && <Check className="inline w-3 h-3 ml-1" />}
                                                            {time}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Step 3: Preview & Submit */}
                            <AnimatePresence>
                                {selectedTimes.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="space-y-4 pt-4 border-t"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">۳</div>
                                            <Label className="text-base font-semibold">پیش‌نمایش و تایید</Label>
                                        </div>

                                        <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 space-y-2">
                                            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                                                📅 تاریخ: {toPersianDate(new Date(selectedDate))}
                                            </p>
                                            <p className="text-sm text-green-800 dark:text-green-200">
                                                ⏰ ساعت‌ها: {selectedTimes.join(" ، ")}
                                            </p>
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                                مجموعاً {selectedTimes.length} زمان جدید اضافه خواهد شد.
                                            </p>
                                        </div>

                                        <div className="flex gap-3">
                                            <Button
                                                onClick={handleAddAllSlots}
                                                disabled={isAdding}
                                                className="flex-1 h-12 rounded-xl text-base font-bold"
                                            >
                                                {isAdding ? (
                                                    <>
                                                        <Loader2 className="h-5 w-5 animate-spin ml-2" />
                                                        در حال افزودن...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="h-5 w-5 ml-2" />
                                                        افزودن {selectedTimes.length} زمان
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => setSelectedTimes([])}
                                                className="rounded-xl"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Existing Slots */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="rounded-2xl border-0 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                زمان‌های موجود
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-4">
                                    <CardSkeleton />
                                    <CardSkeleton />
                                </div>
                            ) : Object.keys(slotsByDate).length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-12 text-muted-foreground"
                                >
                                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>هنوز زمانی اضافه نشده است</p>
                                    <p className="text-sm mt-2">
                                        با فرم بالا زمان‌های خالی خود را اضافه کنید
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    variants={containerVariants}
                                    initial="initial"
                                    animate="animate"
                                    className="space-y-4"
                                >
                                    {Object.entries(slotsByDate)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([dateKey, dateSlots]) => (
                                            <motion.div
                                                key={dateKey}
                                                variants={itemVariants}
                                                className="border rounded-2xl p-4 bg-muted/30"
                                            >
                                                <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-700">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                    {toPersianDate(new Date(dateKey))}
                                                    <Badge variant="outline" className="mr-2">
                                                        {dateSlots.length} زمان
                                                    </Badge>
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {dateSlots
                                                        .sort(
                                                            (a, b) =>
                                                                new Date(a.date).getTime() -
                                                                new Date(b.date).getTime()
                                                        )
                                                        .map((slot) => (
                                                            <motion.div
                                                                key={slot.id}
                                                                whileHover={{ scale: 1.02 }}
                                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${slot.isBooked
                                                                    ? "bg-red-50 border-red-200 text-red-700"
                                                                    : "bg-green-50 border-green-200 text-green-700"
                                                                    }`}
                                                            >
                                                                <Clock className="h-4 w-4" />
                                                                <span className="font-medium">
                                                                    {format(new Date(slot.date), "HH:mm")}
                                                                </span>
                                                                <span className="text-xs opacity-70">
                                                                    ({slot.duration} دقیقه)
                                                                </span>
                                                                {slot.isBooked && (
                                                                    <span className="text-xs font-bold bg-red-100 px-2 py-0.5 rounded-md">
                                                                        رزرو شده
                                                                    </span>
                                                                )}
                                                                {!slot.isBooked && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg"
                                                                        onClick={() =>
                                                                            deleteSlotMutation.mutate(slot.id)
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </motion.div>
                                                        ))}
                                                </div>
                                            </motion.div>
                                        ))}
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </AdminLayout>
    );
}
