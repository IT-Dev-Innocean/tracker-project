/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    fontFamily: {
      sans: ['Barlow', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
    },
    extend: {
      colors: {
        cu: {
          bg: '#101010',
          sidebar: '#161616',
          surface: '#1e1e1e',
          card: '#252525',
          border: '#2e2e2e',
          hover: '#333333',
          muted: '#888888',
          text: '#ebebeb',
          accent: '#7c3aed',
          'accent-hover': '#6d28d9',
          blue: '#3b82f6',
          green: '#22c55e',
          yellow: '#eab308',
          red: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
