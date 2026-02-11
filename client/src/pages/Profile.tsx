import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useBookings } from "@/hooks/use-bookings";
import { Calendar, BookOpen, User as UserIcon, LogOut, Settings, Sparkles, Edit, Trophy, PlayCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { pageVariants, containerVariants, itemVariants } from "@/lib/animations";
import { ProfileSkeleton, StatsSkeleton, ListItemSkeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const { user, logout, isLoading } = useAuth();
  const { data: bookings, isLoading: isLoadingBookings } = useBookings();
  const [, setLocation] = useLocation();

  // Fetch purchased content
  const { data: purchases, isLoading: isLoadingPurchases } = useQuery<any[]>({
    queryKey: ['/api/purchases'],
    queryFn: async () => {
      const res = await fetch('/api/purchases');
      if (!res.ok) throw new Error("Failed to fetch purchases");
      return await res.json();
    }
  });

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
      icon: Trophy,
      label: "سطح تعیین شده",
      value: user.level === 'advanced' ? 'پیشرفته' : user.level === 'intermediate' ? 'متوسط' : user.level === 'beginner' ? 'مبتدی' : 'نیاز به تعیین سطح',
      color: "bg-amber-100 text-amber-600",
      isText: true,
    },
    {
      icon: BookOpen,
      label: "دوره‌های من",
      value: purchases?.length || 0,
      color: "bg-green-100 text-green-600",
    },
    {
      icon: Calendar,
      label: "وضعیت اشتراک",
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
                  {user.level === 'advanced' ? 'پیشرفته' : user.level === 'intermediate' ? 'متوسط' : user.level === 'beginner' ? 'مبتدی' : 'تعیین سطح نشده'}
                </p>
                {(user as any).placementResult?.avgScore !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    امتیاز آخرین آزمون: {(user as any).placementResult.avgScore}%
                  </p>
                )}
                {!user.level && (
                  <Link href="/placement">
                    <Button size="sm" variant="link" className="text-primary mt-1 p-0 h-auto text-xs">
                      شروع آزمون تعیین سطح ←
                    </Button>
                  </Link>
                )}
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

          {/* Stats Grid */}
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
                    <p className={`text-xl font-bold ${stat.isText ? 'text-primary' : ''}`}>
                      {stat.value}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Purchased Content Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="rounded-[2rem] border border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-primary" />
                  دوره‌های خریداری شده
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingPurchases ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatsSkeleton />
                    <StatsSkeleton />
                  </div>
                ) : purchases && purchases.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {purchases.map((course: any) => {
                      let thumb = course.thumbnailUrl;
                      const provider = course.videoProvider?.toLowerCase().trim();
                      if (!thumb && provider === 'youtube' && course.videoId) {
                        thumb = `https://img.youtube.com/vi/${course.videoId}/maxresdefault.jpg`;
                      }
                      const href = course.type === 'course' ? `/course/${course.contentId}` : `/videos/${course.contentId}`;

                      return (
                        <Link key={course.contentId} href={href}>
                          <div className="group cursor-pointer bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-all border-border/50">
                            <div className="aspect-video relative overflow-hidden">
                              <img
                                src={thumb || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                                alt={course.title}
                                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlayCircle className="w-12 h-12 text-white" />
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-bold group-hover:text-primary transition-colors line-clamp-1">{course.title || `دوره #${course.contentId}`}</h3>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                  {course.level === 'beginner' ? 'مبتدی' : course.level === 'intermediate' ? 'متوسط' : 'پیشرفته'}
                                </span>
                                <span className="text-[10px] text-muted-foreground">خریداری شده</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>هنوز دوره‌ای خریداری نکرده‌اید.</p>
                    <Link href="/content">
                      <Button variant="link" className="text-primary mt-2">مشاهده دوره‌ها</Button>
                    </Link>
                  </div>
                )}
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
              <CardHeader className="border-b bg-muted/30">
                <CardTitle>رزروهای اخیر</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
                    className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl"
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
