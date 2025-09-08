<template>
  <div class="transactions-page">
    <el-card>
      <template #header>
        <div class="card-header-row">
          <span class="title">Stock Transactions</span>
          <div class="filters">
            <el-select
              v-model="typeFilter"
              placeholder="Type"
              size="small"
              style="width: 150px; margin-right: 8px"
            >
              <el-option label="All" value="All" />
              <el-option label="In" value="In" />
              <el-option label="Out" value="Out" />
              <el-option label="Adjustment" value="Adjustment" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              unlink-panels
              start-placeholder="Start date"
              end-placeholder="End date"
              size="small"
              style="margin-right: 8px"
            />
            <el-input
              v-model="search"
              placeholder="Search brand/model/notes"
              clearable
              size="small"
              class="search-input"
            />
            <el-button
              v-if="canAddEditTransactions"
              type="primary"
              size="small"
              @click="openAdd"
            >
              Add Transaction
            </el-button>
          </div>
        </div>
      </template>

      <div class="summary section">
        <el-row :gutter="12">
          <el-col :xs="24" :sm="8">
            <el-card shadow="never" class="kpi">
              <div class="kpi-title">Total In</div>
              <div class="kpi-value kpi-in">{{ totalIn }}</div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-card shadow="never" class="kpi">
              <div class="kpi-title">Total Out</div>
              <div class="kpi-value kpi-out">{{ totalOut }}</div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-card shadow="never" class="kpi">
              <div class="kpi-title">Net</div>
              <div
                class="kpi-value"
                :class="netTotal >= 0 ? 'kpi-in' : 'kpi-out'"
              >
                {{ netTotal }}
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="table-wrapper">
        <el-table
          :data="rowsFilteredSorted"
          border
          stripe
          class="transactions-table"
          style="width: 100%"
          :height="tableHeight"
          v-loading="loading"
        >
          <el-table-column
            prop="DateFmt"
            label="Date"
            min-width="140"
            sortable
          />
          <el-table-column prop="BrandModel" label="Shoe" min-width="180" />
          <el-table-column prop="TransactionType" label="Type" width="120">
            <template #default="scope">
              <el-tag :type="typeTagType(scope.row.TransactionType)">
                {{ scope.row.TransactionType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="Quantity" label="Qty" width="100">
            <template #default="scope">
              <span :class="scope.row.Quantity < 0 ? 'qty-out' : 'qty-in'">
                {{ scope.row.Quantity }}
              </span>
            </template>
          </el-table-column>
          <el-table-column
            prop="Notes"
            label="Notes"
            min-width="220"
            show-overflow-tooltip
          />
          <el-table-column fixed="right" label="Actions" width="120">
            <template #default="scope">
              <el-space wrap size="small">
                <el-button
                  v-if="canAddEditTransactions"
                  link
                  type="primary"
                  size="small"
                  @click="openEdit(scope.row)"
                >
                  Edit
                </el-button>

                <el-popconfirm
                  v-if="canDeleteTransactions"
                  title="Delete this transaction?"
                  confirm-button-text="Delete"
                  cancel-button-text="Cancel"
                  confirm-button-type="danger"
                  width="260"
                  @confirm="onDelete(scope.row)"
                >
                  <template #reference>
                    <el-button link type="danger" size="small"
                      >Delete</el-button
                    >
                  </template>
                </el-popconfirm>
              </el-space>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? 'Add Transaction' : 'Edit Transaction'"
      width="560px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
        <el-form-item label="Shoe" prop="ShoeID">
          <el-select
            v-model="form.ShoeID"
            filterable
            placeholder="Select shoe"
            :disabled="!canAddEditTransactions"
          >
            <el-option
              v-for="s in shoes"
              :key="s.ShoeID"
              :label="shoeLabel(s)"
              :value="s.ShoeID"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Type" prop="TransactionType">
          <el-select
            v-model="form.TransactionType"
            :disabled="!canAddEditTransactions"
          >
            <el-option label="In" value="In" />
            <el-option label="Out" value="Out" />
            <el-option label="Adjustment" value="Adjustment" />
          </el-select>
        </el-form-item>
        <el-form-item label="Quantity" prop="Quantity">
          <el-input-number
            v-model="form.Quantity"
            :min="0"
            :step="1"
            :disabled="!canAddEditTransactions"
          />
        </el-form-item>
        <el-form-item label="Date & Time" prop="Date">
          <el-date-picker
            v-model="formDate"
            type="datetime"
            placeholder="Select date and time"
            :disabled="!canAddEditTransactions"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Notes" prop="Notes">
          <el-input
            v-model="form.Notes"
            type="textarea"
            :rows="3"
            :disabled="!canAddEditTransactions"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="onCancel">Cancel</el-button>
          <el-button
            type="primary"
            @click="onSave"
            :disabled="!canAddEditTransactions"
            >Save</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { ElMessage } from "element-plus";

export default {
  name: "TransactionsView",
  data() {
    return {
      typeFilter: "All",
      dateRange: null, // [startDate, endDate]
      search: "",
      dialogVisible: false,
      dialogMode: "add", // 'add' | 'edit'
      tableHeight: 520,
      form: {
        TransactionID: null,
        ShoeID: null,
        TransactionType: "In",
        Quantity: 0,
        Date: new Date().toISOString(),
        Notes: "",
      },
      resizeTimeout: null,
    };
  },
  computed: {
    ...mapGetters([
      "stockTransactions",
      "shoes",
      "loading",
      "canAddEditTransactions",
      "canDeleteTransactions",
    ]),
    rowsEnriched() {
      const shoeMap = new Map(this.shoes.map((s) => [s.ShoeID, s]));
      return (this.stockTransactions || []).map((t) => {
        const s = shoeMap.get(t.ShoeID);
        const brandModel = s
          ? `${s.Brand || "Unknown"} - ${s.Model || ""}`
          : `Shoe #${t.ShoeID}`;
        const isOut = t.TransactionType === "Out";
        const qty = isOut
          ? -Math.abs(Number(t.Quantity) || 0)
          : Number(t.Quantity) || 0;
        return {
          ...t,
          BrandModel: brandModel,
          DateFmt: this.formatDate(t.Date),
          Quantity: qty,
        };
      });
    },
    rowsFilteredSorted() {
      let rows = this.rowsEnriched;

      // Type filter
      if (this.typeFilter && this.typeFilter !== "All") {
        rows = rows.filter((r) => r.TransactionType === this.typeFilter);
      }

      // Date filter
      if (
        this.dateRange &&
        this.dateRange.length === 2 &&
        this.dateRange[0] &&
        this.dateRange[1]
      ) {
        const start = new Date(this.dateRange[0]);
        const end = new Date(this.dateRange[1]);
        rows = rows.filter((r) => {
          const d = new Date(r.Date);
          return (
            d >= start &&
            d <=
              new Date(
                end.getFullYear(),
                end.getMonth(),
                end.getDate(),
                23,
                59,
                59,
                999
              )
          );
        });
      }

      // Search filter
      const q = (this.search || "").toLowerCase();
      if (q) {
        rows = rows.filter(
          (r) =>
            (r.BrandModel || "").toLowerCase().includes(q) ||
            (r.Notes || "").toLowerCase().includes(q)
        );
      }

      // Sort by date desc
      return rows.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    },
    totalIn() {
      return this.rowsFilteredSorted
        .filter((r) => r.TransactionType === "In")
        .reduce((acc, r) => acc + Math.abs(r.Quantity || 0), 0);
    },
    totalOut() {
      return this.rowsFilteredSorted
        .filter((r) => r.TransactionType === "Out")
        .reduce((acc, r) => acc + Math.abs(r.Quantity || 0), 0);
    },
    netTotal() {
      return this.rowsFilteredSorted.reduce(
        (acc, r) => acc + (r.Quantity || 0),
        0
      );
    },
    formDate: {
      get() {
        return new Date(this.form.Date);
      },
      set(val) {
        const d = new Date(val);
        if (!isNaN(d)) {
          this.form.Date = d.toISOString();
        }
      },
    },
  },
  methods: {
    formatDate(dateStr) {
      const d = new Date(dateStr);
      if (isNaN(d)) return "";
      return d.toLocaleString();
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
    shoeLabel(s) {
      return `${s.Brand || "Unknown"} - ${s.Model || ""}`;
    },
    updateTableHeight() {
      const appHeader = document.querySelector(".app-header");
      const headerH = appHeader ? appHeader.offsetHeight : 56;
      const reserved = 280; // More reserved space due to KPI cards
      const newH = Math.max(300, window.innerHeight - headerH - reserved);
      this.tableHeight = newH;
    },
    onResize() {
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.updateTableHeight();
        this.resizeTimeout = null;
      }, 120);
    },
    openAdd() {
      this.dialogMode = "add";
      this.dialogVisible = true;
      this.form = {
        TransactionID: null,
        ShoeID: null,
        TransactionType: "In",
        Quantity: 0,
        Date: new Date().toISOString(),
        Notes: "",
      };
      this.$nextTick(
        () => this.$refs.formRef && this.$refs.formRef.clearValidate()
      );
    },
    openEdit(row) {
      this.dialogMode = "edit";
      this.dialogVisible = true;
      // Convert display Quantity back to positive for editing (store keeps positive)
      const qty = Math.abs(Number(row.Quantity) || 0);
      this.form = {
        TransactionID: row.TransactionID,
        ShoeID: row.ShoeID,
        TransactionType: row.TransactionType,
        Quantity: qty,
        Date: new Date(row.Date).toISOString(),
        Notes: row.Notes || "",
      };
      this.$nextTick(
        () => this.$refs.formRef && this.$refs.formRef.clearValidate()
      );
    },
    onCancel() {
      this.dialogVisible = false;
    },
    onSave() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return;
        const normalized = {
          ...this.form,
          Quantity: Math.abs(Number(this.form.Quantity) || 0),
          Date: new Date(this.form.Date).toISOString(),
        };
        try {
          if (this.dialogMode === "add") {
            const created = await this.$store.dispatch(
              "addTransaction",
              normalized
            );
            this.form = { ...created };
          } else {
            await this.$store.dispatch("updateTransaction", normalized);
          }
          this.dialogVisible = false;
        } catch (e) {
          ElMessage.error(String(e?.message || e));
        }
      });
    },
    async onDelete(row) {
      try {
        await this.$store.dispatch("deleteTransaction", row.TransactionID);
      } catch (e) {
        ElMessage.error(String(e?.message || e));
      }
    },
  },
  created() {
    if (
      !this.$store.getters.loading &&
      !this.$store.getters.stockTransactions.length
    ) {
      this.$store.dispatch("loadMockData");
    }
  },
  mounted() {
    this.updateTableHeight();
    window.addEventListener("resize", this.onResize);

    // Ensure data as well for shoes dropdown
    if (!this.$store.getters.shoes.length) {
      this.$store.dispatch("loadMockData");
    }
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.onResize);
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
  },
  rules: {
    // keep component options clean; rules are inside data()
  },
};
</script>

