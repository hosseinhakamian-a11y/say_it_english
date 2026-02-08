import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface VideoPlayerProps {
    // Primary source (Bunny/YouTube/Aparat for international)
    videoId: string | null;
    provider: string | null;
    // Secondary source (ArvanCloud for Iran / fallback)
    arvanVideoId?: string | null;
    arvanProvider?: string | null;
    title?: string;
    aspectRatio?: '16:9' | '9:16' | 'auto';
}

export function VideoPlayer({
    videoId,
    provider,
    arvanVideoId,
    arvanProvider,
    title,
    aspectRatio = 'auto'
}: VideoPlayerProps) {
    const [useArvan, setUseArvan] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Detect if user is likely in Iran (simple heuristic based on timezone)
    useEffect(() => {
        const isIran = Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Tehran');
        // If in Iran and ArvanCloud source exists, prefer it
        if (isIran && arvanVideoId && arvanProvider) {
            setUseArvan(true);
        }
    }, [arvanVideoId, arvanProvider]);

    // Determine which source to use
    const activeVideoId = useArvan ? arvanVideoId : videoId;
    const activeProvider = useArvan ? arvanProvider : provider;

    // Handle fallback when primary source fails
    const handleError = () => {
        if (!useArvan && arvanVideoId && arvanProvider) {
            // Try ArvanCloud fallback
            setUseArvan(true);
            setLoadError(false);
        } else if (useArvan && videoId && provider) {
            // Try primary source as fallback
            setUseArvan(false);
            setLoadError(false);
        } else {
            setLoadError(true);
        }
    };

    const handleLoad = () => {
        setIsLoading(false);
    };

    if (!activeVideoId || !activeProvider) {
        return (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                <span>ویدیویی برای نمایش وجود ندارد</span>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="aspect-video bg-gray-900 rounded-2xl flex flex-col items-center justify-center text-white gap-4 p-8">
                <AlertCircle className="w-12 h-12 text-red-400" />
                <p className="text-center text-sm text-red-400">خطا در بارگذاری ویدیو</p>
                <button
                    onClick={() => { setLoadError(false); setIsLoading(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    تلاش مجدد
                </button>
            </div>
        );
    }

    // Aparat Embed
    if (activeProvider === "aparat") {
        return (
            <div className="aspect-video rounded-2xl overflow-hidden shadow-xl bg-black relative">
                {isLoading && <LoadingOverlay />}
                <iframe
                    src={`https://www.aparat.com/video/video/embed/videohash/${activeVideoId}/vt/frame`}
                    title={title || "Aparat Video"}
                    allowFullScreen
                    className="w-full h-full"
                    onLoad={handleLoad}
                    onError={handleError}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
            </div>
        );
    }

    // YouTube Embed
    if (activeProvider === "youtube") {
        let ytId = activeVideoId;
        if (activeVideoId.includes("youtube.com") || activeVideoId.includes("youtu.be")) {
            const match = activeVideoId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
            if (match) ytId = match[1];
        }

        return (
            <div className="aspect-video rounded-2xl overflow-hidden shadow-xl bg-black relative">
                {isLoading && <LoadingOverlay />}
                <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title={title || "YouTube Video"}
                    allowFullScreen
                    className="w-full h-full"
                    onLoad={handleLoad}
                    onError={handleError}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
            </div>
        );
    }

    // Bunny.net Stream Embed (Vertical 9:16)
    if (activeProvider === "bunny") {
        let embedUrl = activeVideoId;
        if (activeVideoId.startsWith("http")) {
            embedUrl = activeVideoId.replace('/play/', '/embed/');
        } else {
            embedUrl = `https://iframe.mediadelivery.net/embed/595075/${activeVideoId}`;
        }

        return (
            <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10">
                {isLoading && <LoadingOverlay />}
                <div className="aspect-[9/16]">
                    <iframe
                        src={embedUrl}
                        title={title || "Video"}
                        allowFullScreen
                        className="w-full h-full"
                        loading="lazy"
                        onLoad={handleLoad}
                        onError={handleError}
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                        style={{ border: 'none' }}
                    />
                </div>
                <ProviderBadge provider="Bunny" isActive={!useArvan} />
            </div>
        );
    }

    // ArvanCloud VOD (Video Platform)
    if (activeProvider === "arvan-vod") {
        const embedUrl = activeVideoId.startsWith("http")
            ? activeVideoId
            : `https://player.arvancloud.ir/index.html?config=${activeVideoId}`;

        return (
            <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10">
                {isLoading && <LoadingOverlay />}
                <div className="aspect-[9/16]">
                    <iframe
                        src={embedUrl}
                        title={title || "Video"}
                        allowFullScreen
                        className="w-full h-full"
                        loading="lazy"
                        onLoad={handleLoad}
                        onError={handleError}
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                        style={{ border: 'none' }}
                    />
                </div>
                <ProviderBadge provider="ArvanCloud" isActive={useArvan} />
            </div>
        );
    }

    // ArvanCloud Storage (Direct link) or Custom
    return (
        <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-xl bg-black border border-white/10">
            {isLoading && <LoadingOverlay />}
            <div className="aspect-[9/16]">
                <video
                    src={activeVideoId}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    title={title}
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    onLoadedData={handleLoad}
                    onError={handleError}
                >
                    مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                </video>
            </div>
            <ProviderBadge provider={useArvan ? "ArvanCloud" : "CDN"} isActive={true} />
        </div>
    );
}

// Loading Overlay Component
function LoadingOverlay() {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );
}

// Provider Badge Component
function ProviderBadge({ provider, isActive }: { provider: string; isActive: boolean }) {
    return (
        <div className="absolute top-3 left-3 z-20">
            <div className={`px-3 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5 backdrop-blur-md
                ${isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                {provider}
            </div>
        </div>
    );
}
