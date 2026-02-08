
interface VideoPlayerProps {
    videoId: string | null;
    provider: string | null;
    title?: string;
    aspectRatio?: '16:9' | '9:16' | 'auto'; // New: Support vertical videos
}

export function VideoPlayer({ videoId, provider, title, aspectRatio = 'auto' }: VideoPlayerProps) {
    if (!videoId || !provider) {
        return (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                <span>ویدیویی برای نمایش وجود ندارد</span>
            </div>
        );
    }

    // Determine aspect ratio class
    const getAspectClass = () => {
        if (aspectRatio === '9:16') return 'aspect-[9/16] max-w-[280px] mx-auto'; // Vertical video
        if (aspectRatio === '16:9') return 'aspect-video'; // Horizontal video
        // Auto: detect from URL pattern or default to 16:9
        return 'aspect-video';
    };

    // Aparat Embed
    if (provider === "aparat") {
        return (
            <div className={`${getAspectClass()} rounded-2xl overflow-hidden shadow-xl bg-black`}>
                <iframe
                    src={`https://www.aparat.com/video/video/embed/videohash/${videoId}/vt/frame`}
                    title={title || "Aparat Video"}
                    allowFullScreen
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
            </div>
        );
    }

    // YouTube Embed
    if (provider === "youtube") {
        let ytId = videoId;
        if (videoId.includes("youtube.com") || videoId.includes("youtu.be")) {
            const match = videoId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
            if (match) ytId = match[1];
        }

        return (
            <div className={`${getAspectClass()} rounded-2xl overflow-hidden shadow-xl bg-black`}>
                <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title={title || "YouTube Video"}
                    allowFullScreen
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
            </div>
        );
    }

    // Bunny.net Stream Embed (Optimized for 9:16 Vertical Videos)
    if (provider === "bunny") {
        // Convert /play/ to /embed/ if needed, and handle full URLs or just IDs
        let embedUrl = videoId;
        if (videoId.startsWith("http")) {
            // Replace /play/ with /embed/ for proper embedding
            embedUrl = videoId.replace('/play/', '/embed/');
        } else {
            // If just an ID is provided, we need the library ID
            embedUrl = `https://iframe.mediadelivery.net/embed/595075/${videoId}`;
        }

        // For Bunny, we use a special container optimized for mobile-first vertical content
        return (
            <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10">
                <div className="aspect-[9/16]">
                    <iframe
                        src={embedUrl}
                        title={title || "Video"}
                        allowFullScreen
                        className="w-full h-full"
                        loading="lazy"
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                        style={{ border: 'none' }}
                    />
                </div>
            </div>
        );
    }

    // Custom/Direct Link (CDN or ArvanCloud)
    return (
        <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-xl bg-black border border-white/10">
            <div className="aspect-[9/16]">
                <video
                    src={videoId}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    title={title}
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                >
                    مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                </video>
            </div>
        </div>
    );
}
