import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, FileText, Lock, Video, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { VideoPlayer } from "@/components/VideoPlayer";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";
import { CardSkeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Content {
  id: number;
  title: string;
  description: string | null;
  type: string;
  level: string;
  contentUrl: string | null;
  videoId: string | null;
  videoProvider: string | null;
  isPremium: boolean;
  price: number | null;
  thumbnailUrl?: string | null;
  createdAt: string;
}

export default function ContentLibrary() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState("all");
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  const { data: contentList, isLoading } = useQuery<Content[]>({
    queryKey: [api.content.list.path],
    queryFn: async () => {
      const res = await fetch(api.content.list.path);
      if (!res.ok) throw new Error("Failed to fetch content");
      return await res.json();
    },
  });

  const { data: purchases } = useQuery<{ contentId: number }[]>({
    queryKey: ["/api/purchases"],
    queryFn: async () => {
      const res = await fetch("/api/purchases");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
  });

  const hasUserPurchased = (contentId: number) => {
    return purchases?.some(p => p.contentId === contentId) || false;
  };

  const filteredContent = filter === "all"
    ? contentList
    : contentList?.filter(c => c.level === filter);

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "beginner": return "مبتدی";
      case "intermediate": return "متوسط";
      case "advanced": return "پیشرفته";
      default: return level;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-5 h-5" />;
      case "podcast": return <PlayCircle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">محتوای آموزشی</h1>
          <p className="text-muted-foreground">دسترسی به ویدیو، پادکست و مقالات آموزشی</p>
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredContent?.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 text-muted-foreground"
        >
          <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">هنوز محتوایی اضافه نشده است.</p>
          <p className="text-sm mt-2">مدرس می‌تواند از پنل ادمین محتوای جدید اضافه کند.</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredContent?.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="group overflow-hidden rounded-3xl border border-border/50 hover:shadow-2xl transition-all duration-300 flex flex-col h-full bg-card card-hover">
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="absolute inset-0">
                    <OptimizedImage
                      src={item.thumbnailUrl || (
                        item.type === 'video' ? "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500" :
                          item.type === 'podcast' ? "https://images.unsplash.com/photo-1590602847861-f357a9302bbc?w=500" :
                            "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500"
                      )}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                  </div>

                  <Badge className="absolute top-4 right-4 z-20 bg-white/90 text-foreground backdrop-blur-sm shadow-sm hover:bg-white">
                    {getLevelLabel(item.level)}
                  </Badge>
                  {item.isPremium && (
                    <div className="absolute top-4 left-4 z-20 bg-amber-400 text-amber-900 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm uppercase tracking-wider">
                      <Lock className="w-3 h-3" />
                      VIP
                    </div>
                  )}
                  <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 text-white/90 text-xs font-medium">
                    {getTypeIcon(item.type)}
                  </div>
                </div>

                <CardHeader className="p-6 pb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${item.type === 'video' ? 'bg-red-100 text-red-600' :
                      item.type === 'podcast' ? 'bg-purple-100 text-purple-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                      {getTypeIcon(item.type)}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.type === 'video' ? 'ویدیو' : item.type === 'podcast' ? 'پادکست' : 'مقاله'}
                    </span>
                  </div>
                  <h3 className="font-bold text-xl leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </CardHeader>

                <CardContent className="p-6 pt-2 flex-grow">
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                    {item.description || "بدون توضیحات"}
                  </p>
                </CardContent>

                <CardFooter className="p-6 pt-0 flex-col gap-2">
                  {item.isPremium && item.price && !hasUserPurchased(item.id) ? (
                    <>
                      <p className="text-center text-amber-700 font-bold text-lg">
                        {new Intl.NumberFormat("fa-IR").format(item.price)} تومان
                      </p>
                      <Button
                        className="w-full rounded-xl py-6 bg-amber-500 hover:bg-amber-600 shadow-lg btn-press"
                        onClick={() => navigate(`/payment/${item.id}`)}
                      >
                        <Lock className="ml-2 h-4 w-4" />
                        خرید دوره
                      </Button>
                    </>
                  ) : hasUserPurchased(item.id) ? (
                    <>
                      <p className="text-center text-green-600 font-medium text-sm">✅ شما این دوره را خریداری کرده‌اید</p>
                      <Button
                        className="w-full rounded-xl py-6 shadow-lg shadow-primary/10 group-hover:shadow-primary/20 transition-all btn-press"
                        onClick={() => setSelectedContent(item)}
                      >
                        مشاهده دوره
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full rounded-xl py-6 shadow-lg shadow-primary/10 group-hover:shadow-primary/20 transition-all btn-press"
                      onClick={() => setSelectedContent(item)}
                    >
                      {item.type === 'video' ? 'مشاهده ویدیو' : item.type === 'podcast' ? 'گوش دادن' : 'خواندن مطلب'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Video Player Modal */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden" dir="rtl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold">{selectedContent?.title}</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            <VideoPlayer
              videoId={selectedContent?.videoId || null}
              provider={selectedContent?.videoProvider || null}
              title={selectedContent?.title}
            />
            {selectedContent?.description && (
              <p className="mt-4 text-muted-foreground">{selectedContent.description}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
