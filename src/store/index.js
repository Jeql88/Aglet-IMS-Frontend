import { createStore } from "vuex";
import { getJson, postJson, putJson, deleteJson } from "@/api/http";

const LOW_STOCK_THRESHOLD = 2;

// ---- TransactionType enum code mapping (backend expects numeric by default) ----
const TxTypeCode = { In: 0, Out: 1, Adjustment: 2 };
const CodeToTxType = { 0: "In", 1: "Out", 2: "Adjustment" };

// ---------- Mapping helpers: API camelCase DTOs ⇄ Frontend state (PascalCase like mock) ----------
function shoeDtoToState(dto) {
  return {
    ShoeID: dto.shoeId,
    Brand: dto.brand,
    Model: dto.model,
    Colorway: dto.colorway,
    Size: Number(dto.size),
    Condition: dto.condition,
    PurchasePrice: dto.purchasePrice,
    CurrentStock: dto.currentStock,
  };
}
function shoeStateToDto(s) {
  return {
    shoeId: s.ShoeID,
    brand: s.Brand,
    model: s.Model,
    colorway: s.Colorway,
    size: String(s.Size), // backend size is string (per error)
    condition: s.Condition,
    purchasePrice: s.PurchasePrice,
    currentStock: s.CurrentStock,
  };
}

function supplierDtoToState(dto) {
  return {
    // Keep "sources" namespace used by the UI
    SourceID: dto.supplierId,
    Name: dto.name,
    ContactInfo: dto.contactInfo,
  };
}
function supplierStateToDto(s) {
  return {
    supplierId: s.SourceID,
    name: s.Name,
    contactInfo: s.ContactInfo,
  };
}

function stockTxDtoToState(dto) {
  const t = dto.transactionType;
  const typeStr =
    typeof t === "number" ? CodeToTxType[t] ?? "In" : String(t || "In");
  return {
    TransactionID: dto.transactionId,
    ShoeID: dto.shoeId,
    TransactionType: typeStr, // "In" | "Out" | "Adjustment"
    Quantity: dto.quantity, // keep positive; consumers display +/- based on type
    Date: dto.date,
    Notes: dto.notes,
  };
}
function stockTxStateToDto(t) {
  return {
    transactionId: t.TransactionID,
    shoeId: Number(t.ShoeID),
    transactionType:
      typeof t.TransactionType === "number"
        ? t.TransactionType
        : TxTypeCode[t.TransactionType] ?? 0,
    quantity: Math.abs(Number(t.Quantity) || 0),
    date: new Date(t.Date).toISOString(),
    notes: t.Notes,
  };
}

function purchaseDtoToState(dto) {
  return {
    PurchaseID: dto.purchaseId,
    ShoeID: dto.shoeId,
    // Prefer supplierId if present; fallback to sourceId for compatibility
    SourceID: dto.supplierId ?? dto.sourceId,
    // Accept either 'purchase' or 'purchaseDate' from backend
    PurchaseDate: dto.purchase ?? dto.purchaseDate,
    Quantity: dto.quantity,
    UnitPrice: dto.unitPrice,
    TotalCost: dto.totalCost,
  };
}
function purchaseStateToDto(p) {
  const shoeId = Number(p.ShoeID);
  const supplierId = Number(p.SourceID);
  const quantity = Number(p.Quantity);
  const unitPrice = Number(p.UnitPrice);
  const totalCost = Number(p.TotalCost);
  const d =
    p.PurchaseDate instanceof Date ? p.PurchaseDate : new Date(p.PurchaseDate);
  return {
    purchaseId: p.PurchaseID,
    shoeId,
    // Send both, server will bind the one it expects
    supplierId,
    sourceId: supplierId,
    // Backend requires 'purchase' field; also send 'purchaseDate' for compatibility
    purchase: new Date(d).toISOString(),
    purchaseDate: new Date(d).toISOString(),
    quantity,
    unitPrice,
    totalCost,
  };
}

// ---------- Utilities ----------
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

// Format a Date object to local time without timezone suffix: "YYYY-MM-DDTHH:mm:ss"
// function formatLocalDateTime(d) {
//   if (!(d instanceof Date)) d = new Date(d);
//   if (isNaN(d)) return "";
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   const hh = String(d.getHours()).padStart(2, "0");
//   const mi = String(d.getMinutes()).padStart(2, "0");
//   const ss = String(d.getSeconds()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
// }

async function fetchAllPaged(path, mapItem, pageSize = 100) {
  let pageNumber = 1;
  let out = [];
  while (true) {
    const res = await getJson(path, { pageNumber, pageSize });
    if (Array.isArray(res)) {
      out = res.map(mapItem);
      break;
    }
    const data = res?.data ?? res?.Data ?? [];
    const total = res?.totalCount ?? res?.TotalCount ?? data.length;
    out = out.concat((data || []).map(mapItem));
    if (out.length >= total || data.length === 0) break;
    pageNumber += 1;
  }
  return out;
}

