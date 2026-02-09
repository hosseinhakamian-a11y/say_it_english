-- Seed Educational Videos for Say It English
-- Mix of free and premium content for monetization strategy

-- Video 1: FREE - Hook to attract users
INSERT INTO content (title, description, type, level, video_id, video_provider, is_premium, price, metadata, created_at)
VALUES (
    'آموزش مکالمه روزمره انگلیسی - قسمت اول 🗣️',
    'در این ویدیو با جملات و عبارات پرکاربرد روزمره انگلیسی آشنا می‌شوید. از سلام و احوالپرسی گرفته تا درخواست کمک و تشکر کردن. این درس برای مبتدیان عالی است!',
    'video', 'beginner', '5f-V4ES5-xE', 'youtube', false, 0,
    '{
        "vocabulary": [
            { "word": "Greetings", "meaning": "سلام و احوالپرسی", "timestamp": "00:30" },
            { "word": "How are you doing?", "meaning": "حالت چطوره؟ (غیررسمی)", "timestamp": "01:15" },
            { "word": "Nice to meet you", "meaning": "از آشنایی با شما خوشبختم", "timestamp": "02:00" },
            { "word": "Excuse me", "meaning": "ببخشید (برای جلب توجه)", "timestamp": "03:30" },
            { "word": "Could you help me?", "meaning": "میشه کمکم کنید؟", "timestamp": "04:45" }
        ],
        "quiz": [
            { "question": "How do you politely ask for help?", "options": ["Help me now!", "Could you help me?", "I need help!", "Help!"], "correctAnswer": 1 },
            { "question": "What does ''Nice to meet you'' mean?", "options": ["خداحافظ", "از آشنایی خوشبختم", "چطوری؟", "ممنون"], "correctAnswer": 1 }
        ]
    }',
    NOW()
);

-- Video 2: PREMIUM - Advanced Conversation
INSERT INTO content (title, description, type, level, video_id, video_provider, is_premium, price, metadata, created_at)
VALUES (
    'مکالمه پیشرفته انگلیسی - صحبت درباره کار 💼',
    'یاد بگیرید چطور درباره شغل، کار و حرفه‌تان به انگلیسی صحبت کنید. اصطلاحات حرفه‌ای، مصاحبه شغلی و معرفی خود در محیط کار.',
    'video', 'intermediate', '8ckMphCip8c', 'youtube', true, 49000,
    '{
        "vocabulary": [
            { "word": "I work as a...", "meaning": "من به عنوان ... کار می‌کنم", "timestamp": "00:45" },
            { "word": "I''m in charge of", "meaning": "من مسئول ... هستم", "timestamp": "01:30" },
            { "word": "My responsibilities include", "meaning": "مسئولیت‌های من شامل ... است", "timestamp": "02:15" },
            { "word": "I''ve been working here for", "meaning": "... سال است اینجا کار می‌کنم", "timestamp": "03:00" },
            { "word": "Career path", "meaning": "مسیر شغلی", "timestamp": "04:00" },
            { "word": "Promotion", "meaning": "ارتقاء شغلی", "timestamp": "05:00" },
            { "word": "Salary negotiation", "meaning": "مذاکره حقوق", "timestamp": "06:30" }
        ],
        "quiz": [
            { "question": "How do you describe your job role?", "options": ["I work as a...", "I am job", "My job is work", "Work I do"], "correctAnswer": 0 },
            { "question": "What does ''promotion'' mean?", "options": ["استعفا", "ارتقاء", "حقوق", "مرخصی"], "correctAnswer": 1 },
            { "question": "Complete: I''ve been working here ___ 5 years", "options": ["since", "for", "from", "at"], "correctAnswer": 1 }
        ]
    }',
    NOW()
);

