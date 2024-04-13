const layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: "登录",
      showLink: false,
    },
  },

  {
    path: "/redirect",
    component: layout,
    meta: {
      icon: "homeFilled",
      title: "物联网控制",
      showLink: false,
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "redirect",
        component: () => import("@/layout/redirect.vue"),
      },
    ],
  },
] as Array<RouteConfigsTable>;
