import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useBookings } from "@/hooks/use-bookings";
import { Calendar, BookOpen, User as UserIcon, LogOut, Settings, Sparkles, Edit, UserCog } from "lucide-react";
import { Link, useLocation } from "wouter";
import { SecureVideoPlayer } from "@/components/SecureVideoPlayer";
import { motion } from "framer-motion";
import { pageVariants, containerVariants, itemVariants } from "@/lib/animations";
import { ProfileSkeleton, StatsSkeleton, ListItemSkeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const { user, logout, isLoading } = useAuth();
  const { data: bookings, isLoading: isLoadingBookings } = useBookings();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 lg:col-span-3">
            <ProfileSkeleton />
          </div>
          <div className="md:col-span-8 lg:col-span-9 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatsSkeleton />
              <StatsSkeleton />
              <StatsSkeleton />
            </div>
            <div className="space-y-4">
              <ListItemSkeleton />
              <ListItemSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  const stats = [
    {
      icon: Calendar,
      label: "رزروهای فعال",
      value: bookings?.length || 0,
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: BookOpen,
      label: "کلاس‌های من",
      value: 0,
      color: "bg-green-100 text-green-600",
    },
    {
      icon: UserIcon,
      label: "وضعیت",
      value: "فعال",
      color: "bg-orange-100 text-orange-600",
      isText: true,
    },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="container mx-auto px-4 py-12"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* Sidebar Info */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="md:col-span-4 lg:col-span-3"
        >
          <Card className="rounded-[2rem] border-0 shadow-xl text-center overflow-hidden glass">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 h-32 mb-12 relative">
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </div>
            </div>
            <CardContent className="pt-0 pb-8 px-6">
              <h2 className="text-xl font-bold mb-1">{user.username}</h2>
              <p className="text-muted-foreground mb-6 text-sm">{user.role === 'admin' ? 'مدرس' : 'دانش‌آموز'}</p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 mb-6 border border-primary/10"
              >
                <p className="text-xs text-muted-foreground uppercase mb-1 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  سطح زبان
                </p>
                <p className="font-bold text-lg gradient-text">
                  {user.level || "تعیین سطح نشده"}
                </p>
              </motion.div>

              {user.role === 'admin' && (
                <Button
                  className="w-full rounded-xl mb-3 bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 btn-press shadow-lg shadow-amber-500/20"
                  onClick={() => setLocation("/admin")}
                >
                  <Settings className="w-4 h-4 ml-2" />
                  داشبورد ادمین
                </Button>
              )}

              <Link href="/edit-profile">
                <Button
                  variant="outline"
                  className="w-full rounded-xl mb-3 border-primary/30 text-primary hover:bg-primary/10 btn-press"
                >
                  <Edit className="w-4 h-4 ml-2" />
                  ویرایش پروفایل
                </Button>
              </Link>

              <Button
                variant="outline"
                className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive btn-press"
                onClick={() => logout()}
              >
                <LogOut className="w-4 h-4 ml-2" />
                خروج
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="md:col-span-8 lg:col-span-9 space-y-8">

          {/* Stats Grid with Staggered Animation */}
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {stats.map((stat, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Card className="rounded-2xl border border-border/50 shadow-sm p-6 flex items-center gap-4 card-hover hover:shadow-xl transition-all">
                  <div className={`p-3 ${stat.color} rounded-xl`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.isText ? 'text-green-600' : ''}`}>
                      {stat.value}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Test Video Player Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="rounded-[2rem] border border-border/50 shadow-sm glass-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  پخش کننده ویدیوی امن (تست)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    این بخش برای تست سیستم استریم امن است. اگر فایل ویدیویی در باکت موجود باشد و در دیتابیس ثبت شده باشد، اینجا پخش می‌شود.
                  </p>
                  <SecureVideoPlayer contentId={1} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="rounded-[2rem] border border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>رزروهای اخیر</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingBookings ? (
                  <div className="space-y-4">
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                  </div>
                ) : bookings && bookings.length > 0 ? (
                  <motion.div
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                    className="space-y-4"
                  >
                    {bookings.map((booking: any) => (
                      <motion.div
                        key={booking.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-border shadow-sm">
                            <Calendar className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold">{booking.type === 'consultation' ? 'مشاوره تعیین سطح' : 'کلاس خصوصی'}</p>
                            <p className="text-sm text-muted-foreground">{new Date(booking.date).toLocaleDateString('fa-IR')}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {booking.status === 'confirmed' ? 'تایید شده' : booking.status === 'pending' ? 'در انتظار' : 'لغو شده'}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>هنوز رزروی ثبت نکرده‌اید.</p>
                    <Button onClick={() => setLocation("/bookings")} variant="link" className="text-primary mt-2 btn-press">
                      رزرو وقت جدید
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
