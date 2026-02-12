import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { insertUserSchema } from "@shared/schema";
import { Loader2, AlertCircle, Phone, Mail, Lock, Smartphone, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SiGoogle } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { pageVariants, scaleUpVariants } from "@/lib/animations";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  username: z.string().min(1, "نام کاربری الزامی است"),
  password: z.string().min(1, "رمز عبور الزامی است"),
  rememberMe: z.boolean().default(false),
});

const phoneSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل نامعتبر است (مثال: 09123456789)"),
  rememberMe: z.boolean().default(false),
});

const otpSchema = z.object({
  otp: z.string().length(6, "کد تایید باید ۶ رقم باشد"),
});

import { useLocation } from "wouter";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, login, register, isLoggingIn, isRegistering, loginError, registerError, verifyOtp, isVerifyingOtp, verifyOtpError } = useAuth();

  if (user) {
    window.location.href = "/";
    return null;
  }
  const [mode, setMode] = useState<"login" | "register" | "otp">("login");
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [phone, setPhone] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", rememberMe: false },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", password: "", role: "student" },
  });

  const phoneForm = useForm({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "", rememberMe: false },
  });

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(z.object({ password: z.string().min(6, "حداقل ۶ کاراکتر") })),
    defaultValues: { password: "" },
  });

  const handleRequestOtp = async (data: { phone: string, rememberMe: boolean }) => {
    setIsSendingOtp(true);
    setRememberMe(data.rememberMe);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || JSON.stringify(result));
      }

      setPhone(data.phone);
      setOtpStep("verify");
      toast({ title: "کد تایید با موفقیت ارسال شد ✅" });
    } catch (err: any) {
      toast({ title: "خطای سیستمی", description: err.message, variant: "destructive" });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = (data: { otp: string }) => {
    verifyOtp(
      { phone, otp: data.otp, rememberMe },
      {
        onError: (err: any) => {
          toast({ title: "کد نامعتبر", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleSetPassword = async (data: { password: string }) => {
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "کلمه عبور با موفقیت تنظیم شد ✅" });
      passwordForm.reset();
    } catch (err: any) {
      toast({ title: "خطا", description: err.message, variant: "destructive" });
    }
  };

  if (user) return null;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-primary/5 to-muted/20"
    >
      <motion.div variants={scaleUpVariants} initial="initial" animate="animate">
        <Card className="w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border-0 glass">
          <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-center text-primary-foreground">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
            <h1 className="text-2xl font-bold">خوش آمدید</h1>
            <p className="text-primary-foreground/80 mt-2">به جامعه یادگیری زبان بپیوندید</p>
          </div>

          <CardContent className="p-8">
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted rounded-xl p-1">
                <TabsTrigger value="login" className="rounded-lg">ورود</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg">ثبت نام</TabsTrigger>
                <TabsTrigger value="otp" className="rounded-lg flex gap-1 items-center">
                  <Smartphone className="w-4 h-4" />
                  پیامک
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit((data) => login(data))} className="space-y-4">
                    {loginError && (
                      <Alert variant="destructive" className="rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{loginError.message}</AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نام کاربری</FormLabel>
                          <FormControl><Input className="h-12 rounded-xl" placeholder="نام کاربری یا موبایل" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رمز عبور</FormLabel>
                          <FormControl><Input type="password" className="h-12 rounded-xl" placeholder="••••••••" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 px-1">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} className="ml-2" />
                          </FormControl>
                          <FormLabel className="text-sm font-medium cursor-pointer">مرا به خاطر بسپار</FormLabel>
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full h-12 rounded-xl text-lg mt-2" disabled={isLoggingIn}>
                      {isLoggingIn ? <Loader2 className="animate-spin" /> : "ورود به حساب"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit((data) => register(data))} className="space-y-6">
                    {registerError && (
                      <Alert variant="destructive" className="rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{registerError.message}</AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نام کاربری</FormLabel>
                          <FormControl><Input className="h-12 rounded-xl" placeholder="یک نام کاربری انتخاب کنید" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رمز عبور</FormLabel>
                          <FormControl><Input type="password" className="h-12 rounded-xl" placeholder="حداقل ۶ کاراکتر" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full h-12 rounded-xl text-lg" disabled={isRegistering}>
                      {isRegistering ? <Loader2 className="animate-spin" /> : "ایجاد حساب کاربری"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="otp">
                {otpStep === "request" ? (
                  <Form {...phoneForm}>
                    <form onSubmit={phoneForm.handleSubmit(handleRequestOtp)} className="space-y-4">
                      <FormField
                        control={phoneForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>شماره موبایل</FormLabel>
                            <FormControl><Input className="h-12 rounded-xl" placeholder="09123456789" {...field} dir="ltr" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={phoneForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0 px-1">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} className="ml-2" />
                            </FormControl>
                            <FormLabel className="text-sm font-medium cursor-pointer">مرا به خاطر بسپار</FormLabel>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full h-12 rounded-xl text-lg mt-2" disabled={isSendingOtp}>
                        {isSendingOtp ? <Loader2 className="animate-spin" /> : "ارسال کد تایید"}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <Form {...otpForm}>
                    <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-6">
                      <div className="text-center mb-4">
                        <p className="text-sm text-muted-foreground italic">کد ۶ رقمی به شماره {phone} ارسال شد</p>
                        <Button variant="link" size="sm" onClick={() => setOtpStep("request")} className="p-0 h-auto">ویرایش شماره</Button>
                      </div>
                      <FormField
                        control={otpForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>کد تایید</FormLabel>
                            <FormControl>
                              <Input
                                className="h-14 rounded-xl text-center text-3xl font-bold tracking-[0.5em]"
                                placeholder="      "
                                {...field}
                                dir="ltr"
                                maxLength={6}
                                autoComplete="one-time-code"
                                inputMode="numeric"
                                pattern="\d*"
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, "");
                                  field.onChange(val);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full h-12 rounded-xl text-lg" disabled={isVerifyingOtp}>
                        {isVerifyingOtp ? <Loader2 className="animate-spin" /> : "تایید و ورود"}
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">یا استفاده از</span></div>
            </div>

            <Button
              variant="outline"
              className="w-full h-12 rounded-xl flex items-center justify-center gap-2 btn-press"
              onClick={() => window.location.href = "/api/auth/google"}
            >
              <SiGoogle className="w-5 h-5 text-red-500" />
              ورود با حساب گوگل
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
