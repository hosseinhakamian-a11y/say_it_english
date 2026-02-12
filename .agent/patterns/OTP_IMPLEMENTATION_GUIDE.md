# الگوی پیاده‌سازی ورودی OTP (Segmented OTP Input Pattern)

## مشکل (The Problem)
در پیاده‌سازی ورودی‌های چند بخشی (مانند کد تایید ۶ رقمی)، چالش‌های زیر وجود دارد:
1. **مدیریت فوکوس:** پرش خودکار به خانه بعدی و بازگشت با Backspace.
2. **ناپدید شدن محتوا:** اگر از Space برای پر کردن خانه‌های خالی استفاده شود، در UI نمایش داده شده و باعث تداخل با Placeholder می‌شود.
3. **مشکلات تایپ:** تایپ سریع باعث می‌شود برخی کاراکترها جا بیفتند یا state به درستی آپدیت نشود.
4. **اعتبارسنجی:** فرم‌های متصل به Zod ممکن است با مقادیر "پر شده با فاصله" مشکل داشته باشند.

## راه حل نهایی (The Solution)

### 1. جداسازی State محلی از State فرم
برای جلوگیری از تداخل (`Race Conditions`)، باید یک `Local State` (آرایه) برای مدیریت لحظه‌ای داشته باشیم و آن را با `useEffect` به فرم اصلی سینک کنیم.

### 2. استفاده از `useEffect` برای همگام‌سازی
```tsx
  // Local state for UI
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);

  // Sync to Form (React Hook Form)
  useEffect(() => {
    const finalOtp = otpValues.join("");
    // Only validate when full
    otpForm.setValue("otp", finalOtp, { shouldValidate: finalOtp.length === 6 });
  }, [otpValues, otpForm]);
```

### 3. مدیریت هوشمند Backspace
رفتار پیش‌فرض مرورگر باید `preventDefault` شود تا بتوانیم فوکوس را دستی کنترل کنیم:

```tsx
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault(); 
      const newOtpValues = [...otpValues];
      
      if (newOtpValues[index]) {
        // اگر خانه فعلی پر است، فقط آن را خالی کن
        newOtpValues[index] = "";
        setOtpValues(newOtpValues);
      } else if (index > 0) {
        // اگر خالی است، یکی عقب برو و آن را پاک کن
        newOtpValues[index - 1] = "";
        setOtpValues(newOtpValues);
        otpRefs[index - 1].current?.focus();
      }
    }
    // Handle Arrows...
  };
```

### 4. استایل‌دهی برای زبان فارسی
برای نمایش صحیح اعداد در دیزاین‌های مدرن فارسی:
- استفاده از فونت استاندارد (مثل `Vazirmatn`).
- تنظیم `dir="ltr"` برای کانتینر اصلی (تا ترتیب خانه‌ها از چپ به راست باشد - استاندارد ریاضی).
- تنظیم `text-center`.

### 5. نکته حیاتی (Empty Space)
هرگز از کاراکتر فاصله (`" "`) برای نگه داشتن جای خالی استفاده نکنید. آرایه باید شامل رشته‌های خالی `""` باشد.

---
**تاریخ ایجاد:** 2026-02-12
**پروژه:** Say It English