-- Video 3: PREMIUM - Travel English
INSERT INTO content (title, description, type, level, video_id, video_provider, is_premium, price, metadata, created_at)
VALUES (
    'انگلیسی سفر - در فرودگاه و هتل ✈️',
    'تمام عبارات ضروری برای سفر خارجی: از چک‌این فرودگاه تا رزرو هتل و گشت‌وگذار در شهر. با این درس مثل یک حرفه‌ای سفر کنید!',
    'video', 'intermediate', 'k5l3x6GCEu8', 'youtube', true, 59000,
    '{
        "vocabulary": [
            { "word": "Check-in counter", "meaning": "باجه پذیرش", "timestamp": "00:30" },
            { "word": "Boarding pass", "meaning": "کارت پرواز", "timestamp": "01:00" },
            { "word": "Gate number", "meaning": "شماره گیت", "timestamp": "01:45" },
            { "word": "I have a reservation", "meaning": "من رزرو دارم", "timestamp": "03:00" },
            { "word": "Room service", "meaning": "سرویس اتاق", "timestamp": "04:30" },
            { "word": "What time is checkout?", "meaning": "ساعت تحویل اتاق چنده؟", "timestamp": "05:15" },
            { "word": "Could I get a late checkout?", "meaning": "میشه دیرتر تحویل بدم؟", "timestamp": "06:00" }
        ],
        "quiz": [
            { "question": "What is a ''boarding pass''?", "options": ["بلیط قطار", "کارت پرواز", "گذرنامه", "ویزا"], "correctAnswer": 1 },
            { "question": "How do you ask for room service?", "options": ["Food now!", "I want eat", "Could I order room service?", "Give food"], "correctAnswer": 2 },
            { "question": "What does ''late checkout'' mean?", "options": ["ورود دیر", "خروج دیرتر", "رزرو دیر", "لغو رزرو"], "correctAnswer": 1 }
        ]
    }',
    NOW()
);

-- Video 4: FREE - Restaurant English
INSERT INTO content (title, description, type, level, video_id, video_provider, is_premium, price, metadata, created_at)
VALUES (
    'سفارش غذا به انگلیسی - در رستوران 🍽️',
    'یاد بگیرید چطور در رستوران‌های خارجی غذا سفارش دهید، از منو بپرسید و صورتحساب بخواهید. درس رایگان و کاربردی!',
    'video', 'beginner', 'IoSFYeDN-Vc', 'youtube', false, 0,
    '{
        "vocabulary": [
            { "word": "Table for two, please", "meaning": "میز دو نفره، لطفاً", "timestamp": "00:20" },
            { "word": "Can I see the menu?", "meaning": "میشه منو رو ببینم؟", "timestamp": "01:00" },
            { "word": "I''ll have the...", "meaning": "من ... می‌خوام", "timestamp": "02:00" },
            { "word": "Could I get the bill?", "meaning": "صورتحساب لطفاً", "timestamp": "03:30" },
            { "word": "Is service included?", "meaning": "سرویس شامل هست؟", "timestamp": "04:15" }
        ],
        "quiz": [
            { "question": "How do you ask for the menu?", "options": ["Give menu!", "Can I see the menu?", "Menu now!", "Where food?"], "correctAnswer": 1 },
            { "question": "What does ''bill'' mean in a restaurant?", "options": ["منو", "صورتحساب", "انعام", "غذا"], "correctAnswer": 1 }
        ]
    }',
    NOW()
);

-- Video 5: PREMIUM - Business English
INSERT INTO content (title, description, type, level, video_id, video_provider, is_premium, price, metadata, created_at)
VALUES (
    'انگلیسی تجاری - جلسات و ایمیل حرفه‌ای 📧',
    'اصطلاحات کلیدی برای جلسات کاری، نوشتن ایمیل حرفه‌ای و مذاکره تجاری. ضروری برای کسی که با شرکت‌های خارجی کار می‌کند.',
    'video', 'advanced', '0jblRoyR-Jk', 'youtube', true, 79000,
    '{
        "vocabulary": [
            { "word": "Let''s get started", "meaning": "بیایید شروع کنیم", "timestamp": "00:30" },
            { "word": "I''d like to propose", "meaning": "می‌خوام پیشنهاد بدم", "timestamp": "01:15" },
            { "word": "Could you elaborate on that?", "meaning": "میشه بیشتر توضیح بدید؟", "timestamp": "02:00" },
            { "word": "To summarize", "meaning": "به طور خلاصه", "timestamp": "03:00" },
            { "word": "Action items", "meaning": "موارد اقدام", "timestamp": "04:00" },
            { "word": "Please find attached", "meaning": "فایل پیوست را ببینید", "timestamp": "05:30" },
            { "word": "Looking forward to hearing from you", "meaning": "منتظر پاسختان هستم", "timestamp": "06:15" },
            { "word": "Best regards", "meaning": "با احترام", "timestamp": "07:00" }
        ],
        "quiz": [
            { "question": "How do you start a business meeting?", "options": ["Start now!", "Let''s get started", "Begin!", "We start"], "correctAnswer": 1 },
            { "question": "What does ''Please find attached'' mean?", "options": ["لطفاً پیدا کنید", "فایل پیوست را ببینید", "لطفاً بنویسید", "ارسال کنید"], "correctAnswer": 1 },
            { "question": "How do you end a professional email?", "options": ["Bye", "See ya", "Best regards", "Later"], "correctAnswer": 2 }
        ]
    }',
    NOW()
);

