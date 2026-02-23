import "dotenv/config";
import { db } from "../server/db";
import { content } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateLesson() {
  console.log("🔄 Updating lesson content in database with correct schema...");
  
  const videoId = "OOkKNt71Rpc";
  
  const newData = {
    title: "مشاور املاک نیویورکی: لهجه اسپانیش و چالش‌های مهاجرت",
    description: "در این ویدیو با یک مشاور املاک در نیویورک همراه می‌شویم تا تفاوت‌های لهجه اسپانیش-آمریکایی و مفهوم 'آمریکایی شدن' را در محیط واقعی یاد بگیریم.",
    level: "intermediate",
    metadata: {
      vocabulary: [
        { word: "I have no clue", meaning: "اصلاً ایده ای ندارم / نمیدونم", pronunciation: "/aɪ hæv noʊ kluː/" },
        { word: "Looking for", meaning: "به دنبالِ (چیزی یا کسی) گشتن", pronunciation: "/ˈlʊk.ɪŋ fɔːr/" },
        { word: "Something wrong with...", meaning: "مشکلی وجود دارد / یک جای کار می‌لنگد", pronunciation: "/ˈsʌm.θɪŋ rɔːŋ wɪð/" },
        { word: "Born and raised", meaning: "متولد و بزرگ شده", pronunciation: "/bɔːrn ænd reɪzd/" },
        { word: "Obviously", meaning: "مشخصاً / بدیهی است که", pronunciation: "/ˈɒb.vi.əs.li/" },
        { word: "Americanized", meaning: "آمریکایی شده / غرق در فرهنگ آمریکا", pronunciation: "/əˈmer.ɪ.kən.aɪzd/" },
        { word: "Hold on", meaning: "صبر کن / یه لحظه واسا", pronunciation: "/hoʊld ɒn/" },
        { word: "Weekday", meaning: "روز هفته / روز کاری", pronunciation: "/ˈwiːk.deɪ/" },
        { word: "Exactly", meaning: "دقیقاً", pronunciation: "/ɪɡˈzækt.li/" },
        { word: "I guess", meaning: "فکر کنم / حدس می‌زنم", pronunciation: "/aɪ ɡes/" }
      ],
      quiz: [
        {
          question: "What does 'I have no clue' mean?",
          options: ["I know it well", "I have some idea", "I don't know at all", "I am thinking"],
          answer: 2
        },
        {
          question: "If someone is 'born and raised' in a city, they...",
          options: ["Just moved there", "Were born there and grew up there", "Only visit on holidays", "Work there but live elsewhere"],
          answer: 1
        }
      ]
    }
  };

  try {
    const result = await db.update(content)
      .set(newData)
      .where(eq(content.videoId, videoId))
      .returning();

    if (result.length > 0) {
      console.log("✅ Lesson vocabulary and quiz fixed successfully!");
    } else {
      console.log("⚠️ Video ID not found in database. Creating instead...");
      await db.insert(content).values({
        ...newData,
        videoId,
        videoProvider: "youtube",
        type: "video",
        contentUrl: `https://www.youtube.com/watch?v=OOkKNt71Rpc`,
        thumbnailUrl: `https://img.youtube.com/vi/OOkKNt71Rpc/hqdefault.jpg`
      });
      console.log("✅ Lesson created successfully!");
    }
  } catch (err) {
    console.error("❌ Error updating database:", err);
  }
  
  process.exit(0);
}

updateLesson();
