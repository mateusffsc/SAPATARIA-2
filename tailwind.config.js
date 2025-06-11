/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary colors
        'primary': {
          DEFAULT: '#1A1A1A',  // Main black
          light: '#333333',    // Lighter black for text
          dark: '#000000',     // Pure black for emphasis
        },
        // Secondary colors
        'secondary': {
          DEFAULT: '#FFFFFF',  // Pure white
          dark: '#F5F5F5',     // Off-white for backgrounds
          darker: '#EBEBEB',   // Darker off-white for hover states
        },
        // Neutral colors
        'neutral': {
          100: '#FFFFFF',
          200: '#F5F5F5',
          300: '#E5E5E5',
          400: '#D4D4D4',
          500: '#A3A3A3',
          600: '#737373',
          700: '#525252',
          800: '#333333',
          900: '#1A1A1A',
        },
        // Status colors (grayscale variants)
        'status': {
          success: '#333333',
          warning: '#666666',
          error: '#1A1A1A',
          info: '#4A4A4A',
        }
      },
      // Mobile-first spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Better mobile breakpoints
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      // Mobile-optimized font sizes
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      // Touch-friendly minimum sizes
      minHeight: {
        '11': '2.75rem', // 44px - minimum touch target
        '12': '3rem',    // 48px
        '14': '3.5rem',  // 56px
      },
      minWidth: {
        '11': '2.75rem', // 44px - minimum touch target
        '12': '3rem',    // 48px
        '14': '3.5rem',  // 56px
      },
      // Better shadows for mobile
      boxShadow: {
        'mobile': '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
        'mobile-lg': '0 4px 16px 0 rgba(0, 0, 0, 0.15)',
      },
      // Animation improvements
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};