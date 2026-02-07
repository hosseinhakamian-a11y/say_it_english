import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Calendar, GraduationCap, Headphones, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { containerVariants, itemVariants, pageVariants } from "@/lib/animations";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SEO } from "@/components/SEO";

export default function Home() {
  const features = [
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
  ];

  return (
    <>
      <SEO />
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="space-y-20 pb-20"
      >
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 md:pt-24 pb-32">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-accent/20 to-transparent" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-secondary/10 text-secondary-foreground text-sm font-bold mb-6 border border-secondary/20 glass"
              >
                <Sparkles className="w-4 h-4" />
                آموزش تخصصی زبان انگلیسی
              </motion.span>

              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-foreground leading-tight">
                زبان را <span className="gradient-text">ساده</span> و{" "}
                <span className="text-secondary-foreground bg-secondary/30 px-3 rounded-xl">لذت‌بخش</span> بیاموزید
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
              >
                با متدهای جدید آموزشی، پادکست‌های جذاب و کلاس‌های تعاملی، مسیر یادگیری خود را هموار کنید.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link href="/placement">
                  <Button size="lg" className="text-lg px-8 h-14 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all btn-press">
                    شروع تعیین سطح
                    <ArrowLeft className="mr-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/content">
                  <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-2xl glass hover:bg-white/80 border-2 btn-press">
                    مشاهده دوره‌ها
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid with Staggered Animation */}
        <section className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, idx) => (
              <Link key={idx} href={feature.href}>
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-2xl transition-all cursor-pointer h-full card-hover"
                >
                  <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </section>

        {/* About Section */}
        <section className="container mx-auto px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-primary rounded-[2.5rem] p-8 md:p-16"
          >
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold gradient-text">درباره مدرس</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  من مدرس زبان با بیش از ۱۰ سال سابقه تدریس هستم. هدف من کمک به شما برای یادگیری زبان انگلیسی به روشی کاربردی و موثر است. با استفاده از تکنیک‌های روز دنیا، مسیر یادگیری را برای شما کوتاه و لذت‌بخش می‌کنم.
                </p>
                <motion.ul
                  variants={containerVariants}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  className="space-y-3"
                >
                  {[
                    "مدرک بین‌المللی TESOL",
                    "مدرک تخصصی آیلتس (IELTS)",
                    "بیش از ۱۰ سال سابقه تدریس تخصصی"
                  ].map((item, i) => (
                    <motion.li key={i} variants={itemVariants} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="font-medium text-foreground/80">{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
              {/* Professional Teacher Portrait */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="w-full md:w-5/12 aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl"
              >
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800"
                  alt="Teacher Portrait"
                  className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                  containerClassName="w-full h-full"
                />
              </motion.div>
            </div>
          </motion.div>
        </section>
      </motion.div>
    </>
  );
}
