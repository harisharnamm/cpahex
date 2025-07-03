/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#D7FF1E',
        'primary-hover': '#C8F000',
        'primary-light': {
          DEFAULT: '#F0FF8A',
          dark: '#A3B300'
        },
        'primary-foreground': {
          DEFAULT: '#1F2937',
          dark: '#1F2937'
        },
        'text-primary': {
          DEFAULT: '#1F2937',
          dark: '#F9FAFB'
        },
        'text-secondary': {
          DEFAULT: '#6B7280',
          dark: '#9CA3AF'
        },
        'text-tertiary': {
          DEFAULT: '#9CA3AF',
          dark: '#6B7280'
        },
        'text-hover': {
          DEFAULT: '#A3B300',
          dark: '#F0FF8A'
        },
        'background': {
          DEFAULT: '#FFFFFF',
          dark: '#111827'
        },
        'foreground': {
          DEFAULT: '#1F2937',
          dark: '#F9FAFB'
        },
        'muted': {
          DEFAULT: '#F3F4F6',
          dark: '#1F2937'
        },
        'muted-foreground': {
          DEFAULT: '#6B7280',
          dark: '#9CA3AF'
        },
        'accent': {
          DEFAULT: '#F1F5F9',
          dark: '#1E293B'
        },
        'accent-foreground': {
          DEFAULT: '#1F2937',
          dark: '#F9FAFB'
        },
        'destructive': {
          DEFAULT: '#EF4444',
          dark: '#F87171'
        },
        'destructive-foreground': {
          DEFAULT: '#FFFFFF',
          dark: '#1F2937'
        },
        'secondary': {
          DEFAULT: '#F8F9FB',
          dark: '#1E293B'
        },
        'secondary-foreground': {
          DEFAULT: '#1F2937',
          dark: '#F9FAFB'
        },
        'input': {
          DEFAULT: '#E5E7EB',
          dark: '#374151'
        },
        'ring': {
          DEFAULT: '#D7FF1E',
          dark: '#A3B300'
        },
        'border-light': {
          DEFAULT: '#E5E7EB',
          dark: '#374151'
        },
        'border-subtle': {
          DEFAULT: '#F3F4F6',
          dark: '#1F2937'
        },
        'border': {
          DEFAULT: '#E5E7EB',
          dark: '#374151'
        },
        'surface': {
          DEFAULT: '#F8F9FB',
          dark: '#1E293B'
        },
        'surface-elevated': {
          DEFAULT: '#FFFFFF',
          dark: '#111827'
        },
        'surface-hover': {
          DEFAULT: '#F1F5F9',
          dark: '#1E293B'
        },
      },
      borderRadius: {
        'default': '8px',
        'lg': '12px',
        'xl': '16px',
        'design': '28px',
      },
      boxShadow: {
        'design': '0 2px 4px rgba(16, 24, 40, 0.08)',
        'soft': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'large': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'premium': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 0 1px rgba(215, 255, 30, 0.1), 0 4px 16px rgba(215, 255, 30, 0.15)',
      },
      maxWidth: {
        'content': '1280px',
      },
      spacing: {
        '60': '240px',
        '18': '72px',
        '72': '288px',
      },
      animation: {
        'dot-bounce': 'dot-bounce 1.2s infinite',
        'fade-slide-up': 'fade-slide-up 300ms ease-out',
        'fade-in': 'fade-in 500ms ease-out',
        'slide-up': 'slide-up 400ms ease-out',
        'scale-in': 'scale-in 200ms ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'dot-bounce': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
        'fade-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(215, 255, 30, 0.1)' },
          '50%': { boxShadow: '0 0 0 1px rgba(215, 255, 30, 0.2), 0 0 20px rgba(215, 255, 30, 0.1)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};