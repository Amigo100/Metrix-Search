/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    // include any other paths that need scanning
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#E7F5F6', // Very light teal/gray for backgrounds
          DEFAULT: '#2C7E89', // Main teal accent
          dark: '#256D75', // Dark teal for hovers/focus
        },
        neutral: {
          50: '#F8FAFC', // Soft gray background
          800: '#1F2937', // Dark neutral text color
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'Nunito', 'sans-serif'],
      },
      visibility: ['group-hover'],
    },
  },
  variants: {
    extend: {
      visibility: ['group-hover'],
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
