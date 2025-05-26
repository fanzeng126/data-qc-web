<template>
  <ContentWrap>
    <!-- 搜索区域 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="机构代码" prop="hospitalCode">
        <el-input
          v-model="queryParams.hospitalCode"
          placeholder="请输入医疗机构代码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="机构名称" prop="organizationName">
        <el-input
          v-model="queryParams.organizationName"
          placeholder="请输入机构名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="统计日期" prop="statDate">
        <el-date-picker
          v-model="queryParams.statDate"
          type="monthrange"
          start-placeholder="开始月份"
          end-placeholder="结束月份"
          format="YYYY-MM"
          value-format="YYYYMM"
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
          v-hasPermi="['dataqc:hospital-resource:create']"
        >
          <Icon icon="ep:plus" />新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="openImportDialog"
          v-hasPermi="['dataqc:hospital-resource:import']"
        >
          <Icon icon="ep:upload" />导入
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['dataqc:hospital-resource:export']"
        >
          <Icon icon="ep:download" />导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 统计卡片 -->
  <ContentWrap>
    <el-row :gutter="20" class="mb-4">
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-value">{{ overviewData.totalHospitals || 0 }}</div>
            <div class="stat-label">医疗机构总数</div>
            <Icon icon="ep:office-building" class="stat-icon" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-value">{{ formatNumber(overviewData.totalBeds) }}</div>
            <div class="stat-label">床位总数</div>
            <Icon icon="ep:house" class="stat-icon bed-icon" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-value">{{ formatNumber(overviewData.totalDoctors) }}</div>
            <div class="stat-label">医师总数</div>
            <Icon icon="ep:user" class="stat-icon doctor-icon" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-value">{{ formatNumber(overviewData.totalVisits) }}</div>
            <div class="stat-label">诊疗总人次</div>
            <Icon icon="ep:data-line" class="stat-icon visit-icon" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="机构代码" align="center" prop="hospitalCode" width="120" />
      <el-table-column
        label="机构名称"
        align="center"
        prop="organizationName"
        :show-overflow-tooltip="true"
        min-width="200"
      />
      <el-table-column label="统计日期" align="center" width="100">
        <template #default="scope">
          {{ formatStatDate(scope.row.statDate) }}
        </template>
      </el-table-column>
      <el-table-column label="资源配置" align="center" width="140">
        <template #default="scope">
          <div class="resource-info">
            <div>床位: {{ scope.row.bedsNum || 0 }}</div>
            <div>医师: {{ (scope.row.pracDockerNum || 0) + (scope.row.assDockerNum || 0) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="诊疗情况" align="center" width="140">
        <template #default="scope">
          <div class="service-info">
            <div>诊疗: {{ formatNumber(scope.row.visitCount) }}</div>
            <div>出院: {{ formatNumber(scope.row.leaveHosCount) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="药品收入" align="center" width="120">
        <template #default="scope">
          <div class="amount-info">
            {{ formatAmount(scope.row.drugSellAmount) }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="中医药情况" align="center" width="140">
        <template #default="scope">
          <div class="tcm-info">
            <div>采购: {{ formatAmount(scope.row.ypPurchaseAmount + scope.row.klPurchaseAmount) }}</div>
            <div>销售: {{ formatAmount(scope.row.ypSellAmount + scope.row.klSellAmount) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <div class="flex items-center justify-center gap-2">
            <el-button
              type="primary"
              link
              @click="openResourceDialog(scope.row)"
              v-hasPermi="['dataqc:hospital-resource:query']"
            >
              <Icon icon="ep:view" />详情
            </el-button>
            <el-button
              type="warning"
              link
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['dataqc:hospital-resource:update']"
            >
              <Icon icon="ep:edit" />修改
            </el-button>
            <el-button
              type="danger"
              link
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['dataqc:hospital-resource:delete']"
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
  <HospitalForm ref="formRef" @success="getList" />

  <!-- 资源详情对话框 -->
  <HospitalResourceDialog ref="resourceDialogRef" />

  <!-- 导入对话框 -->
  <el-dialog v-model="importVisible" title="导入医疗机构资源数据" width="600px">
    <el-upload
      ref="uploadRef"
      v-model:file-list="importFileList"
      :auto-upload="false"
      :limit="1"
      :on-exceed="handleExceed"
      :before-upload="beforeImportUpload"
      accept=".xlsx,.xls"
      drag
      class="upload-area"
    >
      <div class="upload-content">
        <Icon icon="ep:upload-filled" class="upload-icon" />
        <div class="upload-text">
          <p class="primary-text">点击选择文件或将文件拖拽到此处</p>
          <p class="secondary-text">只支持 Excel 格式文件，且文件大小不超过 10MB</p>
        </div>
      </div>
    </el-upload>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="importVisible = false">取 消</el-button>
        <el-button
          type="primary"
          @click="handleImport"
          :loading="importLoading"
          :disabled="importFileList.length === 0"
        >
          确定导入
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as HospitalResourceApi from '@/api/dataqc/hosResource'
import HospitalForm from './HospitalForm.vue'
import HospitalResourceDialog from './HospitalResourceDialog.vue'
import download from "@/utils/download";

defineOptions({ name: 'HospitalResource' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref([])
const overviewData = ref({})
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  hospitalCode: undefined,
  organizationName: undefined,
  statDate: []
})
const queryFormRef = ref()
const exportLoading = ref(false)
const importVisible = ref(false)
const importLoading = ref(false)
const importFileList = ref([])
const uploadRef = ref()

// 组件引用
const formRef = ref()
const resourceDialogRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await HospitalResourceApi.getHospitalResourcePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 获取概览数据 */
const getOverviewData = async () => {
  try {
    const data = await HospitalResourceApi.getHospitalResourceOverview()
    overviewData.value = data
  } catch (error) {
    console.error('获取概览数据失败', error)
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

/** 打开资源详情对话框 */
const openResourceDialog = (row) => {
  resourceDialogRef.value.open(row)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await HospitalResourceApi.deleteHospitalResource(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await HospitalResourceApi.exportHospitalResource(queryParams)
    download.excel(data, '医疗机构资源数据.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 打开导入对话框 */
const openImportDialog = () => {
  importVisible.value = true
  importFileList.value = []
}

/** 文件数量超出限制 */
const handleExceed = () => {
  message.warning('最多只能上传一个文件！')
}

/** 上传前校验 */
const beforeImportUpload = (file) => {
  const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
  if (!isExcel) {
    message.error('只支持 Excel 格式的文件！')
    return false
  }

  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    message.error('文件大小不能超过 10MB！')
    return false
  }

  return true
}

/** 执行导入 */
const handleImport = async () => {
  if (importFileList.value.length === 0) {
    message.warning('请先选择要导入的文件！')
    return
  }

  try {
    importLoading.value = true
    const result = await HospitalResourceApi.importHospitalResource(importFileList.value[0].raw, true)
    message.success(result)
    importVisible.value = false
    await getList()
    await getOverviewData()
  } catch (error) {
    message.error('导入失败：' + error.message)
  } finally {
    importLoading.value = false
  }
}

/** 格式化统计日期 */
const formatStatDate = (statDate: string) => {
  if (!statDate) return '-'
  return statDate.replace(/(\d{4})(\d{2})/, '$1-$2')
}

/** 格式化数字 */
const formatNumber = (num: number) => {
  if (!num) return '0'
  return num.toLocaleString()
}

/** 格式化金额 */
const formatAmount = (amount: number) => {
  if (!amount) return '0'
  return (amount / 10000).toFixed(1) + '万'
}

/** 初始化 */
onMounted(() => {
  getList()
  getOverviewData()
})
</script>

<style scoped>
.stat-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-item {
  position: relative;
  padding: 20px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 0;
}

.stat-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 24px;
  color: #1890ff;
  opacity: 0.8;
}

.bed-icon {
  color: #52c41a;
}

.doctor-icon {
  color: #722ed1;
}

.visit-icon {
  color: #eb2f96;
}

.resource-info,
.service-info,
.tcm-info {
  font-size: 12px;
  line-height: 1.4;
}

.resource-info div,
.service-info div,
.tcm-info div {
  margin-bottom: 2px;
}

.amount-info {
  font-weight: bold;
  color: #52c41a;
}

.upload-area {
  margin: 20px 0;
}

.upload-content {
  padding: 40px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.primary-text {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  margin: 0 0 8px 0;
}

.secondary-text {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}
</style>
