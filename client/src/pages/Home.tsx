import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Calendar, GraduationCap, Headphones } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="space-y-20 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-24 pb-32">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-accent/20 to-transparent" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-secondary/10 text-secondary-foreground text-sm font-bold mb-6 border border-secondary/20">
              🎓 آموزش تخصصی زبان انگلیسی
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-foreground leading-tight">
              زبان را <span className="text-primary">ساده</span> و <span className="text-secondary-foreground bg-secondary/30 px-2 rounded-lg">لذت‌بخش</span> بیاموزید
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              با متدهای جدید آموزشی، پادکست‌های جذاب و کلاس‌های تعاملی، مسیر یادگیری خود را هموار کنید.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/placement">
                <Button size="lg" className="text-lg px-8 h-14 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all">
                  شروع تعیین سطح
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/content">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white border-2">
                  مشاهده دوره‌ها
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: GraduationCap,
              title: "تعیین سطح هوشمند",
              desc: "سطح واقعی خود را با آزمون استاندارد ما بسنجید",
              color: "bg-blue-50 text-blue-600",
              href: "/placement"
            },
            {
              icon: Headphones,
              title: "پادکست‌های آموزشی",
              desc: "تقویت مهارت شنیداری با مطالب به‌روز و جذاب",
              color: "bg-amber-50 text-amber-600",
              href: "/content"
            },
            {
              icon: Calendar,
              title: "رزرو مشاوره",
              desc: "وقت مشاوره خصوصی با استاد رزرو کنید",
              color: "bg-green-50 text-green-600",
              href: "/bookings"
            },
            {
              icon: BookOpen,
              title: "کلاس‌های گروهی",
              desc: "یادگیری تعاملی در کنار سایر زبان‌آموزان",
              color: "bg-purple-50 text-purple-600",
              href: "/classes"
            }
          ].map((feature, idx) => (
            <Link key={idx} href={feature.href}>
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-xl transition-all cursor-pointer h-full"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 py-10">
        <div className="bg-primary/5 rounded-[2.5rem] p-8 md:p-16 border border-primary/10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-primary">درباره مدرس</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                من مدرس زبان با بیش از ۱۰ سال سابقه تدریس هستم. هدف من کمک به شما برای یادگیری زبان انگلیسی به روشی کاربردی و موثر است. با استفاده از تکنیک‌های روز دنیا، مسیر یادگیری را برای شما کوتاه و لذت‌بخش می‌کنم.
              </p>
              <ul className="space-y-3">
                {[
                  "کارشناسی ارشد آموزش زبان انگلیسی",
                  "مدرک بین‌المللی CELTA",
                  "بیش از ۱۰۰۰ دانش‌آموز موفق"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Unsplash image: Portrait of a friendly teacher/professional */}
            {/* <!-- teacher portrait friendly professional smiling --> */}
            <div className="w-full md:w-1/3 aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
              <img 
                src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80" 
                alt="Teacher Portrait" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
