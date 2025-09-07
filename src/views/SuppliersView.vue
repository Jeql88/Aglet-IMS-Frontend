<template>
  <div class="suppliers-page">
    <el-card>
      <template #header>
        <div class="card-header-row">
          <span class="title">Suppliers</span>
          <div class="actions">
            <el-input
              v-model="search"
              placeholder="Search name/contact"
              clearable
              size="small"
              style="width: 280px; margin-right: 8px"
            />
            <el-button
              v-if="canCrudSuppliers"
              type="primary"
              size="small"
              @click="openAdd"
            >
              Add Supplier
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="filteredSources"
        border
        stripe
        style="width: 100%"
        height="520"
        v-loading="loading"
      >
        <el-table-column prop="SourceID" label="ID" width="80" />
        <el-table-column prop="Name" label="Name" min-width="200" />
        <el-table-column prop="ContactInfo" label="Contact" min-width="220" />
        <el-table-column fixed="right" label="Actions" width="200">
          <template #default="scope">
            <el-space wrap size="small">
              <el-button
                v-if="canCrudSuppliers"
                link
                type="primary"
                size="small"
                @click="openEdit(scope.row)"
              >
                Edit
              </el-button>

              <el-popconfirm
                v-if="canDeleteMasterData"
                title="Delete this supplier?"
                confirm-button-text="Delete"
                cancel-button-text="Cancel"
                confirm-button-type="danger"
                width="260"
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
      :title="dialogMode === 'add' ? 'Add Supplier' : 'Edit Supplier'"
      width="520px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="Name" prop="Name">
          <el-input v-model="form.Name" :disabled="!canCrudSuppliers" />
        </el-form-item>
        <el-form-item label="Contact Info" prop="ContactInfo">
          <el-input
            v-model="form.ContactInfo"
            type="textarea"
            :rows="3"
            :disabled="!canCrudSuppliers"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="onCancel">Cancel</el-button>
          <el-button
            type="primary"
            @click="onSave"
            :disabled="!canCrudSuppliers"
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
  name: "SuppliersView",
  data() {
    return {
      search: "",
      dialogVisible: false,
      dialogMode: "add", // 'add' | 'edit'
      form: {
        SourceID: null,
        Name: "",
        ContactInfo: "",
      },
      rules: {
        Name: [
          { required: true, message: "Name is required", trigger: "blur" },
        ],
        ContactInfo: [
          { required: true, message: "Contact is required", trigger: "blur" },
        ],
      },
    };
  },
  computed: {
    ...mapGetters([
      "sources",
      "loading",
      "canCrudSuppliers",
      "canDeleteMasterData",
    ]),
    filteredSources() {
      const q = (this.search || "").toLowerCase();
      if (!q) return this.sources;
      return this.sources.filter(
        (s) =>
          String(s.Name || "")
            .toLowerCase()
            .includes(q) ||
          String(s.ContactInfo || "")
            .toLowerCase()
            .includes(q)
      );
    },
  },
  methods: {
    openAdd() {
      this.dialogMode = "add";
      this.dialogVisible = true;
      this.form = { SourceID: null, Name: "", ContactInfo: "" };
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
        try {
          if (this.dialogMode === "add") {
            const created = await this.$store.dispatch("addSource", {
              ...this.form,
            });
            this.form = { ...created };
          } else {
            await this.$store.dispatch("updateSource", { ...this.form });
          }
          this.dialogVisible = false;
        } catch (e) {
          ElMessage.error(String(e?.message || e));
        }
      });
    },
    async onDelete(row) {
      try {
        await this.$store.dispatch("deleteSource", row.SourceID);
      } catch (e) {
        ElMessage.error(String(e?.message || e));
      }
    },
  },
  created() {
    if (!this.$store.getters.loading && !this.$store.getters.sources.length) {
      this.$store.dispatch("loadMockData");
    }
  },
};
</script>

<style scoped>
.suppliers-page {
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
