-- Migration to add Instagram Lesson about AI & Reality with fixed formatting and thumbnail
-- ID extracted from: https://www.instagram.com/reel/DNuzfvgWuni/

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
    'هوش مصنوعی یا واقعیت؟ (اعتماد در عصر دیجیتال) 🤖',
    'هوش مصنوعی (AI) با چنان سرعتی در حال پیشرفت است که مرز بین واقعیت و دنیای مجازی در حال از بین رفتن است. در این ویدیو، دو نفر درباره این بحث می‌کنند که چطور دیگر نمی‌توان حتی به چهره و صدای افراد در ویدیوها اعتماد کرد (Deepfakes).

## نکات آموزشی مهم
این مکالمه شامل عباراتی است که برای بیان **عدم قطعیت** و **ترس از تکنولوژی** استفاده می‌شوند. همچنین یاد می‌گیرید چطور از پسوند **wise-** برای توصیف جنبه‌های مختلف یک موضوع استفاده کنید.

## آنچه یاد خواهید گرفت
۱. اصطلاحات مربوط به فریب خوردن و گول زدن.
۲. نحوه استفاده از "On a daily basis" برای بیان تکرار.
۳. اصطلاحات مربوط به تشخیص و شناسایی ویدیوهای فیک.',
    'video',
    'intermediate',
    'DNuzfvgWuni',
    'instagram',
    true,
    39000,
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    '{
        "vocabulary": [
            {
                "word": "On a daily basis",
                "pronunciation": "/ɒn ə ˈdeɪli ˈbeɪsɪs/",
                "meaning": "به صورت روزانه / هر روز",
                "definition": "Happening every day.",
                "time": "00:01"
            },
            {
                "word": "Detecting",
                "pronunciation": "/dɪˈtektɪŋ/",
                "meaning": "تشخیص دادن / شناسایی",
                "definition": "Discovering or identifying the presence or existence of something.",
                "time": "00:15"
            },
            {
                "word": "Fall for it",
                "pronunciation": "/fɔːl fɔːr ɪt/",
                "meaning": "گول آن را خوردن / فریب خوردن",
                "definition": "To be deceived by something.",
                "time": "00:18"
            },
            {
                "word": "Audio wise",
                "pronunciation": "/ˈɔːdiəʊ waɪz/",
                "meaning": "از نظر صوتی / از جهت صدا",
                "definition": "In terms of audio or sound quality.",
                "time": "00:20"
            },
            {
                "word": "Trust",
                "pronunciation": "/trʌst/",
                "meaning": "اعتماد کردن",
                "definition": "To believe that someone is good, honest, or reliable.",
                "time": "00:10"
            }
        ],
        "quiz": [
            {
                "question": "What does the speaker mean by ''On a daily basis''?",
                "options": [
                    "Once a month",
                    "Only on weekends",
                    "Every single day",
                    "Occasionally"
                ],
                "answer": 2
            },
            {
                "question": "What is the meaning of ''Fall for it'' in the context of AI videos?",
                "options": [
                    "Falling on the ground",
                    "Being deceived by a fake video",
                    "Buying a new AI software",
                    "Loving the video"
                ],
                "answer": 1
            },
            {
                "question": "How can the speaker usually tell a video is AI?",
                "options": [
                    "By looking at the colors",
                    "By checking the length",
                    "By the audio quality (audio wise)",
                    "By the title"
                ],
                "answer": 2
            }
        ]
    }',
    NOW()
);
