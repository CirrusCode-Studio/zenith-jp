import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Zenith Japanese",

        short_name: "Zenith JP",

        description:
        "Audio-first Japanese acquisition system optimized for speaking, listening, recall, and long-term retention.",

        start_url: "/",

        display: "standalone",

        background_color: "#ffffff",

        theme_color: "#0f172a",

        orientation: "portrait",

        lang: "en",

        icons: [
        {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
        },

        {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
        },

        {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
        },
        ],
    };
}