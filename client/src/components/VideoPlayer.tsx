
interface VideoPlayerProps {
    videoId: string | null;
    provider: string | null;
    title?: string;
}

export function VideoPlayer({ videoId, provider, title }: VideoPlayerProps) {
    if (!videoId || !provider) {
        return (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                <span>ویدیویی برای نمایش وجود ندارد</span>
            </div>
        );
    }

    // Aparat Embed
    if (provider === "aparat") {
        return (
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
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
        // Extract video ID if full URL is provided
        let ytId = videoId;
        if (videoId.includes("youtube.com") || videoId.includes("youtu.be")) {
            const match = videoId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
            if (match) ytId = match[1];
        }

        return (
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
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

    // Bunny.net Stream Embed
    if (provider === "bunny") {
        // Bunny stream format: https://iframe.mediadelivery.net/embed/{library_id}/{video_id}
        // User needs to provide the full embed URL or we construct it
        const embedUrl = videoId.startsWith("http")
            ? videoId
            : `https://iframe.mediadelivery.net/embed/YOUR_LIBRARY_ID/${videoId}`;

        return (
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                <iframe
                    src={embedUrl}
                    title={title || "Video"}
                    allowFullScreen
                    className="w-full h-full"
                    loading="lazy"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                />
            </div>
        );
    }

    // Custom/Direct Link
    return (
        <div className="aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
            <video
                src={videoId}
                controls
                className="w-full h-full"
                title={title}
            >
                مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
            </video>
        </div>
    );
}
