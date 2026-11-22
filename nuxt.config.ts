// https://nuxt.com/docs/api/configuration/nuxt-config
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
  modules: ["@nuxtjs/i18n"],

  nitro: {
    prerender: { crawlLinks: true, routes: ["/", "/en"], failOnError: true },
  },

  // i18n configuration
  i18n: {
    baseUrl: process.env.NUXT_I18N_BASE_URL ?? "https://twbronycon.org",
    locales: [
      { code: "zh-TW", language: "zh-TW", name: "繁體中文", file: "zh-TW.json" },
      { code: "en", language: "en", name: "English", file: "en.json" },
    ],
    defaultLocale: "zh-TW",
    langDir: "locales/",
    strategy: "prefix_except_default",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
    },
  },
});
