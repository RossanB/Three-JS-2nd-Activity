import { defineConfig } from "vite"

const isCodeSandbox = 'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env

export default defineConfig({
    root: 'src/',
    publicDir: '../static/',
    base: './', // IMPORTANT: Keeps assets relative, works on Vercel/GitHub pages
    server: {
        host: true,
        open: !isCodeSandbox // Open if it's not a CodeSandbox
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true
    }
})
