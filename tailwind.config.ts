import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gold-gradient':
          'linear-gradient(135deg, #B8860B 0%, #D4AF37 40%, #F2D675 60%, #D4AF37 100%)',
        'gold-gradient-hover':
          'linear-gradient(135deg, #D4AF37 0%, #F2D675 40%, #F2D675 60%, #D4AF37 100%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: '#0B0B0F',
        surface: '#14141A',
        'surface-elevated': '#1D1D26',
        border: '#2A2A35',
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F2D675',
          dark: '#B8860B',
        },
        'tiger-orange': '#E8751A',
        text: '#F5F1E6',
        muted: '#A8A29E',
        success: '#22C55E',
        danger: '#EF4444',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: '#D4AF37',
          foreground: '#0B0B0F',
        },
        secondary: {
          DEFAULT: '#1D1D26',
          foreground: '#F5F1E6',
        },
        accent: {
          DEFAULT: '#1D1D26',
          foreground: '#F5F1E6',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#F5F1E6',
        },
        input: '#2A2A35',
        ring: '#D4AF37',
        chart: {
          '1': '#D4AF37',
          '2': '#E8751A',
          '3': '#22C55E',
          '4': '#F2D675',
          '5': '#B8860B',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
