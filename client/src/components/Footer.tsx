import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  return (
    <footer className="bg-background border-t border-border mt-auto pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl">
                S
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-foreground tracking-tight">{t('footer.title')}</span>
                <span className="text-xs text-muted-foreground font-medium -mt-1">{t('footer.subtitle')}</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              {t('footer.description')}
            </p>
            <div className="flex gap-4">
              <a href="https://www.youtube.com/@say.it.english" target="_blank" rel="noopener noreferrer" className="p-2 bg-background border border-border rounded-full hover:border-red-500 hover:text-red-500 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-background border border-border rounded-full hover:border-primary hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-background border border-border rounded-full hover:border-primary hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-background border border-border rounded-full hover:border-primary hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3">
              {[
                { label: t('footer.links.home'), path: "/" },
                { label: t('footer.links.placement'), path: "/placement" },
                { label: t('footer.links.videos'), path: "/videos" },
                { label: t('footer.links.podcasts'), path: "/content" },
                { label: t('footer.links.bookings'), path: "/bookings" },
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
            <h3 className="font-bold text-lg">{t('footer.contactUs')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span dir="ltr">info@language-teacher.com</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span dir="ltr">+98 21 1234 5678</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>{t('footer.address')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}

