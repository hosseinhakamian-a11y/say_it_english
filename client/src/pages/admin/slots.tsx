import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "./layout";
import { motion } from "framer-motion";
import { pageVariants, containerVariants, itemVariants } from "@/lib/animations";
import { CardSkeleton, StatsSkeleton } from "@/components/ui/skeleton";

interface TimeSlot {
    id: number;
    date: string;
    duration: number;
    isBooked: boolean;
}

export default function AdminSlotsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");

    const { data: slots, isLoading } = useQuery<TimeSlot[]>({
        queryKey: ["/api/slots"],
    });

    const addSlotMutation = useMutation({
        mutationFn: async (data: { date: string }) => {
            const res = await fetch("/api/slots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to add slot");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
            toast({ title: "✅ زمان جدید اضافه شد" });
            setSelectedDate("");
            setSelectedTime("");
        },
        onError: () => {
            toast({ title: "❌ خطا در افزودن زمان", variant: "destructive" });
        },
    });

    const deleteSlotMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/slots?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete slot");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
            toast({ title: "✅ زمان حذف شد" });
        },
    });

    const handleAddSlot = () => {
        if (!selectedDate || !selectedTime) {
            toast({
                title: "لطفاً تاریخ و ساعت را انتخاب کنید",
                variant: "destructive",
            });
            return;
        }
        const dateTime = `${selectedDate}T${selectedTime}:00+03:30`;
        addSlotMutation.mutate({ date: dateTime });
    };

    const quickTimes = [
        "09:00",
        "10:00",
        "11:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
        "18:00",
        "19:00",
        "20:00",
    ];

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

                {/* Add New Slot Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="rounded-2xl border-0 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-primary" />
                                افزودن زمان جدید
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="date">تاریخ</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        min={format(new Date(), "yyyy-MM-dd")}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="time">ساعت</Label>
                                    <Input
                                        id="time"
                                        type="time"
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        className="rounded-xl"
                                    />
                                </div>
                                <Button
                                    onClick={handleAddSlot}
                                    disabled={addSlotMutation.isPending}
                                    className="rounded-xl btn-press"
                                >
                                    {addSlotMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "افزودن"
                                    )}
                                </Button>
                            </div>

                            {/* Quick Time Buttons */}
                            {selectedDate && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="mt-4"
                                >
                                    <Label className="mb-2 block">انتخاب سریع ساعت:</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {quickTimes.map((time) => (
                                            <motion.button
                                                key={time}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setSelectedTime(time)}
                                                className={`px-4 py-2 rounded-xl border-2 transition-all font-medium ${selectedTime === time
                                                        ? "border-primary bg-primary text-white shadow-lg shadow-primary/30"
                                                        : "border-gray-200 hover:border-primary hover:bg-primary/5"
                                                    }`}
                                            >
                                                {time}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
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
                                                    {format(new Date(dateKey), "EEEE d MMMM", {
                                                        locale: faIR,
                                                    })}
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
