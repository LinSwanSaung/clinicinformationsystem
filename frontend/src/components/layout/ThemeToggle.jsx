import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 border-2 border-border hover:bg-accent sm:h-12 sm:w-12"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-muted-foreground transition-all sm:h-6 sm:w-6" />
      ) : (
        <Moon className="h-5 w-5 text-muted-foreground transition-all sm:h-6 sm:w-6" />
      )}
    </Button>
  );
};

export default ThemeToggle;


