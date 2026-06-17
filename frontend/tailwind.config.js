/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // shadcn-style CSS-variable-driven theming
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(28px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-up-sm': { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-down': { '0%': { opacity: '0', transform: 'translateY(-14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'slide-in-right': { '0%': { opacity: '0', transform: 'translateX(24px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'slide-in-left': { '0%': { opacity: '0', transform: 'translateX(-24px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        // Overshoot "pop" for count badges, success checks, toggles
        pop: { '0%': { opacity: '0', transform: 'scale(0.6)' }, '60%': { transform: 'scale(1.12)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        // Error nudge for invalid form fields (transform-only → no reflow)
        shake: { '0%, 100%': { transform: 'translateX(0)' }, '20%, 60%': { transform: 'translateX(-5px)' }, '40%, 80%': { transform: 'translateX(5px)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        sheen: { '0%': { transform: 'translateX(-120%) skewX(-15deg)' }, '60%, 100%': { transform: 'translateX(240%) skewX(-15deg)' } },
        // Slow pan for animated gold gradient text/borders (pairs with bg-[length:200%_auto])
        'gradient-pan': { '0%, 100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        // Indeterminate top progress bar for route/data loading
        progress: { '0%': { transform: 'translateX(-100%) scaleX(0.4)' }, '50%': { transform: 'translateX(0) scaleX(0.6)' }, '100%': { transform: 'translateX(100%) scaleX(0.4)' } },
        // Cinematic slow Ken-Burns zoom for hero imagery (overscaled so it never
        // reveals an edge under parallax). Use on a child of a parallax wrapper.
        kenburns: { '0%': { transform: 'scale(1.06)' }, '100%': { transform: 'scale(1.12)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out both',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-up-sm': 'fade-up-sm 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-down': 'fade-down 0.4s ease-out both',
        'scale-in': 'scale-in 0.3s ease-out both',
        'slide-in-right': 'slide-in-right 0.35s ease-out both',
        'slide-in-left': 'slide-in-left 0.35s ease-out both',
        pop: 'pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        shake: 'shake 0.4s ease-in-out both',
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 6s ease-in-out infinite',
        sheen: 'sheen 7s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 6s ease infinite',
        progress: 'progress 1.1s ease-in-out infinite',
        kenburns: 'kenburns 18s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};
