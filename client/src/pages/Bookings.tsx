import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, Clock, CheckCircle2, Loader2, Phone,
  Wallet, CreditCard, Copy, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, scaleUpVariants } from "@/lib/animations";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TimeSlot {
  id: number;
  date: string;
  duration: number;
  isBooked: boolean;
  price?: number;
  currency?: string;
}

// Persian date formatting helper
const toPersianDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const WALLET_ADDRESS = "0x2ca84105e9e3f3a91f0385acbd497923d743a342";
// Placeholder for Bank Card - update with real one later
const BANK_CARD = "6037-9973-0000-0000";
const BANK_HOLDER = "حسین حکمیان";

export default function Bookings() {
  const { toast } = useToast();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("crypto");
  const [trackingHash, setTrackingHash] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch available slots
  const { data: slots, isLoading } = useQuery<TimeSlot[]>({
    queryKey: ["/api/slots"],
    queryFn: async () => {
      const res = await fetch("/api/slots");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Book mutation
  const bookMutation = useMutation({
    mutationFn: async (data: {
      timeSlotId: number;
      phone: string;
      notes: string;
      paymentMethod: string;
      trackingHash: string;
    }) => {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Booking failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({ title: "✅ رزرو با موفقیت انجام شد!" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "خطا در رزرو", variant: "destructive" });
    },
  });

  const handleBook = () => {
    if (!selectedSlot) {
      toast({ title: "لطفاً یک زمان انتخاب کنید", variant: "destructive" });
      return;
    }
    if (!phone || phone.length < 10) {
      toast({ title: "لطفاً شماره تماس معتبر وارد کنید", variant: "destructive" });
      return;
    }
    if (!trackingHash) {
      toast({
        title: paymentMethod === 'crypto' ? "لطفاً هش تراکنش را وارد کنید" : "لطفاً کد پیگیری را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    bookMutation.mutate({
      timeSlotId: selectedSlot.id,
      phone,
      notes,
      paymentMethod,
      trackingHash
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "کپی شد" });
    setTimeout(() => setCopied(false), 2000);
  };

  // Group slots by date
  const slotsByDate = slots?.reduce((acc, slot) => {
    const dateKey = format(new Date(slot.date), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>) || {};

  if (isSuccess) {
    return (
      <motion.div
        variants={scaleUpVariants}
        initial="initial"
        animate="animate"
        className="container mx-auto px-4 py-20 text-center"
      >
        <Card className="max-w-lg mx-auto rounded-[2rem] border-primary/20 glass-primary p-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30"
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold gradient-text mb-4">رزرو با موفقیت ثبت شد!</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            درخواست شما دریافت شد. ادمین پس از بررسی پرداخت، لینک گوگل میت را برای شما پیامک خواهد کرد.
          </p>
          <Button onClick={() => {
            setIsSuccess(false);
            setSelectedSlot(null);
            setTrackingHash("");
            setPhone("");
            setNotes("");
          }} className="rounded-xl btn-press">
            بازگشت به تقویم
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-background pb-20"
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-block p-4 glass rounded-2xl shadow-lg mb-4"
          >
            <Calendar className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold mb-2"
          >
            رزرو کلاس خصوصی
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            انتخاب زمان، پرداخت، یادگیری!
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">

          {/* Slots List */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  زمان‌های موجود
                </h2>

                {isLoading ? (
                  <div className="grid grid-cols-1 gap-4 py-4">
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                ) : Object.keys(slotsByDate).length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>در حال حاضر زمان خالی موجود نیست</p>
                    <p className="text-sm mt-2">لطفاً بعداً مراجعه کنید</p>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(slotsByDate)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dateKey, dateSlots]) => (
                        <div key={dateKey}>
                          <h3 className="font-bold mb-3 text-sm text-muted-foreground">
                            {toPersianDate(new Date(dateKey))}
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {dateSlots
                              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .map((slot) => (
                                <button
                                  key={slot.id}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-2 ${selectedSlot?.id === slot.id
                                    ? "border-primary bg-primary text-white"
                                    : "border-border hover:border-primary hover:bg-primary/5"
                                    }`}
                                >
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">
                                    {format(new Date(slot.date), "HH:mm")}
                                  </span>
                                </button>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Booking Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="rounded-2xl border-border/50 sticky top-24 glass">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="font-bold text-lg mb-2">تکمیل رزرو</h2>
                  <AnimatePresence mode="wait">
                    {selectedSlot ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-primary/10 rounded-xl p-4 text-center"
                      >
                        <p className="text-sm text-muted-foreground mb-1">زمان انتخابی:</p>
                        <p className="font-bold text-primary">
                          {toPersianDate(new Date(selectedSlot.date))}
                        </p>
                        <p className="font-bold text-primary text-lg">
                          ساعت {format(new Date(selectedSlot.date), "HH:mm")}
                        </p>
                      </motion.div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-xl">
                        ابتدا یک زمان را انتخاب کنید
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {selectedSlot && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="phone">شماره تماس (جهت ارسال لینک)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="09123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="text-left dir-ltr rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>روش پرداخت</Label>
                      <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 rounded-xl h-12">
                          <TabsTrigger value="crypto" className="rounded-lg">ارز دیجیتال (Tether)</TabsTrigger>
                          <TabsTrigger value="card" className="rounded-lg">کارت به کارت</TabsTrigger>
                        </TabsList>

                        <div className="mt-4 p-4 border rounded-xl bg-muted/30">
                          <TabsContent value="crypto" className="mt-0 space-y-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">آدرس کیف پول (Tether - BEP20)</Label>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 bg-background p-2 rounded-lg text-xs break-all border font-mono">
                                  {WALLET_ADDRESS}
                                </code>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(WALLET_ADDRESS)}>
                                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="hash">هش تراکنش (Transaction Hash)</Label>
                              <Input
                                id="hash"
                                placeholder="0x..."
                                value={trackingHash}
                                onChange={(e) => setTrackingHash(e.target.value)}
                                className="font-mono text-sm rounded-xl"
                              />
                            </div>
                          </TabsContent>

                          <TabsContent value="card" className="mt-0 space-y-4">
                            <div className="space-y-1 text-sm bg-background p-3 rounded-lg border">
                              <div className="flex justify-between text-muted-foreground text-xs"><span>شماره کارت:</span></div>
                              <div className="font-mono text-center text-lg tracking-wider font-bold dir-ltr select-all">
                                {BANK_CARD}
                              </div>
                              <div className="text-center text-muted-foreground text-xs mt-1">{BANK_HOLDER}</div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="code">کد پیگیری / ۴ رقم آخر کارت</Label>
                              <Input
                                id="code"
                                placeholder="مثلاً: ۱۲۳۴۵"
                                value={trackingHash}
                                onChange={(e) => setTrackingHash(e.target.value)}
                                className="rounded-xl"
                              />
                            </div>
                          </TabsContent>
                        </div>
                      </Tabs>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">توضیحات (اختیاری)</Label>
                      <Textarea
                        id="notes"
                        placeholder="سطح فعلی، موضوع مورد علاقه..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="rounded-xl resize-none"
                        rows={2}
                      />
                    </div>

                    <Button
                      onClick={handleBook}
                      disabled={!selectedSlot || bookMutation.isPending}
                      className="w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20 btn-press"
                    >
                      {bookMutation.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin ml-2" />
                          در حال ثبت...
                        </>
                      ) : (
                        "تایید و پرداخت"
                      )}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </motion.div >
  );
}
