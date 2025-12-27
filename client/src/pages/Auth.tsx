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
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  username: z.string().min(1, "نام کاربری الزامی است"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

export default function AuthPage() {
  const { login, register, isLoggingIn, isRegistering, loginError, registerError } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", password: "", role: "student" },
  });

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-muted/20">
      <Card className="w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border-0">
        <div className="bg-primary p-8 text-center text-primary-foreground">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm text-2xl font-bold">
            F
          </div>
          <h1 className="text-2xl font-bold">خوش آمدید</h1>
          <p className="text-primary-foreground/80 mt-2">به جامعه یادگیری زبان بپیوندید</p>
        </div>
        
        <CardContent className="p-8">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted rounded-xl p-1">
              <TabsTrigger value="login" className="rounded-lg">ورود</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg">ثبت نام</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit((data) => login(data))} className="space-y-6">
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
                        <FormControl>
                          <Input className="h-12 rounded-xl" placeholder="نام کاربری خود را وارد کنید" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input type="password" className="h-12 rounded-xl" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full h-12 rounded-xl text-lg" disabled={isLoggingIn}>
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
                        <FormControl>
                          <Input className="h-12 rounded-xl" placeholder="یک نام کاربری انتخاب کنید" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input type="password" className="h-12 rounded-xl" placeholder="حداقل ۶ کاراکتر" {...field} />
                        </FormControl>
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
