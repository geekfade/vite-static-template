import { createApp } from "vue";
import App from "./App.vue";
import { setupStore } from "@/store";
import router from "./router";
// 引入重置样式
import "./style/reset.scss";
// 导入公共样式
import "./style/index.scss";
// 一定要在main.ts中导入tailwind.css，防止vite每次hmr都会请求src/style/index.scss整体css文件导致热更新慢的问题
import "./style/tailwind.css";

import { getPlatformConfig } from "./config";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
dayjs.locale("zh-cn");

const app = createApp(App);

getPlatformConfig().then(async () => {
  app.use(router);
  await router.isReady();
  setupStore(app);
  app.mount("#app");
});
