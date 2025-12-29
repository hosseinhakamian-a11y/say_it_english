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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : filteredContent?.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">هنوز محتوایی اضافه نشده است.</p>
          <p className="text-sm mt-2">مدرس می‌تواند از پنل ادمین محتوای جدید اضافه کند.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredContent?.map((item) => (
            <Card key={item.id} className="group overflow-hidden rounded-3xl border border-border/50 hover:shadow-xl transition-all duration-300 flex flex-col h-full bg-card">
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-primary/30">
                  {getTypeIcon(item.type)}
                  <span className="sr-only">{item.type}</span>
                </div>
                <Badge className="absolute top-4 right-4 z-20 bg-white/90 text-foreground backdrop-blur-sm shadow-sm hover:bg-white">
                  {getLevelLabel(item.level)}
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
                {item.isPremium && item.price ? (
                  <>
                    <p className="text-center text-amber-700 font-bold text-lg">
                      {new Intl.NumberFormat("fa-IR").format(item.price)} تومان
                    </p>
                    <Button
                      className="w-full rounded-xl py-6 bg-amber-500 hover:bg-amber-600 shadow-lg"
                      onClick={() => navigate(`/payment/${item.id}`)}
                    >
                      <Lock className="ml-2 h-4 w-4" />
                      خرید دوره
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full rounded-xl py-6 shadow-lg shadow-primary/10 group-hover:shadow-primary/20 transition-all"
                    onClick={() => setSelectedContent(item)}
                  >
                    {item.type === 'video' ? 'مشاهده ویدیو' : item.type === 'podcast' ? 'گوش دادن' : 'خواندن مطلب'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
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

