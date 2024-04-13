import vue from "@vitejs/plugin-vue";
import { viteBuildInfo } from "./info";
import type { PluginOption } from "vite";
import vueJsx from "@vitejs/plugin-vue-jsx";
import removeConsole from "vite-plugin-remove-console";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers";
import { configCompressPlugin } from "./compress";

export function getPluginsList(
  VITE_COMPRESSION: ViteCompression,
): PluginOption[] {
  return [
    vue(),
    // jsx、tsx语法支持
    vueJsx(),
    AutoImport({
      imports: ["vue", "vue-router", "@vueuse/core", "pinia"],
      dts: "types/auto-imports.d.ts",
      resolvers: [
        AntDesignVueResolver({
          importStyle: "less",
        }),
      ],
    }),
    Components({
      dts: "types/components.d.ts",
      resolvers: [
        AntDesignVueResolver({
          importStyle: "less",
        }),
      ],
    }),
    viteBuildInfo(),
    configCompressPlugin(VITE_COMPRESSION),
    // 线上环境删除console
    removeConsole({ external: ["src/assets/iconfont/iconfont.js"] }),
  ];
}
