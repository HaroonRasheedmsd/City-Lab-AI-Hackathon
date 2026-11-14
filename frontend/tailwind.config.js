/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        navy: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        healthcare: {
          bg: '#F5F7FB',
          card: '#ffffff',
          darkBg: '#0b1120',
          darkCard: '#131d33',
        },
        zendenta: {
          bg: '#F5F7FB',
          card: '#FFFFFF',
          border: '#E8ECEF',
          darkBorder: '#1E293B',
          blue: {
            DEFAULT: '#2F54EB',
            hover: '#1D39C4',
            light: '#F0F5FF',
            border: '#ADC6FF',
          },
          teal: {
            DEFAULT: '#0D9488',
            hover: '#0F766E',
            light: '#F0FDFA',
          },
          slate: {
            dark: '#1E293B',
            muted: '#64748B',
            light: '#94A3B8',
          }
        },
        status: {
          normal: {
            DEFAULT: '#10b981',
            bg: '#ecfdf5',
            border: '#a7f3d0',
            text: '#065f46',
            darkBg: '#064e3b',
            darkText: '#a7f3d0',
          },
          low: {
            DEFAULT: '#3b82f6',
            bg: '#eff6ff',
            border: '#bfdbfe',
            text: '#1e40af',
            darkBg: '#1e3a8a',
            darkText: '#bfdbfe',
          },
          high: {
            DEFAULT: '#f59e0b',
            bg: '#fffbeb',
            border: '#fde68a',
            text: '#92400e',
            darkBg: '#78350f',
            darkText: '#fde68a',
          },
          urgent: {
            DEFAULT: '#ef4444',
            bg: '#fef2f2',
            border: '#fecaca',
            text: '#991b1b',
            darkBg: '#7f1d1d',
            darkText: '#fecaca',
          },
          unclassified: {
            DEFAULT: '#6b7280',
            bg: '#f9fafb',
            border: '#e5e7eb',
            text: '#374151',
            darkBg: '#374151',
            darkText: '#e5e7eb',
          },
          needsInfo: {
            DEFAULT: '#8b5cf6',
            bg: '#f5f3ff',
            border: '#ddd6fe',
            text: '#5b21b6',
            darkBg: '#4c1d95',
            darkText: '#ddd6fe',
          },
        }
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '28px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
        'card': '0 10px 30px -5px rgba(15, 23, 42, 0.06), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
        'hover': '0 20px 40px -10px rgba(15, 23, 42, 0.1), 0 8px 16px -4px rgba(15, 23, 42, 0.04)',
        'urgent': '0 0 25px rgba(239, 68, 68, 0.35)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'pulse-gentle': 'pulse-gentle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-gentle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
