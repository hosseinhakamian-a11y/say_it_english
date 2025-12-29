
import { storage } from "../server/storage";

async function seed() {
    console.log("🌱 Seeding database...");

    try {
        const existingContent = await storage.getContent();
        if (existingContent.length === 0) {
            console.log("Creating initial content...");
            await storage.createContent({
                title: "Introduction to Persian",
                type: "podcast",
                level: "beginner",
                contentUrl: "https://example.com/podcast1.mp3",
                description: "Basic greetings and numbers",
            });
            await storage.createContent({
                title: "Advanced Grammar",
                type: "article",
                level: "advanced",
                contentUrl: "https://example.com/article1",
                description: "Subjunctive mood in depth",
            });
        } else {
            console.log("Content already exists, skipping...");
        }

        const existingClasses = await storage.getClasses();
        if (existingClasses.length === 0) {
            console.log("Creating initial classes...");
            await storage.createClass({
                title: "Beginner Group A",
                level: "beginner",
                capacity: 10,
                price: 500000,
                schedule: "Mon/Wed 18:00",
                description: "Start from scratch",
            });
        } else {
            console.log("Classes already exists, skipping...");
        }

        console.log("✅ Seeding completed!");
    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
}

seed();
