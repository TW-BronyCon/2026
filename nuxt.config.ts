// https://nuxt.com/docs/api/configuration/nuxt-config
const publishSitemap = process.env.NUXT_APP_BASE_URL === "/2026/";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // Global CSS
  css: ["~/assets/css/global.css"],

  app: {
    head: {
      charset: "utf-8",
      viewport:
        "width=device-width, initial-scale=1, minimum-scale=1.0, maximum-scale=10",
    },
    pageTransition: { name: "page", mode: "out-in" },
  },

  // Modules
  modules: ["@nuxtjs/i18n", "@nuxtjs/sitemap"],
  site: { url: "https://twbronycon.org", trailingSlash: true },
  sitemap: {
    enabled: publishSitemap,
    autoI18n: false,
    discoverImages: false,
    discoverVideos: false,
    exclude: ["/home", "/en/home"],
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        "/",
        "/en",
        "/home/",
        "/en/home/",
        ...(publishSitemap ? ["/sitemap.xml"] : []),
      ],
      // The unprefixed root is already seeded. Keep crawling booth links.
      ignore: [/^\/2026\/?$/],
      failOnError: true,
    },
  },

  // i18n configuration
  i18n: {
    baseUrl: process.env.NUXT_I18N_BASE_URL ?? "https://twbronycon.org",
    locales: [
      {
        code: "zh-TW",
        language: "zh-TW",
        name: "繁體中文",
        file: "zh-TW.json",
      },
      { code: "en", language: "en", name: "English", file: "en.json" },
    ],
    defaultLocale: "zh-TW",
    langDir: "locales/",
    trailingSlash: true,
    strategy: "prefix_except_default",
    detectBrowserLanguage: false,
  },
});
