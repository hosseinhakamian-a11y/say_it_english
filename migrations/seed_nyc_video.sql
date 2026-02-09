INSERT INTO content (
    title, 
    description, 
    type, 
    level, 
    video_id, 
    video_provider, 
    is_premium, 
    metadata,
    created_at
) VALUES (
    'یک روز رویایی در نیویورک - اصطلاحات انگلیسی در سفر 🗽',
    'در این ویدیوی جذاب آموزشی، همراه با هم سفری به قلب نیویورک خواهیم داشت. یاد می‌گیرید چطور مثل یک نیویورکی قهوه سفارش دهید، از مترو استفاده کنید و درباره جاهای دیدنی صحبت کنید. این درس پر از اصطلاحات واقعی (Real-life English) است که در کتاب‌های درسی پیدا نمی‌کنید.',
    'video',
    'intermediate',
    'OOkKNt71Rpc',
    'youtube',
    false,
    '{
        "vocabulary": [
            { "word": "Itinerary", "meaning": "برنامه سفر (لیست کارهایی که قرار است انجام دهید)", "timestamp": "00:45" },
            { "word": "Subway", "meaning": "مترو / قطار زیرزمینی", "timestamp": "02:10" },
            { "word": "Commute", "meaning": "رفت و آمد روزانه به محل کار", "timestamp": "03:15" },
            { "word": "Iconic", "meaning": "نمادین (بسیار معروف و خاص)", "timestamp": "05:20" },
            { "word": "Bagel", "meaning": "نان بیگل (نان حلقه‌ای محبوب نیویورک)", "timestamp": "08:15" },
            { "word": "Observation Deck", "meaning": "سکوی تماشا (در برج‌های بلند)", "timestamp": "14:30" },
            { "word": "Vibrant", "meaning": "پرجنب و جوش و پرانرژی", "timestamp": "18:00" }
        ],
        "quiz": [
            {
                "question": "What is the fastest way to get around NYC according to the video?",
                "options": ["Yellow Taxi", "Subway", "Walking", "Bus"],
                "correctAnswer": 1
            },
            {
                "question": "Which famous park is mentioned as the lungs of the city?",
                "options": ["Bryant Park", "Central Park", "Battery Park", "High Line"],
                "correctAnswer": 1
            },
             {
                "question": "What is a \'Bagel\'?",
                "options": ["A type of coffee", "A famous building", "A ring-shaped bread", "A subway ticket"],
                "correctAnswer": 2
            }
        ]
    }',
    NOW()
);
