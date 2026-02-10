import { useState, useEffect, useRef } from 'react';
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
    const [failedSources, setFailedSources] = useState<Set<string>>(new Set());
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-detect Iran users and check bunny.net connectivity
    useEffect(() => {
        const isIran = Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Tehran');

        if (isIran && provider === 'bunny') {
            // For Iranian users with bunny provider, try to reach bunny first
            // If it fails within 5 seconds, auto-fallback
            if (arvanVideoId && arvanProvider) {
                setUseArvan(true); // Default to arvan for Iranian users
            } else if (videoId && provider === 'bunny') {
                // No arvan fallback, try bunny but with timeout
                timeoutRef.current = setTimeout(() => {
                    if (isLoading) {
                        setLoadError(true);
                    }
                }, 8000);
            }
        } else if (isIran && arvanVideoId && arvanProvider) {
            setUseArvan(true);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [arvanVideoId, arvanProvider, provider, videoId]);

    // Determine which source to use
    const activeVideoId = useArvan ? arvanVideoId : videoId;
    const activeProvider = useArvan ? arvanProvider : provider;

    // Handle fallback when primary source fails
    const handleError = () => {
        const currentSource = `${activeProvider}:${activeVideoId}`;
        const newFailed = new Set(failedSources);
        newFailed.add(currentSource);
        setFailedSources(newFailed);

        if (!useArvan && arvanVideoId && arvanProvider) {
            // Try ArvanCloud fallback
            setUseArvan(true);
            setIsLoading(true);
        } else if (useArvan && videoId && provider) {
            // Try primary source as fallback
            const primarySource = `${provider}:${videoId}`;
            if (!newFailed.has(primarySource)) {
                setUseArvan(false);
                setIsLoading(true);
            } else {
                setLoadError(true);
            }
        } else {
            setLoadError(true);
        }
    };

    const handleLoad = () => {
        setIsLoading(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    // Manual toggle between sources
    const toggleSource = () => {
        if (useArvan && videoId && provider) {
            setUseArvan(false);
            setIsLoading(true);
            setLoadError(false);
        } else if (!useArvan && arvanVideoId && arvanProvider) {
            setUseArvan(true);
            setIsLoading(true);
            setLoadError(false);
        }
    };

    const hasAlternateSource = (useArvan && videoId && provider) || (!useArvan && arvanVideoId && arvanProvider);

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
                <div className="flex gap-3">
                    <button
                        onClick={() => { setLoadError(false); setIsLoading(true); setFailedSources(new Set()); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        تلاش مجدد
                    </button>
                    {hasAlternateSource && (
                        <button
                            onClick={toggleSource}
                            className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-full text-sm transition-colors"
                        >
                            سرور جایگزین
                        </button>
                    )}
                </div>
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
                {hasAlternateSource && <SourceToggle onToggle={toggleSource} isArvan={useArvan} />}
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
                <ProviderBadge provider="B" isActive={!useArvan} />
                {hasAlternateSource && <SourceToggle onToggle={toggleSource} isArvan={useArvan} />}
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
                <ProviderBadge provider="A" isActive={useArvan} />
                {hasAlternateSource && <SourceToggle onToggle={toggleSource} isArvan={useArvan} />}
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
            <ProviderBadge provider={useArvan ? "A" : "B"} isActive={true} />
            {hasAlternateSource && <SourceToggle onToggle={toggleSource} isArvan={useArvan} />}
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

// Source Toggle Button - small non-intrusive toggle
function SourceToggle({ onToggle, isArvan }: { onToggle: () => void; isArvan: boolean }) {
    return (
        <button
            onClick={onToggle}
            className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full text-[10px] font-medium bg-black/50 text-white/70 hover:text-white border border-white/10 hover:border-white/30 backdrop-blur-md transition-all"
            title={isArvan ? "تغییر به سرور اصلی" : "تغییر به سرور ایران"}
        >
            {isArvan ? "🌐 سرور اصلی" : "🇮🇷 سرور ایران"}
        </button>
    );
}
