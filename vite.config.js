import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// ✅ Make build work on any path (localhost, mobile IP, GitHub Pages)
export default defineConfig({
    plugins: [react()],
    base: "./",
});
