/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./frontend/index.html",
        "./frontend/src/**/*.{js,svelte}",
        "./public/**/*.html"
    ],
    theme: {
        extend: {
            colors: {
                sage: {
                    50: '#f8fbfa',
                    100: '#e8efed',
                    200: '#d1dfd9',
                    300: '#b8c9c3',
                    400: '#9bb3ab',
                    500: '#5a9d8a',
                    600: '#4a8d7a',
                    700: '#3d7566',
                    800: '#2f5a4f',
                    900: '#1f3d35'
                },
                primary: {
                    DEFAULT: '#5a9d8a',
                    hover: '#4a8d7a',
                    dark: '#3d7566'
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
            },
            boxShadow: {
                'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
                'glow': '0 0 20px rgba(90, 157, 138, 0.3)',
            }
        },
    },
    plugins: [],
}
