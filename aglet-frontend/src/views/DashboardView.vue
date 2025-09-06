<template>
  <div class="dashboard p-6">
    <!-- Row 1: KPI Cards -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <el-card shadow="hover">
        <h3>Total Shoes in Stock</h3>
        <p class="text-2xl font-bold">{{ totalStock }}</p>
      </el-card>
      <el-card shadow="hover">
        <h3>Total Inventory Value</h3>
        <p class="text-2xl font-bold">₱{{ totalValue }}</p>
      </el-card>
      <el-card shadow="hover">
        <h3>Low Stock Items</h3>
        <p class="text-2xl font-bold">{{ lowStockCount }}</p>
      </el-card>
      <el-card shadow="hover">
        <h3>Total Sources</h3>
        <p class="text-2xl font-bold">{{ totalSources }}</p>
      </el-card>
    </div>

    <!-- Row 2: Charts -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <el-card shadow="hover">
        <h3 class="mb-2">Stock Breakdown by Brand</h3>
        <v-chart :option="brandChartOption" class="chart-container" />
      </el-card>

      <el-card shadow="hover">
        <h3 class="mb-2">Stock Transactions (Last 7 Days)</h3>
        <v-chart :option="transactionChartOption" class="chart-container" />
      </el-card>
    </div>

    <!-- Row 3: Tables -->
    <div class="grid grid-cols-2 gap-4">
      <el-card shadow="hover">
        <h3 class="mb-2">Low Stock Alerts</h3>
        <el-table :data="lowStockList" style="width: 100%">
          <el-table-column prop="Brand" label="Brand" />
          <el-table-column prop="Model" label="Model" />
          <el-table-column prop="CurrentStock" label="Stock" />
        </el-table>
      </el-card>

      <el-card shadow="hover">
        <h3 class="mb-2">Recent Stock Transactions</h3>
        <el-table :data="recentTransactions" style="width: 100%">
          <el-table-column prop="Date" label="Date" />
          <el-table-column prop="TransactionType" label="Type" />
          <el-table-column prop="Quantity" label="Qty" />
          <el-table-column prop="Notes" label="Notes" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script>
import VChart from "vue-echarts";

export default {
  name: "Dashboard",
  components: { VChart },
  data() {
    return {
      totalStock: 0,
      totalValue: 0,
      lowStockCount: 0,
      totalSources: 0,
      lowStockList: [],
      recentTransactions: [],
      brandChartOption: {
        tooltip: { trigger: "item" },
        series: [
          {
            type: "pie",
            radius: "70%",
            data: [
              { value: 10, name: "Nike" },
              { value: 6, name: "Adidas" },
              { value: 4, name: "Converse" },
            ],
          },
        ],
      },
      transactionChartOption: {
        xAxis: { type: "category", data: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"] },
        yAxis: { type: "value" },
        series: [
          {
            data: [5, 2, 3, 8, 4, 6, 7],
            type: "bar",
          },
        ],
      },
    };
  },
  mounted() {
    this.totalStock = 120;
    this.totalValue = 350000;
    this.lowStockCount = 5;
    this.totalSources = 8;

    this.lowStockList = [
      { Brand: "Nike", Model: "Air Max 90", CurrentStock: 2 },
      { Brand: "Adidas", Model: "Yeezy 350", CurrentStock: 1 },
    ];

    this.recentTransactions = [
      { Date: "2025-09-01", TransactionType: "In", Quantity: 5, Notes: "Bought from StockX" },
      { Date: "2025-09-02", TransactionType: "Out", Quantity: 1, Notes: "Sold to walk-in" },
      { Date: "2025-09-03", TransactionType: "Adjustment", Quantity: -1, Notes: "Damaged box" },
    ];
  },
};
</script>

<style>
.dashboard {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.chart-container {
  width: 100%;
  height: 300px; /* 👈 ensures echarts has space */
}
</style>
