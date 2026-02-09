# 🌴 Say It English - حافظه پروژه (MANA_MEMORY.md)

## 📅 تاریخ آخرین بروزرسانی: ۲۰ بهمن ۱۴۰۴ (2026-02-09) - ساعت ۱۴:۱۲ تهران

---

## 🚀 دستاوردهای کلیدی اخیر (جلسه ۲۰ بهمن)

### 1. سیستم درآمدزایی از ویدیوهای یوتیوب 💰 ✅
- **استراتژی Freemium:** ویدیوهای رایگان + محتوای پریمیوم قابل فروش.
- **مدل قیمت‌گذاری:**
  - ویدیوهای رایگان: جذب کاربر (۳ ویدیو)
  - ویدیوهای پولی: ۴۹,۰۰۰ تا ۷۹,۰۰۰ تومان (۴ ویدیو)
- **پلن کامل:** `brain/.../implementation_plan.md`

### 2. قفل محتوای پریمیوم (Premium Content Lock) 🔒 ✅
- **فایل:** `client/src/pages/VideoDetail.tsx`
- **منطق:**
  - لغات: ۲ عدد رایگان + بقیه قفل با بلور
  - آزمون: ۱ سوال رایگان + بقیه قفل
  - دکمه CTA به صفحه پرداخت (`/payment/:id`)
- **نکته فنی:** همه Hooks باید قبل از `return` شرطی باشند (React Rules of Hooks).

### 3. تغییر نام منو ✅
- "محتوای آموزشی" → **"دوره‌های آموزشی"** (کاربر بداند پولی است)
- فایل‌ها: `Navbar.tsx`, `ContentLibrary.tsx`

### 4. بارگذاری ۸ ویدیوی آموزشی یوتیوب 🎬 ✅
- **فایل SQL:** `migrations/seed_all_videos.sql` (۷ ویدیو جدید)
- **فایل SQL:** `migrations/seed_nyc_video.sql` (۱ ویدیو نیویورک)
- **اجرا در Supabase:** SQL Editor → کپی و Run

### 5. رفع باگ API ویدیوی تکی ✅
- اضافه کردن `GET /api/content/:id` به `api/index.ts`
- اضافه کردن `PATCH /api/content/:id` برای ادمین
- اضافه کردن `metadata` به `mapContentRow`

---

## 📊 وضعیت فعلی سیستم (System Health)

- **Frontend:** React + Vite + TailwindCSS (Glassmorphism UI)
- **Backend:** Node.js (Vercel Serverless) - Monolithic API
- **Database:** Supabase PostgreSQL
- **Deploy:** Vercel 🟢 Healthy
- **Git:** `main` branch - آخرین کامیت: `60e979b`

---

## 🎯 نقشه راه آینده (Next Session Roadmap)

### اولویت ۱: تکمیل درآمدزایی
- [ ] **پکیج‌های موضوعی:** گروه‌بندی ویدیوها (سفر، بیزینس، روزمره)
- [ ] **سیستم اشتراک:** ماهانه ۷۹,۰۰۰ / سالانه ۶۹۰,۰۰۰

### اولویت ۲: داشبورد کاربر
- [ ] لیست دوره‌های خریداری شده
- [ ] پیشرفت یادگیری (Progress Tracker)

### اولویت ۳: PDF دانلودی
- [ ] تولید PDF از لغات و آزمون هر ویدیو

---

## 🔧 راهنمای سریع

### افزودن ویدیوی جدید
1. لینک یوتیوب را بگیرید (مثلاً `youtu.be/ABC123`)
2. Video ID را استخراج کنید: `ABC123`
3. SQL بنویسید با `video_id`, `video_provider: 'youtube'`, `metadata` (لغات و آزمون)
4. در Supabase SQL Editor اجرا کنید

### تست قفل پریمیوم
1. ویدیو را در پنل ادمین `isPremium: true` کنید
2. بدون لاگین به صفحه ویدیو بروید
3. تب لغات → باید ۲ لغت + قفل ببینید

---

## 💸 اطلاعات مالی پروژه
- **آدرس ولت (BEP20):** `0x2ca84105e9e3f3a91f0385acbd497923d743a342`
