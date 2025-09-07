import { createStore } from "vuex";

const LOW_STOCK_THRESHOLD = 2;

function sum(arr, selector) {
  return arr.reduce((acc, item) => acc + selector(item), 0);
}

function formatDateISO(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function nextId(list, key) {
  const max = (list || []).reduce(
    (m, it) => Math.max(m, Number(it?.[key]) || 0),
    0
  );
  return max + 1;
}

export default createStore({
  state: {
    data: null,
    loading: false,
    error: null,
    user: {
      role: "admin", // 'admin' | 'inventory'
    },
  },
  getters: {
    shoes: (state) => state.data?.shoes ?? [],
    sources: (state) => state.data?.sources ?? [],
    stockTransactions: (state) => state.data?.stockTransactions ?? [],
    purchaseRecords: (state) => state.data?.purchaseRecords ?? [],

    loading: (state) => state.loading,
    error: (state) => state.error,

    role: (state) => state.user?.role || "inventory",
    isAdmin: (state, getters) => getters.role === "admin",
    isInventory: (state, getters) => getters.role === "inventory",

    // permissions
    canManageUsers: (state, getters) => getters.isAdmin,
    canViewReports: () => true,
    canCrudShoes: (state, getters) => getters.isAdmin || getters.isInventory,
    canCrudSuppliers: (state, getters) =>
      getters.isAdmin || getters.isInventory,
    canAddEditTransactions: (state, getters) =>
      getters.isAdmin || getters.isInventory,
    canDeleteTransactions: (state, getters) => getters.isAdmin,
    canDeleteMasterData: (state, getters) => getters.isAdmin,

    lowStockThreshold: () => LOW_STOCK_THRESHOLD,

    totalStock: (state, getters) => {
      return sum(getters.shoes, (s) => Number(s.CurrentStock) || 0);
    },
    totalValue: (state, getters) => {
      return sum(
        getters.shoes,
        (s) => (Number(s.PurchasePrice) || 0) * (Number(s.CurrentStock) || 0)
      );
    },
    lowStockList: (state, getters) => {
      return getters.shoes.filter(
        (s) => (Number(s.CurrentStock) || 0) <= LOW_STOCK_THRESHOLD
      );
    },
    lowStockCount: (state, getters) => getters.lowStockList.length,
    totalSources: (state, getters) => getters.sources.length,

    brandStockSeries: (state, getters) => {
      const map = new Map();
      for (const s of getters.shoes) {
        const key = s.Brand || "Unknown";
        const qty = Number(s.CurrentStock) || 0;
        map.set(key, (map.get(key) || 0) + qty);
      }
      return Array.from(map.entries()).map(([name, value]) => ({
        name,
        value,
      }));
    },

    brandChartOption: (state, getters) => ({
      tooltip: { trigger: "item" },
      legend: { top: "top" },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          label: { formatter: "{b}: {c}" },
          data: getters.brandStockSeries,
        },
      ],
    }),

    transactionTimeSeries: (state, getters) => {
      const days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(formatDateISO(d.toISOString()));
      }
      const byDay = new Map(days.map((d) => [d, 0]));
      for (const t of getters.stockTransactions) {
        const day = formatDateISO(t.Date);
        if (!byDay.has(day)) continue;
        let qty = Number(t.Quantity) || 0;
        if (t.TransactionType === "Out") qty = -Math.abs(qty);
        byDay.set(day, (byDay.get(day) || 0) + qty);
      }
      const xAxisData = Array.from(byDay.keys());
      const seriesData = Array.from(byDay.values());
      return { xAxisData, seriesData };
    },

    transactionChartOption: (state, getters) => {
      const ts = getters.transactionTimeSeries;
      return {
        grid: { left: 40, right: 20, bottom: 30, top: 30 },
        tooltip: { trigger: "axis" },
        xAxis: {
          type: "category",
          data: ts.xAxisData,
          axisLabel: { rotate: 45 },
        },
        yAxis: { type: "value" },
        series: [
          {
            type: "bar",
            data: ts.seriesData,
            itemStyle: { color: "#409EFF" },
          },
        ],
      };
    },

    recentTransactions: (state, getters) => {
      return [...getters.stockTransactions]
        .sort((a, b) => new Date(b.Date) - new Date(a.Date))
        .slice(0, 10);
    },
  },
  mutations: {
    setLoading(state, payload) {
      state.loading = payload;
    },
    setError(state, payload) {
      state.error = payload;
    },
    setData(state, payload) {
      state.data = payload;
    },
    setRole(state, role) {
      state.user.role = role;
    },

    // Inventory
    addShoe(state, shoe) {
      if (!state.data)
        state.data = {
          shoes: [],
          sources: [],
          stockTransactions: [],
          purchaseRecords: [],
        };
      if (!state.data.shoes) state.data.shoes = [];
      state.data.shoes.push(shoe);
    },
    updateShoe(state, updated) {
      if (!state.data?.shoes) return;
      const idx = state.data.shoes.findIndex(
        (s) => s.ShoeID === updated.ShoeID
      );
      if (idx !== -1) {
        state.data.shoes.splice(idx, 1, {
          ...state.data.shoes[idx],
          ...updated,
        });
      }
    },
    deleteShoe(state, id) {
      if (!state.data?.shoes) return;
      state.data.shoes = state.data.shoes.filter((s) => s.ShoeID !== id);
    },

    // Suppliers
    addSource(state, source) {
      if (!state.data)
        state.data = {
          shoes: [],
          sources: [],
          stockTransactions: [],
          purchaseRecords: [],
        };
      if (!state.data.sources) state.data.sources = [];
      state.data.sources.push(source);
    },
    updateSource(state, updated) {
      if (!state.data?.sources) return;
      const idx = state.data.sources.findIndex(
        (s) => s.SourceID === updated.SourceID
      );
      if (idx !== -1) {
        state.data.sources.splice(idx, 1, {
          ...state.data.sources[idx],
          ...updated,
        });
      }
    },
    deleteSource(state, id) {
      if (!state.data?.sources) return;
      state.data.sources = state.data.sources.filter((s) => s.SourceID !== id);
    },

    // Transactions
    addTransaction(state, tx) {
      if (!state.data)
        state.data = {
          shoes: [],
          sources: [],
          stockTransactions: [],
          purchaseRecords: [],
        };
      if (!state.data.stockTransactions) state.data.stockTransactions = [];
      state.data.stockTransactions.push(tx);
    },
    updateTransaction(state, updated) {
      if (!state.data?.stockTransactions) return;
      const idx = state.data.stockTransactions.findIndex(
        (t) => t.TransactionID === updated.TransactionID
      );
      if (idx !== -1) {
        state.data.stockTransactions.splice(idx, 1, {
          ...state.data.stockTransactions[idx],
          ...updated,
        });
      }
    },
    deleteTransaction(state, id) {
      if (!state.data?.stockTransactions) return;
      state.data.stockTransactions = state.data.stockTransactions.filter(
        (t) => t.TransactionID !== id
      );
    },
  },
  actions: {
    async loadMockData({ commit, state }) {
      if (state.data) return;
      commit("setLoading", true);
      commit("setError", null);
      try {
        const base = process.env.BASE_URL || "/";
        const res = await fetch(`${base}mock-api.json`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        commit("setData", json);
      } catch (err) {
        commit("setError", err?.message || String(err));
      } finally {
        commit("setLoading", false);
      }
    },

    setRole({ commit }, role) {
      commit("setRole", role);
    },

    // Inventory
    addShoe({ commit, getters }, payload) {
      const id = nextId(getters.shoes, "ShoeID");
      const newShoe = {
        ShoeID: id,
        Brand: "",
        Model: "",
        Colorway: "",
        Size: 0,
        Condition: "",
        PurchasePrice: 0,
        CurrentStock: 0,
        ...payload,
      };
      commit("addShoe", newShoe);
      return newShoe;
    },
    updateShoe({ commit }, payload) {
      commit("updateShoe", payload);
    },
    deleteShoe({ commit, getters }, id) {
      if (!getters.canDeleteMasterData) throw new Error("Not allowed");
      commit("deleteShoe", id);
    },

    // Suppliers
    addSource({ commit, getters }, payload) {
      const id = nextId(getters.sources, "SourceID");
      const newSource = {
        SourceID: id,
        Name: "",
        ContactInfo: "",
        ...payload,
      };
      commit("addSource", newSource);
      return newSource;
    },
    updateSource({ commit }, payload) {
      commit("updateSource", payload);
    },
    deleteSource({ commit, getters }, id) {
      if (!getters.canDeleteMasterData) throw new Error("Not allowed");
      commit("deleteSource", id);
    },

    // Transactions
    addTransaction({ commit, getters }, payload) {
      const id = nextId(getters.stockTransactions, "TransactionID");
      const newTx = {
        TransactionID: id,
        ShoeID: null,
        TransactionType: "In", // In | Out | Adjustment
        Quantity: 0,
        Date: new Date().toISOString(),
        Notes: "",
        ...payload,
      };
      commit("addTransaction", newTx);
      return newTx;
    },
    updateTransaction({ commit }, payload) {
      commit("updateTransaction", payload);
    },
    deleteTransaction({ commit, getters }, id) {
      if (!getters.canDeleteTransactions) throw new Error("Not allowed");
      commit("deleteTransaction", id);
    },
  },
  modules: {},
});
