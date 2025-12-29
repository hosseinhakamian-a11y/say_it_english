import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateBooking } from "@/hooks/use-bookings";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns-jalali"; // Note: In real app use date-fns-jalali for Persian calendar
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Bookings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const createBooking = useCreateBooking();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [type, setType] = useState<"consultation" | "private_class">("consultation");
  const [notes, setNotes] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-card border border-border rounded-3xl p-10 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">ورود الزامی است</h2>
          <p className="text-muted-foreground mb-8">برای رزرو وقت مشاوره یا کلاس، لطفاً ابتدا وارد حساب کاربری خود شوید.</p>
          <Button onClick={() => setLocation("/auth")} className="w-full rounded-xl">ورود / ثبت نام</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!date) return;

    createBooking.mutate({
      userId: user.id,
      type,
      date: date, // Pass Date object directly
      notes,
    }, {
      onSuccess: () => setIsSuccess(true)
    });
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Card className="max-w-lg mx-auto rounded-[2rem] border-primary/20 bg-primary/5 p-12">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-primary mb-4">رزرو با موفقیت انجام شد!</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            درخواست شما ثبت شد. به زودی برای هماهنگی نهایی با شما تماس خواهیم گرفت.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setLocation("/profile")} variant="outline" className="rounded-xl bg-white border-primary/20 text-primary hover:bg-white hover:border-primary">
              مشاهده رزروها
            </Button>
            <Button onClick={() => setIsSuccess(false)} className="rounded-xl shadow-lg shadow-primary/20">
              رزرو جدید
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">رزرو وقت</h1>
        <p className="text-muted-foreground mb-10">زمان مناسب برای مشاوره یا کلاس خصوصی خود را انتخاب کنید.</p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-5">
            <Card className="rounded-[2rem] border-0 shadow-xl overflow-hidden h-full">
              <CardContent className="p-0">
                <div className="bg-primary p-6 text-primary-foreground">
                  <div className="flex items-center gap-3 mb-2 opacity-80">
                    <CalendarIcon className="w-5 h-5" />
                    <span className="font-medium">انتخاب تاریخ</span>
                  </div>
                  <h3 className="text-2xl font-bold">
                    {date ? date.toLocaleDateString('fa-IR') : 'تاریخی انتخاب نشده'}
                  </h3>
                </div>
                <div className="p-6 flex justify-center bg-white">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border-0 w-full"
                    classNames={{
                      head_cell: "text-muted-foreground font-normal text-sm pt-4 pb-2 w-10",
                      cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary/5 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-full transition-colors",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-lg shadow-primary/30",
                      day_today: "bg-accent text-accent-foreground",
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-7">
            <Card className="rounded-[2rem] border border-border/50 shadow-sm h-full">
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <span className="w-1 h-5 bg-secondary rounded-full block"></span>
                    نوع کلاس
                  </label>
                  <Select value={type} onValueChange={(val: any) => setType(val)}>
                    <SelectTrigger className="w-full h-14 rounded-xl border-2 border-muted bg-transparent focus:border-primary focus:ring-0 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">مشاوره تعیین سطح (۳۰ دقیقه)</SelectItem>
                      <SelectItem value="private_class">کلاس خصوصی (۶۰ دقیقه)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <span className="w-1 h-5 bg-secondary rounded-full block"></span>
                    ساعت‌های پیشنهادی
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['10:00', '11:30', '14:00', '16:00', '18:00', '19:30'].map((time) => (
                      <button
                        key={time}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl border border-muted hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium focus:bg-primary focus:text-white focus:border-primary group"
                      >
                        <Clock className="w-4 h-4 group-focus:text-white text-muted-foreground" />
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <span className="w-1 h-5 bg-secondary rounded-full block"></span>
                    توضیحات اضافی (اختیاری)
                  </label>
                  <Textarea
                    placeholder="اگر موضوع خاصی مد نظر دارید بنویسید..."
                    className="min-h-[120px] rounded-xl border-2 border-muted focus:border-primary resize-none p-4"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!date || createBooking.isPending}
                  className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all mt-4"
                >
                  {createBooking.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      در حال ثبت...
                    </>
                  ) : "تایید و ثبت نهایی"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
