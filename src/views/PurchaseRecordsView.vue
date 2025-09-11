<template>
  <div class="purchase-records-page">
    <el-card>
      <template #header>
        <div class="card-header-row">
          <span class="title">Purchase Records</span>
          <div class="filters">
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
              placeholder="Search brand/model/supplier"
              clearable
              size="small"
              class="search-input"
            />
            <el-tooltip
              v-if="canCrudPurchases"
              :content="
                dataReady
                  ? 'Add a new purchase'
                  : 'Load or create Shoes and Suppliers first'
              "
              placement="top"
            >
              <span>
                <el-button
                  type="primary"
                  size="small"
                  :disabled="!dataReady"
                  @click="openAdd"
                >
                  Add Purchase
                </el-button>
              </span>
            </el-tooltip>
          </div>
        </div>
      </template>

      <div class="table-wrapper">
        <el-table
          :data="rowsFilteredSorted"
          border
          stripe
          class="purchase-records-table"
          style="width: 100%"
          :height="tableHeight"
          v-loading="loading"
        >
          <el-table-column
            prop="PurchaseDateFmt"
            label="Date"
            min-width="160"
            sortable
          />
          <el-table-column prop="ShoeLabel" label="Shoe" min-width="220" />
          <el-table-column
            prop="SourceLabel"
            label="Supplier"
            min-width="220"
          />
          <el-table-column prop="Quantity" label="Qty" width="100" />
          <el-table-column prop="UnitPrice" label="Unit Price" width="120">
            <template #default="scope"
              >₱{{ formatCurrency(scope.row.UnitPrice) }}</template
            >
          </el-table-column>
          <el-table-column prop="TotalCost" label="Total Cost" width="130">
            <template #default="scope"
              >₱{{ formatCurrency(scope.row.TotalCost) }}</template
            >
          </el-table-column>

          <el-table-column fixed="right" label="Actions" width="160">
            <template #default="scope">
              <el-space wrap size="small">
                <el-button
                  v-if="canCrudPurchases"
                  link
                  type="primary"
                  size="small"
                  @click="openEdit(scope.row)"
                >
                  Edit
                </el-button>

                <el-popconfirm
                  v-if="isAdmin"
                  title="Delete this purchase?"
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

      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="purchaseRecordsTotal"
          :page-size="purchaseRecordsPageSize"
          :current-page="purchaseRecordsPageNumber"
          :page-sizes="[10, 20, 50]"
          @current-change="
            (n) =>
              $store.dispatch('fetchPurchaseRecordsPage', {
                pageNumber: n,
                pageSize: purchaseRecordsPageSize,
              })
          "
          @size-change="
            (s) =>
              $store.dispatch('fetchPurchaseRecordsPage', {
                pageNumber: purchaseRecordsPageNumber,
                pageSize: s,
              })
          "
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? 'Add Purchase' : 'Edit Purchase'"
      width="560px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
        <el-form-item label="Shoe" prop="ShoeID">
          <el-select
            v-model="form.ShoeID"
            filterable
            placeholder="Select shoe"
            :disabled="!canCrudPurchases"
          >
            <el-option
              v-for="s in shoes"
              :key="s.ShoeID"
              :label="shoeLabel(s)"
              :value="s.ShoeID"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Supplier" prop="SourceID">
          <el-select
            v-model="form.SourceID"
            filterable
            placeholder="Select supplier"
            :disabled="!canCrudPurchases"
          >
            <el-option
              v-for="sup in sources"
              :key="sup.SourceID"
              :label="sup.Name"
              :value="sup.SourceID"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Date & Time" prop="PurchaseDate">
          <el-date-picker
            v-model="formDate"
            type="datetime"
            placeholder="Select date and time"
            :disabled="!canCrudPurchases"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Quantity" prop="Quantity">
          <el-input-number
            v-model="form.Quantity"
            :min="1"
            :step="1"
            :disabled="!canCrudPurchases"
          />
        </el-form-item>
        <el-form-item label="Unit Price" prop="UnitPrice">
          <el-input-number
            v-model="form.UnitPrice"
            :min="0"
            :step="1"
            :precision="2"
            :disabled="!canCrudPurchases"
          />
        </el-form-item>
        <el-form-item label="Total Cost">
          <el-input-number
            :model-value="totalCost"
            :min="0"
            :step="1"
            :precision="2"
            disabled
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="onCancel">Cancel</el-button>
          <el-button
            type="primary"
            @click="onSave"
            :disabled="!canCrudPurchases"
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
import { formatDate } from "@/utils/dates";

