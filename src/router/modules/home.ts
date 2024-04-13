const Layout = () => import("@/layout/index.vue");
export default {
  path: "/",
  name: "Home",
  component: Layout,
  redirect: "/dashboard",
  meta: {
    title: "主页",
  },
  children: [
    {
      path: "/dashboard",
      name: "Dashboard",
      component: () => import("@/views/dashboard/index.vue"),
      meta: {
        title: "物联网控制",
      },
    },
    {
      path: "/system",
      name: "System",
      component: () => import("@/views/system/index.vue"),
      meta: {
        title: "系统",
      },
    },
  ],
} satisfies RouteConfigsTable;
