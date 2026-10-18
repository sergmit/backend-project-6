import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [tailwindcss()],
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: "assets/css/source.css",
            output: { assetFileNames: "main.css" },
        },
    },
});