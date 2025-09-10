<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-left">
        <el-button
          link
          class="menu-btn"
          @click="collapsed = !collapsed"
          title="Toggle menu"
          >☰</el-button
        >
        <span class="brand">Aglet IMS</span>
      </div>
      <div class="header-right">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item
            v-for="(m, idx) in $route.matched"
            :key="m.path || idx"
            :to="idx === 0 ? '/dashboard' : undefined"
          >
            {{ idx === 0 ? 'Dashboard' : (m.name || m.path) }}
          </el-breadcrumb-item>
        </el-breadcrumb>
        <div class="header-controls">
          <el-select
            v-model="role"
            size="small"
            style="width: 160px"
            :teleported="false"
            title="Switch Role"
          >
            <el-option label="Admin" value="admin" />
            <el-option label="Inventory Manager/Staff" value="inventory" />
          </el-select>
        </div>
      </div>
    </el-header>

    <el-container>
      <el-aside :width="collapsed ? '64px' : '200px'" class="app-aside">
        <el-menu
          :default-active="$route.path"
          router
          :collapse="collapsed"
          class="side-menu"
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataBoard /></el-icon>
            <span>Dashboard</span>
          </el-menu-item>
          <el-menu-item index="/inventory">
            <el-icon><Box /></el-icon>
            <span>Inventory</span>
          </el-menu-item>
          <el-menu-item index="/transactions">
            <el-icon><List /></el-icon>
            <span>Stock Transactions</span>
          </el-menu-item>
          <el-menu-item index="/suppliers">
            <el-icon><User /></el-icon>
            <span>Suppliers</span>
          </el-menu-item>
          <el-menu-item index="/purchases">
            <el-icon><ShoppingCartFull /></el-icon>
            <span>Purchase Records</span>
          </el-menu-item>
          <el-menu-item index="/about">
            <el-icon><InfoFilled /></el-icon>
            <span>About</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="app-main">
        <transition name="fade-slide" mode="out-in">
          <router-view />
        </transition>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import {
  DataBoard,
  Box,
  List,
  User,
  InfoFilled,
  ShoppingCartFull,
} from "@element-plus/icons-vue";

export default {
  name: "App",
  components: {
    DataBoard,
    Box,
    List,
    User,
    InfoFilled,
    ShoppingCartFull,
  },
  data() {
    return {
      collapsed: false,
    };
  },
  computed: {
    role: {
      get() {
        return this.$store.getters.role;
      },
      set(val) {
        this.$store.dispatch("setRole", val);
      },
    },
  },
  created() {
    // Ensure mock data is loaded on app start
    this.$store.dispatch("loadAll");
  },
};
</script>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
}

/* Align typography with Element Plus defaults */
body,
#app {
  font-family: var(--el-font-family), -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans",
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji",
    sans-serif;
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-primary);
}

.app-container {
  min-height: 100%;
  background: #f5f7fa;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px !important;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  padding: 0 16px;
  box-sizing: border-box;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-btn {
  font-size: 18px;
}

.brand {
  font-weight: 700;
  font-size: 18px;
  color: #303133;
}

.app-aside {
  background: #fff;
  border-right: 1px solid #ebeef5;
  transition: width 240ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: width;
}

.side-menu {
  border-right: none;
  transition: width 240ms cubic-bezier(0.4, 0, 0.2, 1);
}

.app-main {
  padding: 16px;
}

/* Smooth menu item padding when collapsing */
.side-menu .el-menu-item,
.side-menu .el-sub-menu__title {
  transition: padding-left 240ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Route transition for page content */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