// Normalize paging envelope from backend (camel or pascal)
function unpackPageEnvelope(res) {
  if (Array.isArray(res)) {
    return {
      totalCount: res.length,
      pageNumber: 1,
      pageSize: res.length,
      data: res,
    };
  }
  return {
    totalCount: res?.totalCount ?? res?.TotalCount ?? 0,
    pageNumber: res?.pageNumber ?? res?.PageNumber ?? 1,
    pageSize: res?.pageSize ?? res?.PageSize ?? 10,
    data: res?.data ?? res?.Data ?? [],
  };
}

export default createStore({
  state: {
    // Aggregated data for dashboard and non-paged usage
    data: {
      shoes: [],
      sources: [],
      stockTransactions: [],
      purchaseRecords: [],
    },

    // Paged slices for large tables
    shoesPage: {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 10,
    },
    stockTransactionsPage: {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 10,
    },
    purchaseRecordsPage: {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 10,
    },

    loading: false,
    error: null,

    user: {
      role: "admin", // 'admin' | 'inventory'
    },
  },

  getters: {
    // Aggregated
    shoes: (state) => state.data?.shoes ?? [],
    sources: (state) => state.data?.sources ?? [],
    stockTransactions: (state) => state.data?.stockTransactions ?? [],
    purchaseRecords: (state) => state.data?.purchaseRecords ?? [],

    // Paged
    shoesPage: (state) => state.shoesPage,
    shoesPageItems: (state) => state.shoesPage.items,
    shoesPageTotal: (state) => state.shoesPage.totalCount,
    shoesPageNumber: (state) => state.shoesPage.pageNumber,
    shoesPageSize: (state) => state.shoesPage.pageSize,

    // Purchase Records paged
    purchaseRecordsPage: (state) => state.purchaseRecordsPage,
    purchaseRecordsPagedItems: (state) => state.purchaseRecordsPage.items,
    purchaseRecordsTotal: (state) => state.purchaseRecordsPage.totalCount,
    purchaseRecordsPageNumber: (state) => state.purchaseRecordsPage.pageNumber,
    purchaseRecordsPageSize: (state) => state.purchaseRecordsPage.pageSize,
    stockTransactionsPage: (state) => state.stockTransactionsPage,
    stockTransactionsPagedItems: (state) => state.stockTransactionsPage.items,
    stockTransactionsTotal: (state) => state.stockTransactionsPage.totalCount,
    stockTransactionsPageNumber: (state) =>
      state.stockTransactionsPage.pageNumber,
    stockTransactionsPageSize: (state) => state.stockTransactionsPage.pageSize,

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
    // purchases are admin-controlled
    canCrudPurchases: (state, getters) => getters.isAdmin,

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
      // last 7 days including today
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
        // 'Adjustment' sign as provided
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
    setRole(state, role) {
      state.user.role = role;
    },

    // Replace all data at once (dashboard aggregation)
    setAll(state, payload) {
      state.data = {
        shoes: payload.shoes ?? [],
        sources: payload.sources ?? [],
        stockTransactions: payload.stockTransactions ?? [],
        purchaseRecords: payload.purchaseRecords ?? [],
      };
    },

    // Paged setters
    setShoesPage(state, page) {
      state.shoesPage = page;
    },
    setStockTransactionsPage(state, page) {
      state.stockTransactionsPage = page;
    },
    setPurchaseRecordsPage(state, page) {
      state.purchaseRecordsPage = page;
    },

    // Shoes
    addShoe(state, shoe) {
      state.data.shoes.push(shoe);
    },
    updateShoe(state, updated) {
      const idx = state.data.shoes.findIndex(
        (s) => s.ShoeID === updated.ShoeID
      );
      if (idx !== -1)
        state.data.shoes.splice(idx, 1, {
          ...state.data.shoes[idx],
          ...updated,
        });
    },
    deleteShoe(state, id) {
      state.data.shoes = state.data.shoes.filter((s) => s.ShoeID !== id);
    },

    // Suppliers (sources in state)
    addSource(state, source) {
      state.data.sources.push(source);
    },
    updateSource(state, updated) {
      const idx = state.data.sources.findIndex(
        (s) => s.SourceID === updated.SourceID
      );
      if (idx !== -1)
        state.data.sources.splice(idx, 1, {
          ...state.data.sources[idx],
          ...updated,
        });
    },
    deleteSource(state, id) {
      state.data.sources = state.data.sources.filter((s) => s.SourceID !== id);
    },

    // Stock Transactions
    addTransaction(state, tx) {
      state.data.stockTransactions.push(tx);
    },
    updateTransaction(state, updated) {
      const idx = state.data.stockTransactions.findIndex(
        (t) => t.TransactionID === updated.TransactionID
      );
      if (idx !== -1)
        state.data.stockTransactions.splice(idx, 1, {
          ...state.data.stockTransactions[idx],
          ...updated,
        });
    },
    deleteTransaction(state, id) {
      state.data.stockTransactions = state.data.stockTransactions.filter(
        (t) => t.TransactionID !== id
      );
    },

    // Purchases
    addPurchase(state, p) {
      state.data.purchaseRecords.push(p);
    },
    updatePurchase(state, updated) {
      const idx = state.data.purchaseRecords.findIndex(
        (r) => r.PurchaseID === updated.PurchaseID
      );
      if (idx !== -1)
        state.data.purchaseRecords.splice(idx, 1, {
          ...state.data.purchaseRecords[idx],
          ...updated,
        });
    },
    deletePurchase(state, id) {
      state.data.purchaseRecords = state.data.purchaseRecords.filter(
        (r) => r.PurchaseID !== id
      );
    },
  },

  actions: {
    // Aggregate load (used by dashboard)
    async loadAll({ commit }) {
      commit("setLoading", true);
      commit("setError", null);
      try {
        const [shoes, suppliers, transactions, purchases] = await Promise.all([
          fetchAllPaged("/Shoes", shoeDtoToState, 100),
          fetchAllPaged("/Suppliers", supplierDtoToState, 100),
          fetchAllPaged("/StockTransmission", stockTxDtoToState, 100),
          fetchAllPaged("/PurchaseRecord", purchaseDtoToState, 100),
        ]);
        commit("setAll", {
          shoes,
          sources: suppliers, // map to "sources" namespace expected by UI
          stockTransactions: transactions,
          purchaseRecords: purchases,
        });
      } catch (err) {
        commit("setError", err?.message || String(err));
      } finally {
        commit("setLoading", false);
      }
    },

    // Paged loads for tables (10 per page default)
    async fetchShoesPage({ commit }, { pageNumber = 1, pageSize = 10 } = {}) {
      const res = await getJson("/Shoes", { pageNumber, pageSize });
      const env = unpackPageEnvelope(res);
      commit("setShoesPage", {
        items: (env.data || []).map(shoeDtoToState),
        totalCount: env.totalCount,
        pageNumber: env.pageNumber,
        pageSize: env.pageSize,
      });
    },

    async fetchStockTransactionsPage(
      { commit },
      { pageNumber = 1, pageSize = 10 } = {}
    ) {
      const res = await getJson("/StockTransmission", { pageNumber, pageSize });
      const env = unpackPageEnvelope(res);
      commit("setStockTransactionsPage", {
        items: (env.data || []).map(stockTxDtoToState),
        totalCount: env.totalCount,
        pageNumber: env.pageNumber,
        pageSize: env.pageSize,
      });
    },

    async fetchPurchaseRecordsPage(
      { commit },
      { pageNumber = 1, pageSize = 10 } = {}
    ) {
      const res = await getJson("/PurchaseRecord", { pageNumber, pageSize });
      const env = unpackPageEnvelope(res);
      commit("setPurchaseRecordsPage", {
        items: (env.data || []).map(purchaseDtoToState),
        totalCount: env.totalCount,
        pageNumber: env.pageNumber,
        pageSize: env.pageSize,
      });
    },

    setRole({ commit }, role) {
      commit("setRole", role);
    },

    // Shoes
    async addShoe({ commit, getters, dispatch }, payload) {
      if (!getters.canCrudShoes) throw new Error("Not allowed");
      const dto = shoeStateToDto(payload);
      // For create, backend ignores id if present
      const created = await postJson("/Shoes", { ...dto, shoeId: undefined });
      const stateObj = shoeDtoToState(created);
      commit("addShoe", stateObj);
      // refresh current page to reflect totals/order
      await dispatch("fetchShoesPage", {
        pageNumber: getters.shoesPageNumber,
        pageSize: getters.shoesPageSize,
      });
      return stateObj;
    },
    async updateShoe({ commit, getters, dispatch }, payload) {
      if (!getters.canCrudShoes) throw new Error("Not allowed");
      const dto = shoeStateToDto(payload);
      await putJson(`/Shoes/${dto.shoeId}`, dto);
      commit("updateShoe", payload);
      await dispatch("fetchShoesPage", {
        pageNumber: getters.shoesPageNumber,
        pageSize: getters.shoesPageSize,
      });
    },
    async deleteShoe({ commit, getters, dispatch }, id) {
      if (!getters.canDeleteMasterData) throw new Error("Not allowed");
      await deleteJson(`/Shoes/${id}`);
      commit("deleteShoe", id);
      await dispatch("fetchShoesPage", {
        pageNumber: getters.shoesPageNumber,
        pageSize: getters.shoesPageSize,
      });
    },

    // Suppliers
    async addSource({ commit, getters }, payload) {
      if (!getters.canCrudSuppliers) throw new Error("Not allowed");
      const dto = supplierStateToDto(payload);
      const created = await postJson("/Suppliers", {
        ...dto,
        supplierId: undefined,
      });
      const stateObj = supplierDtoToState(created);
      commit("addSource", stateObj);
      return stateObj;
    },
    async updateSource({ commit, getters }, payload) {
      if (!getters.canCrudSuppliers) throw new Error("Not allowed");
      const dto = supplierStateToDto(payload);
      await putJson(`/Suppliers/${dto.supplierId}`, dto);
      commit("updateSource", payload);
    },
    async deleteSource({ commit, getters }, id) {
      if (!getters.canDeleteMasterData) throw new Error("Not allowed");
      await deleteJson(`/Suppliers/${id}`);
      commit("deleteSource", id);
    },

    // Stock Transactions
    async addTransaction({ commit, getters, dispatch }, payload) {
      if (!getters.canAddEditTransactions) throw new Error("Not allowed");
      const dto = stockTxStateToDto(payload);
      const created = await postJson("/StockTransmission", {
        ...dto,
        transactionId: undefined,
      });
      const stateObj = stockTxDtoToState(created);
      commit("addTransaction", stateObj);
      // refresh current page
      await dispatch("fetchStockTransactionsPage", {
        pageNumber: getters.stockTransactionsPageNumber,
        pageSize: getters.stockTransactionsPageSize,
      });
      return stateObj;
    },
    async updateTransaction({ commit, getters, dispatch }, payload) {
      if (!getters.canAddEditTransactions) throw new Error("Not allowed");
      const dto = stockTxStateToDto(payload);
      await putJson(`/StockTransmission/${dto.transactionId}`, dto);
      commit("updateTransaction", payload);
      await dispatch("fetchStockTransactionsPage", {
        pageNumber: getters.stockTransactionsPageNumber,
        pageSize: getters.stockTransactionsPageSize,
      });
    },
    async deleteTransaction({ commit, getters, dispatch }, id) {
      if (!getters.canDeleteTransactions) throw new Error("Not allowed");
      await deleteJson(`/StockTransmission/${id}`);
      commit("deleteTransaction", id);
      await dispatch("fetchStockTransactionsPage", {
        pageNumber: getters.stockTransactionsPageNumber,
        pageSize: getters.stockTransactionsPageSize,
      });
    },

    // Purchases (not yet exposed in UI, but wired for completeness)
    async addPurchase({ commit, getters, dispatch }, payload) {
      if (!getters.isAdmin) throw new Error("Not allowed");
      const dto = purchaseStateToDto(payload);
      // Auto-calc total cost on the API payload to enforce correctness
      const qty = Number(dto.quantity) || 0;
      const unit = Number(dto.unitPrice) || 0;
      dto.totalCost = Number((qty * unit).toFixed(2));
      const created = await postJson("/PurchaseRecord", {
        ...dto,
        purchaseId: undefined,
      });
      const stateObj = purchaseDtoToState(created);
      commit("addPurchase", stateObj);
      // refresh current purchases page so UI updates immediately
      await dispatch("fetchPurchaseRecordsPage", {
        pageNumber: getters.purchaseRecordsPageNumber,
        pageSize: getters.purchaseRecordsPageSize,
      });
      return stateObj;
    },
    async updatePurchase({ commit, getters, dispatch }, payload) {
      if (!getters.isAdmin) throw new Error("Not allowed");
      const dto = purchaseStateToDto(payload);
      // Auto-calc total cost on update as well
      const qty = Number(dto.quantity) || 0;
      const unit = Number(dto.unitPrice) || 0;
      dto.totalCost = Number((qty * unit).toFixed(2));
      await putJson(`/PurchaseRecord/${dto.purchaseId}`, dto);
      commit("updatePurchase", payload);
      await dispatch("fetchPurchaseRecordsPage", {
        pageNumber: getters.purchaseRecordsPageNumber,
        pageSize: getters.purchaseRecordsPageSize,
      });
    },
    async deletePurchase({ commit, getters, dispatch }, id) {
      if (!getters.isAdmin) throw new Error("Not allowed");
      await deleteJson(`/PurchaseRecord/${id}`);
      commit("deletePurchase", id);
      await dispatch("fetchPurchaseRecordsPage", {
        pageNumber: getters.purchaseRecordsPageNumber,
        pageSize: getters.purchaseRecordsPageSize,
      });
    },
  },

  modules: {},
});
