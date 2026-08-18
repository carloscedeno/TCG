import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeProvider";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    // Resolving system theme for display purposes if theme === 'system'
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative inline-flex items-center justify-center p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-geeko-cyan ml-1"
            aria-label="Toggle theme"
            title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
            {isDark ? (
                <Sun className="h-[1.1rem] w-[1.1rem] text-amber-400" />
            ) : (
                <Moon className="h-[1.1rem] w-[1.1rem] text-slate-700" />
            )}
        </button>
    );
}
