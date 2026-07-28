import { defineConfig, loadEnv } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import babel from "@rolldown/plugin-babel";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      // helps with backwards compatibility
      babel({ plugins: ["babel-plugin-react-compiler"] }),
      svgr({
        svgrOptions: {
          ref: true,
          exportType: "default",
          dimensions: true,
          titleProp: true,
          // allow overwrite
          expandProps: "end",
          replaceAttrValues: {
            "#TARGET_COLOR": "{props.customfill}",
            "#TARGET_SIZE_WIDTH": "{props.size || props.width || 16}",
            "#TARGET_SIZE_HEIGHT": "{props.size || props.height || 16}",
          },
        },
      }),
      tailwindcss(),
      VitePWA({
        registerType: "prompt",
        // For destroying the serviceWorker and later replacement
        // selfDestroying: true,
        // Ensures assets are in the src/asset folder
        srcDir: "src/sw",
        // strategies: "generateSW",
        strategies: "injectManifest",
        filename: "sample-sw.ts",
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
          injectionPoint: "self.__WB_MANIFEST",
        },
        manifest: {
          name: "BiteScout: Restaurant Search",
          short_name: "BiteScout",
          start_url: "/",
          scope: "/",
          // Important for normal app feel
          display: "standalone",

          // Fill in later if we want app store screen shots
          screenshots: [],
          // For the app icons, need persistence
          icons: [],
        },

        devOptions: {
          enabled: env.NODE_ENV === "development",
          type: "module",
          suppressWarnings: true,
          navigateFallback: "index.html",
        },
      }),
    ],

    resolve: {
      alias: {
        // Alias @ to the src directory
        "@": path.resolve(__dirname, "./src"),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ["**/*.csv", "**/*.png", "**/*.svg"],
    publicDir: "assets",

    // Change localhost port
    // server: {
    //   host: "localhost",
    //   port: 4000,
    // },
    server: {
      host: env.NODE_ENV === "development",
      watch: {
        usePolling: env.NODE_ENV === "development",
      },
      allowedHosts: env.NODE_ENV === "development" || undefined,
    },
  };
});
