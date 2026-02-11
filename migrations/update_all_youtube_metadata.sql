-- Migration to update all YouTube lessons with professional metadata (pronunciation and English definitions)
-- This covers the main YouTube courses in the system.

-- 1. Daily Conversation (5f-V4ES5-xE)
UPDATE content
SET metadata = '{
    "vocabulary": [
        { "word": "Greetings", "pronunciation": "/ˈɡriːtɪŋz/", "meaning": "سلام و احوالپرسی", "definition": "Words or actions used when meeting someone.", "time": "00:30" },
        { "word": "How are you doing?", "pronunciation": "/haʊ ɑːr ju ˈduːɪŋ/", "meaning": "حالت چطوره؟ (غیررسمی)", "definition": "A common informal way to ask someone about their well-being.", "time": "01:15" },
        { "word": "Nice to meet you", "pronunciation": "/naɪs tu miːt ju/", "meaning": "از آشنایی با شما خوشبختم", "definition": "A polite expression used when meeting someone for the first time.", "time": "02:00" },
        { "word": "Excuse me", "pronunciation": "/ɪkˈskjuːs miː/", "meaning": "ببخشید (برای جلب توجه)", "definition": "Used to capture someone''s attention or to move past someone.", "time": "03:30" },
        { "word": "Could you help me?", "pronunciation": "/kʊd ju help miː/", "meaning": "میشه کمکم کنید؟", "definition": "A polite request for assistance. ", "time": "04:45" }
    ],
    "quiz": [
        { "question": "How do you politely ask for help?", "options": ["Help me now!", "Could you help me?", "I need help!", "Help!"], "answer": 1 },
        { "question": "What does ''Nice to meet you'' mean?", "options": ["خداحافظ", "از آشنایی خوشبختم", "چطوری؟", "ممنون"], "answer": 1 }
    ]
}'
WHERE video_id = '5f-V4ES5-xE';

-- 2. Advanced Conversation - Work/Career (8ckMphCip8c)
UPDATE content
SET metadata = '{
    "vocabulary": [
        { "word": "I work as a...", "pronunciation": "/aɪ wɜːrk æz ə/", "meaning": "من به عنوان ... کار می‌کنم", "definition": "A way to state your specific job title or profession.", "time": "00:45" },
        { "word": "I''m in charge of", "pronunciation": "/aɪm ɪn tʃɑːrdʒ ɒv/", "meaning": "من مسئول ... هستم", "definition": "To have responsibility for something/someone.", "time": "01:30" },
        { "word": "My responsibilities include", "pronunciation": "/maɪ rɪˌspɒnsəˈbɪlətiz ɪnˈkluːd/", "meaning": "مسئولیت‌های من شامل ... است", "definition": "Used to describe specific tasks you regularly perform in your job.", "time": "02:15" },
        { "word": "Career path", "pronunciation": "/kəˈrɪər pɑːθ/", "meaning": "مسیر شغلی", "definition": "The sequence of jobs that leads to your career goals.", "time": "04:00" },
        { "word": "Promotion", "pronunciation": "/prəˈməʊʃn/", "meaning": "ارتقاء شغلی", "definition": "The advancement of an employee to a higher rank or position.", "time": "05:00" },
        { "word": "Salary negotiation", "pronunciation": "/ˈsæləri nɪˌɡəʊʃiˈeɪʃn/", "meaning": "مذاکره حقوق", "definition": "The process of discussing terms of pay between an employee and employer.", "time": "06:30" }
    ],
    "quiz": [
        { "question": "How do you describe your job role?", "options": ["I work as a...", "I am job", "My job is work", "Work I do"], "answer": 0 },
        { "question": "What does ''promotion'' mean?", "options": ["استعفا", "ارتقاء", "حقوق", "مرخصی"], "answer": 1 },
        { "question": "Complete: I''ve been working here ___ 5 years", "options": ["since", "for", "from", "at"], "answer": 1 }
    ]
}'
WHERE video_id = '8ckMphCip8c';

