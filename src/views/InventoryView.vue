// ...existing code...
<template>
  <div class="inventory-page">
    <el-card>
      <template #header>
        <div class="card-header-row">
          <span class="title">Inventory</span>
          <div class="actions">
            <el-input
              class="search"
              v-model="search"
              placeholder="Search brand/model/colorway"
              clearable
              size="small"
            />
            <el-button
              v-if="canCrudShoes"
              type="primary"
              size="small"
              @click="openAdd"
            >
              Add Shoe
            </el-button>
          </div>
        </div>
      </template>

      <div class="table-wrapper">
        <el-table
          :data="filteredShoes"
          border
          stripe
          class="inventory-table"
          style="width: 100%"
          :height="tableHeight"
        >
          <el-table-column prop="ShoeID" label="ID" width="80" />
          <el-table-column prop="Brand" label="Brand" min-width="120" />
          <el-table-column prop="Model" label="Model" min-width="160" />
          <el-table-column prop="Colorway" label="Colorway" min-width="140" />
          <el-table-column prop="Size" label="Size" width="80" />
          <el-table-column prop="Condition" label="Condition" width="120" />
          <el-table-column prop="PurchasePrice" label="Unit Price" width="120">
            <template #default="scope">
              ₱{{ formatCurrency(scope.row.PurchasePrice) }}
            </template>
          </el-table-column>
          <el-table-column prop="CurrentStock" label="Stock" width="100" />
          <el-table-column label="Actions" width="140">
            <template #default="scope">
              <el-space wrap size="small">
                <el-button
                  v-if="canCrudShoes"
                  link
                  type="primary"
                  size="small"
                  @click="openEdit(scope.row)"
                >
                  Edit
                </el-button>

                <el-popconfirm
                  v-if="canDeleteMasterData"
                  title="Delete this shoe?"
                  confirm-button-text="Delete"
                  cancel-button-text="Cancel"
                  confirm-button-type="danger"
                  width="240"
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
          :total="shoesPageTotal"
          :page-size="shoesPageSize"
          :current-page="shoesPageNumber"
          :page-sizes="[10, 20, 50]"
          @current-change="n => $store.dispatch('fetchShoesPage', { pageNumber: n, pageSize: shoesPageSize })"
          @size-change="s => $store.dispatch('fetchShoesPage', { pageNumber: shoesPageNumber, pageSize: s })"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? 'Add Shoe' : 'Edit Shoe'"
      width="520px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="Brand" prop="Brand">
          <el-input v-model="form.Brand" :disabled="!canCrudShoes" />
        </el-form-item>
        <el-form-item label="Model" prop="Model">
          <el-input v-model="form.Model" :disabled="!canCrudShoes" />
        </el-form-item>
        <el-form-item label="Colorway" prop="Colorway">
          <el-input v-model="form.Colorway" :disabled="!canCrudShoes" />
        </el-form-item>
        <el-form-item label="Size" prop="Size">
          <el-input-number
            v-model="form.Size"
            :min="0"
            :step="0.5"
            :disabled="!canCrudShoes"
          />
        </el-form-item>
        <el-form-item label="Condition" prop="Condition">
          <el-select
            v-model="form.Condition"
            placeholder="Select"
            :disabled="!canCrudShoes"
          >
            <el-option label="New" value="New" />
            <el-option label="Like New" value="Like New" />
            <el-option label="Used" value="Used" />
          </el-select>
        </el-form-item>
        <el-form-item label="Unit Price" prop="PurchasePrice">
          <el-input-number
            v-model="form.PurchasePrice"
            :min="0"
            :step="1"
            :precision="2"
            :disabled="!canCrudShoes"
          />
        </el-form-item>
        <el-form-item label="Current Stock" prop="CurrentStock">
          <el-input-number
            v-model="form.CurrentStock"
            :min="0"
            :step="1"
            :disabled="!canCrudShoes"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="onCancel">Cancel</el-button>
          <el-button type="primary" @click="onSave" :disabled="!canCrudShoes"
            >Save</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "InventoryView",
  data() {
    return {
      search: "",
      dialogVisible: false,
      dialogMode: "add", // 'add' | 'edit'
      tableHeight: 520,
      form: {
        ShoeID: null,
        Brand: "",
        Model: "",
        Colorway: "",
        Size: 0,
        Condition: "",
        PurchasePrice: 0,
        CurrentStock: 0,
      },
      rules: {
        Brand: [
          { required: true, message: "Brand is required", trigger: "blur" },
        ],
        Model: [
          { required: true, message: "Model is required", trigger: "blur" },
        ],
        Size: [
          { required: true, message: "Size is required", trigger: "change" },
        ],
        Condition: [
          {
            required: true,
            message: "Condition is required",
            trigger: "change",
          },
        ],
        PurchasePrice: [
          {
            required: true,
            message: "Unit Price is required",
            trigger: "change",
          },
        ],
        CurrentStock: [
          {
            required: true,
            message: "Current Stock is required",
            trigger: "change",
          },
        ],
      },
      resizeTimeout: null,
    };
  },
  computed: {
    ...mapGetters([
      "shoes",
      "loading",
      "canCrudShoes",
      "canDeleteMasterData",
      "shoesPageItems",
      "shoesPageTotal",
      "shoesPageNumber",
      "shoesPageSize",
    ]),
    filteredShoes() {
      const q = (this.search || "").toLowerCase();
      if (!q) return this.shoesPageItems;
      return this.shoesPageItems.filter(
        (s) =>
          String(s.Brand || "")
            .toLowerCase()
            .includes(q) ||
          String(s.Model || "")
            .toLowerCase()
            .includes(q) ||
          String(s.Colorway || "")
            .toLowerCase()
            .includes(q)
      );
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
    openAdd() {
      this.dialogMode = "add";
      this.dialogVisible = true;
      this.form = {
        ShoeID: null,
        Brand: "",
        Model: "",
        Colorway: "",
        Size: 0,
        Condition: "",
        PurchasePrice: 0,
        CurrentStock: 0,
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
        if (this.dialogMode === "add") {
          const payload = { ...this.form };
          const created = await this.$store.dispatch("addShoe", payload);
          this.form = { ...created };
        } else {
          await this.$store.dispatch("updateShoe", { ...this.form });
        }
        this.dialogVisible = false;
      });
    },
    async onDelete(row) {
      try {
        await this.$store.dispatch("deleteShoe", row.ShoeID);
      } catch (e) {
        this.$message.error(String(e?.message || e));
      }
    },
  },
  created() {
    this.$store.dispatch("fetchShoesPage", { pageNumber: 1, pageSize: 10 });
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
.inventory-page {
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

.dialog-footer {
  text-align: right;
}

/* header actions responsive */
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.search {
  width: clamp(160px, 30vw, 360px);
  min-width: 140px;
}

/* horizontal scroll to prevent column collapse when sidebar toggles */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* set a min-width so columns remain visible; change if you add/remove columns */
.inventory-table {
  min-width: 1060px;
}
</style>
