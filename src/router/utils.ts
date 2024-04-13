import { buildHierarchyTree } from "@/utils/tree";
import type { RouteRecordRaw } from "vue-router";

/**
 * 根据每个元素的 "meta" 对象中的 "rank" 属性，以升序对数组进行排序。
 * 如果 "rank" 属性不存在，则根据顺序自动创建，第一个元素的 rank 为 2。
 *
 * @param arr - 要排序的数组。
 * @returns 升序排序后的数组。
 */
export function ascending(arr: any[]) {
  return arr.sort(
    (a: { meta: { rank: number } }, b: { meta: { rank: number } }) => {
      return a?.meta.rank - b?.meta.rank;
    },
  );
}

/**
 * 将多级嵌套路由处理成一维数组
 * @param routesList 传入路由
 * @returns 返回处理后的一维路由
 */
export function formatFlatteningRoutes(routesList: RouteRecordRaw[]) {
  if (routesList.length === 0) return routesList;
  let hierarchyList = buildHierarchyTree(routesList);
  for (let i = 0; i < hierarchyList.length; i++) {
    if (hierarchyList[i].children) {
      hierarchyList = hierarchyList
        .slice(0, i + 1)
        .concat(hierarchyList[i].children, hierarchyList.slice(i + 1));
    }
  }
  return hierarchyList;
}

/**
 * 格式化两级路由列表
 * @param routesList 路由记录数组
 * @returns 格式化后的路由记录数组
 */
export function formatTwoStageRoutes(routesList: RouteRecordRaw[]) {
  if (routesList.length === 0) return routesList;
  const newRoutesList: RouteRecordRaw[] = [];
  routesList.forEach((v: RouteRecordRaw) => {
    if (v.path === "/") {
      newRoutesList.push({
        component: v.component,
        name: v.name,
        path: v.path,
        redirect: v.redirect,
        meta: v.meta,
        children: [],
      });
    } else {
      if (newRoutesList[0]?.children) {
        newRoutesList[0].children.push({ ...v });
      }
    }
  });
  return newRoutesList;
}
