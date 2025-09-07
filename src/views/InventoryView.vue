<template>
  <div class="inventory-page">
    <el-card>
      <template #header>
        <div class="card-header-row">
          <span class="title">Inventory</span>
          <div class="actions">
            <el-input
              v-model="search"
              placeholder="Search brand/model/colorway"
              clearable
              size="small"
              style="width: 280px; margin-right: 8px"
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

      <el-table
        :data="filteredShoes"
        border
        stripe
        style="width: 100%"
        height="520"
      >
        <el-table-column prop="ShoeID" label="ID" width="80" />
        <el-table-column prop="Brand" label="Brand" min-width="120" />
        <el-table-column prop="Model" label="Model" min-width="160" />
        <el-table-column prop="Colorway" label="Colorway" min-width="140" />
        <el-table-column prop="Size" label="Size" width="80" />
        <el-table-column prop="Condition" label="Condition" width="120" />
        <el-table-column prop="PurchasePrice" label="Unit Price" width="120">
          <template #default="scope"
            >₱{{ formatCurrency(scope.row.PurchasePrice) }}</template
          >
        </el-table-column>
        <el-table-column prop="CurrentStock" label="Stock" width="100" />
        <el-table-column fixed="right" label="Actions" width="200">
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
                  <el-button link type="danger" size="small">Delete</el-button>
                </template>
              </el-popconfirm>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
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
    };
  },
  computed: {
    ...mapGetters(["shoes", "loading", "canCrudShoes", "canDeleteMasterData"]),
    filteredShoes() {
      const q = (this.search || "").toLowerCase();
      if (!q) return this.shoes;
      return this.shoes.filter(
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
    if (!this.$store.getters.loading && !this.$store.getters.shoes.length) {
      this.$store.dispatch("loadMockData");
    }
  },
};
</script>

<style scoped>
.inventory-page {
  padding: 4px;
}
.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-weight: 600;
}
.dialog-footer {
  text-align: right;
}
</style>
