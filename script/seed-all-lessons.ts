import "dotenv/config";
import { db } from "../server/db";
import { content } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedAllLessons() {
  console.log("🌱 Starting bulk lesson seeding for YouTube content...");

  const lessons = [
    {
      videoId: "OOkKNt71Rpc",
      title: "مشاور املاک نیویورکی: لهجه اسپانیش و چالش‌های مهاجرت",
      description: "در این ویدیو با یک مشاور املاک در نیویورک همراه می‌شویم تا تفاوت‌های لهجه اسپانیش-آمریکایی و مفهوم 'آمریکایی شدن' را در محیط واقعی یاد بگیریم.",
      level: "intermediate",
      metadata: {
        vocabulary: [
          { word: "I have no clue", meaning: "اصلاً ایده ای ندارم / نمیدونم", pronunciation: "/aɪ hæv noʊ kluː/" },
          { word: "Born and raised", meaning: "متولد و بزرگ شده", pronunciation: "/bɔːrn ænd reɪzd/" },
          { word: "Americanized", meaning: "آمریکایی شده / غرق در فرهنگ آمریکا", pronunciation: "/əˈmer.ɪ.kən.aɪzd/" },
          { word: "Something wrong with...", meaning: "مشکلی وجود دارد / یک جای کار می‌لنگد", pronunciation: "/ˈsʌm.θɪŋ rɔːŋ wɪð/" },
          { word: "Skip", meaning: "نادیده گرفتن / پریدن از روی چیزی", pronunciation: "/skɪp/" }
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
    },
    {
      videoId: "5f-V4ES5-xE",
      title: "اصطلاح کاربردی Oh Word: تعجب و تایید در انگلیسی",
      description: "در این ویدیو با اصطلاح عامیانه و پرکاربرد Oh Word آشنا می‌شویم که در مکالمات روزمره برای ابراز تعجب یا تایید به کار می‌رود. همچنین یاد می‌گیریم چطور از نسل جوان اصطلاحات جدید را یاد بگیریم.",
      level: "intermediate",
      metadata: {
        vocabulary: [
          { word: "Expression", meaning: "اصطلاح / عبارت", pronunciation: "/ɪkˈspreʃn/" },
          { word: "Generation", meaning: "نسل", pronunciation: "/ˌdʒenəˈreɪʃn/" },
          { word: "Circling", meaning: "رایج / در گردش (درباره اصطلاحات)", pronunciation: "/ˈsɜːrklɪŋ/" },
          { word: "Updated", meaning: "به‌روز", pronunciation: "/ˌʌpˈdeɪtɪd/" },
          { word: "Curse", meaning: "فحش دادن / بددهنی", pronunciation: "/kɜːrs/" },
          { word: "Oh Word", meaning: "جدی میگی؟ / واقعاً؟ (برای تایید یا تعجب)", pronunciation: "/oʊ wɜːrd/" }
        ],
        quiz: [
          {
            question: "What does 'Oh Word' mean in a conversation?",
            options: ["I am bored", "Tell me a story", "Expressing surprise or confirmation", "Goodbye"],
            answer: 2
          },
          {
            question: "Why does the speaker talk to the younger generation?",
            options: ["To teach them history", "To learn new expressions", "To give them money", "To play games"],
            answer: 1
          }
        ]
      }
    },
    {
      videoId: "8ckMphCip8c",
      title: "اعتماد به نفس و بدلکاری‌های عجیب در نیویورک",
      description: "گفتگویی جذاب با یک جوان پرانرژی نیویورکی که درباره بدلکاری‌های ویدیوهایش و اعتماد به نفس صحبت می‌کند. یاد می‌گیریم چطور محیط اطراف (حتی یک زیرزمین ترسناک) می‌تواند لوکیشن محتوا باشد!",
      level: "intermediate",
      metadata: {
        vocabulary: [
          { word: "Self-confidence", meaning: "اعتماد به نفس", pronunciation: "/ˌself ˈkɑːnfɪdəns/" },
          { word: "Streamer", meaning: "استریمر / پخش‌کننده زنده", pronunciation: "/ˈstriːmər/" },
          { word: "Characters", meaning: "شخصیت‌ها", pronunciation: "/ˈkærəktərz/" },
          { word: "Obviously", meaning: "مشخصاً / تابلوئه که", pronunciation: "/ˈɑːbviəsli/" },
          { word: "Scary", meaning: "ترسناک", pronunciation: "/ˈskeri/" },
          { word: "Throw off", meaning: "گیج کردن / خارج کردن از حالت عادی", pronunciation: "/θroʊ ɔːf/" },
          { word: "Stunts", meaning: "بدلکاری‌ / حرکات نمایشی", pronunciation: "/stʌnts/" }
        ],
        quiz: [
          {
            question: "What does the young man do in his videos?",
            options: ["Cooking lessons", "Making characters and doing stunts", "Teaching math", "Singing"],
            answer: 1
          },
          {
            question: "How does the basement in the video feel according to the speaker?",
            options: ["Very cozy", "Bright and sunny", "Scary", "Modern"],
            answer: 2
          }
        ]
      }
    },
    {
      videoId: "0jblRoyR-Jk",
      title: "ارتباط و Vibe مشترک در مکالمه انگلیسی",
      description: "در این درس یاد می‌گیریم چطور درباره حس و حال (Vibe) مشترک صحبت کنیم و چطور سبک زندگی شخصی خود را (درون‌گرا یا برون‌گرا بودن) در سنین مختلف توضیح دهیم.",
      level: "intermediate",
      metadata: {
        vocabulary: [
          { word: "Vibe", meaning: "حال و هوا / حس و موج", pronunciation: "/vaɪb/" },
          { word: "Vacation", meaning: "تعطیلات", pronunciation: "/veɪˈkeɪʃn/" },
          { word: "Stylish", meaning: "خوش‌تیپ / با استایل", pronunciation: "/ˈstaɪlɪʃ/" },
          { word: "Prefer", meaning: "ترجیح دادن", pronunciation: "/prɪˈfɜːr/" },
          { word: "Certain age", meaning: "یک سن مشخص", pronunciation: "/ˈsɜːrtn eɪdʒ/" },
          { word: "Lovely", meaning: "دوست‌داشتنی / عالی", pronunciation: "/ˈlʌvli/" }
        ],
        quiz: [
          {
            question: "What does 'Common Vibe' mean in the video?",
            options: ["Having the same clothes", "Feeling a similar connection or energy", "Living in the same city", "Being the same age"],
            answer: 1
          },
          {
            question: "The speaker says they prefer to be at home after a certain age to avoid:",
            options: ["Cold weather", "Traffic", "Stupid people", "Expensive food"],
            answer: 2
          }
        ]
      }
    },
    {
      videoId: "k5l3x6GCEu8",
      title: "تربیت فرزند و تاثیر اسلنگ‌های تیک‌تاک",
      description: "گفتگویی با یک پدر سینگل درباره چالش‌های بزرگ کردن یک دختر نوجوان و اینکه چطور اسلنگ‌های شبکه‌های اجتماعی (مثل تیک‌تاک) روی رفتار و آینده شغلی نوجوانان تاثیر می‌گذارند.",
      level: "intermediate",
      metadata: {
        vocabulary: [
          { word: "Single father", meaning: "پدر تنها (که فرزندش را به تنهایی بزرگ می‌کند)", pronunciation: "/ˈsɪŋɡl ˈfɑːðər/" },
          { word: "Teenager", meaning: "نوجوان", pronunciation: "/ˈtiːneɪdʒər/" },
          { word: "Slang", meaning: "کلمات عامیانه", pronunciation: "/slæŋ/" },
          { word: "Embarrassing", meaning: "خجالت‌آور / آبرو بر", pronunciation: "/ɪmˈbærəsɪŋ/" },
          { word: "Professional", meaning: "حرفه‌ای / شغلی", pronunciation: "/prəˈfeʃənl/" },
          { word: "Influence", meaning: "تاثیر / نفوذ", pronunciation: "/ˈɪnfluəns/" }
        ],
        quiz: [
          {
            question: "Where do most modern slangs come from according to the video?",
            options: ["Boring books", "Old movies", "TikTok and social media", "Schools"],
            answer: 2
          },
          {
            question: "The father is concerned about his daughter's use of slang in:",
            options: ["Sports", "Future professional jobs", "Cooking", "Driving"],
            answer: 1
          }
        ]
      }
    },
    {
      videoId: "IoSFYeDN-Vc",
      title: "ترکوندی! بررسی اصطلاح You Ate و فرهنگ نسل Z",
      description: "در این ویدیو با یکی از جذاب‌ترین اصطلاحات ترند نسل Z یعنی 'You Ate' آشنا می‌شویم. یاد می‌گیریم چطور وقتی کسی کاری را عالی انجام می‌دهد، او را تشویق کنیم.",
      level: "intermediate",
      metadata: {
        vocabulary: [
          { word: "You ate", meaning: "ترکوندی / عالی بودی / سنگ تموم گذاشتی", pronunciation: "/ju eɪt/" },
          { word: "You're cooked", meaning: "کارت تمومه / تو دردسری / فاتحه‌ت خونده‌ست", pronunciation: "/jʊr kʊkt/" },
          { word: "Serving", meaning: "ارائه دادن (بیشتر برای استایل و ظاهر عالی)", pronunciation: "/ˈsɜːr.vɪŋ/" },
          { word: "Outfit", meaning: "ست لباس / تیپ", pronunciation: "/ˈaʊt.fɪt/" },
          { word: "Inappropriate", meaning: "نامناسب / بیجا", pronunciation: "/ˌɪn.əˈproʊ.pri.ət/" },
          { word: "Acronym", meaning: "مخفف / سرواژه", pronunciation: "/ˈæk.rə.nɪm/" }
        ],
        quiz: [
          {
            question: "What does 'You ate' mean in Gen Z slang?",
            options: ["You are full", "You did something impressively well", "You are late for dinner", "You need to eat"],
            answer: 1
          },
          {
            question: "If someone says 'Your outfit is serving', they mean:",
            options: ["You are a waiter", "Your clothes look amazing", "You need to change", "Your clothes are too small"],
            answer: 1
          }
        ]
      }
    },
    {
      videoId: "0DwHJL9BDK8",
      title: "تایید حرف با اصطلاح Clock it و کاربرد Period",
      description: "یادگیری اصطلاحات تاکیدی در مکالمه. چطور با استفاده از کلمه Period روی حرف خود پافشاری کنیم و چطور با Clock it نشان دهیم که متوجه حقیقت یا نکته ظریفی شده‌ایم.",
      level: "intermediate",
      metadata: {
        vocabulary: [
          { word: "Clock it", meaning: "مچ کسی رو گرفتن / متوجه حقیقت شدن / تایید حرف درست", pronunciation: "/klɒk ɪt/" },
          { word: "Period", meaning: "تمام! / نقطه سر خط (برای تاکید بر قطعی بودن)", pronunciation: "/ˈpɪr.i.əd/" },
          { word: "On a roll", meaning: "روی دورِ موفقیت بودن / پشت سر هم پیروز شدن", pronunciation: "/ɒn ə roʊl/" },
          { word: "Educated", meaning: "تحصیلکرده / با فرهنگ", pronunciation: "/ˈedʒ.u.keɪ.tɪd/" },
          { word: "Honor", meaning: "افتخار / مایه سربلندی", pronunciation: "/ˈɒn.ər/" },
          { word: "Trend", meaning: "مد / روند رایج", pronunciation: "/trend/" }
        ],
        quiz: [
          {
            question: "How is 'Period' used at the end of a sentence in slang?",
            options: ["To ask a question", "To show uncertainty", "To emphasize that the statement is final", "To talk about time"],
            answer: 2
          },
          {
            question: "What does 'On a roll' mean?",
            options: ["Moving in circles", "Having a series of continuous successes", "Feeling dizzy", "Eating quickly"],
            answer: 1
          }
        ]
      }
    },
    {
      videoId: "Y9MtlTbrORY",
      title: "مکالمه با توریست‌های مکزیکی و تمرین لیسنینگ",
      description: "یک گفتگوی واقعی و چالش‌برانگیز با چند مکزیکی. یاد می‌گیریم چطور با وجود کیفیت صدای بد (Terrible Connection) به تمرین مکالمه ادامه دهیم و لهجه‌های مختلف را تشخیص دهیم.",
      level: "intermediate",
      metadata: {
        vocabulary: [
          { word: "Terrible connection", meaning: "اتصال بسیار بد / سرعت اینترنت ضعیف", pronunciation: "/ˈter.ə.bəl kəˈnek.ʃَن/" },
          { word: "Practice", meaning: "تمرین کردن", pronunciation: "/ˈpræk.tɪs/" },
          { word: "Middle East", meaning: "خاورمیانه", pronunciation: "/ˌmɪd.əl ˈiːست/" },
          { word: "Guess", meaning: "حدس زدن", pronunciation: "/ɡes/" },
          { word: "Sounds like", meaning: "به نظر رسیدن (از روی صدا یا شنیده‌ها)", pronunciation: "/saʊndz laɪk/" },
          { word: "Far", meaning: "دور", pronunciation: "/fɑːr/" }
        ],
        quiz: [
          {
            question: "Why is the speaker talking to Mexicans in the video?",
            options: ["To buy a ticket", "To practice English conversation", "To report a problem", "To teach them Farsi"],
            answer: 1
          },
          {
            question: "What does 'Terrible connection' refer to?",
            options: ["Bad weather", "Poor video/audio quality due to internet", "A long distance", "Not liking the other person"],
            answer: 1
          }
        ]
      }
    },
    {
      videoId: "ti3UtLzfas0",
      title: "اصطلاح You Know Ball و تفاوت نسل‌ها",
      description: "بررسی اصطلاح جالب You Know Ball که برای تایید اطلاعات بالای کسی در یک زمینه (نه فقط فوتبال) به کار می‌رود. همچنین گفتگو درباره تفاوت نسل هزاره (Millennial) و نسل Z.",
      level: "intermediate",
      metadata: {
        vocabulary: [
          { word: "You know ball", meaning: "اطلاعاتت تو این زمینه خیلی بالاست / کارت درسته", pronunciation: "/ju noʊ bɔːl/" },
          { word: "Millennial", meaning: "نسل هزاره (متولدین حدود ۶۰ تا ۷۰ شمسی)", pronunciation: "/mɪˈlen.i.əl/" },
          { word: "Improve", meaning: "بهبود بخشیدن / تقویت کردن", pronunciation: "/ɪmˈpruːv/" },
          { word: "Daily basis", meaning: "به صورت روزانه", pronunciation: "/ˈdeɪ.li ˈbeɪ.sɪs/" },
          { word: "Actually", meaning: "در واقع / حقیقتش", pronunciation: "/ˈæk.tʃu.ə.li/" },
          { word: "Native speaker", meaning: "گویشور بومی / کسی که زبان مادری‌اش انگلیسی است", pronunciation: "/ˈneɪ.tɪv ˈspiː.kər/" }
        ],
        quiz: [
          {
            question: "To which generation does the interviewer say she belongs?",
            options: ["Gen Z", "Gen Alpha", "Millennial", "Baby Boomer"],
            answer: 2
          },
          {
            question: "What does 'You know ball' imply?",
            options: ["You are good at soccer", "You have deep knowledge about the topic", "You are carrying a ball", "You are confused"],
            answer: 1
          }
        ]
      }
    }
  ];

  for (const lesson of lessons) {
    try {
      const result = await db.update(content)
        .set(lesson)
        .where(eq(content.videoId, lesson.videoId))
        .returning();

      if (result.length > 0) {
        console.log(`✅ Updated lesson: ${lesson.videoId} - ${lesson.title}`);
      } else {
        console.log(`⚠️ Lesson not found, inserting new: ${lesson.videoId}`);
        await db.insert(content).values({
          ...lesson,
          videoProvider: "youtube",
          type: "video",
          contentUrl: `https://www.youtube.com/watch?v=${lesson.videoId}`,
          thumbnailUrl: `https://img.youtube.com/vi/${lesson.videoId}/hqdefault.jpg`,
          isPremium: false,
          price: 0
        });
        console.log(`✅ Inserted lesson: ${lesson.videoId}`);
      }
    } catch (err) {
      console.error(`❌ Error processing lesson ${lesson.videoId}:`, err);
    }
  }

  console.log("🏁 Bulk seeding complete!");
  process.exit(0);
}

seedAllLessons();
