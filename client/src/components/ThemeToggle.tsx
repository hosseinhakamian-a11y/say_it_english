import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    {resolvedTheme === "dark" ? (
                        <Moon className="h-4 w-4 text-yellow-400" />
                    ) : (
                        <Sun className="h-4 w-4 text-orange-500" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer">
                    <Sun className="h-4 w-4" />
                    <span>روشن</span>
                    {theme === "light" && <span className="mr-auto text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer">
                    <Moon className="h-4 w-4" />
                    <span>تاریک</span>
                    {theme === "dark" && <span className="mr-auto text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 cursor-pointer">
                    <Monitor className="h-4 w-4" />
                    <span>سیستم</span>
                    {theme === "system" && <span className="mr-auto text-primary">✓</span>}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