<style scoped>
.transactions-page {
  padding: 8px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.title {
  font-weight: 600;
}

.filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.search-input {
  width: clamp(180px, 30vw, 280px);
  min-width: 160px;
}

.section {
  margin-bottom: 12px;
}

.kpi {
  text-align: center;
}

.kpi-title {
  color: #909399;
  font-size: 12px;
  margin-bottom: 4px;
}
.kpi-value {
  font-size: 22px;
  font-weight: 700;
}
.kpi-in {
  color: #67c23a;
}
.kpi-out {
  color: #f56c6c;
}

.qty-in {
  color: #67c23a;
  font-weight: 600;
}
.qty-out {
  color: #f56c6c;
  font-weight: 600;
}

.dialog-footer {
  text-align: right;
}

/* Horizontal scroll to prevent column collapse when sidebar toggles */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Set a min-width so columns remain visible; adjust based on your columns */
.transactions-table {
  min-width: 690px;
}

/* Additional professional styling */
.transactions-table .el-table__header-wrapper th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
}

.transactions-table .el-table__row:hover {
  background-color: #f8f9fa;
}

.transactions-table .el-table__body .el-table__row td {
  border-bottom: 1px solid #e9ecef;
}

/* Better tag styling */
.el-tag {
  border-radius: 4px;
  font-weight: 500;
  letter-spacing: 0.025em;
}

/* Improved date column */
.transactions-table .el-table__body td:first-child {
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas,
    "Courier New", monospace;
  font-size: 13px;
  color: #6c757d;
}
</style>
