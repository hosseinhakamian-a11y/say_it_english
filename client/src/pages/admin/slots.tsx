import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfWeek, parseISO } from "date-fns";
import { faIR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Plus, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "./layout";

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

    // Fetch all slots (for admin view, we might want to see booked ones too - adjust API if needed)
    const { data: slots, isLoading } = useQuery<TimeSlot[]>({
        queryKey: ["/api/slots"],
    });

    // Add slot mutation
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

    // Delete slot mutation
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
            toast({ title: "لطفاً تاریخ و ساعت را انتخاب کنید", variant: "destructive" });
            return;
        }
        // Add Tehran timezone offset (+03:30) to preserve local time
        const dateTime = `${selectedDate}T${selectedTime}:00+03:30`;
        addSlotMutation.mutate({ date: dateTime });
    };

    // Quick add buttons for common times
    const quickTimes = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

    // Group slots by date for display
    const slotsByDate = slots?.reduce((acc, slot) => {
        const dateKey = format(new Date(slot.date), "yyyy-MM-dd");
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(slot);
        return acc;
    }, {} as Record<string, TimeSlot[]>) || {};

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">مدیریت زمان‌های کلاس</h1>
                        <p className="text-muted-foreground">زمان‌های خالی خود را برای رزرو کلاس خصوصی اضافه کنید</p>
                    </div>
                </div>

                {/* Add New Slot Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">ساعت</Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleAddSlot} disabled={addSlotMutation.isPending}>
                                {addSlotMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "افزودن"}
                            </Button>
                        </div>

                        {/* Quick Time Buttons */}
                        {selectedDate && (
                            <div className="mt-4">
                                <Label className="mb-2 block">انتخاب سریع ساعت:</Label>
                                <div className="flex flex-wrap gap-2">
                                    {quickTimes.map((time) => (
                                        <Button
                                            key={time}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedTime(time)}
                                            className={selectedTime === time ? "border-primary bg-primary/10" : ""}
                                        >
                                            {time}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Existing Slots */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            زمان‌های موجود
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : Object.keys(slotsByDate).length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">هنوز زمانی اضافه نشده است</p>
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(slotsByDate)
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .map(([dateKey, dateSlots]) => (
                                        <div key={dateKey} className="border rounded-lg p-4">
                                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                {format(new Date(dateKey), "EEEE d MMMM", { locale: faIR })}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {dateSlots
                                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                                    .map((slot) => (
                                                        <div
                                                            key={slot.id}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${slot.isBooked
                                                                ? "bg-red-50 border-red-200 text-red-700"
                                                                : "bg-green-50 border-green-200 text-green-700"
                                                                }`}
                                                        >
                                                            <Clock className="h-4 w-4" />
                                                            <span>{format(new Date(slot.date), "HH:mm")}</span>
                                                            <span className="text-xs">({slot.duration} دقیقه)</span>
                                                            {slot.isBooked && <span className="text-xs font-medium">(رزرو شده)</span>}
                                                            {!slot.isBooked && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                                    onClick={() => deleteSlotMutation.mutate(slot.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
