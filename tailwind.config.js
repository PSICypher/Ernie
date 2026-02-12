/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#9333EA',
          blue: '#2563EB',
          green: '#16A34A',
          yellow: '#EAB308',
          red: '#DC2626'
        },
        category: {
          accommodation: '#8B5CF6',
          transport: '#3B82F6',
          activities: '#10B981',
          tickets: '#F59E0B',
          food: '#EC4899',
          misc: '#6B7280'
        }
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)'
      }
    }
  },
  plugins: []
};
