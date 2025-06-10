import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
    setIsDark(!isDark);
  };

  if (!mounted) {
    return (
      <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                 shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Toggle Track */}
      <div className="relative w-12 h-6 bg-gradient-to-r from-blue-400 to-purple-500 dark:from-purple-500 dark:to-pink-500 rounded-full p-1 transition">
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center
                      transform transition-transform duration-300 ease-out
                      ${isDark ? 'translate-x-6' : 'translate-x-0'}`}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-purple-600" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-yellow-500" />
          )}
        </div>
      </div>

      {/* Optional Label */}
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 hidden sm:inline">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}
