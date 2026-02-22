import rateLimit from "express-rate-limit";

// Rate limiter for login, register, and OTP requests
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "درخواست‌های ورود بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر دوباره تلاش کنید.",
});

// Rate limiter for financial and booking transactions
export const transactionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 transaction attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: "تعداد درخواست‌های مالی/رزرو شما در این ساعت بیش از حد مجاز بوده است. لطفاً بعداً تلاش کنید.",
});

// General API rate limiter (optional, for the whole API)
export const apiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // Limit each IP to 200 requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: "تعداد درخواست‌های شما بیش از حد مجاز است.",
});
