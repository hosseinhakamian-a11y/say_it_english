-- Migration to add Instagram Slang Lesson (Gen Z: You Know Ball)
-- ID extracted from: https://www.instagram.com/say.it.english/reel/DNxS_vvWjEL/

INSERT INTO content (
    title, 
    description, 
    type, 
    level, 
    video_id, 
    video_provider, 
    is_premium, 
    price, 
    thumbnail_url,
    metadata,
    created_at
) VALUES (
    'رمزگشایی از اصطلاح نسل زد: "You Know Ball" 🏀',
    'در این درس جذاب، همراه با "جیلا" (نوجوان ۱۷ ساله نیتیو) یاد می‌گیریم که چطور اصطلاحات ورزشی به دنیای فندوم‌های اینترنتی راه پیدا کرده‌اند.

![Infographic English](https://res.cloudinary.com/dujzchgtx/image/upload/v1770805768/You_know_ball-eng_yuq5nv.png)

![Infographic Persian](https://res.cloudinary.com/dujzchgtx/image/upload/v1770805768/You_know_ball-per_u2s1ss.png)

## 📊 راهنمای اینفوگرافیک درس (Gen Z Lingo)

### بخش اول: معنا و مفهوم اصلی (Core Meaning)
این عبارت برای **تایید شناخت عمیق و اصالت (Validating Niche Knowledge)** به کار می‌رود. وقتی کسی ارجاعی به یک موضوع خاص، قدیمی یا تخصصی می‌دهد، با این جمله اصالت دانش او را تایید می‌کنیم.

### بخش دوم: جایگاه پیش‌کسوت (Identifying an OG)
این جمله مثل یک "دست‌دادن کلامی" (Verbal Handshake) بین اعضای یک زیرشاخه دیجیتال است. نشان می‌دهد که شما از ابتدا (The Peak) در آن جریان حضور داشته‌اید.

### بخش سوم: کاربرد در فندوم‌ها (Usage & Context)
بیشترین کاربرد زمانی است که کسی به یک گروه طرفداری (Fandom) اشاره می‌کند که اکنون کمرنگ شده یا به اندازه قبل محبوب نیست.

---

## 💡 نکات کلیدی جیلا (Gen Jay)
- **Age Awareness:** قدرت تشخیص ترندها در نسل‌های مختلف.
- **Peer Recognition:** تایید اعتبار در گفتگوهای دوستانه.
- **Internet Dynamics:** چطور گروه‌های اینترنتی فروکش می‌کنند (Died down).',
    'video',
    'advanced',
    'DNxS_vvWjEL',
    'instagram',
    true,
    45000,
    'https://res.cloudinary.com/dujzchgtx/image/upload/v1770805768/You_know_ball-eng_yuq5nv.png',
    '{
        "vocabulary": [
            {
                "word": "You know ball",
                "pronunciation": "/juː nəʊ bɔːl/",
                "meaning": "شناخت عمیق و اصالت در یک موضوع",
                "definition": "A phrase used to acknowledge someone has deep, authentic knowledge about a specific niche or topic.",
                "time": "00:05"
            },
            {
                "word": "OG (Original Gangster)",
                "pronunciation": "/əʊ ˈdʒiː/",
                "meaning": "پیش‌کسوت / قدیمی",
                "definition": "Someone who has been part of a community or trend from the very start.",
                "time": "00:15"
            },
            {
                "word": "Fandom",
                "pronunciation": "/ˈfændəm/",
                "meaning": "جامعه طرفداران",
                "definition": "The community of fans of a particular person, team, fictional series, etc.",
                "time": "00:22"
            },
            {
                "word": "Died down",
                "pronunciation": "/daɪd daʊn/",
                "meaning": "کمرنگ شدن / فروکش کردن",
                "definition": "To become less powerful, active, or popular over time.",
                "time": "00:25"
            },
            {
                "word": "Niche",
                "pronunciation": "/niːʃ/",
                "meaning": "تخصصی / خاص",
                "definition": "A specialized segment of the market or a specific area of interest.",
                "time": "00:12"
            }
        ],
        "quiz": [
            {
                "question": "According to the dialogue, how old is Jayla?",
                "options": ["15", "18", "17", "16"],
                "answer": 2
            },
            {
                "question": "What does the phrase ''you know ball'' signify in an internet fandom context?",
                "options": [
                    "Expert in professional sports",
                    "Being an ''OG'' or long-term member",
                    "Preferring modern trends",
                    "Being a new member"
                ],
                "answer": 1
            },
            {
                "question": "In what scenario would someone use ''you know ball''?",
                "options": [
                    "Learning a new language",
                    "Wanting to play football",
                    "A new internet trend",
                    "Reference to a fandom that is no longer popular"
                ],
                "answer": 3
            },
            {
                "question": "Why is the older speaker''s English ''really good''?",
                "options": [
                    "Native speaker from UK",
                    "Watching internet fandoms",
                    "Used to live in the US",
                    "Studying since age 15"
                ],
                "answer": 2
            },
            {
                "question": "What is the primary purpose of this dialogue?",
                "options": [
                    "History of basketball",
                    "Explain modern slang expressions",
                    "Job interview",
                    "Comparing generations"
                ],
                "answer": 1
            }
        ]
    }',
    NOW()
);
