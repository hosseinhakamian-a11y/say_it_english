import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-border mt-auto pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                F
              </div>
              <span className="font-bold text-xl text-foreground">زبان‌آموز</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              بهترین پلتفرم یادگیری زبان با متدهای نوین آموزشی. ما اینجا هستیم تا یادگیری زبان را برای شما آسان و لذت‌بخش کنیم. با ما همراه باشید تا به اهداف زبانی خود برسید.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-white border border-border rounded-full hover:border-primary hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-white border border-border rounded-full hover:border-primary hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-white border border-border rounded-full hover:border-primary hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg">دسترسی سریع</h3>
            <ul className="space-y-3">
              {[
                { label: "خانه", path: "/" },
                { label: "تعیین سطح", path: "/placement" },
                { label: "پادکست‌ها", path: "/content" },
                { label: "رزرو وقت", path: "/bookings" },
              ].map((item) => (
                <li key={item.path}>
                  <Link href={item.path} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg">تماس با ما</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail className="h-5 w-5 text-primary" />
                <span>info@language-teacher.com</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="h-5 w-5 text-primary" />
                <span>+98 21 1234 5678</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <MapPin className="h-5 w-5 text-primary" />
                <span>تهران، میدان انقلاب</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>© ۱۴۰۳ تمامی حقوق محفوظ است.</p>
        </div>
      </div>
    </footer>
  );
}