-- 3. Restaurant Ordering (IoSFYeDN-Vc)
UPDATE content
SET metadata = '{
    "vocabulary": [
        { "word": "Table for two, please", "pronunciation": "/ˈteɪbl fɔːr tuː pliːz/", "meaning": "میز دو نفره، لطفاً", "definition": "A polite phrase to request a table for two people in a restaurant.", "time": "00:20" },
        { "word": "Can I see the menu?", "pronunciation": "/kæn aɪ siː ðə ˈmenjuː/", "meaning": "میشه منو رو ببینم؟", "definition": "A request for the list of food and drinks available.", "time": "01:00" },
        { "word": "I''ll have the...", "pronunciation": "/aɪl hæv ðə/", "meaning": "من ... می‌خوام", "definition": "A standard way to state your order to a server.", "time": "02:00" },
        { "word": "Could I get the bill?", "pronunciation": "/kʊd aɪ ɡet ðə bɪl/", "meaning": "صورتحساب لطفاً", "definition": "Asking for the check or final amount to pay for your meal.", "time": "03:30" },
        { "word": "Is service included?", "pronunciation": "/ɪz ˈsɜːrvɪs ɪnˈkluːdɪd/", "meaning": "سرویس شامل هست؟", "definition": "Asking if the tip or service charge is already added to the bill.", "time": "04:15" }
    ],
    "quiz": [
        { "question": "How do you ask for the menu?", "options": ["Give menu!", "Can I see the menu?", "Menu now!", "Where food?"], "answer": 1 },
        { "question": "What does ''bill'' mean in a restaurant?", "options": ["منو", "صورتحساب", "انعام", "غذا"], "answer": 1 }
    ]
}'
WHERE video_id = 'IoSFYeDN-Vc';

-- 4. Business English (0jblRoyR-Jk)
UPDATE content
SET metadata = '{
    "vocabulary": [
        { "word": "Let''s get started", "pronunciation": "/lets ɡet ˈstɑːrtɪd/", "meaning": "بیایید شروع کنیم", "definition": "An common way to officially begin a meeting or project.", "time": "00:30" },
        { "word": "Could you elaborate on that?", "pronunciation": "/kʊd ju ɪˈlæbəreɪt ɒn ðæt/", "meaning": "میشه بیشتر توضیح بدید؟", "definition": "A professional way to ask someone for more details about a point.", "time": "02:00" },
        { "word": "To summarize", "pronunciation": "/tu ˈsʌməraɪz/", "meaning": "به طور خلاصه", "definition": "To briefly give the main points of something.", "time": "03:00" },
        { "word": "Action items", "pronunciation": "/ˈækʃn ˈaɪtəmz/", "meaning": "موارد اقدام", "definition": "Specific tasks assigned to individuals during a meeting to be completed later.", "time": "04:00" },
        { "word": "Please find attached", "pronunciation": "/pliːz faɪnd əˈtætʃt/", "meaning": "فایل پیوست را ببینید", "definition": "A standard phrase in business emails to direct attention to an attachment.", "time": "05:30" },
        { "word": "Best regards", "pronunciation": "/best rɪˈɡɑːrdz/", "meaning": "با احترام", "definition": "A formal way to end a business email or letter.", "time": "07:00" }
    ],
    "quiz": [
        { "question": "How do you start a business meeting?", "options": ["Start now!", "Let''s get started", "Begin!", "We start"], "answer": 1 },
        { "question": "What does ''Please find attached'' mean?", "options": ["لطفاً پیدا کنید", "فایل پیوست را ببینید", "لطفاً بنویسید", "ارسال کنید"], "answer": 1 },
        { "question": "How do you end a professional email?", "options": ["Bye", "See ya", "Best regards", "Later"], "answer": 2 }
    ]
}'
WHERE video_id = '0jblRoyR-Jk';

-- 5. Idioms & Expressions (Y9MtlTbrORY)
UPDATE content
SET metadata = '{
    "vocabulary": [
        { "word": "Break a leg", "pronunciation": "/breɪk ə leɡ/", "meaning": "موفق باشی! (در تئاتر)", "definition": "An expression used to wish someone good luck, especially before a performance.", "time": "00:45" },
        { "word": "Piece of cake", "pronunciation": "/piːs əv keɪk/", "meaning": "خیلی آسونه", "definition": "Something that is very easy to accomplish.", "time": "01:30" },
        { "word": "Hit the nail on the head", "pronunciation": "/hɪt ðə neɪl ɒn ðə hed/", "meaning": "دقیقاً درست گفتی", "definition": "To describe exactly what is causing a situation or problem.", "time": "02:15" },
        { "word": "Bite the bullet", "pronunciation": "/baɪt ðə ˈbʊlɪt/", "meaning": "با شجاعت قبول کردن", "definition": "To accept something difficult or unpleasant that is unavoidable.", "time": "03:00" },
        { "word": "Cost an arm and a leg", "pronunciation": "/kɒst ən ɑːrm ənd ə leɡ/", "meaning": "خیلی گرون بود", "definition": "Used to describe something that is extremely expensive.", "time": "04:00" },
        { "word": "Once in a blue moon", "pronunciation": "/wʌns ɪn ə bluː muːn/", "meaning": "خیلی به ندرت", "definition": "Something that happens very rarely.", "time": "05:00" },
        { "word": "Under the weather", "pronunciation": "/ˈʌndər ðə ˈweðər/", "meaning": "حالم خوب نیست", "definition": "Feeling slightly ill or not well.", "time": "06:00" }
    ],
    "quiz": [
        { "question": "What does ''piece of cake'' mean?", "options": ["کیک خوشمزه", "خیلی آسان", "غذای خوب", "تولد"], "answer": 1 },
        { "question": "If something ''costs an arm and a leg'', it is:", "options": ["ارزان", "رایگان", "خیلی گران", "متوسط"], "answer": 2 },
        { "question": "''Under the weather'' means:", "options": ["هوا بارانی است", "حالم خوب نیست", "بیرون هستم", "سردم است"], "answer": 1 }
    ]
}'
WHERE video_id = 'Y9MtlTbrORY';

