import { useState, useEffect } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecureVideoPlayerProps {
    contentId: number;
    poster?: string;
}

export function SecureVideoPlayer({ contentId, poster }: SecureVideoPlayerProps) {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Only fetch when the user interacts or component mounts?
        // Let's fetch immediately for now, or we can put a "Click to Play" overlay.
        // Ideally, we fetch the signed URL only when they want to play to maximize the 1-hour window.
        // But for simplicity, let's fetch on mount.

        // Better UX: Show poster, click to load.
    }, [contentId]);

    const loadVideo = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/download?id=${contentId}&stream=true`, {
                method: 'GET',
                credentials: 'include',
            });

            if (res.status === 403) {
                throw new Error("برای مشاهده این ویدیو باید آن را خریداری کنید.");
            }
            if (res.status === 401) {
                throw new Error("لطفا ابتدا وارد حساب کاربری شوید.");
            }

            // Since the API redirects (302), fetch might follow it automatically.
            // If we used `res.url`, we might get the final Signed URL.
            if (res.ok) {
                // The fetch request usually follows redirects transparently.
                // So `res.url` should be the final Arvan URL.
                setVideoUrl(res.url);
            } else {
                throw new Error("خطا در دریافت ویدیو");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="w-full aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center text-white gap-4 p-4">
                <Lock className="w-12 h-12 text-gray-500" />
                <p className="text-center text-sm text-red-400">{error}</p>
                <Button variant="outline" onClick={loadVideo} className="text-black">تلاش مجدد</Button>
            </div>
        );
    }

    if (videoUrl) {
        return (
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative">
                <video
                    controls
                    autoPlay
                    className="w-full h-full"
                    poster={poster}
                    controlsList="nodownload" // Basic HTML5 attempt to hide download button
                    onContextMenu={(e) => e.preventDefault()} // Disable right click
                >
                    <source src={videoUrl} type="video/mp4" />
                    مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                </video>
            </div>
        );
    }

    return (
        <div className="w-full aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center relative overflow-hidden group">
            {poster && (
                <img src={poster} alt="Video Poster" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" />
            )}

            <Button
                size="lg"
                onClick={loadVideo}
                disabled={loading}
                className="z-10 bg-green-600 hover:bg-green-700 text-white rounded-full w-16 h-16 flex items-center justify-center pl-1"
            >
                {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </Button>
            <p className="z-10 mt-4 text-white font-medium text-sm drop-shadow-md">
                {loading ? "در حال دریافت مجوز پخش..." : "مشاهده ویدیو"}
            </p>
        </div>
    );
}
