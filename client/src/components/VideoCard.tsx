
import { Link } from "wouter";
import { Play, Calendar, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns-jalali"; // Use Jalali date if available, otherwise standard
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Content {
    id: number;
    title: string;
    description: string | null;
    type: string;
    level: string;
    thumbnailUrl: string | null;
    createdAt: string;
    isPremium: boolean;
    videoId: string | null;
    videoProvider: string | null;
}

interface VideoCardProps {
    video: Content;
}

export function VideoCard({ video }: VideoCardProps) {
    return (
        <Link href={`/videos/${video.id}`}>
            <motion.div whileHover={{ y: -5 }} className="h-full cursor-pointer">
                <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 bg-card group relative flex flex-col">
                    <CardHeader className="p-0">
                        <div className="relative overflow-hidden aspect-video">
                            {(() => {
                                let thumb = video.thumbnailUrl;
                                // Auto-use YouTube thumbnail if no custom one exists
                                if (!thumb && video.videoProvider === 'youtube' && video.videoId) {
                                    thumb = `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`;
                                }

                                return thumb ? (
                                    <OptimizedImage
                                        src={thumb}
                                        alt={video.title}
                                        className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                                        containerClassName="w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                                        <Play className="w-12 h-12 text-muted-foreground/30" />
                                    </div>
                                );
                            })()}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                                </div>
                            </div>

                            {/* Badges */}
                            <div className="absolute top-3 right-3 flex gap-2">
                                {video.isPremium ? (
                                    <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white shadow-sm backdrop-blur-sm">
                                        <Lock className="w-3 h-3 ml-1" />
                                        VIP
                                    </Badge>
                                ) : (
                                    <Badge className="bg-green-500/90 hover:bg-green-500 text-white shadow-sm backdrop-blur-sm">
                                        رایگان
                                    </Badge>
                                )}
                            </div>

                            {video.level && (
                                <Badge variant="secondary" className="absolute bottom-3 left-3 bg-black/50 hover:bg-black/60 text-white backdrop-blur-sm text-xs border-0">
                                    {video.level === 'beginner' ? 'مبتدی' : video.level === 'intermediate' ? 'متوسط' : 'پیشرفته'}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-2 flex-grow">
                        <div className="flex items-center text-xs text-muted-foreground gap-2 mb-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(video.createdAt).toLocaleDateString('fa-IR')}</span>
                        </div>
                        <h3 className="font-bold text-lg line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {video.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 text-right dir-rtl leading-relaxed">
                            {video.description || "بدون توضیحات"}
                        </p>
                    </CardContent>

                    <CardFooter className="p-4 pt-0 mt-auto">
                        <Button variant="secondary" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 rounded-xl">
                            <Play className="w-4 h-4 ml-1" />
                            تماشای درس
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </Link>
    );
}
