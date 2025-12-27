import { useContent } from "@/hooks/use-content";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, FileText, Lock } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

// Mock data for display purposes since DB might be empty initially
const mockContent = [
  {
    id: 1,
    title: "مقدمه‌ای بر مکالمه روزمره",
    description: "یادگیری اصطلاحات پرکاربرد در گفتگوهای روزانه به زبان انگلیسی.",
    type: "podcast",
    level: "beginner",
    isPremium: false,
    duration: "۱۵ دقیقه",
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?w=500&q=80"
  },
  {
    id: 2,
    title: "گرامر پیشرفته: زمان‌ها",
    description: "بررسی دقیق تفاوت‌های زمان حال کامل و گذشته ساده.",
    type: "article",
    level: "advanced",
    isPremium: true,
    readTime: "۱۰ دقیقه",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&q=80"
  },
  {
    id: 3,
    title: "اصطلاحات کسب و کار",
    description: "واژگان ضروری برای جلسات کاری و محیط اداری.",
    type: "podcast",
    level: "intermediate",
    isPremium: false,
    duration: "۲۰ دقیقه",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&q=80"
  },
  {
    id: 4,
    title: "داستان کوتاه: سفر به ماه",
    description: "تقویت مهارت خواندن با داستان‌های جذاب علمی تخیلی.",
    type: "article",
    level: "intermediate",
    isPremium: true,
    readTime: "۱۲ دقیقه",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80"
  },
];

export default function ContentLibrary() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");

  const filteredContent = filter === "all" 
    ? mockContent 
    : mockContent.filter(c => c.level === filter);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">محتوای آموزشی</h1>
          <p className="text-muted-foreground">دسترسی به صدها پادکست و مقاله آموزشی برای تقویت زبان شما</p>
        </div>
        
        <Tabs defaultValue="all" onValueChange={setFilter} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-4 md:w-[400px] bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg">همه</TabsTrigger>
            <TabsTrigger value="beginner" className="rounded-lg">مبتدی</TabsTrigger>
            <TabsTrigger value="intermediate" className="rounded-lg">متوسط</TabsTrigger>
            <TabsTrigger value="advanced" className="rounded-lg">پیشرفته</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredContent.map((item) => (
          <Card key={item.id} className="group overflow-hidden rounded-3xl border border-border/50 hover:shadow-xl transition-all duration-300 flex flex-col h-full bg-card">
            <div className="relative h-48 overflow-hidden">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />
              {/* <!-- educational content image learning english --> */}
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <Badge className="absolute top-4 right-4 z-20 bg-white/90 text-foreground backdrop-blur-sm shadow-sm hover:bg-white">
                {item.level === 'beginner' ? 'مبتدی' : item.level === 'intermediate' ? 'متوسط' : 'پیشرفته'}
              </Badge>
              {item.isPremium && (
                <div className="absolute top-4 left-4 z-20 bg-amber-400 text-amber-900 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm">
                  <Lock className="w-3 h-3" />
                  VIP
                </div>
              )}
            </div>
            
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center gap-2 mb-3">
                {item.type === 'podcast' ? (
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <span className="text-xs font-medium text-muted-foreground">
                  {item.type === 'podcast' ? `پادکست • ${item.duration}` : `مقاله • ${item.readTime}`}
                </span>
              </div>
              <h3 className="font-bold text-xl leading-snug group-hover:text-primary transition-colors">
                {item.title}
              </h3>
            </CardHeader>
            
            <CardContent className="p-6 pt-2 flex-grow">
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                {item.description}
              </p>
            </CardContent>
            
            <CardFooter className="p-6 pt-0">
              <Button className="w-full rounded-xl py-6 shadow-lg shadow-primary/10 group-hover:shadow-primary/20 transition-all">
                {item.type === 'podcast' ? 'گوش دادن' : 'خواندن مطلب'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
