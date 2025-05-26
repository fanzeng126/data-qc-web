<template>
  <Dialog
    v-model="dialogVisible"
    title="药品库存汇总"
    width="1200px"
    :close-on-click-modal="false"
  >
    <!-- 筛选条件 -->
    <el-card class="mb-4">
      <template #header>
        <span>查询条件</span>
      </template>
      <el-form
        :model="queryParams"
        :inline="true"
        label-width="100px"
        class="search-form"
      >
        <el-form-item label="药品编码">
          <el-input
            v-model="queryParams.hosDrugId"
            placeholder="请输入药品编码"
            clearable
            class="w-200px"
          />
        </el-form-item>
        <el-form-item label="药品名称">
          <el-input
            v-model="queryParams.productName"
            placeholder="请输入药品名称"
            clearable
            class="w-200px"
          />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input
            v-model="queryParams.supplierName"
            placeholder="请输入供应商名称"
            clearable
            class="w-200px"
          />
        </el-form-item>
        <el-form-item label="库存状态">
          <el-select
            v-model="queryParams.stockStatus"
            placeholder="请选择库存状态"
            clearable
            class="w-150px"
          >
            <el-option label="正常" value="NORMAL" />
            <el-option label="预警" value="WARNING" />
            <el-option label="不足" value="LOW" />
            <el-option label="过期" value="EXPIRED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <Icon icon="ep:search" />查询
          </el-button>
          <el-button @click="resetQuery">
            <Icon icon="ep:refresh" />重置
          </el-button>
          <el-button type="success" @click="handleExport" :loading="exportLoading">
            <Icon icon="ep:download" />导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计概览 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card class="stats-overview-card">
          <div class="stats-overview-content">
            <div class="stats-overview-icon total-icon">
              <Icon icon="ep:goods" />
            </div>
            <div class="stats-overview-info">
              <div class="stats-overview-value">{{ summaryStats.totalDrugs || 0 }}</div>
              <div class="stats-overview-label">药品种类</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-overview-card">
          <div class="stats-overview-content">
            <div class="stats-overview-icon stock-icon">
              <Icon icon="ep:box" />
            </div>
            <div class="stats-overview-info">
              <div class="stats-overview-value">{{ summaryStats.totalQuantity || 0 }}</div>
              <div class="stats-overview-label">库存总量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-overview-card">
          <div class="stats-overview-content">
            <div class="stats-overview-icon value-icon">
              <Icon icon="ep:money" />
            </div>
            <div class="stats-overview-info">
              <div class="stats-overview-value">¥{{ formatAmount(summaryStats.totalValue || 0) }}</div>
              <div class="stats-overview-label">库存价值</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-overview-card">
          <div class="stats-overview-content">
            <div class="stats-overview-icon warning-icon">
              <Icon icon="ep:warning" />
            </div>
            <div class="stats-overview-info">
              <div class="stats-overview-value text-orange-500">{{ summaryStats.lowStockCount || 0 }}</div>
              <div class="stats-overview-label">预警药品</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 库存明细表格 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>库存明细</span>
          <div class="header-actions">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button value="detail">明细视图</el-radio-button>
              <el-radio-button value="summary">汇总视图</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="stockList"
        max-height="500"
        @sort-change="handleSortChange"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />

        <el-table-column
          label="药品编码"
          prop="hosDrugId"
          width="120"
          align="center"
          sortable="custom"
        />

        <el-table-column
          label="产品名称"
          prop="productName"
          min-width="180"
          :show-overflow-tooltip="true"
          sortable="custom"
        />

        <el-table-column
          label="规格"
          prop="specification"
          width="120"
          align="center"
          :show-overflow-tooltip="true"
        />

        <el-table-column
          label="当前库存"
          prop="currentStock"
          width="100"
          align="center"
          sortable="custom"
        >
          <template #default="scope">
            <span
              :class="{
                'text-red-500': scope.row.stockStatus === 'LOW',
                'text-orange-500': scope.row.stockStatus === 'WARNING',
                'text-green-600': scope.row.stockStatus === 'NORMAL'
              }"
            >
              {{ scope.row.currentStock || 0 }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          label="安全库存"
          prop="safetyStock"
          width="100"
          align="center"
        />

        <el-table-column
          label="库存状态"
          prop="stockStatus"
          width="100"
          align="center"
        >
          <template #default="scope">
            <el-tag
              :type="getStockStatusType(scope.row.stockStatus)"
              size="small"
            >
              {{ getStockStatusText(scope.row.stockStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          v-if="viewMode === 'detail'"
          label="批次号"
          prop="batchNo"
          width="120"
          align="center"
        />

        <el-table-column
          v-if="viewMode === 'detail'"
          label="有效期"
          prop="expiryDate"
          width="110"
          align="center"
          sortable="custom"
        >
          <template #default="scope">
            <span
              :class="{
                'text-red-500': isExpiringSoon(scope.row.expiryDate),
                'text-orange-500': isExpiring(scope.row.expiryDate)
              }"
            >
              {{ formatDate(scope.row.expiryDate) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          label="供应商"
          prop="supplierName"
          width="150"
          align="center"
          :show-overflow-tooltip="true"
        />

        <el-table-column
          label="单价"
          prop="unitPrice"
          width="100"
          align="center"
          sortable="custom"
        >
          <template #default="scope">
            ¥{{ (scope.row.unitPrice || 0).toFixed(2) }}
          </template>
        </el-table-column>

        <el-table-column
          label="库存金额"
          prop="stockValue"
          width="120"
          align="center"
          sortable="custom"
        >
          <template #default="scope">
            <span class="text-green-600 font-medium">
              ¥{{ formatAmount((scope.row.currentStock || 0) * (scope.row.unitPrice || 0)) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          label="最后更新"
          prop="lastUpdateTime"
          width="160"
          align="center"
          :formatter="dateFormatter"
        />

        <el-table-column
          v-if="viewMode === 'detail'"
          label="操作"
          width="120"
          align="center"
          fixed="right"
        >
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleStockAdjust(scope.row)"
            >
              <Icon icon="ep:edit" />
              调整
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getStockList"
        class="mt-4"
      />
    </el-card>

    <!-- 库存调整对话框 -->
    <Dialog
      v-model="adjustDialogVisible"
      title="库存调整"
      width="500px"
    >
      <el-form
        ref="adjustFormRef"
        :model="adjustForm"
        :rules="adjustRules"
        label-width="100px"
      >
        <el-form-item label="药品信息">
          <div class="drug-info">
            <p><strong>{{ adjustForm.productName }}</strong></p>
            <p>编码：{{ adjustForm.hosDrugId }}</p>
            <p>当前库存：{{ adjustForm.currentStock }}</p>
          </div>
        </el-form-item>

        <el-form-item label="调整类型" prop="adjustType">
          <el-radio-group v-model="adjustForm.adjustType">
            <el-radio value="IN">增加库存</el-radio>
            <el-radio value="OUT">减少库存</el-radio>
            <el-radio value="SET">设置库存</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          :label="adjustForm.adjustType === 'SET' ? '目标库存' : '调整数量'"
          prop="adjustQuantity"
        >
          <el-input-number
            v-model="adjustForm.adjustQuantity"
            :min="adjustForm.adjustType === 'SET' ? 0 : 1"
            :max="adjustForm.adjustType === 'OUT' ? adjustForm.currentStock : undefined"
            class="w-full"
          />
        </el-form-item>

        <el-form-item label="调整原因" prop="adjustReason">
          <el-select
            v-model="adjustForm.adjustReason"
            placeholder="请选择调整原因"
            class="w-full"
          >
            <el-option label="盘点调整" value="INVENTORY" />
            <el-option label="损耗调整" value="LOSS" />
            <el-option label="过期处理" value="EXPIRED" />
            <el-option label="系统错误" value="ERROR" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>

        <el-form-item label="备注说明">
          <el-input
            v-model="adjustForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入调整说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="adjustDialogVisible = false">取 消</el-button>
        <el-button
          type="primary"
          @click="handleConfirmAdjust"
          :loading="adjustLoading"
        >
          确认调整
        </el-button>
      </template>
    </Dialog>

    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import {dateFormatter, formatDate } from '@/utils/formatTime'
import download from '@/utils/download'
import * as DrugInoutApi from '@/api/dataqc/drugInout'
import { FormRules } from 'element-plus'

defineOptions({ name: 'DrugInoutStatsDialog' })

const message = useMessage()

// 响应式数据
const dialogVisible = ref(false)
const loading = ref(false)
const exportLoading = ref(false)
const adjustDialogVisible = ref(false)
const adjustLoading = ref(false)
const viewMode = ref<'detail' | 'summary'>('detail')

const stockList = ref([])
const total = ref(0)
const summaryStats = ref({})

const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  hosDrugId: '',
  productName: '',
  supplierName: '',
  stockStatus: '',
  orderBy: '',
  orderDirection: ''
})

const adjustForm = ref({
  id: '',
  hosDrugId: '',
  productName: '',
  currentStock: 0,
  adjustType: 'IN',
  adjustQuantity: 1,
  adjustReason: '',
  remark: ''
})

const adjustFormRef = ref()

// 表单验证规则
const adjustRules = reactive<FormRules>({
  adjustType: [{ required: true, message: '请选择调整类型', trigger: 'change' }],
  adjustQuantity: [
    { required: true, message: '请输入调整数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '数量不能小于0', trigger: 'change' }
  ],
  adjustReason: [{ required: true, message: '请选择调整原因', trigger: 'change' }]
})

/** 打开对话框 */
const open = () => {
  dialogVisible.value = true
  resetQuery()
  getStockList()
  getSummaryStats()
}

/** 获取库存列表 */
const getStockList = async () => {
  loading.value = true
  try {
    const data = await DrugInoutApi.getStockSummary(queryParams)
    stockList.value = data.list
    total.value = data.total
  } catch (error) {
    console.error('获取库存数据失败', error)
    message.error('获取库存数据失败')
  } finally {
    loading.value = false
  }
}

/** 获取汇总统计 */
const getSummaryStats = async () => {
  try {
    const data = await DrugInoutApi.getStockStatistics()
    summaryStats.value = data
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

/** 查询操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getStockList()
}

/** 重置查询 */
const resetQuery = () => {
  queryParams.pageNo = 1
  queryParams.pageSize = 20
  queryParams.hosDrugId = ''
  queryParams.productName = ''
  queryParams.supplierName = ''
  queryParams.stockStatus = ''
  queryParams.orderBy = ''
  queryParams.orderDirection = ''
  getStockList()
}

/** 排序变更 */
const handleSortChange = ({ prop, order }) => {
  queryParams.orderBy = prop
  queryParams.orderDirection = order === 'ascending' ? 'ASC' : 'DESC'
  getStockList()
}

/** 导出数据 */
const handleExport = async () => {
  try {
    exportLoading.value = true
    const data = await DrugInoutApi.exportStockSummary(queryParams)
    download.excel(data, '药品库存汇总.xls')
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败', error)
    message.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

/** 库存调整 */
const handleStockAdjust = (row: any) => {
  adjustForm.value = {
    id: row.id,
    hosDrugId: row.hosDrugId,
    productName: row.productName,
    currentStock: row.currentStock,
    adjustType: 'IN',
    adjustQuantity: 1,
    adjustReason: '',
    remark: ''
  }
  adjustDialogVisible.value = true
}

/** 确认调整 */
const handleConfirmAdjust = async () => {
  if (!adjustFormRef.value) return
  const valid = await adjustFormRef.value.validate()
  if (!valid) return

  adjustLoading.value = true
  try {
    await DrugInoutApi.adjustStock(adjustForm.value)
    message.success('库存调整成功')
    adjustDialogVisible.value = false
    getStockList()
    getSummaryStats()
  } catch (error) {
    console.error('库存调整失败', error)
    message.error('库存调整失败')
  } finally {
    adjustLoading.value = false
  }
}

/** 格式化金额 */
const formatAmount = (amount: number) => {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万'
  }
  return amount.toFixed(2)
}

/** 获取库存状态类型 */
const getStockStatusType = (status: string) => {
  const typeMap = {
    'NORMAL': 'success',
    'WARNING': 'warning',
    'LOW': 'danger',
    'EXPIRED': 'info'
  }
  return typeMap[status] || 'info'
}

/** 获取库存状态文本 */
const getStockStatusText = (status: string) => {
  const textMap = {
    'NORMAL': '正常',
    'WARNING': '预警',
    'LOW': '不足',
    'EXPIRED': '过期'
  }
  return textMap[status] || '未知'
}

/** 判断是否即将过期（30天内） */
const isExpiringSoon = (expiryDate: string) => {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
  const now = new Date()
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 30 && diffDays > 0
}

/** 判断是否过期或90天内过期 */
const isExpiring = (expiryDate: string) => {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
  const now = new Date()
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 90 && diffDays > 30
}

// 暴露方法
defineExpose({ open })
</script>

<style scoped>
.search-form {
  margin-bottom: 0;
}

.stats-overview-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-overview-content {
  display: flex;
  align-items: center;
  padding: 16px;
}

.stats-overview-icon {
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

.total-icon {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stock-icon {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.value-icon {
  background: linear-gradient(135deg, #e6a23c, #f0a020);
}

.warning-icon {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.stats-overview-info {
  flex: 1;
}

.stats-overview-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stats-overview-label {
  font-size: 14px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.drug-info {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.drug-info p {
  margin: 4px 0;
  color: #606266;
}

.drug-info strong {
  color: #303133;
}

:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}

:deep(.el-card__body) {
  padding: 16px;
}

.w-200px {
  width: 200px;
}

.w-150px {
  width: 150px;
}
</style>
