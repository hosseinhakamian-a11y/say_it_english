import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertUser } from "@shared/schema";
import { useLocation } from "wouter";

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await fetch("/api/user", {
        credentials: "include"
      });
      if (res.status === 401) {
        return null;
      }
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json();
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });
      if (!res.ok) throw new Error("نام کاربری یا رمز عبور اشتباه است");
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      setLocation("/");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "ثبت نام با خطا مواجه شد");
      }
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      setLocation("/");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/logout", { 
        method: "POST",
        credentials: "include" 
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      setLocation("/auth");
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { phone: string; otp: string }) => {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.text();
        try {
          // Try to parse JSON error first
          const json = JSON.parse(error);
          throw new Error(json.error || json.message || "کد تایید نامعتبر است");
        } catch (e: any) {
          // If not JSON, throw raw text or original error
          throw new Error(e.message !== "کد تایید نامعتبر است" ? error : e.message);
        }
      }
      return await res.json();
    },
    onSuccess: (data) => {
      // The backend returns { message: "...", user: { ... } }
      // We need to set the user object in the cache
      console.log("OTP Verify Success, updating cache:", data.user);
      queryClient.setQueryData(["/api/user"], data.user);
      setLocation("/");
    },
  });

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    verifyOtp: verifyOtpMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isVerifyingOtp: verifyOtpMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    verifyOtpError: verifyOtpMutation.error,
  };
}
