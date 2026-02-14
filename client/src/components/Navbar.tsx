import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X, User, LogOut, LayoutDashboard, Crown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout, isLoading } = useAuth();

  const getDisplayName = () => {
    if (!user) return "";
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return user.username;
  };

  const getUserInitials = () => {
    if (!user) return "??";
    if (user.firstName) return user.firstName;
    return user.username.slice(0, 2).toUpperCase();
  };

  const navItems = [
    { label: "خانه", path: "/" },
    { label: "تعیین سطح", path: "/placement" },
    { label: "دوره‌های آموزشی", path: "/content" },
    { label: "ویدیوهای آموزشی", path: "/videos" },
    { label: "رزرو وقت", path: "/bookings" },
    { label: "کلاس‌های گروهی", path: "/classes" },
    { label: "وبلاگ", path: "/blog" },
    { label: "قیمت‌ها", path: "/pricing", highlight: true },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-background/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">

          {/* Mobile: Menu + User on LEFT (visually RIGHT in RTL) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-muted-foreground hover:bg-muted"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            {/* Mobile User Menu */}
            {isLoading ? (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-cyan-700 text-white font-bold text-[10px] px-1">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white dark:bg-gray-900 shadow-xl border rounded-2xl" align="start" sideOffset={8}>
                  <div dir="rtl">
                    <div className="px-4 py-3 border-b mb-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{getDisplayName()}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.username}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>داشبورد من</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>پروفایل کاربری</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                      <LogOut className="h-4 w-4 ml-2" />
                      <span>خروج از حساب</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <div className="flex items-center gap-1 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-full p-0.5">
                  <span className="px-2 py-1 text-xs font-medium text-primary">ورود</span>
                  <span className="px-2 py-1 text-xs font-medium bg-primary text-white rounded-full">ثبت نام</span>
                </div>
              </Link>
            )}
          </div>

          {/* Logo - Always visible, positioned RIGHT on mobile (LEFT in RTL) */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-xl shadow-primary/20 group-hover:rotate-6 transition-all duration-300">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-foreground tracking-tight">Say It English</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest -mt-1">American English Tutor</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 bg-muted/50 p-1 rounded-full">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive(item.path)
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm transition-transform group-hover:scale-105">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-cyan-700 text-white font-bold text-xs px-1">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-white dark:bg-gray-900 shadow-xl border rounded-2xl" align="end" sideOffset={8}>
                  <div dir="rtl">
                    <div className="px-4 py-3 border-b mb-2 bg-muted/20">
                      <p className="text-sm font-bold text-gray-900 truncate">{getDisplayName()}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.username}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>داشبورد من</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>پروفایل کاربری</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                      <LogOut className="h-4 w-4 ml-2" />
                      <span>خروج از حساب</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <div className="flex items-center gap-1 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm border border-primary/20 rounded-full p-1 hover:border-primary/40 transition-all">
                  <span className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-white/80 rounded-full transition-colors">ورود</span>
                  <span className="px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-full shadow-sm">ثبت نام</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${isActive(item.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