export default {
  name: "PurchaseRecordsView",
  data() {
    return {
      search: "",
      dateRange: null,
      dialogVisible: false,
      dialogMode: "add",
      tableHeight: 520,
      form: {
        PurchaseID: null,
        ShoeID: null,
        SourceID: null,
        PurchaseDate: new Date().toISOString(),
        Quantity: 1,
        UnitPrice: 0,
        TotalCost: 0,
      },
      rules: {
        ShoeID: [
          { required: true, message: "Shoe is required", trigger: "change" },
        ],
        SourceID: [
          {
            required: true,
            message: "Supplier is required",
            trigger: "change",
          },
        ],
        PurchaseDate: [
          {
            required: true,
            message: "Date & Time is required",
            trigger: "change",
          },
        ],
        Quantity: [
          {
            required: true,
            message: "Quantity is required",
            trigger: "change",
          },
        ],
        UnitPrice: [
          {
            required: true,
            message: "Unit Price is required",
            trigger: "change",
          },
        ],
        // TotalCost is auto-calculated from UnitPrice * Quantity
      },
      resizeTimeout: null,
    };
  },
  computed: {
    ...mapGetters([
      "purchaseRecordsPagedItems",
      "purchaseRecordsTotal",
      "purchaseRecordsPageNumber",
      "purchaseRecordsPageSize",
      "shoes",
      "sources",
      "loading",
      "isAdmin",
      "canCrudPurchases",
    ]),
    dataReady() {
      return (
        this.shoes &&
        this.shoes.length > 0 &&
        this.sources &&
        this.sources.length > 0
      );
    },
    rowsFilteredSorted() {
      const shoeMap = new Map(this.shoes.map((s) => [s.ShoeID, s]));
      const supplierMap = new Map(this.sources.map((s) => [s.SourceID, s]));
      let rows = (this.purchaseRecordsPagedItems || []).map((r) => {
        const s = shoeMap.get(r.ShoeID);
        const sup = supplierMap.get(r.SourceID);
        return {
          ...r,
          ShoeLabel: s
            ? `${s.Brand || "Unknown"} - ${s.Model || ""}`
            : `Shoe #${r.ShoeID}`,
          SourceLabel: sup ? sup.Name : `Supplier #${r.SourceID}`,
          PurchaseDateFmt: this.formatDate(r.PurchaseDate),
        };
      });

      // date filter
      if (
        this.dateRange &&
        this.dateRange.length === 2 &&
        this.dateRange[0] &&
        this.dateRange[1]
      ) {
        const start = new Date(this.dateRange[0]);
        const end = new Date(this.dateRange[1]);
        rows = rows.filter((r) => {
          const d = new Date(r.PurchaseDate);
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

      // search filter
      const q = (this.search || "").toLowerCase();
      if (q) {
        rows = rows.filter(
          (r) =>
            (r.ShoeLabel || "").toLowerCase().includes(q) ||
            (r.SourceLabel || "").toLowerCase().includes(q)
        );
      }

      // sort desc by date
      return rows.sort(
        (a, b) => new Date(b.PurchaseDate) - new Date(a.PurchaseDate)
      );
    },
    formDate: {
      get() {
        return new Date(this.form.PurchaseDate);
      },
      set(val) {
        const d = new Date(val);
        if (!isNaN(d)) {
          this.form.PurchaseDate = d.toISOString();
        }
      },
    },
    totalCost() {
      return Number(this.form.UnitPrice || 0) * Number(this.form.Quantity || 0);
    },
  },
  methods: {
    formatDate,
    formatCurrency(num) {
      try {
        return new Intl.NumberFormat("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(num) || 0);
      } catch {
        return String(num);
      }
    },
    shoeLabel(s) {
      return `${s.Brand || "Unknown"} - ${s.Model || ""}`;
    },
    openAdd() {
      this.dialogMode = "add";
      this.dialogVisible = true;
      this.form = {
        PurchaseID: null,
        ShoeID: null,
        SourceID: null,
        PurchaseDate: new Date().toISOString(),
        Quantity: 1,
        UnitPrice: 0,
        TotalCost: 0,
      };
      this.$nextTick(
        () => this.$refs.formRef && this.$refs.formRef.clearValidate()
      );
    },
    openEdit(row) {
      this.dialogMode = "edit";
      this.dialogVisible = true;
      this.form = { ...row };
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
        // quick FK sanity check to avoid 500s
        const shoeExists = this.shoes.some(
          (s) => Number(s.ShoeID) === Number(this.form.ShoeID)
        );
        const supExists = this.sources.some(
          (s) => Number(s.SourceID) === Number(this.form.SourceID)
        );
        if (!shoeExists || !supExists) {
          ElMessage.error("Invalid Shoe or Supplier selection.");
          return;
        }
        try {
          const payload = { ...this.form, TotalCost: this.totalCost };
          if (this.dialogMode === "add") {
            const created = await this.$store.dispatch("addPurchase", payload);
            this.form = { ...created };
          } else {
            await this.$store.dispatch("updatePurchase", payload);
          }
          this.dialogVisible = false;
        } catch (e) {
          ElMessage.error(String(e?.message || e));
        }
      });
    },
    async onDelete(row) {
      try {
        await this.$store.dispatch("deletePurchase", row.PurchaseID);
      } catch (e) {
        ElMessage.error(String(e?.message || e));
      }
    },
    updateTableHeight() {
      const appHeader = document.querySelector(".app-header");
      const headerH = appHeader ? appHeader.offsetHeight : 56;
      const reserved = 220;
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
  },
  created() {
    // initial page load
    this.$store.dispatch("fetchPurchaseRecordsPage", {
      pageNumber: 1,
      pageSize: 10,
    });
    // ensure dropdown data present
    if (
      !this.$store.getters.shoes.length ||
      !this.$store.getters.sources.length
    ) {
      this.$store.dispatch("loadAll");
    }
  },
  mounted() {
    this.updateTableHeight();
    window.addEventListener("resize", this.onResize);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.onResize);
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
  },
};
</script>

<style scoped>
.purchase-records-page {
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
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.purchase-records-table {
  min-width: 980px;
}
.pagination {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
</style>
