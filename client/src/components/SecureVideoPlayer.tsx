import { useState } from 'react';
import { Loader2, Lock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecureVideoPlayerProps {
    contentId: number;
    poster?: string;
}

export function SecureVideoPlayer({ contentId, poster }: SecureVideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // This is the endpoint that will redirect to the actual ArvanCloud signed URL
    const videoSourceUrl = `/api/download?id=${contentId}&stream=true`;

    const handlePlay = () => {
        setIsPlaying(true);
    };

    const handleError = () => {
        setError("خطا در بارگذاری ویدیو. ممکن است دسترسی شما منقضی شده باشد یا فایل وجود نداشته باشد.");
        setIsPlaying(false);
    };

    if (error) {
        return (
            <div className="w-full aspect-video bg-gray-900 rounded-[2rem] flex flex-col items-center justify-center text-white gap-4 p-8 border border-red-900/20 glass">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
                    <Lock className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-center text-sm text-red-400 max-w-xs leading-relaxed">{error}</p>
                <Button
                    variant="outline"
                    onClick={() => { setError(null); setIsPlaying(false); }}
                    className="rounded-xl border-white/20 hover:bg-white/10 text-white"
                >
                    تلاش مجدد
                </Button>
            </div>
        );
    }

    if (isPlaying) {
        return (
            <div className="w-full aspect-video bg-black rounded-[2rem] overflow-hidden relative shadow-2xl border border-white/5 shadow-primary/20">
                <video
                    controls
                    autoPlay
                    className="w-full h-full"
                    poster={poster}
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    onError={handleError}
                    onLoadStart={() => setLoading(true)}
                    onCanPlay={() => setLoading(false)}
                >
                    <source src={videoSourceUrl} type="video/mp4" />
                    مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                </video>
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full aspect-video bg-gray-900 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group shadow-xl border border-white/5">
            {poster ? (
                <img
                    src={poster}
                    alt="Video Poster"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-30 transition-all duration-700 group-hover:scale-105"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-black/60" />
            )}

            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />

            <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="z-10"
            >
                <Button
                    size="lg"
                    onClick={handlePlay}
                    className="bg-primary hover:bg-primary/90 text-white rounded-full w-20 h-20 flex items-center justify-center pl-1 shadow-2xl shadow-primary/40 group-hover:shadow-primary/60 transition-all duration-500"
                >
                    <Play fill="currentColor" className="w-8 h-8" />
                </Button>
            </motion.div>

            <p className="z-10 mt-6 text-white font-bold text-lg drop-shadow-lg tracking-wide">
                مشاهده ویدیو آموزشی
            </p>
            <div className="z-10 mt-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-[10px] text-white/70 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Secure Stream Active
            </div>
        </div>
    );
}

// Separate import for motion to avoid issues if not used correctly
import { motion } from "framer-motion";
const motion_div = motion.div;
