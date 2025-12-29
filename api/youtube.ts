
import { Router } from "express";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const youtubeRouter = Router();

// Function to load videos from JSON file
function loadVideosFromFile(): any[] | null {
    try {
        const filePath = join(process.cwd(), "data", "videos.json");
        if (existsSync(filePath)) {
            const data = readFileSync(filePath, "utf-8");
            return JSON.parse(data);
        }
    } catch (error) {
        console.log("Could not load videos.json, using fallback");
    }
    return null;
}

// Fallback mock data
const FALLBACK_VIDEOS = [
    {
        id: "demo-1",
        snippet: {
            title: "ویدیوی نمونه - به زودی ویدیوهای واقعی اضافه می‌شوند",
            description: "این یک ویدیوی نمونه است. برای اضافه کردن ویدیوهای واقعی، فایل data/videos.json را ویرایش کنید.",
            thumbnails: {
                medium: { url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60" },
                high: { url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60" },
            },
            publishedAt: "2024-12-01T10:00:00Z",
            resourceId: { videoId: "demo-1" }
        }
    }
];

let cachedVideos: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes cache for file reads

youtubeRouter.get("/videos", async (req, res) => {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;

        // Priority 1: If API key exists, fetch from YouTube
        if (apiKey) {
            const channelId = process.env.YOUTUBE_CHANNEL_ID;

            // Check cache
            if (cachedVideos && (Date.now() - lastFetchTime < CACHE_DURATION * 12)) { // 1 hour for API
                return res.json(cachedVideos);
            }

            try {
                const channelResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
                );

                if (channelResponse.ok) {
                    const channelData = await channelResponse.json();
                    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

                    if (uploadsPlaylistId) {
                        const videosResponse = await fetch(
                            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=20&key=${apiKey}`
                        );

                        if (videosResponse.ok) {
                            const videosData = await videosResponse.json();
                            cachedVideos = videosData.items;
                            lastFetchTime = Date.now();
                            return res.json(cachedVideos);
                        }
                    }
                }
            } catch (apiError) {
                console.log("YouTube API error, falling back to file");
            }
        }

        // Priority 2: Load from videos.json file
        // Check cache first
        if (cachedVideos && (Date.now() - lastFetchTime < CACHE_DURATION)) {
            return res.json(cachedVideos);
        }

        const fileVideos = loadVideosFromFile();
        if (fileVideos && fileVideos.length > 0) {
            cachedVideos = fileVideos;
            lastFetchTime = Date.now();
            return res.json(fileVideos);
        }

        // Priority 3: Fallback to demo data
        res.json(FALLBACK_VIDEOS);

    } catch (error) {
        console.error("Error fetching videos:", error);
        res.json(FALLBACK_VIDEOS);
    }
});
