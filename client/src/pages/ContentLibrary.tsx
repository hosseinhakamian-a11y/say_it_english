import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PlayCircle, FileText, Lock, Video, Loader2, Gift, Crown,
  ExternalLink, Headphones, BookOpen, Package, Sparkles, ArrowLeft
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { VideoPlayer } from "@/components/VideoPlayer";
import { motion, AnimatePresence } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";
import { CardSkeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SEO } from "@/components/SEO";
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

type FilterType = "all" | "free" | "premium" | "package";

export default function ContentLibrary() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FilterType>("all");
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
      const res = await fetch("/api/purchases", { credentials: "include" });
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
  });

  const hasUserPurchased = (contentId: number) => {
    return purchases?.some(p => p.contentId === contentId) || false;
  };

  // Filter logic based on new categories
  const filteredContent = contentList?.filter(item => {
    if (filter === "all") return true;
    if (filter === "free") return !item.isPremium;
    if (filter === "premium") return item.isPremium && item.type !== "package";
    if (filter === "package") return item.type === "package" || item.type === "course";
    return true;
  });

  // Separate content by category for display
  const freeContent = contentList?.filter(c => !c.isPremium) || [];
  const premiumContent = contentList?.filter(c => c.isPremium) || [];

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
      case "podcast": return <Headphones className="w-5 h-5" />;
      case "article": return <BookOpen className="w-5 h-5" />;
      case "package":
      case "course": return <Package className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "video": return "ویدیو";
      case "podcast": return "پادکست";
      case "article": return "مقاله";
      case "package":
      case "course": return "پکیج";
      default: return "محتوا";
    }
  };

  const ContentCard = ({ item }: { item: Content }) => {
    const isPurchased = hasUserPurchased(item.id);
    const isLocked = item.isPremium && !isPurchased && !user;

    return (
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        layout
      >
        <Card className="group overflow-hidden rounded-3xl border border-border/50 hover:shadow-2xl transition-all duration-300 flex flex-col h-full bg-card card-hover relative">
          {/* Thumbnail */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <div className="absolute inset-0">
              {(() => {
                let thumb = item.thumbnailUrl;
                // Auto-use YouTube thumbnail if no custom one exists and it's a youtube video
                if (!thumb && item.videoProvider === 'youtube' && item.videoId) {
                  thumb = `https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`;
                }

                return (
                  <OptimizedImage
                    src={thumb || (
                      item.type === 'video' ? "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500" :
                        item.type === 'podcast' ? "https://images.unsplash.com/photo-1590602847861-f357a9302bbc?w=500" :
                          item.type === 'package' || item.type === 'course' ? "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=500" :
                            "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500"
                    )}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    containerClassName="w-full h-full"
                  />
                );
              })()}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            </div>

            {/* Level Badge */}
            <Badge className="absolute top-4 right-4 z-20 bg-white/90 text-foreground backdrop-blur-sm shadow-sm hover:bg-white">
              {getLevelLabel(item.level)}
            </Badge>

            {/* Premium/Free Badge */}
            {item.isPremium ? (
              <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                <Crown className="w-3.5 h-3.5" />
                پریمیوم
              </div>
            ) : (
              <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                <Gift className="w-3.5 h-3.5" />
                رایگان
              </div>
            )}

            {/* Type indicator */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 text-white/90 text-xs font-medium bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
              {getTypeIcon(item.type)}
              <span>{getTypeLabel(item.type)}</span>
            </div>

            {/* Lock Overlay for premium content */}
            {isLocked && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="bg-white/90 rounded-full p-4">
                  <Lock className="w-8 h-8 text-amber-600" />
                </div>
              </div>
            )}
          </div>

          <CardHeader className="p-6 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-lg ${item.type === 'video' ? 'bg-red-100 text-red-600' :
                item.type === 'podcast' ? 'bg-purple-100 text-purple-600' :
                  item.type === 'package' || item.type === 'course' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                }`}>
                {getTypeIcon(item.type)}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {getTypeLabel(item.type)}
              </span>
              {isPurchased && (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 mr-auto text-[10px]">
                  ✓ خریداری شده
                </Badge>
              )}
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
            {item.isPremium && item.price && !isPurchased ? (
              <>
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-xs text-muted-foreground">قیمت:</span>
                  <span className="text-amber-600 font-bold text-lg">
                    {new Intl.NumberFormat("fa-IR").format(item.price)} تومان
                  </span>
                </div>
                <Button
                  className="w-full rounded-xl py-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg btn-press"
                  onClick={() => navigate(`/payment/${item.id}`)}
                >
                  <Lock className="ml-2 h-4 w-4" />
                  خرید و دسترسی
                </Button>
                <Button
                  variant="ghost"
                  className="w-full rounded-xl text-sm"
                  onClick={() => navigate(`/course/${item.id}`)}
                >
                  مشاهده پیش‌نمایش
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
              </>
            ) : isPurchased ? (
              <Button
                className="w-full rounded-xl py-6 bg-green-600 hover:bg-green-700 shadow-lg btn-press"
                onClick={() => navigate(`/course/${item.id}`)}
              >
                <PlayCircle className="ml-2 h-5 w-5" />
                مشاهده کامل
              </Button>
            ) : (
              <Button
                className="w-full rounded-xl py-6 shadow-lg shadow-primary/10 group-hover:shadow-primary/20 transition-all btn-press"
                onClick={() => navigate(`/course/${item.id}`)}
              >
                {item.type === 'video' ? 'مشاهده ویدیو' :
                  item.type === 'podcast' ? 'گوش دادن' :
                    item.type === 'article' ? 'خواندن مقاله' : 'مشاهده'}
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    );
  };

  return (
    <>
      <SEO
        title="کتابخانه محتوا"
        description="دسترسی به بهترین ویدیوها، پادکست‌ها و مقالات آموزشی برای یادگیری زبان انگلیسی"
        keywords="ویدیو آموزشی, پادکست انگلیسی, مقالات زبان, یادگیری خودآموز"
      />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl text-primary-foreground shadow-lg shadow-primary/30">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">دوره‌های آموزشی</h1>
                <p className="text-muted-foreground">مجموعه‌ای از دوره‌های ویدیویی، صوتی و متنی</p>
              </div>
            </div>
          </div>

          {/* New Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-4 md:w-[500px] bg-muted/50 p-1.5 rounded-2xl h-auto">
              <TabsTrigger value="all" className="rounded-xl py-3 data-[state=active]:shadow-md">
                <Sparkles className="w-4 h-4 ml-1.5 hidden sm:block" />
                همه
              </TabsTrigger>
              <TabsTrigger value="free" className="rounded-xl py-3 data-[state=active]:shadow-md data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                <Gift className="w-4 h-4 ml-1.5 hidden sm:block" />
                رایگان
              </TabsTrigger>
              <TabsTrigger value="premium" className="rounded-xl py-3 data-[state=active]:shadow-md data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
                <Crown className="w-4 h-4 ml-1.5 hidden sm:block" />
                پریمیوم
              </TabsTrigger>
              <TabsTrigger value="package" className="rounded-xl py-3 data-[state=active]:shadow-md data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                <Package className="w-4 h-4 ml-1.5 hidden sm:block" />
                پکیج‌ها
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-muted/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{contentList?.length || 0}</p>
            <p className="text-xs text-muted-foreground">کل محتوا</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{freeContent.length}</p>
            <p className="text-xs text-muted-foreground">رایگان</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{premiumContent.length}</p>
            <p className="text-xs text-muted-foreground">پریمیوم</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{purchases?.length || 0}</p>
            <p className="text-xs text-muted-foreground">خریداری شده</p>
          </div>
        </div>

        {/* CTA Banner for non-subscribers */}
        {!user && premiumContent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">🎁 دسترسی نامحدود به همه محتوا</h2>
                <p className="text-white/80 text-sm md:text-base">
                  با خرید اشتراک، به {premiumContent.length} محتوای پریمیوم دسترسی پیدا کنید
                </p>
              </div>
              <Button
                size="lg"
                className="bg-white text-amber-600 hover:bg-white/90 rounded-xl font-bold shadow-xl"
                onClick={() => navigate("/pricing")}
              >
                مشاهده پلن‌ها
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Content Grid */}
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
            <p className="text-xl">محتوایی در این دسته‌بندی یافت نشد.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setFilter("all")}
            >
              مشاهده همه محتوا
            </Button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredContent?.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </AnimatePresence>
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
    </>
  );
}
