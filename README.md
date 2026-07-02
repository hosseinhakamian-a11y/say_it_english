# Say It English 🗣️

یک پلتفرم آموزش زبان انگلیسی

## 🚀 دیپلوی در Vercel

نسخه زنده این پروژه فقط روی **Vercel** دیپلوی می‌شود (پروژه `say-it-english`). با هر push به برنچ `main`، Vercel به‌صورت خودکار بیلد و دیپلوی می‌کند؛ نیازی به مرحله دستی نیست. بک‌اند production یک تابع سرورلس یکپارچه در `api/index.ts` است (تمام مسیرهای `/api/*` طبق `vercel.json` به همین فایل هدایت می‌شوند).

متغیرهای محیطی لازم (`DATABASE_URL`, `AVALAI_API_KEY`, و مشابه) باید در تنظیمات پروژه روی Vercel (Project Settings → Environment Variables) ست شوند، نه در فایل‌های `.env*`.

## 🛠️ توسعه محلی

### پیش‌نیازها

- Node.js 20 یا بالاتر
- PostgreSQL یا Supabase
- npm یا yarn

### نصب

```bash
npm install
```

### تنظیم دیتابیس

1. یک فایل `.env` در ریشه پروژه بسازید
2. متغیر زیر را اضافه کنید:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

3. جداول را بسازید:

```bash
npm run db:push
```

### اجرای پروژه

```bash
npm run dev
```

پروژه روی `http://localhost:5000` اجرا می‌شود.

## 📦 ساخت برای Production

```bash
npm run build
```

## 🗄️ دیتابیس

این پروژه از:
- **Drizzle ORM** برای مدیریت دیتابیس
- **PostgreSQL** به عنوان دیتابیس
- **Supabase** برای دیتابیس در production

استفاده می‌کند.

## 🏗️ ساختار پروژه

```
.
├── client/          # فایل‌های React (Frontend)
├── api/
│   └── index.ts     # بک‌اند واقعی Production — تابع سرورلس یکپارچه روی Vercel
├── server/          # Express — فقط برای development محلی (npm run dev)
│   ├── index.ts     # Entry point برای development
│   ├── routes.ts    # API routes (نسخه ساده‌تر و ناقص‌تر نسبت به api/index.ts)
│   └── db.ts        # تنظیمات دیتابیس
├── shared/          # کدهای مشترک بین client و server
│   └── schema.ts    # Schema دیتابیس
└── dist/            # فایل‌های build شده
```

> ⚠️ `server/routes.ts` هنوز از نظر قابلیت‌ها عقب‌تر از `api/index.ts` است (مثلاً گیمیفیکیشن، اشتراک‌ها، آپلود S3 و `/api/chat` را ندارد)، پس رفتار `npm run dev` لزوماً همان رفتار production نیست.

## 📝 لایسنس

MIT
