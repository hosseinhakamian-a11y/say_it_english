
import { Router } from "express";

export const youtubeRouter = Router();

// Mock data to use when no API key is present
const MOCK_VIDEOS = [
    {
        id: "mock-1",
        snippet: {
            title: "Learn English: 5 Common Mistakes",
            description: "In this video, we discuss 5 common mistakes English learners make and how to fix them.",
            thumbnails: {
                medium: { url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
                high: { url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
            },
            publishedAt: "2024-03-15T10:00:00Z",
            resourceId: { videoId: "mock-1" }
        }
    },
    {
        id: "mock-2",
        snippet: {
            title: "Business English Vocabulary",
            description: "Essential vocabulary for your next business meeting.",
            thumbnails: {
                medium: { url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
                high: { url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
            },
            publishedAt: "2024-03-10T14:30:00Z",
            resourceId: { videoId: "mock-2" }
        }
    },
    {
        id: "mock-3",
        snippet: {
            title: "IELTS Speaking Tips",
            description: "Maximize your score in the IELTS speaking test with these top tips.",
            thumbnails: {
                medium: { url: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
                high: { url: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
            },
            publishedAt: "2024-03-05T09:15:00Z",
            resourceId: { videoId: "mock-3" }
        }
    },
    {
        id: "mock-4",
        snippet: {
            title: "English Pronunciation Masterclass",
            description: "Improve your accent and speak more clearly.",
            thumbnails: {
                medium: { url: "https://images.unsplash.com/photo-1478737270239-2f63b86de6b9?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
                high: { url: "https://images.unsplash.com/photo-1478737270239-2f63b86de6b9?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
            },
            publishedAt: "2024-02-28T16:45:00Z",
            resourceId: { videoId: "mock-4" }
        }
    },
    {
        id: "mock-5",
        snippet: {
            title: "Idioms You Need to Know",
            description: "Sound more like a native speaker with these popular idioms.",
            thumbnails: {
                medium: { url: "https://images.unsplash.com/photo-1499750310159-5b5f8c673ef8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
                high: { url: "https://images.unsplash.com/photo-1499750310159-5b5f8c673ef8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
            },
            publishedAt: "2024-02-20T11:20:00Z",
            resourceId: { videoId: "mock-5" }
        }
    },
    {
        id: "mock-6",
        snippet: {
            title: "Grammar: Past Perfect Tense",
            description: "A deep dive into the past perfect tense and when to use it.",
            thumbnails: {
                medium: { url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
                high: { url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
            },
            publishedAt: "2024-02-15T13:00:00Z",
            resourceId: { videoId: "mock-6" }
        }
    }
];

let cachedVideos: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

youtubeRouter.get("/videos", async (req, res) => {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        const channelId = process.env.YOUTUBE_CHANNEL_ID || "UC_x5XG1OV2P6uZZ5FSM9Ttw"; // Example ID, replace with actual if known or use uploads playlist approach

        // Return mock data if no API key is configured
        if (!apiKey) {
            console.log("No YouTube API key found, returning mock data");
            return res.json(MOCK_VIDEOS);
        }

        // Check cache
        if (cachedVideos && (Date.now() - lastFetchTime < CACHE_DURATION)) {
            return res.json(cachedVideos);
        }

        // Fetch from YouTube API
        // We first get the Uploads playlist ID for the channel
        const channelResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
        );

        if (!channelResponse.ok) {
            throw new Error("Failed to fetch channel details");
        }

        const channelData = await channelResponse.json();
        const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

        if (!uploadsPlaylistId) {
            // Fallback or user channel name logic might be needed if ID is not direct
            return res.json(MOCK_VIDEOS);
        }

        // Get videos from the uploads playlist
        const videosResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=20&key=${apiKey}`
        );

        if (!videosResponse.ok) {
            throw new Error("Failed to fetch videos");
        }

        const videosData = await videosResponse.json();
        cachedVideos = videosData.items;
        lastFetchTime = Date.now();

        res.json(cachedVideos);
    } catch (error) {
        console.error("Error fetching YouTube videos:", error);
        // Fallback to mock data on error so the page doesn't break
        res.json(MOCK_VIDEOS);
    }
});
