import { isUrl, storageLocal } from "@pureadmin/utils";
import {
  type RouteRecordRaw,
  type Router,
  createRouter,
  createWebHashHistory,
} from "vue-router";
import {
  ascending,
  formatFlatteningRoutes,
  formatTwoStageRoutes,
} from "./utils";
import { buildHierarchyTree } from "@/utils/tree";
import remainingRouter from "./modules/remaining";
import { type DataInfo, userKey } from "@/utils/auth";

/**
 * @name 自动导入modules文件夹下的所有路由匹配src/router/modules/xxx.ts，除了remaining.ts
 */
const modules: Record<string, any> = import.meta.glob(
  ["./modules/**/*.ts", "!./modules/**/remaining.ts"],
  {
    eager: true,
  },
);

/** 原始静态路由（未做任何处理） */
const routes: any[] = [];

Object.keys(modules).forEach((key) => {
  routes.push(modules[key].default);
});

export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(
  formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity)))),
);

/**
 * @name 创建路由实例
 */
export const router: Router = createRouter({
  history: createWebHashHistory(), // history模式
  routes: constantRoutes.concat(...(remainingRouter as any)), // 静态路由
  strict: true, // 严格模式
  scrollBehavior(_to, from, savedPosition) {
    return new Promise((resolve) => {
      if (savedPosition) {
        return savedPosition;
      } else {
        if (from.meta.saveSrollTop) {
          const top: number =
            document.documentElement.scrollTop || document.body.scrollTop;
          resolve({ left: 0, top });
        }
      }
    });
  },
});

/** 路由白名单 */
const whiteList = ["/login"];

router.beforeEach((to: ToRouteType, _from, next) => {
  const userInfo = storageLocal().getItem<DataInfo>(userKey);
  const externalLink = isUrl(to?.name as string);
  function toCorrectRoute() {
    whiteList.includes(to.fullPath) ? next(_from.fullPath) : next();
  }
  if (!externalLink) {
    to.matched.some((item) => {
      if (!item.meta.title) return "";
      document.title = item.meta.title;
    });
  }
  if (userInfo) {
    toCorrectRoute();
  } else {
    if (to.path !== "/login") {
      if (whiteList.indexOf(to.path) !== -1) {
        next();
      } else {
        next({ path: "/login" });
      }
    } else {
      next();
    }
  }
});

export default router;