-- Video 6: PREMIUM - Idioms & Expressions
INSERT INTO content (title, description, type, level, video_id, video_provider, is_premium, price, metadata, created_at)
VALUES (
    'اصطلاحات محاوره‌ای انگلیسی - مثل یک نیتیو صحبت کن! 🔥',
    'اصطلاحات و ایدیوم‌های پرکاربرد که در کتاب‌های درسی پیدا نمی‌کنید. یاد بگیرید مثل یک بومی انگلیسی صحبت کنید!',
    'video', 'advanced', 'Y9MtlTbrORY', 'youtube', true, 69000,
    '{
        "vocabulary": [
            { "word": "Break a leg", "meaning": "موفق باشی! (در تئاتر)", "timestamp": "00:45" },
            { "word": "Piece of cake", "meaning": "خیلی آسونه", "timestamp": "01:30" },
            { "word": "Hit the nail on the head", "meaning": "دقیقاً درست گفتی", "timestamp": "02:15" },
            { "word": "Bite the bullet", "meaning": "با شجاعت قبول کردن", "timestamp": "03:00" },
            { "word": "Cost an arm and a leg", "meaning": "خیلی گرون بود", "timestamp": "04:00" },
            { "word": "Once in a blue moon", "meaning": "خیلی به ندرت", "timestamp": "05:00" },
            { "word": "Under the weather", "meaning": "حالم خوب نیست", "timestamp": "06:00" }
        ],
        "quiz": [
            { "question": "What does ''piece of cake'' mean?", "options": ["کیک خوشمزه", "خیلی آسان", "غذای خوب", "تولد"], "correctAnswer": 1 },
            { "question": "If something ''costs an arm and a leg'', it is:", "options": ["ارزان", "رایگان", "خیلی گران", "متوسط"], "correctAnswer": 2 },
            { "question": "''Under the weather'' means:", "options": ["هوا بارانی است", "حالم خوب نیست", "بیرون هستم", "سردم است"], "correctAnswer": 1 }
        ]
    }',
    NOW()
);

-- Video 7: FREE - Pronunciation Tips
INSERT INTO content (title, description, type, level, video_id, video_provider, is_premium, price, metadata, created_at)
VALUES (
    'اشتباهات رایج تلفظ ایرانی‌ها - و راه حل آن‌ها 🎯',
    'ده اشتباه تلفظی رایج که ایرانی‌ها در انگلیسی مرتکب می‌شوند و چطور آن‌ها را اصلاح کنید. درس رایگان و کاربردی!',
    'video', 'beginner', 'ti3UtLzfas0', 'youtube', false, 0,
    '{
        "vocabulary": [
            { "word": "Pronunciation", "meaning": "تلفظ", "timestamp": "00:30" },
            { "word": "Stress", "meaning": "تکیه (در کلمات)", "timestamp": "01:00" },
            { "word": "Intonation", "meaning": "آهنگ کلام", "timestamp": "02:00" },
            { "word": "Vowel sounds", "meaning": "صداهای مصوت", "timestamp": "03:00" },
            { "word": "Consonant clusters", "meaning": "خوشه‌های همخوان", "timestamp": "04:30" }
        ],
        "quiz": [
            { "question": "What is ''stress'' in pronunciation?", "options": ["استرس", "تکیه", "صدا", "حرف"], "correctAnswer": 1 },
            { "question": "What are vowel sounds?", "options": ["حروف بیصدا", "صداهای مصوت", "کلمات", "جملات"], "correctAnswer": 1 }
        ]
    }',
    NOW()
);
