import { useState, useRef } from "react";
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
import { Loader2, AlertCircle, Sparkles, Smartphone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SiGoogle } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { pageVariants, scaleUpVariants } from "@/lib/animations";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";

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
  otp: z.string().regex(/^\d{6}$/, "کد تایید باید ۶ رقم باشد"),
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, login, register, isLoggingIn, isRegistering, loginError, registerError, verifyOtp, isVerifyingOtp } = useAuth();

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

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
      if (!res.ok) throw new Error(result.message || "خطا در ارسال کد");
      setPhone(data.phone);
      setOtpStep("verify");
      toast({ title: "کد تایید ارسال شد ✅" });
    } catch (err: any) {
      toast({ title: "خطا", description: err.message, variant: "destructive" });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = (data: { otp: string }) => {
    verifyOtp(
      { phone, otp: data.otp, rememberMe },
      {
        onError: (err: any) => {
          toast({ title: "خطا", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  if (user) {
    window.location.href = "/";
    return null;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-primary/5 to-muted/20"
    >
      <motion.div variants={scaleUpVariants} initial="initial" animate="animate">
        <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border-0 bg-white/80 backdrop-blur-xl">
          <div className="bg-gradient-to-br from-primary to-primary-600 p-8 text-center text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-50" />
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md relative z-10"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
            <h1 className="text-3xl font-black relative z-10">خوش آمدید</h1>
            <p className="text-primary-foreground/80 mt-2 font-medium relative z-10">به جامعه زبان‌شناس بپیوندید</p>
          </div>

          <CardContent className="p-8">
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 rounded-2xl p-1.5 h-14">
                <TabsTrigger value="login" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">ورود</TabsTrigger>
                <TabsTrigger value="register" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">عضویت</TabsTrigger>
                <TabsTrigger value="otp" className="rounded-xl flex gap-2 items-center data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Smartphone className="w-4 h-4 text-primary" />
                  پیامک
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit((data) => login(data))} className="space-y-4">
                    {loginError && (
                      <Alert variant="destructive" className="rounded-2xl border-0 bg-red-50 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="font-medium">{loginError.message}</AlertDescription>
                      </Alert>
                    )}
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground mr-1">نام کاربری</FormLabel>
                          <FormControl><Input className="h-14 rounded-2xl border-muted/30 focus:border-primary transition-all text-lg" placeholder="نام کاربری یا موبایل" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground mr-1">رمز عبور</FormLabel>
                          <FormControl><Input type="password" className="h-14 rounded-2xl border-muted/30 focus:border-primary transition-all text-lg" placeholder="••••••••" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 p-1">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="ml-2 rounded-md" /></FormControl>
                          <FormLabel className="text-sm font-semibold text-muted-foreground cursor-pointer">مرا همواره لاگین نگه دار</FormLabel>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-14 rounded-2xl text-xl font-bold bg-primary hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 mt-4" disabled={isLoggingIn}>
                      {isLoggingIn ? <Loader2 className="animate-spin" /> : "ورود به حساب"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit((data) => register(data))} className="space-y-4">
                    {registerError && (
                      <Alert variant="destructive" className="rounded-2xl border-0 bg-red-50 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="font-medium">{registerError.message}</AlertDescription>
                      </Alert>
                    )}
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground mr-1">نام کاربری</FormLabel>
                          <FormControl><Input className="h-14 rounded-2xl border-muted/30 focus:border-primary transition-all text-lg" placeholder="انتخاب نام آیدی" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground mr-1">رمز عبور</FormLabel>
                          <FormControl><Input type="password" className="h-14 rounded-2xl border-muted/30 focus:border-primary transition-all text-lg" placeholder="حداقل ۶ کاراکتر" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-14 rounded-2xl text-xl font-bold bg-primary hover:bg-primary-600 shadow-lg shadow-primary/20 mt-4" disabled={isRegistering}>
                      {isRegistering ? <Loader2 className="animate-spin" /> : "عضویت سریع"}
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
                            <FormLabel className="text-muted-foreground mr-1">شماره موبایل</FormLabel>
                            <FormControl><Input className="h-14 rounded-2xl border-muted/30 focus:border-primary text-center text-xl tracking-widest font-bold" placeholder="09123456789" {...field} dir="ltr" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={phoneForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0 p-1">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="ml-2 rounded-md" /></FormControl>
                            <FormLabel className="text-sm font-semibold text-muted-foreground cursor-pointer">مرا همواره لاگین نگه دار</FormLabel>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full h-14 rounded-2xl text-xl font-bold bg-primary hover:bg-primary-600 shadow-lg shadow-primary/20 mt-4" disabled={isSendingOtp}>
                        {isSendingOtp ? <Loader2 className="animate-spin" /> : "ارسال کد ورود"}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <Form {...otpForm}>
                    <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-6">
                      <div className="text-center mb-6">
                        <p className="text-muted-foreground font-medium">کد ۶ رقمی به شماره <span className="text-primary font-bold">{phone}</span> ارسال شد</p>
                        <Button variant="link" size="sm" onClick={() => setOtpStep("request")} className="p-0 h-auto text-primary font-bold mt-1 underline">ویرایش شماره</Button>
                      </div>
                      <FormField
                        control={otpForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex justify-between gap-2" dir="ltr" onPaste={(e) => {
                                e.preventDefault();
                                const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                                let currentStr = field.value || "      ";
                                if (currentStr.length < 6) currentStr = currentStr.padEnd(6, " ");
                                const currentArr = currentStr.split("");
                                paste.split("").forEach((char, i) => {
                                  if (i < 6) currentArr[i] = char;
                                });
                                field.onChange(currentArr.join(""));
                                const lastIdx = Math.min(paste.length, 5);
                                otpRefs[lastIdx]?.current?.focus();
                              }}>
                                {[0, 1, 2, 3, 4, 5].map((index) => {
                                  const char = (field.value || "      ")[index];
                                  return (
                                    <input
                                      key={index}
                                      ref={otpRefs[index]}
                                      className={`w-12 h-16 text-center text-4xl font-black rounded-2xl border-2 transition-all duration-200 outline-none p-0 text-black shadow-sm ${char && char !== " "
                                          ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                                          : "border-muted/30 bg-muted/20"
                                        } focus:border-primary focus:ring-4 focus:ring-primary/20 focus:scale-105`}
                                      maxLength={1}
                                      type="text"
                                      inputMode="numeric"
                                      autoFocus={index === 0}
                                      value={char === " " ? "" : char}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "").slice(-1);
                                        let currentStr = field.value || "      ";
                                        if (currentStr.length < 6) currentStr = currentStr.padEnd(6, " ");
                                        const currentArr = currentStr.split("");

                                        if (val) {
                                          currentArr[index] = val;
                                          field.onChange(currentArr.join(""));
                                          if (index < 5) otpRefs[index + 1].current?.focus();
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Backspace") {
                                          e.preventDefault();
                                          let currentStr = field.value || "      ";
                                          if (currentStr.length < 6) currentStr = currentStr.padEnd(6, " ");
                                          const currentArr = currentStr.split("");

                                          if (currentArr[index] !== " ") {
                                            currentArr[index] = " ";
                                            field.onChange(currentArr.join(""));
                                          } else if (index > 0) {
                                            currentArr[index - 1] = " ";
                                            field.onChange(currentArr.join(""));
                                            otpRefs[index - 1].current?.focus();
                                          }
                                        } else if (e.key === "ArrowLeft" && index > 0) {
                                          e.preventDefault();
                                          otpRefs[index - 1].current?.focus();
                                        } else if (e.key === "ArrowRight" && index < 5) {
                                          e.preventDefault();
                                          otpRefs[index + 1].current?.focus();
                                        }
                                      }}
                                      onFocus={(e) => e.target.select()}
                                    />
                                  );
                                })}
                              </div>
                            </FormControl>
                            <FormMessage className="text-center mt-4" />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full h-14 rounded-2xl text-xl font-bold bg-primary hover:bg-primary-600 shadow-lg shadow-primary/20" disabled={isVerifyingOtp}>
                        {isVerifyingOtp ? <Loader2 className="animate-spin" /> : "تایید کد و ورود"}
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-muted-foreground font-semibold">یا ادامه با</span></div>
            </div>

            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 border-muted/30 hover:bg-muted/10 transition-all font-bold text-lg"
              onClick={() => window.location.href = "/api/auth/google"}
            >
              <SiGoogle className="w-5 h-5 text-red-500" />
              حساب کاربری گوگل
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
