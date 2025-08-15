<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <PageHeader
      title="机构标准库管理"
      :content="pageHeaderContent"
      :tag="currentVersion ? `版本: ${currentVersion.versionCode}` : undefined"
      :tag-type="currentVersion ? getVersionStatusType(currentVersion.status) : 'info'"
      :meta="versionMeta"
    >
      <!-- 版本选择器和操作按钮 -->
      <template #extra>
        <div class="version-management">
          <!-- 头部操作按钮 -->
          <div class="header-actions-section">
            <el-button
              type="primary"
              @click="openImportDialog"
            >
              <Icon icon="ep:upload" class="mr-5px" />
              导入标准库
            </el-button>
            <el-button @click="downloadTemplate">
              <Icon icon="ep:download" class="mr-5px" />
              下载模板
            </el-button>
          </div>

          <!-- 版本选择器 -->
          <div class="version-selector">
            <label>当前版本：</label>
            <el-select
              v-model="currentVersionId"
              placeholder="请选择版本"
              @change="handleVersionChange"
              style="width: 280px"
            >
              <el-option
                v-for="version in versionList"
                :key="version.id"
                :label="`${version.versionCode} - ${version.versionName}`"
                :value="version.id"
              >
                <div class="version-option">
                  <span>{{ version.versionCode }} - {{ version.versionName }}</span>
                  <el-tag :type="getVersionStatusType(version.status)" size="small" class="ml-2">
                    {{ getVersionStatusText(version.status) }}
                  </el-tag>
                </div>
              </el-option>
            </el-select>
          </div>

          <!-- 版本操作按钮 -->
          <div class="version-actions" v-if="currentVersion">
            <el-button
              v-if="currentVersion.status !== 4"
              type="success"
              size="small"
              @click="publishVersion"
            >
              发布版本
            </el-button>
            <el-button
              v-if="currentVersion.status !== 4"
              size="small"
              @click="importToCurrentVersion"
            >
              继续导入
            </el-button>
          </div>
        </div>
      </template>
    </PageHeader>

    <!-- 数据查询区域 -->
    <ContentWrap>
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="100px"
      >
        <el-form-item label="机构ID" prop="institutionId">
          <el-input
            v-model="queryParams.institutionId"
            placeholder="请输入医疗机构ID"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="机构名称" prop="institutionName">
          <el-input
            v-model="queryParams.institutionName"
            placeholder="请输入机构名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="机构类别" prop="institutionCategory">
          <el-select
            v-model="queryParams.institutionCategory"
            placeholder="请选择机构类别"
            clearable
            class="!w-240px"
          >
            <el-option
              v-for="category in institutionCategoryList"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="行政区划" prop="adminDivisionCode">
          <el-input
            v-model="queryParams.adminDivisionCode"
            placeholder="请输入行政区划代码"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            class="!w-240px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
          <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
          <el-button
            type="primary"
            @click="openForm('create')"
            v-hasPermi="['drug:institution-standard:create']"
          >
            <Icon icon="ep:plus" class="mr-5px" /> 新增
          </el-button>
          <el-button
            type="success"
            @click="handleExport"
            :loading="exportLoading"
            v-hasPermi="['drug:institution-standard:export']"
          >
            <Icon icon="ep:download" class="mr-5px" /> 导出
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 数据列表 -->
    <ContentWrap>
      <!-- 导入进度条 -->
      <div v-if="isImporting" class="import-progress-container mb-4">
        <div class="progress-header">
          <div class="progress-info">
            <span class="progress-title">{{
              importProgressInfo.currentMessage || '正在导入数据...'
            }}</span>
            <div class="progress-meta">
              <span v-if="currentVersion?.importType" class="meta-item">
                <Icon icon="ep:upload" class="mr-1" />
                {{ currentVersion.importType === 1 ? '全量导入' : '增量导入' }}
              </span>
              <span v-if="currentVersion?.totalRecords" class="meta-item">
                <Icon icon="ep:collection-tag" class="mr-1" />
                共{{ formatNumber(currentVersion.totalRecords) }}条记录
              </span>
              <span v-if="currentVersion?.importStartTime" class="meta-item">
                <Icon icon="ep:clock" class="mr-1" />
                {{ formatDateTime(currentVersion.importStartTime) }}
              </span>
            </div>
          </div>
          <span class="progress-percentage">{{ importProgressInfo.overallProgress || 0 }}%</span>
        </div>
        <el-progress
          :percentage="importProgressInfo.overallProgress || 0"
          :status="getProgressStatus(importProgressInfo.overallStatus)"
          :stroke-width="8"
        />
        <div class="progress-details" v-if="importProgressInfo.totalRecords">
          已处理 {{ importProgressInfo.successRecords || 0 }} /
          {{ importProgressInfo.totalRecords }} 条记录
          <span v-if="importProgressInfo.currentStage" class="ml-4">
            当前阶段：{{ importProgressInfo.currentStage }}
          </span>
        </div>
      </div>

      <el-table
        v-loading="loading && !isImporting"
        :data="list"
        :stripe="true"
        :show-overflow-tooltip="true"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="机构唯一编码" prop="orgId" width="120" fixed="left" />
        <el-table-column label="机构名称" prop="institutionName" width="200" show-overflow-tooltip />
        <el-table-column label="机构类别" prop="institutionCategoryName" width="150" show-overflow-tooltip>
        <template #default="scope">
          {{ getDictLabel(DICT_TYPE.INSTITUTION_CATEGORY, scope.row.institutionCategoryName) || scope.row.institutionCategoryName }}
        </template>
        </el-table-column>
        <el-table-column label="行政区划代码" prop="adminDivisionCode" width="120" />
        <el-table-column label="行政区划名称" prop="adminDivisionName" width="150" show-overflow-tooltip />
        <el-table-column label="负责人" prop="director" width="100" />
        <el-table-column label="联系人" prop="contactPerson" width="100" />
        <el-table-column label="联系电话" prop="contactPhone" width="130" />
        <el-table-column label="机构代码" prop="institutionCode" width="120" />
        <el-table-column label="统一社会信用代码" prop="socialCreditCode" width="160" show-overflow-tooltip />
        <el-table-column label="医院等级(等)" prop="hospitalLevelGrade" width="100" />
        <el-table-column label="医院等级(级)" prop="hospitalLevelClass" width="110">
          <template #default="scope">
            {{ getDictLabel(DICT_TYPE.INSTITUTION_LEVEL, scope.row.hospitalLevelClass) || scope.row.hospitalLevelClass }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small">
              {{ scope.row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          prop="createTime"
          :formatter="dateFormatter"
          width="180px"
        />
        <el-table-column label="操作" align="center" width="150" fixed="right">
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['drug:institution-standard:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['drug:institution-standard:delete']"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </ContentWrap>

    <!-- 导入对话框 -->
    <ImportDialog ref="importDialogRef" @success="handleImportSuccess" />

    <!-- 表单弹窗：添加/修改 -->
    <InstitutionStandardForm ref="formRef" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import dayjs from 'dayjs'
import { InstitutionStandardApi, InstitutionStandardVO } from '@/api/drug/standardlibrary/institution'
import { InstitutionVersionApi, StandardVersionVO } from '@/api/drug/standardlibrary/version'
import InstitutionStandardForm from './InstitutionStandardForm.vue'
import ImportDialog from './ImportDialog.vue'
import PageHeader from '@/components/PageHeader/index.vue'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'

defineOptions({ name: 'InstitutionStandardIndex' })

const message = useMessage()
const { t } = useI18n()

// 数据状态
const loading = ref(true)
const list = ref<InstitutionStandardVO[]>([])
const total = ref(0)
const exportLoading = ref(false)
const selectedRows = ref<InstitutionStandardVO[]>([])
const institutionCategoryList = ref<string[]>([])

// 导入进度相关
const isImporting = ref(false)
const importProgressInfo = ref<any>({})
const progressTimer = ref<NodeJS.Timeout | null>(null)

// 版本相关
const versionList = ref<StandardVersionVO[]>([])
const currentVersionId = ref<number>()
const currentVersion = ref<StandardVersionVO>()

// PageHeader相关数据
const pageHeaderContent = computed(() => {
  const baseContent = '管理和维护医疗机构标准库数据，包括版本管理、数据导入和质量控制'
  if (currentVersion.value?.versionDescription) {
    return `${baseContent} | ${currentVersion.value.versionDescription}`
  }
  return baseContent
})

const versionMeta = computed(() => {
  if (!currentVersion.value) return []
  const meta = [
    {
      label: '总记录数',
      value: formatNumber(currentVersion.value.totalRecords),
      icon: 'ep:collection-tag'
    },
    {
      label: '新增记录',
      value: formatNumber(currentVersion.value.newRecords),
      icon: 'ep:plus'
    },
    {
      label: '更新记录',
      value: formatNumber(currentVersion.value.updatedRecords),
      icon: 'ep:edit'
    },
    {
      label: '创建时间',
      value: formatDateTime(currentVersion.value.createTime),
      icon: 'ep:calendar'
    }
  ]

  // 如果已发布，显示发布时间
  if (currentVersion.value.publishTime) {
    meta.push({
      label: '发布时间',
      value: formatDateTime(currentVersion.value.publishTime),
      icon: 'ep:check'
    })
  }

  return meta
})

// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  versionId: undefined,
  institutionId: undefined,
  institutionName: undefined,
  institutionCategory: undefined,
  adminDivisionCode: undefined,
  status: undefined
})

const queryFormRef = ref()
const formRef = ref()
const importDialogRef = ref()

/** 初始化 */
onMounted(async () => {
  await loadVersionList()
  if (versionList.value.length > 0) {
    // 默认选择已发布的版本，如果没有则选择第一个
    const publishedVersion = versionList.value.find((v) => v.status === 4)
    currentVersionId.value = publishedVersion?.id || versionList.value[0].id
    await handleVersionChange(currentVersionId.value)
  } else {
    // 如果没有版本，也加载机构类别列表
    await loadInstitutionCategories()
  }
})

/** 加载版本列表 */
const loadVersionList = async () => {
  try {
    versionList.value = await InstitutionVersionApi.getInstitutionVersionList()
  } catch (error) {
    console.error('加载版本列表失败:', error)
  }
}

/** 版本切换 */
const handleVersionChange = async (versionId: number) => {
  if (!versionId) return

  try {
    // 获取版本详情
    currentVersion.value = await InstitutionVersionApi.getInstitutionVersion(versionId)

    // 更新查询参数
    queryParams.versionId = versionId

    // 加载机构类别列表
    await loadInstitutionCategories(versionId)

    // 刷新数据列表
    await getList()

    // 如果版本正在导入中，开始轮询进度
    if (currentVersion.value?.status === 1 && !isImporting.value) {
      startProgressPolling(versionId)
    }
  } catch (error) {
    console.error('获取版本详情失败:', error)
  }
}

/** 加载机构类别列表 */
const loadInstitutionCategories = async (versionId?: number) => {
  try {
    institutionCategoryList.value = await InstitutionStandardApi.getInstitutionCategories(versionId)
  } catch (error) {
    console.error('加载机构类别列表失败:', error)
  }
}

/** 开始进度轮询 */
const startProgressPolling = (versionId: number) => {
  isImporting.value = true
  importProgressInfo.value = { overallProgress: 5, currentMessage: '开始导入...' }

  progressTimer.value = setInterval(async () => {
    try {
      const progress = await InstitutionVersionApi.getImportProgress(versionId.toString())
      importProgressInfo.value = progress

      // 如果完成或失败，停止轮询
      if (progress.overallStatus === 2 || progress.overallStatus === 3) {
        stopProgressPolling()
        
        if (progress.overallStatus === 2) {
          message.success('数据导入完成')
        } else {
          message.error('数据导入失败: ' + progress.errorMessage)
        }
        
        // 刷新数据
        await handleVersionChange(versionId)
        return // 确保不再执行后续代码
      }
    } catch (error) {
      console.error('查询进度失败:', error)
    }
  }, 1000)
}

/** 停止进度轮询 */
const stopProgressPolling = () => {
  if (progressTimer.value) {
    clearInterval(progressTimer.value)
    progressTimer.value = null
  }
  isImporting.value = false
}

/** 获取进度状态 */
const getProgressStatus = (status: number) => {
  switch (status) {
    case 2:
      return 'success'
    case 3:
      return 'exception'
    default:
      return undefined
  }
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await InstitutionStandardApi.getInstitutionStandardPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
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
  queryParams.versionId = currentVersionId.value
  handleQuery()
}

/** 多选 */
const handleSelectionChange = (selection: InstitutionStandardVO[]) => {
  selectedRows.value = selection
}

/** 新增/修改操作 */
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id, currentVersionId.value)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await InstitutionStandardApi.deleteInstitutionStandard(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await InstitutionStandardApi.exportInstitutionStandard(queryParams)
    download.excel(data, `机构标准库_${currentVersion.value?.versionCode}.xls`)
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 打开导入对话框 */
const openImportDialog = () => {
  importDialogRef.value.open()
}

/** 导入成功回调 */
const handleImportSuccess = async (result: StandardVersionVO) => {
  await loadVersionList()

  // 如果是新创建的版本，切换到该版本
  if (result && result.id) {
    currentVersionId.value = result.id
    await handleVersionChange(result.id)

    // 开始轮询进度
    startProgressPolling(result.id)
  } else {
    await getList()
  }
}

/** 继续导入到当前版本 */
const importToCurrentVersion = () => {
  importDialogRef.value.openForVersion(currentVersionId.value)
}

/** 发布版本 */
const publishVersion = async () => {
  try {
    await message.confirm('确认发布此版本？发布后将成为当前有效版本。')
    await InstitutionVersionApi.publishVersion(currentVersionId.value!)
    message.success('版本发布成功')
    await loadVersionList()
    await handleVersionChange(currentVersionId.value!)
  } catch {}
}

/** 下载模板 */
const downloadTemplate = async () => {
  try {
    const data = await InstitutionVersionApi.getImportTemplate()
    download.excel(data, '机构标准库导入模板.xls')
  } catch {
    message.error('下载模板失败')
  }
}

/** 工具方法 */
const getVersionStatusType = (status: number) => {
  const statusMap = {
    1: 'warning', // 导入中
    2: 'success', // 导入成功
    3: 'danger', // 导入失败
    4: 'primary', // 已发布
    5: 'info' // 已停用
  }
  return statusMap[status] || 'info'
}

const getVersionStatusText = (status: number) => {
  const statusMap = {
    1: '导入中',
    2: '导入成功',
    3: '导入失败',
    4: '已发布',
    5: '已停用'
  }
  return statusMap[status] || '未知'
}

const formatNumber = (num: number) => {
  return num ? num.toLocaleString() : 0
}

const formatDateTime = (dateTime: string | Date) => {
  if (!dateTime) return '-'
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss')
}

// 页面卸载时清理定时器
onUnmounted(() => {
  stopProgressPolling()
})
</script>

<style scoped>
.import-progress-container {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.progress-info {
  flex: 1;
}

.progress-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.progress-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.meta-item {
  display: inline-flex;
  align-items: center;
}

.progress-percentage {
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
  flex-shrink: 0;
}

.progress-details {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

.version-management {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.header-actions-section {
  display: flex;
  gap: 8px;
  align-items: center;
}

.version-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-selector label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.version-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.version-actions {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .version-management {
    align-items: stretch;
  }

  .header-actions-section {
    width: 100%;
    justify-content: space-between;
  }

  .version-selector {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }

  .version-selector label {
    text-align: left;
  }

  .version-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
