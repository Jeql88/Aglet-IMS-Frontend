import { createRouter, createWebHashHistory } from "vue-router";

// Lazy-loaded views to keep bundle size smaller
const Dashboard = () => import("../views/DashboardView.vue");
const Inventory = () => import("../views/InventoryView.vue");
const Transactions = () => import("../views/TransactionsView.vue");
const Suppliers = () => import("../views/SuppliersView.vue");
const About = () =>
  import(/* webpackChunkName: "about" */ "../views/AboutView.vue");

const routes = [
  { path: "/", redirect: "/dashboard" },
  {
    path: "/dashboard",
    name: "dashboard",
    component: Dashboard,
  },
  {
    path: "/inventory",
    name: "inventory",
    component: Inventory,
  },
  {
    path: "/transactions",
    name: "transactions",
    component: Transactions,
  },
  {
    path: "/suppliers",
    name: "suppliers",
    component: Suppliers,
  },
  {
    path: "/about",
    name: "about",
    component: About,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
