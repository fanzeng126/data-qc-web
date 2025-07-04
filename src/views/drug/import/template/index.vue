<template>
  <div class="template-container">
    <!-- 页面头部 -->
    <PageHeader content="管理数据导入模板，包括默认模板和自定义模板" title="导入模板管理">
      <template #extra>
        <el-button
          v-hasPermi="['drug:import-template:create']"
          type="primary"
          @click="openForm('create')"
        >
          <el-icon><Plus /></el-icon>
          新建模板
        </el-button>
        <el-button
          v-hasPermi="['drug:import-template:export']"
          :loading="exportLoading"
          type="success"
          @click="handleExport"
        >
          <el-icon><Download /></el-icon>
          导出列表
        </el-button>
      </template>
    </PageHeader>

    <!-- 统计概览卡片 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :lg="6" :md="6" :sm="6" :xl="6" :xs="12">
          <StatCard
            :value="statistics.totalCount"
            color="#409eff"
            icon="Document"
            title="模板总数"
          />
        </el-col>
        <el-col :lg="6" :md="6" :sm="6" :xl="6" :xs="12">
          <StatCard
            :value="statistics.activeCount"
            color="#67c23a"
            icon="CircleCheck"
            title="启用模板"
          />
        </el-col>
        <el-col :lg="6" :md="6" :sm="6" :xl="6" :xs="12">
          <StatCard :value="statistics.defaultCount" color="#e6a23c" icon="Star" title="默认模板" />
        </el-col>
        <el-col :lg="6" :md="6" :sm="6" :xl="6" :xs="12">
          <StatCard
            :value="formatNumber(statistics.totalDownloads)"
            color="#909399"
            icon="Download"
            title="总下载次数"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和操作区域 -->
    <el-card class="search-card" shadow="never">
      <el-form
        ref="queryFormRef"
        :inline="true"
        :model="queryParams"
        class="search-form"
        label-width="80px"
      >
        <el-row :gutter="20">
          <el-col :lg="6" :md="8" :sm="12" :xs="24">
            <el-form-item label="模板名称" prop="templateName">
              <el-input
                v-model="queryParams.templateName"
                clearable
                placeholder="请输入模板名称"
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :lg="6" :md="8" :sm="12" :xs="24">
            <el-form-item label="模板编码" prop="templateCode">
              <el-input
                v-model="queryParams.templateCode"
                clearable
                placeholder="请输入模板编码"
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :lg="6" :md="8" :sm="12" :xs="24">
            <el-form-item label="表类型" prop="tableType">
              <el-select
                v-model="queryParams.tableType"
                clearable
                placeholder="请选择表类型"
                style="width: 100%"
              >
                <el-option label="全部" value="" />
                <el-option
                  v-for="(name, type) in TABLE_TYPE_NAMES"
                  :key="type"
                  :label="name"
                  :value="Number(type)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :lg="6" :md="8" :sm="12" :xs="24">
            <el-form-item label="状态" prop="status">
              <el-select
                v-model="queryParams.status"
                clearable
                placeholder="请选择状态"
                style="width: 100%"
              >
                <el-option label="全部" value="" />
                <el-option :value="1" label="启用" />
                <el-option :value="0" label="禁用" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24" style="text-align: center">
            <el-form-item>
              <el-button type="primary" @click="handleQuery">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="resetQuery">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 模板列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <span class="table-title">模板列表</span>
          <div class="table-actions">
            <el-button size="small" type="primary" @click="openForm('create')">
              <el-icon><Plus /></el-icon>
              新建模板
            </el-button>
            <el-button :loading="refreshing" size="small" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="list"
        :show-overflow-tooltip="true"
        :stripe="true"
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column
          align="left"
          fixed="left"
          label="模板名称"
          min-width="180"
          prop="templateName"
        >
          <template #default="{ row }">
            <div class="template-info">
              <div class="template-name">
                <Icon
                  :class="{ 'default-icon': row.isDefault }"
                  :icon="row.isDefault ? 'ep:star-filled' : 'ep:document'"
                />
                {{ row.templateName }}
              </div>
              <div class="template-code">{{ row.templateCode }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column align="center" label="表类型" prop="tableTypeName" width="120">
          <template #default="{ row }">
            <el-tag effect="plain" type="info">{{ getTableTypeName(row.tableType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="字段数量" prop="fieldCount" width="100">
          <template #default="{ row }">
            <el-badge :value="row.fieldCount" class="field-badge" type="primary" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="下载次数" prop="downloadCount" width="100">
          <template #default="{ row }">
            <span class="download-count">{{ formatNumber(row.downloadCount) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="true"
              :inactive-value="false"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column align="center" label="模板类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isDefault ? 'warning' : 'primary'" size="small">
              {{ row.isDefault ? '默认' : '自定义' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :formatter="dateFormatter"
          align="center"
          label="创建时间"
          prop="createTime"
          width="160"
        />
        <el-table-column align="center" label="创建人" prop="creator" width="100" />
        <el-table-column align="center" fixed="right" label="操作" width="260">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                v-hasPermi="['drug:import-template:query']"
                link
                size="small"
                type="primary"
                @click="handlePreview(row.id)"
              >
                <Icon class="mr-3px" icon="ep:view" />
                预览
              </el-button>
              <el-button
                v-hasPermi="['drug:import-template:query']"
                link
                size="small"
                type="success"
                @click="handleDownload(row.id)"
              >
                <Icon class="mr-3px" icon="ep:download" />
                下载
              </el-button>
              <el-button
                v-hasPermi="['drug:import-template:update']"
                link
                size="small"
                type="primary"
                @click="openForm('update', row.id)"
              >
                <Icon class="mr-3px" icon="ep:edit" />
                编辑
              </el-button>
              <el-button
                v-hasPermi="['drug:import-template:create']"
                link
                size="small"
                type="warning"
                @click="handleCopy(row.id)"
              >
                <Icon class="mr-3px" icon="ep:copy-document" />
                复制
              </el-button>
              <el-button
                v-hasPermi="['drug:import-template:delete']"
                :disabled="row.isDefault"
                link
                size="small"
                type="danger"
                @click="handleDelete(row.id)"
              >
                <Icon class="mr-3px" icon="ep:delete" />
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <Pagination
          v-model:limit="queryParams.pageSize"
          v-model:page="queryParams.pageNo"
          :total="total"
          @pagination="getList"
        />
      </div>
    </el-card>

    <!-- 表单弹窗：添加/修改 -->
    <ImportTemplateForm ref="formRef" @success="handleFormSuccess" />

    <!-- 预览弹窗 -->
    <TemplatePreviewDialog ref="previewRef" />

    <!-- 下载配置弹窗 -->
    <TemplateDownloadDialog ref="downloadRef" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { Download, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import {
  ImportTemplateApi,
  ImportTemplatePageReqVO,
  ImportTemplateRespVO,
  TABLE_TYPE_NAMES,
  TemplateStatisticsVO
} from '@/api/drug/task/template'
// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'
import ImportTemplateForm from './ImportTemplateForm.vue'
import TemplatePreviewDialog from './components/TemplatePreviewDialog.vue'
import TemplateDownloadDialog from './components/TemplateDownloadDialog.vue'

defineOptions({ name: 'ImportTemplate' })

const message = useMessage()
const { t } = useI18n()

// ========================= 响应式数据 =========================
const loading = ref(true)
const refreshing = ref(false)
const list = ref<ImportTemplateRespVO[]>([])
const total = ref(0)
const selectedIds = ref<number[]>([])
const exportLoading = ref(false)

const queryParams = reactive<ImportTemplatePageReqVO>({
  pageNo: 1,
  pageSize: 10,
  templateName: undefined,
  templateCode: undefined,
  tableType: undefined,
  status: undefined,
  isDefault: undefined
})

const queryFormRef = ref()

// 统计数据
const statistics = reactive<TemplateStatisticsVO>({
  totalCount: 0,
  activeCount: 0,
  defaultCount: 0,
  customCount: 0,
  totalDownloads: 0,
  mostUsedTemplate: {
    templateName: '',
    downloadCount: 0
  }
})

// ========================= 生命周期 =========================
onMounted(() => {
  getList()
  loadStatistics()
})

// ========================= 核心方法 =========================

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ImportTemplateApi.getImportTemplatePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 加载统计数据 */
const loadStatistics = async () => {
  try {
    const data = await ImportTemplateApi.getImportTemplateStatistics()
    Object.assign(statistics, data)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 刷新操作 */
const handleRefresh = async () => {
  refreshing.value = true
  try {
    await Promise.all([getList(), loadStatistics()])
    message.success('刷新成功')
  } finally {
    refreshing.value = false
  }
}

/** 表格选择变化 */
const handleSelectionChange = (selection: ImportTemplateRespVO[]) => {
  selectedIds.value = selection.map((item) => item.id)
}

/** 状态切换 */
const handleStatusChange = async (row: ImportTemplateRespVO) => {
  const action = row.status ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确认要${action}模板"${row.templateName}"吗？`, '系统提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await ImportTemplateApi.toggleImportTemplateStatus(row.id)
    message.success(`${action}成功`)
    await getList()
    await loadStatistics()
  } catch (error) {
    // 恢复状态
    row.status = !row.status
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 表单成功回调 */
const handleFormSuccess = () => {
  getList()
  loadStatistics()
}

/** 预览模板 */
const previewRef = ref()
const handlePreview = (id: number) => {
  previewRef.value.open(id)
}

/** 下载模板 */
const downloadRef = ref()
const handleDownload = (id: number) => {
  downloadRef.value.open(id)
}

/** 复制模板 */
const handleCopy = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认要复制该模板吗？', '系统提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    const newId = await ImportTemplateApi.copyImportTemplate(id)
    message.success('复制成功')
    await getList()
    await loadStatistics()

    // 可选：跳转到编辑页面
    openForm('update', newId)
  } catch (error) {
    if (error !== 'cancel') {
      message.error('复制失败')
    }
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ImportTemplateApi.deleteImportTemplate(id)
    message.success(t('common.delSuccess'))
    await getList()
    await loadStatistics()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await ImportTemplateApi.exportImportTemplateExcel(queryParams)
    download.excel(data, '导入模板列表.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

// ========================= 工具方法 =========================

/** 格式化数字 */
const formatNumber = (num: number | undefined): string => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toLocaleString()
}

/** 获取表类型名称 */
const getTableTypeName = (tableType: number): string => {
  return TABLE_TYPE_NAMES[tableType] || '未知'
}
</script>

<style scoped>
.template-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.stats-overview {
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.search-form {
  margin-bottom: 0;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 8px;
}

/* 表格内容样式 */
.template-info {
  text-align: left;
}

.template-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.template-name .default-icon {
  color: #f56c6c;
}

.template-code {
  font-size: 12px;
  color: #909399;
}

.field-badge {
  margin-right: 0;
}

.download-count {
  font-weight: 600;
  color: #67c23a;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.pagination-wrapper {
  display: flex;
  justify-content: end;
  margin-top: 20px;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .template-container {
    padding: 10px;
  }

  .search-form :deep(.el-form-item) {
    width: 100%;
    margin-right: 0;
  }

  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

/* 开关样式 */
:deep(.el-switch) {
  --el-switch-on-color: #67c23a;
  --el-switch-off-color: #dcdfe6;
}

/* 卡片样式 */
:deep(.el-card) {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

:deep(.el-card__header) {
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}
</style>
