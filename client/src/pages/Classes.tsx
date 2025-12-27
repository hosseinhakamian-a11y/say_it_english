import { useClasses } from "@/hooks/use-classes";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CalendarDays, CheckCircle } from "lucide-react";

// Mock Data
const mockClasses = [
  {
    id: 1,
    title: "مکالمه فشرده سطح A2",
    description: "دوره‌ای عالی برای کسانی که می‌خواهند مکالمه خود را سریع تقویت کنند. تمرکز بر روی موضوعات روزمره و کاربردی.",
    level: "beginner",
    capacity: 10,
    enrolled: 6,
    price: 1500000,
    schedule: "شنبه‌ها و دوشنبه‌ها - ۱۸:۰۰ تا ۱۹:۳۰",
    features: ["۱۲ جلسه آموزشی", "پشتیبانی واتساپ", "ضبط جلسات"]
  },
  {
    id: 2,
    title: "آیلتس تضمینی (Writing)",
    description: "کارگاه تخصصی رایتینگ آیلتس. تحلیل نمونه سوالات و تصحیح متون شما.",
    level: "advanced",
    capacity: 8,
    enrolled: 8,
    price: 2500000,
    schedule: "پنج‌شنبه‌ها - ۱۰:۰۰ تا ۱۳:۰۰",
    features: ["تصحیح ۵ رایتینگ", "جزوه اختصاصی", "مشاوره فردی"]
  },
  {
    id: 3,
    title: "بحث آزاد (Free Discussion)",
    description: "کلاس بحث آزاد برای تقویت اعتماد به نفس و دایره لغات. مناسب برای سطح متوسط به بالا.",
    level: "intermediate",
    capacity: 12,
    enrolled: 4,
    price: 800000,
    schedule: "یکشنبه‌ها - ۲۰:۰۰ تا ۲۱:۳۰",
    features: ["موضوعات متنوع", "اصلاح تلفظ", "ویدئوهای آموزشی"]
  }
];

export default function Classes() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">کلاس‌های گروهی</h1>
        <p className="text-muted-foreground text-lg">
          یادگیری در کنار دیگران انگیزه شما را دوچندان می‌کند. کلاس مناسب سطح خود را انتخاب کنید.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockClasses.map((cls) => (
          <Card key={cls.id} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-[2rem] flex flex-col overflow-hidden group">
            <div className="h-3 bg-gradient-to-r from-primary to-secondary w-full" />
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-start mb-4">
                <Badge variant={cls.level === 'advanced' ? 'destructive' : 'secondary'} className="rounded-lg px-3 py-1 font-bold">
                  {cls.level === 'beginner' ? 'مقدماتی' : cls.level === 'intermediate' ? 'متوسط' : 'پیشرفته'}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  <Users className="w-4 h-4 ml-2" />
                  {cls.enrolled}/{cls.capacity} نفر
                </div>
              </div>
              <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{cls.title}</h3>
            </CardHeader>

            <CardContent className="p-8 pt-2 flex-grow">
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {cls.description}
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 ml-3 text-primary" />
                  <span className="font-medium">{cls.schedule}</span>
                </div>
                <div className="flex items-center text-sm">
                  <CalendarDays className="w-4 h-4 ml-3 text-primary" />
                  <span>شروع از هفته آینده</span>
                </div>
              </div>

              <div className="bg-muted/30 rounded-2xl p-5 border border-border/50">
                <ul className="space-y-2">
                  {cls.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-foreground/80">
                      <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <CardFooter className="p-8 pt-0 flex items-center justify-between border-t border-border/30 bg-muted/10 mt-auto">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">شهریه دوره</span>
                <span className="text-xl font-black text-primary">
                  {cls.price.toLocaleString('fa-IR')} <span className="text-sm font-normal text-muted-foreground">تومان</span>
                </span>
              </div>
              <Button 
                size="lg" 
                disabled={cls.enrolled >= cls.capacity}
                className="rounded-xl px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                {cls.enrolled >= cls.capacity ? "تکمیل ظرفیت" : "ثبت نام"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
