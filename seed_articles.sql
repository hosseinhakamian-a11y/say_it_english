-- 1. Ensure columns exist
ALTER TABLE content ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE content ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 2. Insert Article 1: IELTS Roadmap
INSERT INTO content (title, description, type, level, slug, author, tags, body, is_premium, thumbnail_url)
VALUES 
(
  'چگونه آیلتس را از صفر شروع کنیم؟ (نقشه راه ۲۰۲۵)',
  'راهنمای کامل خودآموز آیلتس برای مبتدیان. منابع، برنامه‌ریزی و تکنیک‌های نمره‌آور بدون کلاس.',
  'article',
  'beginner',
  'how-to-start-ielts-from-zero',
  'Hossein Hakamian',
  ARRAY['IELTS', 'Self-study', 'Exam', 'English Basics'],
  '<h2>مقدمه: چرا آیلتس؟</h2><p>آیلتس (IELTS) فقط یک امتحان زبان نیست؛ بلکه کلید مهاجرت تحصیلی و کاری به بیش از 140 کشور جهان است. اما شروع آن می‌تواند ترسناک باشد...</p><h3>گام اول: تعیین سطح واقعی</h3><p>قبل از هر چیز باید بدانید کجا ایستاده‌اید. آزمون‌های ماک آنلاین بهترین گزینه هستند.</p><h3>گام دوم: منابع طلایی</h3><ul><li>کتاب‌های Cambridge IELTS 10-18</li><li>مجموعه Vocabulary for IELTS</li><li>Grammar for IELTS</li></ul><h3>تکنیک های نمره‌آور</h3><p>برای رایتینگ تسک 2، حتما ساختار پاراگراف‌بندی استاندارد را رعایت کنید...</p>',
  FALSE,
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000'
);

-- 3. Insert Article 2: Speaking Techniques
INSERT INTO content (title, description, type, level, slug, author, tags, body, is_premium, thumbnail_url)
VALUES 
(
  '۵ تکنیک طلایی برای تقویت مکالمه (Speaking) بدون پارتنر',
  'چگونه بدون داشتن پارتنر زبان، مکالمه انگلیسی خود را روان و سریع کنیم؟ معرفی تکنیک سایه.',
  'article',
  'intermediate',
  'improve-speaking-without-partner',
  'Hossein Hakamian',
  ARRAY['Speaking', 'Fluency', 'Shadowing', 'Conversation'],
  '<h2>مکالمه بدون پارتنر: ممکن یا غیرممکن؟</h2><p>بسیاری فکر می‌کنند برای یادگیری مکالمه حتماً نیاز به کلاس خصوصی یا پارتنر خارجی دارند. اما این باور غلط است.</p><h3>تکنیک سایه (Shadowing)</h3><p>این قوی‌ترین متد برای بهبود لهجه و سرعت گفتار است. یک پادکست انگلیسی پخش کنید و همزمان (با تاخیر نیم ثانیه) جملات را تکرار کنید.</p><h3>ضبط صدا</h3><p>صدای خود را هنگام صحبت کردن ضبط کنید و با اصل آن مقایسه کنید. این کار معجزه می‌کند.</p>',
  FALSE,
  'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&q=80&w=1000'
);

-- 4. Insert Article 3: Vocabulary Learning
INSERT INTO content (title, description, type, level, slug, author, tags, body, is_premium, thumbnail_url)
VALUES 
(
  'راز فراموش نکردن لغات انگلیسی: متد جعبه لایتنر',
  'چرا لغات جدید را فراموش می‌کنیم؟ یادگیری واژگان با تکنیک تکرار فاصله‌دار (Spaced Repetition).',
  'article',
  'beginner',
  'how-to-memorize-vocabulary-forever',
  'Hossein Hakamian',
  ARRAY['Vocabulary', 'Leitner Box', 'Memory', 'Learning'],
  '<h2>مشکل فراموشی لغات</h2><p>تحقیقات نشان می‌دهد ما ۸۰٪ مطالب جدید را در عرض ۲۴ ساعت فراموش می‌کنیم اگر مرور نشوند.</p><h3>راه حل: Spaced Repetition</h3><p>تکرار فاصله‌دار یعنی مرور لغت در زمان‌های مشخص: ۱ روز بعد، ۳ روز بعد، ۱ هفته بعد و ۱ ماه بعد.</p><h3>استفاده از اپلیکیشن Anki</h3><p>بهترین ابزار دیجیتال برای این کار نرم‌افزار Anki است که به صورت رایگان در دسترس است.</p>',
  FALSE,
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1000'
);
