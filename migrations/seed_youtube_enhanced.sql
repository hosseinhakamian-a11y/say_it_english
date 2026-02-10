INSERT INTO content (title, description, type, level, video_id, video_provider, is_premium, price, thumbnail_url, created_at, metadata)
VALUES (
  '1000 واژه پرتکرار انگلیسی - 1000 Most Common Words',
  'در این ویدیوی آموزشی، ۱۰۰۰ کلمه پرکاربرد زبان انگلیسی را یاد می‌گیرید که برای مکالمه روزمره ضروری هستند.

## روش مطالعه پیشنهادی
1. ویدیو را تماشا کنید
2. لغات جدید را در دفترچه یادداشت کنید
3. مثال‌های زده شده را با خود تکرار کنید

## Why this video?
Learning the most common words is the fastest way to improve your English fluency.',
  'video',
  'beginner',
  'FWMk42M7dBs', -- Example YouTube ID for "Common English Words"
  'youtube',
  true, -- Premium to demonstrate lock feature
  19000,
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
  NOW(),
  '{
      "vocabulary": [
          {
              "word": "Conversation",
              "pronunciation": "/ˌkɑːnvərˈseɪʃn/",
              "meaning": "مکالمه / گفتگو",
              "definition": "A talk, especially an informal one, between two or more people.",
              "time": "00:30"
          },
          {
              "word": "Necessary",
              "pronunciation": "/ˈnesəseri/",
              "meaning": "ضروری / لازم",
              "definition": "Required to be done, achieved, or present; needed; essential.",
              "time": "01:15"
          },
          {
              "word": "Common",
              "pronunciation": "/ˈkɑːmən/",
              "meaning": "رایج / متداول",
              "definition": "Occurring, found, or done often; prevalent.",
              "time": "02:00"
          },
          {
              "word": "Fluency",
              "pronunciation": "/ˈfluːənsi/",
              "meaning": "روانی کلام",
              "definition": "The ability to speak or write a foreign language easily and accurately.",
              "time": "02:45"
          }
      ],
      "quiz": [
          {
              "question": "Which word means ''essential''?",
              "options": ["Common", "Necessary", "Fluency", "Talk"],
              "answer": 1
          }
      ]
  }'
);
