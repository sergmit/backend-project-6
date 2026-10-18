import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [tailwindcss()],
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: "assets/js/main.js",
                style: "assets/css/source.css",
            },
            output: {
                entryFileNames: "main.js",
                assetFileNames: "main[extname]",
            },
        },
    },
});