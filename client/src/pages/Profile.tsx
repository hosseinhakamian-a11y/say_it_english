import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useBookings } from "@/hooks/use-bookings";
import { Loader2, Calendar, BookOpen, User as UserIcon, LogOut, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { SecureVideoPlayer } from "@/components/SecureVideoPlayer";

export default function Profile() {
  const { user, logout, isLoading } = useAuth();
  const { data: bookings } = useBookings();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* Sidebar Info */}
        <div className="md:col-span-4 lg:col-span-3">
          <Card className="rounded-[2rem] border-0 shadow-lg text-center overflow-hidden">
            <div className="bg-primary/10 h-32 mb-12 relative">
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <CardContent className="pt-0 pb-8 px-6">
              <h2 className="text-xl font-bold mb-1">{user.username}</h2>
              <p className="text-muted-foreground mb-6 text-sm">{user.role === 'admin' ? 'مدرس' : 'دانش‌آموز'}</p>

              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <p className="text-xs text-muted-foreground uppercase mb-1">سطح زبان</p>
                <p className="font-bold text-lg text-primary">
                  {user.level || "تعیین سطح نشده"}
                </p>
              </div>

              {user.role === 'admin' && (
                <Button
                  className="w-full rounded-xl mb-3 bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  onClick={() => setLocation("/admin")}
                >
                  <Settings className="w-4 h-4 ml-2" />
                  داشبورد ادمین
                </Button>
              )}

              <Button variant="outline" className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => logout()}>
                <LogOut className="w-4 h-4 ml-2" />
                خروج
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-8 lg:col-span-9 space-y-8">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-2xl border border-border/50 shadow-sm p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رزروهای فعال</p>
                <p className="text-2xl font-bold">{bookings?.length || 0}</p>
              </div>
            </Card>

            <Card className="rounded-2xl border border-border/50 shadow-sm p-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">کلاس‌های من</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </Card>

            <Card className="rounded-2xl border border-border/50 shadow-sm p-6 flex items-center gap-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">وضعیت</p>
                <p className="text-2xl font-bold text-green-600">فعال</p>
              </div>
            </Card>
          </div>

          {/* Test Video Player Section */}
          <Card className="rounded-[2rem] border border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>پخش کننده ویدیوی امن (تست)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  این بخش برای تست سیستم استریم امن است. اگر فایل `test-file.txt` (یا هر فایل ویدیویی) در باکت موجود باشد و در دیتابیس ثبت شده باشد، اینجا پخش می‌شود.
                </p>
                {/* Using ID 1 for test. Ensure Content ID 1 exists and has file_key set. */}
                <SecureVideoPlayer contentId={1} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>رزروهای اخیر</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings && bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-border">
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>هنوز رزروی ثبت نکرده‌اید.</p>
                  <Button onClick={() => setLocation("/bookings")} variant="link" className="text-primary mt-2">
                    رزرو وقت جدید
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
