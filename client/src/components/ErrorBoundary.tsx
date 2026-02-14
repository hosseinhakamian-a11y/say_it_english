import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-[60vh] flex items-center justify-center px-4" dir="rtl">
                    <div className="max-w-md w-full text-center p-8 bg-card rounded-3xl shadow-xl border border-border/50 space-y-6">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-2">مشکلی پیش آمد!</h2>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                یک خطای غیرمنتظره رخ داده است. لطفاً دوباره تلاش کنید یا به صفحه اصلی بروید.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button onClick={this.handleRetry} className="rounded-xl gap-2">
                                <RefreshCw className="w-4 h-4" />
                                تلاش مجدد
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl gap-2"
                                onClick={() => window.location.href = "/"}
                            >
                                <Home className="w-4 h-4" />
                                صفحه اصلی
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
