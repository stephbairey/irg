import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

export default defineConfig({
  site: "https://raginggrannies.org",
  integrations: [
    sitemap({ filter: (page) => !page.includes("/your-gaggle-site/") }),
    icon(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
