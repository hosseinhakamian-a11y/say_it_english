import "dotenv/config";
import { db } from "../server/db";
import { content } from "../shared/schema";
import { eq } from "drizzle-orm";

async function applyLessonPlan() {
  console.log("📝 Applying premium lesson plan to the NY Real Estate video...");
  
  const videoId = "OOkKNt71Rpc";
  
  const richDescription = `در این ویدیو با یک مشاور املاک در نیویورک همراه می‌شویم تا تفاوت‌های لهجه اسپانیش-آمریکایی و مفهوم 'آمریکایی شدن' را در محیط واقعی یاد بگیریم.
  
## 🎯 اهداف این درس (Lesson Objectives)
- **تقویت مهارت شنیداری (Listening):** درک مکالمه در محیط باز و پر سر و صدای شهری.
- **آشنایی با لهجه‌ها:** تشخیص تفاوت لهجه نیویورکی ادغام‌شده با ریشه‌های لاتین (Spanish).
- **درک فرهنگی (Cultural Identity):** فهم درست عبارت "Americanized" و چگونگی صحبت درباره ریشه و اصلیت خود.

## 💡 نکات طلایی و فرهنگی (Pro Notes)
نیویورک (New York) که به "دیگ ذوب" (Melting Pot) معروف است، پر از افراد با ملیت‌های مختلف است. در این ویدیو می‌بینیم که فردی با ریشه جمهوری دومینیکن (Dominican Republic) خودش را به خاطر سال‌ها زندگی در آمریکا، تا حد زیادی شبیه به بومی‌ها (Americanized) می‌داند. 
در مکالمات روزمره انگلیسی، سوال پرسیدن درباره اصلیت افراد (Where are you originally from?) بسیار رایج است و این درس به شما کمک می‌کند تا به این نوع سوالات با اعتماد به نفس پاسخ دهید.

## 🗣️ تمرین مکالمه (Speaking Challenge)
به سوالات زیر فکر کنید و سعی کنید با صدای بلند (یا با پارتنر خود) به آن‌ها مسلط پاسخ دهید:
1. **Have you ever felt "changed" by living in a new city or country?** (آیا تا به حال حس کردید زندگی در شهر/کشور جدید روی شما تاثیر گذاشته؟)
2. **If someone asks you where you are "originally" from, how do you explain your roots?** (اگر کسی از ریشه و اصلیت شما بپرسد، چطور توضیح می‌دهید؟)

## ✍️ تکلیف عملی (Action Item)
**نقش بازی کنید (Role-play):**
تصور کنید با یک توریست در شهر خودتان در حال صحبت هستید. در 30 ثانیه صدای خودتان را ضبط کنید و با استفاده از لغاتی مثل \`Born and raised\` و \`I guess\` سعی کنید بک‌گراند خود را به او توضیح دهید. صدای ضبط شده را بررسی کنید تا تپق‌هایتان را پیدا کنید.
`;

  try {
    const result = await db.update(content)
      .set({ description: richDescription })
      .where(eq(content.videoId, videoId))
      .returning();

    if (result.length > 0) {
      console.log("✅ Premium Lesson Plan added successfully!");
    } else {
      console.log("⚠️ Video ID not found in database.");
    }
  } catch (err) {
    console.error("❌ Error updating database:", err);
  }
  
  process.exit(0);
}

applyLessonPlan();
