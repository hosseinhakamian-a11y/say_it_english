
import { Link } from "wouter";
import { Play, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";

interface VideoCardProps {
    video: {
        id: string | { videoId: string }; // Handle both raw ID and resourceId object
        snippet: {
            title: string;
            description: string;
            thumbnails: {
                medium: { url: string };
                high: { url: string };
            };
            publishedAt: string;
            resourceId?: { videoId: string };
        };
    };
}

export function VideoCard({ video }: VideoCardProps) {
    // Extract video ID safely working with both Search and Playlist items
    const videoId = typeof video.id === 'string' ? video.id : (video.snippet.resourceId?.videoId || video.id.videoId);

    return (
        <Link href={`/videos/${videoId}`}>
            <motion.div whileHover={{ y: -5 }} className="h-full">
                <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 bg-card group cursor-pointer">
                    <CardHeader className="p-0">
                        <div className="relative overflow-hidden">
                            <AspectRatio ratio={16 / 9}>
                                <OptimizedImage
                                    src={video.snippet.thumbnails.high.url || video.snippet.thumbnails.medium.url}
                                    alt={video.snippet.title}
                                    className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                                    containerClassName="w-full h-full"
                                />
                            </AspectRatio>
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3">
                        <div className="flex items-center text-xs text-muted-foreground gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(video.snippet.publishedAt), "MMMM d, yyyy")}</span>
                        </div>
                        <h3 className="font-bold text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                            {video.snippet.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 text-right dir-rtl">
                            {video.snippet.description}
                        </p>
                    </CardContent>
                    <CardFooter className="p-5 pt-0">
                        <Button variant="secondary" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Play className="w-4 h-4 ml-1" />
                            تماشای ویدیو
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </Link>
    );
}