-- 6. Pronunciation Tips (ti3UtLzfas0)
UPDATE content
SET metadata = '{
    "vocabulary": [
        { "word": "Pronunciation", "pronunciation": "/prəˌnʌnsiˈeɪʃn/", "meaning": "تلفظ", "definition": "The way in which a word is pronounced.", "time": "00:30" },
        { "word": "Stress", "pronunciation": "/stres/", "meaning": "تکیه (در کلمات)", "definition": "Emphasis given to a particular syllable or word in speech.", "time": "01:00" },
        { "word": "Intonation", "pronunciation": "/ˌɪntəˈneɪʃn/", "meaning": "آهنگ کلام", "definition": "The rise and fall of the voice when speaking.", "time": "02:00" },
        { "word": "Vowel sounds", "pronunciation": "/ˈvaʊəl saʊndz/", "meaning": "صداهای مصوت", "definition": "Speech sounds produced without friction or stoppage of air.", "time": "03:00" },
        { "word": "Consonant clusters", "pronunciation": "/ˈkɒnsənənt ˈklʌstərz/", "meaning": "خوشه‌های همخوان", "definition": "Groups of consonants that appear together without a vowel between them.", "time": "04:30" }
    ],
    "quiz": [
        { "question": "What is ''stress'' in pronunciation?", "options": ["استرس", "تکیه", "صدا", "حرف"], "answer": 1 },
        { "question": "What are vowel sounds?", "options": ["حروف بیصدا", "صداهای مصوت", "کلمات", "جملات"], "answer": 1 }
    ]
}'
WHERE video_id = 'ti3UtLzfas0';

-- 7. NYC Travel (OOkKNt71Rpc)
UPDATE content
SET metadata = '{
    "vocabulary": [
        { "word": "Itinerary", "pronunciation": "/aɪˈtɪnəreri/", "meaning": "برنامه سفر", "definition": "A planned route or journey with a list of activities.", "time": "00:45" },
        { "word": "Subway", "pronunciation": "/ˈsʌbweɪ/", "meaning": "مترو / قطار زیرزمینی", "definition": "An underground electric railway system in a city.", "time": "02:10" },
        { "word": "Commute", "pronunciation": "/kəˈmjuːt/", "meaning": "رفت و آمد روزانه", "definition": "To travel some distance between one''s home and place of work on a regular basis.", "time": "03:15" },
        { "word": "Iconic", "pronunciation": "/aɪˈkɒnɪk/", "meaning": "نمادین", "definition": "Very famous or popular and representative of a particular idea or place.", "time": "05:20" },
        { "word": "Bagel", "pronunciation": "/ˈbeɪɡl/", "meaning": "نان بیگل", "definition": "A dense, ring-shaped bread roll that is boiled before being baked.", "time": "08:15" },
        { "word": "Observation Deck", "pronunciation": "/ˌɒbzəˈveɪʃn dek/", "meaning": "سکوی تماشا", "definition": "An elevated platform, often in a tall building, for viewing the surrounding area.", "time": "14:30" },
        { "word": "Vibrant", "pronunciation": "/ˈvaɪbrənt/", "meaning": "پرجنب و جوش", "definition": "Full of energy, life, and enthusiasm.", "time": "18:00" }
    ],
    "quiz": [
        { "question": "What is the fastest way to get around NYC according to the video?", "options": ["Yellow Taxi", "Subway", "Walking", "Bus"], "answer": 1 },
        { "question": "Which famous park is mentioned as the lungs of the city?", "options": ["Bryant Park", "Central Park", "Battery Park", "High Line"], "answer": 1 },
        { "question": "What is a ''Bagel''?", "options": ["A type of coffee", "A famous building", "A ring-shaped bread", "A subway ticket"], "answer": 2 }
    ]
}'
WHERE video_id = 'OOkKNt71Rpc';

