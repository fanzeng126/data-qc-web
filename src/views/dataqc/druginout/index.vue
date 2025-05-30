<template>
  <ContentWrap>
    <!-- 搜索区域 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="90px"
    >
      <el-form-item label="出入库类型" prop="ioType">
        <el-select
          v-model="queryParams.ioType"
          placeholder="请选择类型"
          clearable
          class="!w-240px"
        >
          <el-option label="入库" value="IN" />
          <el-option label="出库" value="OUT" />
        </el-select>
      </el-form-item>
      <el-form-item label="药品编码" prop="hosDrugId">
        <el-input
          v-model="queryParams.hosDrugId"
          placeholder="请输入院内药品编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="药品名称" prop="productName">
        <el-input
          v-model="queryParams.productName"
          placeholder="请输入产品通用名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="供应商" prop="supplierName">
        <el-input
          v-model="queryParams.supplierName"
          placeholder="请输入供应商名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="批次号" prop="batchNo">
        <el-input
          v-model="queryParams.batchNo"
          placeholder="请输入批次号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="出入库日期" prop="outInDate">
        <el-date-picker
          v-model="queryParams.outInDate"
          value-format="YYYYMMDD"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['dataqc:drug-inout:create']"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
        <el-button
          type="warning"
          plain
          @click="handleImport('IN')"
          v-hasPermi="['dataqc:drug-inout:import']"
        >
          <Icon icon="ep:upload" /> 导入入库
        </el-button>
        <el-button
          type="info"
          plain
          @click="handleImport('OUT')"
          v-hasPermi="['dataqc:drug-inout:import']"
        >
          <Icon icon="ep:upload" /> 导入出库
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['dataqc:drug-inout:export']"
        >
          <Icon icon="ep:download" />导出
        </el-button>
        <el-button
          type="primary"
          plain
          @click="openStockSummary"
          v-hasPermi="['dataqc:drug-inout:query']"
        >
          <Icon icon="ep:data-analysis" />库存汇总
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 统计卡片区域 -->
  <ContentWrap>
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon in-icon">
              <Icon icon="ep:top" />
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ inoutStats.inCount || 0 }}</div>
              <div class="stats-label">入库次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon out-icon">
              <Icon icon="ep:bottom" />
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ inoutStats.outCount || 0 }}</div>
              <div class="stats-label">出库次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon amount-icon">
              <Icon icon="ep:money" />
            </div>
            <div class="stats-info">
              <div class="stats-value">¥{{ formatAmount(inoutStats.inAmount || 0) }}</div>
              <div class="stats-label">入库金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon supplier-icon">
              <Icon icon="ep:office-building" />
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ inoutStats.supplierCount || 0 }}</div>
              <div class="stats-label">供应商数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="类型" align="center" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.ioType === 'IN' ? 'success' : 'warning'">
            {{ scope.row.ioType === 'IN' ? '入库' : '出库' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="药品编码" align="center" prop="hosDrugId" width="120" />
      <el-table-column
        label="产品名称"
        align="center"
        prop="productName"
        :show-overflow-tooltip="true"
        min-width="150"
      />
      <el-table-column label="数量" align="center" width="100">
        <template #default="scope">
          <span v-if="scope.row.ioType === 'IN'">{{ scope.row.inPackQuantity || 0 }}</span>
          <span v-else>{{ scope.row.outPackQuantity || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单价" align="center" width="100">
        <template #default="scope">
          <span v-if="scope.row.ioType === 'IN'">¥{{ scope.row.inPackPrice || 0 }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" width="120">
        <template #default="scope">
          <span v-if="scope.row.ioType === 'IN'" class="text-green-600">
            ¥{{ formatAmount((scope.row.inPackQuantity || 0) * (scope.row.inPackPrice || 0)) }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="供应商"
        align="center"
        prop="supplierName"
        :show-overflow-tooltip="true"
        width="120"
      />
      <el-table-column label="批次号" align="center" prop="batchNo" width="120" />
      <el-table-column label="出入库日期" align="center" prop="outInDate" width="110" />
      <el-table-column label="有效期" align="center" prop="expiryDate" width="110" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" width="160" fixed="right">
        <template #default="scope">
          <div class="flex items-center justify-center">
            <el-button
              type="primary"
              link
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['dataqc:drug-inout:update']"
            >
              <Icon icon="ep:edit" />修改
            </el-button>
            <el-button
              type="danger"
              link
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['dataqc:drug-inout:delete']"
            >
              <Icon icon="ep:delete" />删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单对话框 -->
  <DrugInoutForm ref="formRef" @success="getList" />

  <!-- 导入对话框 -->
  <DrugInoutImportForm ref="importFormRef" @success="getList" />

  <!-- 库存汇总对话框 -->
  <DrugInoutStatsDialog ref="statsDialogRef" />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import * as DrugInoutApi from '@/api/dataqc/drugInout'
import DrugInoutForm from './DrugInoutForm.vue'
import DrugInoutImportForm from './DrugInoutImportForm.vue'
import DrugInoutStatsDialog from './DrugInoutStatsDialog.vue'

defineOptions({ name: 'DataqcDrugInout' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref([])
const exportLoading = ref(false)
const inoutStats = ref({})

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  ioType: undefined,
  hosDrugId: undefined,
  productName: undefined,
  supplierName: undefined,
  batchNo: undefined,
  outInDate: []
})
const queryFormRef = ref()

// 组件引用
const formRef = ref()
const importFormRef = ref()
const statsDialogRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DrugInoutApi.getDrugInoutInfoPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 获取统计数据 */
const getStats = async () => {
  try {
    // 获取最近一个月的统计数据
    const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10).replace(/-/g, '')

    const data = await DrugInoutApi.getInoutStatistics(startDate, endDate)
    inoutStats.value = data
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 新增/修改操作 */
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 导入操作 */
const handleImport = (ioType: string) => {
  importFormRef.value.open(ioType)
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await DrugInoutApi.exportDrugInoutInfo(queryParams)
    download.excel(data, '药品出入库数据.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DrugInoutApi.deleteDrugInoutInfo(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 打开库存汇总 */
const openStockSummary = () => {
  statsDialogRef.value.open()
}

/** 格式化金额 */
const formatAmount = (amount: number) => {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万'
  }
  return amount.toFixed(2)
}

/** 初始化 */
onMounted(() => {
  getList()
  getStats()
})
</script>

<style scoped>
.stats-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-content {
  display: flex;
  align-items: center;
  padding: 16px;
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-right: 16px;
}

.in-icon {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.out-icon {
  background: linear-gradient(135deg, #e6a23c, #f0a020);
}

.amount-icon {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.supplier-icon {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.stats-info {
  flex: 1;
}

.stats-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}

:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}
</style>
