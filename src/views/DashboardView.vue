<template>
  <div class="dashboard">
    <el-alert
      v-if="error"
      type="error"
      show-icon
      :title="`Failed to load data`"
      :description="String(error)"
      class="section"
    />

    <div v-if="loading" class="section">
      <el-skeleton :rows="10" animated />
    </div>

    <template v-else>
      <!-- Row 1: KPI Cards -->
      <div class="section">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :lg="6">
            <el-card shadow="hover">
              <div class="kpi-title">Total Shoes in Stock</div>
              <div class="kpi-value">{{ totalStock }}</div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :lg="6">
            <el-card shadow="hover">
              <div class="kpi-title">Total Inventory Value</div>
              <div class="kpi-value">₱{{ formatCurrency(totalValue) }}</div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :lg="6">
            <el-card shadow="hover">
              <div class="kpi-title">
                Low Stock Items (≤ {{ LOW_STOCK_THRESHOLD }})
              </div>
              <div class="kpi-value warning">{{ lowStockCount }}</div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :lg="6">
            <el-card shadow="hover">
              <div class="kpi-title">Total Sources</div>
              <div class="kpi-value">{{ totalSources }}</div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- Row 2: Charts -->
      <div class="section">
        <el-row :gutter="16">
          <el-col :xs="24" :lg="12">
            <el-card shadow="hover" v-loading="loading">
              <template #header>
                <div class="card-header">Stock Breakdown by Brand</div>
              </template>
              <v-chart :option="brandChartOption" class="chart" autoresize />
            </el-card>
          </el-col>

          <el-col :xs="24" :lg="12">
            <el-card shadow="hover" v-loading="loading">
              <template #header>
                <div class="card-header">Stock Transactions (Last 7 Days)</div>
              </template>
              <v-chart
                :option="transactionChartOption"
                class="chart"
                autoresize
              />
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- Row 3: Tables -->
      <div class="section">
        <el-row :gutter="16">
          <el-col :xs="24" :lg="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">Low Stock Alerts</div>
              </template>
              <el-table
                :data="lowStockListDisplay"
                border
                stripe
                style="width: 100%"
                height="320"
              >
                <el-table-column type="index" width="60" label="#" />
                <el-table-column prop="Brand" label="Brand" min-width="120" />
                <el-table-column prop="Model" label="Model" min-width="160" />
                <el-table-column prop="CurrentStock" label="Stock" width="100">
                  <template #default="scope">
                    <el-tag
                      type="danger"
                      v-if="scope.row.CurrentStock <= LOW_STOCK_THRESHOLD"
                    >
                      {{ scope.row.CurrentStock }}
                    </el-tag>
                    <span v-else>{{ scope.row.CurrentStock }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>

          <el-col :xs="24" :lg="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">Recent Stock Transactions</div>
              </template>
              <el-table
                :data="recentTransactionsDisplay"
                border
                stripe
                style="width: 100%"
                height="320"
              >
                <el-table-column prop="DateFmt" label="Date" min-width="120" />
                <el-table-column
                  prop="TransactionType"
                  label="Type"
                  width="120"
                >
                  <template #default="scope">
                    <el-tag :type="typeTagType(scope.row.TransactionType)">
                      {{ scope.row.TransactionType }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="Quantity" label="Qty" width="100">
                  <template #default="scope">
                    <span
                      :class="scope.row.Quantity < 0 ? 'qty-out' : 'qty-in'"
                    >
                      {{ scope.row.Quantity }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="Notes"
                  label="Notes"
                  min-width="160"
                  show-overflow-tooltip
                />
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

const LOW_STOCK_THRESHOLD = 2;

export default {
  name: "DashboardView",
  computed: {
    ...mapGetters([
      "loading",
      "error",
      "totalStock",
      "totalValue",
      "lowStockCount",
      "totalSources",
      "brandChartOption",
      "transactionChartOption",
      "lowStockList",
      "recentTransactions",
    ]),
    LOW_STOCK_THRESHOLD() {
      return LOW_STOCK_THRESHOLD;
    },
    lowStockListDisplay() {
      return this.lowStockList;
    },
    recentTransactionsDisplay() {
      return this.recentTransactions.map((t) => ({
        ...t,
        DateFmt: this.formatDate(t.Date),
        Quantity:
          t.TransactionType === "Out"
            ? -Math.abs(Number(t.Quantity) || 0)
            : Number(t.Quantity) || 0,
      }));
    },
  },
  methods: {
    formatCurrency(num) {
      try {
        return new Intl.NumberFormat("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(num) || 0);
      } catch (e) {
        return String(num);
      }
    },
    formatDate(dateStr) {
      const d = new Date(dateStr);
      if (isNaN(d)) return "";
      return d.toLocaleDateString();
    },
    typeTagType(type) {
      switch (type) {
        case "In":
          return "success";
        case "Out":
          return "danger";
        case "Adjustment":
          return "warning";
        default:
          return "";
      }
    },
  },
  created() {
    if (!this.$store.getters.loading && !this.$store.getters.shoes.length) {
      this.$store.dispatch("loadMockData");
    }
  },
};
</script>

<style scoped>
.dashboard {
  padding: 16px;
  background-color: #f5f7fa;
  min-height: 100vh;
  box-sizing: border-box;
}

.section {
  margin-bottom: 16px;
}

.card-header {
  font-weight: 600;
}

.kpi-title {
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.kpi-value.warning {
  color: #e6a23c;
}

.chart {
  width: 100%;
  height: 360px;
}

.qty-in {
  color: #67c23a;
  font-weight: 600;
}
.qty-out {
  color: #f56c6c;
  font-weight: 600;
}
</style>
