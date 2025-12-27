import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4 rounded-2xl border-none shadow-xl">
        <CardContent className="pt-6 text-center p-12">
          <div className="flex mb-6 justify-center">
            <AlertCircle className="h-16 w-16 text-destructive opacity-80" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">۴۰۴ - صفحه یافت نشد</h1>
          <p className="mt-4 text-sm text-gray-500 mb-8 leading-relaxed">
            متاسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد. ممکن است آدرس اشتباه باشد یا صفحه حذف شده باشد.
          </p>
          <Link href="/">
            <Button className="w-full h-12 rounded-xl text-lg">
              بازگشت به خانه
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
