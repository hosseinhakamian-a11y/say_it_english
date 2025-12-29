
import { Router } from "express";

export const youtubeRouter = Router();

// Videos data - Edit this array to add/remove videos
// To add a new video: Copy a video block and change the videoId from the YouTube URL
// YouTube URL format: https://www.youtube.com/watch?v=VIDEO_ID
const VIDEOS = [
    {
        id: "0jblRoyR-Jk",
        snippet: {
            title: "ویدیوی آموزشی Say It English - قسمت ۱",
            description: "آموزش زبان انگلیسی با متد Say It English",
            thumbnails: {
                medium: { url: "https://img.youtube.com/vi/0jblRoyR-Jk/mqdefault.jpg" },
                high: { url: "https://img.youtube.com/vi/0jblRoyR-Jk/hqdefault.jpg" }
            },
            publishedAt: "2024-12-15T10:00:00Z",
            resourceId: { videoId: "0jblRoyR-Jk" }
        }
    },
    {
        id: "k5l3x6GCEu8",
        snippet: {
            title: "ویدیوی آموزشی Say It English - قسمت ۲",
            description: "آموزش زبان انگلیسی با متد Say It English",
            thumbnails: {
                medium: { url: "https://img.youtube.com/vi/k5l3x6GCEu8/mqdefault.jpg" },
                high: { url: "https://img.youtube.com/vi/k5l3x6GCEu8/hqdefault.jpg" }
            },
            publishedAt: "2024-12-10T10:00:00Z",
            resourceId: { videoId: "k5l3x6GCEu8" }
        }
    },
    {
        id: "8ckMphCip8c",
        snippet: {
            title: "ویدیوی آموزشی Say It English - قسمت ۳",
            description: "آموزش زبان انگلیسی با متد Say It English",
            thumbnails: {
                medium: { url: "https://img.youtube.com/vi/8ckMphCip8c/mqdefault.jpg" },
                high: { url: "https://img.youtube.com/vi/8ckMphCip8c/hqdefault.jpg" }
            },
            publishedAt: "2024-12-05T10:00:00Z",
            resourceId: { videoId: "8ckMphCip8c" }
        }
    }
];

let cachedVideos: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

youtubeRouter.get("/videos", async (req, res) => {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;

        // If API key exists, try to fetch from YouTube
        if (apiKey) {
            const channelId = process.env.YOUTUBE_CHANNEL_ID;

            // Check cache
            if (cachedVideos && (Date.now() - lastFetchTime < CACHE_DURATION)) {
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
                console.log("YouTube API error, using hardcoded videos");
            }
        }

        // Return hardcoded videos
        res.json(VIDEOS);

    } catch (error) {
        console.error("Error fetching videos:", error);
        res.json(VIDEOS);
    }
});
