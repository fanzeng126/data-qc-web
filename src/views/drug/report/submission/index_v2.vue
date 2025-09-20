<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <PageHeader
      :title="currentTask.taskName || '药品数据上报'"
      :dict-tag="{
        type: DICT_TYPE.REPORT_STATUS_TYPE,
        value: currentTask.status
      }"
      :content="currentTask.description"
      :meta="[
        {
          label: '上报期限',
          value: `${formatDate(currentTask.startDate)} 至 ${formatDate(currentTask.endDate)}`,
          icon: Calendar
        },
        {
          label: remainingDays > 0 ? '剩余天数' : '逾期天数',
          value: Math.abs(remainingDays) + '天',
          icon: Timer
        },
        {
          label: '机构',
          value: currentTask.hospitalName || '-',
          icon: Hospital
        }
      ]"
      :show-back-button="false"
    />

    <!-- 上报进度步骤条 -->
    <ContentWrap class="progress-card">
      <template #header>
        <el-button
          v-if="currentStep === 5 && currentTask.status === 3"
          type="success"
          size="small"
          @click="downloadReports"
        >
          <el-icon><Download /></el-icon>
          下载质控报告
        </el-button>
      </template>
      <el-steps :active="currentStep" align-center :process-status="getProcessStatus()">
        <el-step title="准备">
          <template #icon>
            <el-tooltip content="准备上报文件" placement="top">
              <el-icon><Document /></el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step title="上传文件">
          <template #icon>
            <el-tooltip content="上传数据文件" placement="top">
              <el-icon><Upload /></el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step title="前置质控">
          <template #icon>
            <el-tooltip content="数据格式验证" placement="top">
              <el-icon><CircleCheck /></el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step title="提交上报">
          <template #icon>
            <el-tooltip content="提交至管理端" placement="top">
              <el-icon><Promotion /></el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step title="后置质控">
          <template #icon>
            <el-tooltip content="管理端审核" placement="top">
              <el-icon><Stamp /></el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step title="上报完成">
          <template #icon>
            <el-tooltip content="上报成功" placement="top">
              <el-icon><Finished /></el-icon>
            </el-tooltip>
          </template>
        </el-step>
      </el-steps>
    </ContentWrap>

    <!-- 主要内容区域 -->
    <ContentWrap class="content-card" v-loading="loading">
      <!-- 步骤0: 准备阶段 -->
      <Step0Prepare
        v-if="currentStep === 0"
        :current-task="currentTask"
        :loading="loading"
        :table-definitions="tableDefinitions"
        :loading-templates="loadingTemplates"
        @preview-template="previewTemplate"
        @download-template="downloadTemplate"
        @start-upload="startUpload"
        @update:loading="loading = $event"
      />

      <!-- 步骤1: 上传文件 -->
      <Step1Upload
        v-if="currentStep === 1"
        :current-task="currentTask"
        :loading="loading"
        :file-list="fileList"
        :all-files-uploaded="allFilesUploaded"
        @file-change="handleFileChange"
        @view-file-data="viewFileData"
        @reupload-file="reuploadFile"
        @remove-file="removeFile"
        @start-pre-qc="startPreQC"
        @prev-step="currentStep = 0"
        @update:loading="loading = $event"
      />

      <!-- 步骤2: 前置质控 -->
      <Step2PreQC
        v-if="currentStep === 2"
        :current-task="currentTask"
        :loading="loading"
        :pre-qc-result="preQCResult"
        @view-qc-errors="viewQCErrors"
        @fix-and-reupload="fixAndReupload"
        @back-to-upload="backToUpload"
        @download-qc-report="downloadQCReport"
        @submit-report="submitReport"
        @update:loading="loading = $event"
      />

      <!-- 步骤3: 提交上报 -->
      <Step3Submit
        v-if="currentStep === 3"
        :current-task="currentTask"
        :loading="loading"
        :submit-info="submitInfo"
        @refresh-status="refreshStatus"
        @view-submit-log="viewSubmitLog"
        @update:loading="loading = $event"
      />

      <!-- 步骤4: 后置质控 -->
      <Step4PostQC
        v-if="currentStep === 4"
        :current-task="currentTask"
        :loading="loading"
        :post-qc-result="postQCResult"
        @download-error-data="downloadErrorData"
        @reupload-table="reuploadTable"
        @restart-process="restartProcess"
        @download-qc-report="downloadQCReport"
        @update:loading="loading = $event"
      />

      <!-- 步骤5: 上报完成 -->
      <Step5Complete
        v-if="currentStep === 5"
        :current-task="currentTask"
        :loading="loading"
        :complete-info="completeInfo"
        @download-reports="downloadReports"
        @download-original-files="downloadOriginalFiles"
        @view-report-history="viewReportHistory"
        @update:loading="loading = $event"
      />
    </ContentWrap>

    <!-- 数据查看对话框 -->
    <el-dialog
      v-model="dataViewDialog.visible"
      :title="`查看数据 - ${dataViewDialog.fileName}`"
      width="80%"
      top="5vh"
    >
      <el-table
        :data="dataViewDialog.data"
        stripe
        max-height="500"
        v-loading="dataViewDialog.loading"
      >
        <el-table-column
          v-for="column in dataViewDialog.columns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          show-overflow-tooltip
        />
      </el-table>
      <template #footer>
        <el-button @click="dataViewDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 错误详情对话框 -->
    <el-dialog
      v-model="errorDialog.visible"
      :title="`质控错误详情 - ${errorDialog.tableName}`"
      width="70%"
      top="10vh"
    >
      <el-table :data="errorDialog.errors" stripe max-height="400">
        <el-table-column prop="row" label="行号" width="80" />
        <el-table-column prop="column" label="列名" width="120" />
        <el-table-column prop="value" label="错误值" width="150" show-overflow-tooltip />
        <el-table-column prop="errorType" label="错误类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="danger">{{ row.errorType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="错误说明" min-width="200" show-overflow-tooltip />
        <el-table-column prop="suggestion" label="修复建议" min-width="200" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button @click="errorDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="exportErrors">导出错误清单</el-button>
      </template>
    </el-dialog>

    <!-- Excel预览弹窗 -->
    <ExcelPreviewDialog ref="excelPreviewRef" />
  </div>
</template>

<script setup lang="ts">
import request from '@/config/axios'
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import {
  Download,
  Upload,
  CircleCheck,
  Document,
  Promotion,
  Stamp,
  Finished,
  Calendar,
  Timer,
  OfficeBuilding as Hospital
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader/index.vue'
import { ContentWrap } from '@/components/ContentWrap'
import ExcelPreviewDialog from '@/views/drug/import/batch/components/ExcelPreviewDialog.vue'
import {
  ReportTaskApi,
  ReportFileApi,
  ReportQCApi,
  ReportSubmitApi,
  type ReportTaskCreateVO,
  type FileUploadVO,
  type QCResultVO,
  type PostQCResultVO
} from '@/api/drug/report'
import { ImportTemplateApi } from '@/api/drug/task/template'
import { TemplateFieldApi } from '@/api/drug/task/template'
import download from '@/utils/download'
import { DICT_TYPE } from '@/utils/dict'

// 导入步骤组件
import {
  Step0Prepare,
  Step1Upload,
  Step2PreQC,
  Step3Submit,
  Step4PostQC,
  Step5Complete,
  type CurrentTaskInfo,
  type FileInfo,
  type TableDefinition
} from './components'

// 定义组件名称
defineOptions({ name: 'DrugReportSubmission' })

// 消息弹窗
const message = useMessage()

// ==================== 数据定义 ====================

// 表定义数据
const tableDefinitions = ref<Record<string, TableDefinition>>({})
const loadingTemplates = ref(false)

// 组件引用
const excelPreviewRef = ref()

// 当前步骤
const currentStep = ref(0)
const loading = ref(false)

// 当前任务信息
const currentTask = ref<CurrentTaskInfo>({
  id: null,
  taskName: '',
  status: 1, // 1-未开始 2-进行中 3-已结束 4-已关闭
  startDate: '',
  endDate: '',
  hospitalId: null,
  hospitalName: '',
  description: ''
})

// 文件列表
const fileList = ref<FileInfo[]>([
  { id: 1, name: 'HospitalInfo.xlsx', type: 'hospital', status: 'pending', size: 0, recordCount: 0 },
  { id: 2, name: 'Catalog.xlsx', type: 'catalog', status: 'pending', size: 0, recordCount: 0 },
  { id: 3, name: 'Inbound.xlsx', type: 'inbound', status: 'pending', size: 0, recordCount: 0 },
  { id: 4, name: 'Outbound.xlsx', type: 'outbound', status: 'pending', size: 0, recordCount: 0 },
  { id: 5, name: 'Usage.xlsx', type: 'usage', status: 'pending', size: 0, recordCount: 0 }
])

// 前置质控结果
const preQCResult = ref({
  passed: false,
  details: []
})

// 后置质控结果
const postQCResult = ref({
  status: 'processing', // processing, passed, rejected
  progress: 60,
  estimatedTime: '约15分钟',
  rejectReason: '',
  rejectTime: '',
  reviewer: '',
  errorTables: []
})

// 提交信息
const submitInfo = ref({
  submitTime: new Date(),
  submitter: '张三',
  totalRecords: 12580
})

// 完成信息
const completeInfo = ref({
  completeTime: new Date(),
  batchNo: 'BATCH-2024-001',
  qualityScore: 4.5,
  reviewComment: '数据质量良好，符合上报要求'
})

// 数据查看对话框
const dataViewDialog = reactive({
  visible: false,
  loading: false,
  fileName: '',
  data: [],
  columns: []
})

// 错误详情对话框
const errorDialog = reactive({
  visible: false,
  tableName: '',
  errors: []
})

// ==================== 计算属性 ====================

// 计算剩余天数
const remainingDays = computed(() => {
  const end = new Date(currentTask.value.endDate)
  const now = new Date()
  const diff = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
})

// 所有文件是否已上传
const allFilesUploaded = computed(() => {
  return fileList.value.every(file => file.status === 'uploaded')
})

// ==================== 方法定义 ====================

// 获取步骤状态
const getProcessStatus = () => {
  if (postQCResult.value.status === 'rejected') return 'error'
  if (currentStep.value === 5) return 'success'
  return 'process'
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 格式化日期时间
const formatDateTime = (date: Date | string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 下载模板
const downloadTemplate = async () => {
  try {
    message.notify('正在生成标准模板压缩包...')
    const data = await ImportTemplateApi.downloadStandardTemplatesZip()
    download.zip(data, '标准导入模板.zip')
    message.notifySuccess('标准模板压缩包下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    message.notifyError('下载失败，请重试')
  }
}

// 预览模板
const previewTemplate = (templateId: number) => {
  excelPreviewRef.value?.open(templateId)
}

// 加载模板定义数据
const loadTemplateDefinitions = async () => {
  try {
    loadingTemplates.value = true
    const templates = await ImportTemplateApi.getImportTemplateListByTableType()

    const templatePromises = templates.map(async (template: any) => {
      try {
        const fields = await TemplateFieldApi.getTemplateFieldListByTemplateId(template.id)
        const requiredFields = fields.filter((field: any) => field.isRequired)

        return {
          id: template.id,
          fileName: template.templateName + '.xlsx',
          type: template.tableType,
          fieldCount: template.fieldCount || fields.length,
          downloadCount: template.downloadCount || 0,
          requiredFieldsCount: requiredFields.length,
          requiredFields: requiredFields.map((field: any) => field.fieldName),
          color: getTemplateColor(template.tableType)
        }
      } catch (error) {
        console.warn(`获取模板 ${template.id} 字段信息失败:`, error)
        return {
          id: template.id,
          fileName: template.templateCode + '.xlsx',
          type: template.tableType,
          fieldCount: template.fieldCount || 0,
          downloadCount: template.downloadCount || 0,
          requiredFieldsCount: 0,
          requiredFields: [],
          color: getTemplateColor(template.tableType)
        }
      }
    })

    const templateData = await Promise.all(templatePromises)
    const definitions: Record<string, TableDefinition> = {}
    templateData.forEach((template) => {
      definitions[template.id] = template
    })

    tableDefinitions.value = definitions
  } catch (error) {
    console.error('加载模板定义失败:', error)
    message.notifyError('加载模板信息失败，将使用默认配置')

    // 失败时使用默认配置
    tableDefinitions.value = {
      default: {
        id: 'default',
        fileName: '数据导入模板.xlsx',
        type: 'default',
        fieldCount: 10,
        downloadCount: 0,
        requiredFieldsCount: 5,
        requiredFields: ['必填字段1', '必填字段2', '必填字段3', '必填字段4', '必填字段5'],
        color: '#409eff'
      }
    }
  } finally {
    loadingTemplates.value = false
  }
}

// 获取模板颜色
const getTemplateColor = (tableType: string): string => {
  const colorMap: Record<string, string> = {
    'hospital': '#409eff',
    'catalog': '#67c23a',
    'inbound': '#e6a23c',
    'outbound': '#f56c6c',
    'usage': '#909399'
  }
  return colorMap[tableType] || '#409eff'
}

// 开始上传
const startUpload = async () => {
  try {
    loading.value = true

    if (currentTask.value.id) {
      currentStep.value = 1
      await updateReportProgress(1)
      message.notifySuccess('继续当前上报任务')
      return
    }

    message.notify('正在创建上报任务...')

    const createTaskData: ReportTaskCreateVO = {
      taskName: currentTask.value.taskName || '药品数据上报',
      hospitalId: currentTask.value.hospitalId,
      hospitalName: currentTask.value.hospitalName,
      description: currentTask.value.description || '药品数据上报任务',
      startDate: currentTask.value.startDate,
      endDate: currentTask.value.endDate,
      reportProgress: 0
    }

    const taskId = await ReportTaskApi.createReportTask(createTaskData)
    currentTask.value.id = taskId
    currentStep.value = 1
    await updateReportProgress(1)
    message.notifySuccess('上报任务创建成功，现在可以上传文件')

  } catch (error) {
    console.error('创建上报任务失败:', error)
    message.notifyError('创建上报任务失败，请重试')
  } finally {
    loading.value = false
  }
}

// 处理文件改变
const handleFileChange = async (uploadFile: any) => {
  const file = uploadFile.raw
  if (!file) return

  try {
    loading.value = true
    message.notify('正在上传文件...')

    const isZip = file.name.toLowerCase().endsWith('.zip')
    const formData = new FormData()
    formData.append('file', file)

    const params = {
      taskName: currentTask.value.taskName || '药品数据上报',
      hospitalId: currentTask.value.hospitalId,
      hospitalName: currentTask.value.hospitalName,
      description: currentTask.value.description || '药品数据上报任务',
      startDate: currentTask.value.startDate,
      endDate: currentTask.value.endDate
    }
    formData.append('params', JSON.stringify(params))

    const response = await request.post({
      url: '/drug/import-task/validate-and-parse',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response && response.taskId) {
      currentTask.value.id = response.taskId
      message.notifySuccess(isZip ? '压缩包上传成功，正在解析文件...' : '文件上传成功')
      await loadFileList(response.taskId)

      // 更新文件状态
      if (isZip) {
        fileList.value = fileList.value.map(f => ({
          ...f,
          status: 'uploaded' as const,
          size: f.size || Math.floor(Math.random() * 1024000),
          recordCount: f.recordCount || Math.floor(Math.random() * 1000)
        }))
      }
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    message.notifyError('文件上传失败，请重试')
  } finally {
    loading.value = false
  }
}

// 其他方法...
const viewFileData = async (file: FileInfo) => {
  dataViewDialog.loading = true
  dataViewDialog.fileName = file.name
  dataViewDialog.visible = true

  try {
    const result = await ReportFileApi.getFileData(file.id, 1, 100)
    if (result.data && result.data.length > 0) {
      const firstRow = result.data[0]
      dataViewDialog.columns = Object.keys(firstRow).map(key => ({
        prop: key,
        label: key,
        width: key.length > 10 ? 200 : 120
      }))
      dataViewDialog.data = result.data
    } else {
      dataViewDialog.columns = []
      dataViewDialog.data = []
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    message.notifyError('加载数据失败')
  } finally {
    dataViewDialog.loading = false
  }
}

const reuploadFile = (file: FileInfo) => {
  message.notify(`重新上传 ${file.name}`)
}

const removeFile = (file: FileInfo) => {
  message.confirm(`确定删除文件 ${file.name}？`).then(() => {
    const targetFile = fileList.value.find(f => f.id === file.id)
    if (targetFile) {
      targetFile.status = 'pending'
      targetFile.size = 0
      targetFile.recordCount = 0
    }
    message.notifySuccess('文件已删除')
  }).catch(() => {})
}

const updateReportProgress = async (progress: number) => {
  if (!currentTask.value.id) {
    console.warn('任务ID不存在，无法更新上报进度')
    return
  }

  try {
    await ReportTaskApi.updateReportProgress(currentTask.value.id, progress)
    console.log('上报进度更新成功:', progress)
  } catch (error) {
    console.error('更新上报进度失败:', error)
  }
}

const startPreQC = async () => {
  if (!currentTask.value.id) {
    message.notifyError('任务ID不存在')
    return
  }

  loading.value = true
  message.notify('正在进行前置质控...')

  try {
    const result = await ReportQCApi.executePreQC(currentTask.value.id)
    preQCResult.value = result
    currentStep.value = 2
    await updateReportProgress(2)

    const hasErrors = result.details.some(d => !d.passed)
    if (hasErrors) {
      message.notifyWarning('前置质控发现问题，请查看质控报告并修正错误')
    } else {
      message.notifySuccess('前置质控通过，所有检查项均已通过，可以提交上报')
    }
  } catch (error) {
    console.error('前置质控失败:', error)
    message.notifyError('前置质控失败，请重试')
  } finally {
    loading.value = false
  }
}

const viewQCErrors = async (row: any) => {
  if (!currentTask.value.id) return

  errorDialog.tableName = row.tableName
  errorDialog.visible = true

  try {
    const errors = await ReportQCApi.getQCErrors(currentTask.value.id, row.tableName)
    errorDialog.errors = errors
  } catch (error) {
    console.error('获取错误详情失败:', error)
    message.notifyError('获取错误详情失败')
    errorDialog.errors = []
  }
}

const fixAndReupload = (row: any) => {
  message.notify(`请修正 ${row.tableName} 的错误后重新上传`)
  currentStep.value = 1
}

const backToUpload = async () => {
  currentStep.value = 1
  await updateReportProgress(1)
}

const downloadQCReport = async (type: 'pre' | 'post') => {
  if (!currentTask.value.id) return

  try {
    await ReportQCApi.downloadQCReport(currentTask.value.id, type)
    message.notifySuccess(`${type === 'pre' ? '前置' : '后置'}质控报告下载成功`)
  } catch (error) {
    console.error('下载质控报告失败:', error)
    message.notifyError('下载质控报告失败')
  }
}

const submitReport = async () => {
  if (!currentTask.value.id) return

  try {
    await message.confirm('确认提交上报？提交后将进入管理端审核流程')

    loading.value = true
    await ReportSubmitApi.submitReport(currentTask.value.id)
    currentStep.value = 3
    await updateReportProgress(3)
    message.notifySuccess('数据已成功提交上报')
    startStatusPolling()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('提交上报失败:', error)
      message.notifyError('提交上报失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

const refreshStatus = async () => {
  if (!currentTask.value.id) return

  try {
    const result = await ReportSubmitApi.refreshStatus(currentTask.value.id)
    if (result) {
      currentTask.value = { ...currentTask.value, ...result }
      if (result.currentStep !== currentStep.value) {
        currentStep.value = result.currentStep
        await loadQCResults(result.id)

        if (result.status === 3 || result.status === 4) {
          stopStatusPolling()
          if (result.status === 3) {
            message.notifySuccess('上报完成，您的数据已通过所有质控检查')
          } else {
            message.notifyError('数据被退回，请根据审核意见修正后重新上报')
          }
        }
      }
    }
  } catch (error) {
    console.error('刷新状态失败:', error)
  }
}

const viewSubmitLog = () => {
  message.notify('查看提交日志功能开发中')
}

const downloadErrorData = async (row: any) => {
  if (!currentTask.value.id) return

  try {
    await ReportQCApi.downloadErrorData(currentTask.value.id, row.tableName)
    message.notifySuccess(`${row.tableName} 错误数据下载成功`)
  } catch (error) {
    console.error('下载错误数据失败:', error)
    message.notifyError('下载错误数据失败')
  }
}

const reuploadTable = (row: any) => {
  message.notify(`重新上传 ${row.tableName}`)
  currentStep.value = 1
}

const restartProcess = () => {
  message.confirm('确认重新开始上报流程？之前的数据将被清空').then(() => {
    currentStep.value = 0
    fileList.value.forEach(f => {
      f.status = 'pending'
      f.size = 0
      f.recordCount = 0
    })
    preQCResult.value = { passed: false, details: [] }
    postQCResult.value = {
      status: 'processing',
      progress: 0,
      estimatedTime: '',
      rejectReason: '',
      rejectTime: '',
      reviewer: '',
      errorTables: []
    }
    currentTask.value.status = 2
    message.notifySuccess('已重新开始上报流程')
  }).catch(() => {})
}

const downloadReports = async () => {
  if (!currentTask.value.id) return

  try {
    await Promise.all([
      ReportQCApi.downloadQCReport(currentTask.value.id, 'pre'),
      ReportQCApi.downloadQCReport(currentTask.value.id, 'post')
    ])
    message.notifySuccess('质控报告下载成功')
  } catch (error) {
    console.error('下载质控报告失败:', error)
    message.notifyError('下载质控报告失败')
  }
}

const downloadOriginalFiles = async () => {
  if (!currentTask.value.id) return

  try {
    await ReportFileApi.downloadOriginalFiles(currentTask.value.id)
    message.notifySuccess('原始文件下载成功')
  } catch (error) {
    console.error('下载原始文件失败:', error)
    message.notifyError('下载原始文件失败')
  }
}

const viewReportHistory = () => {
  message.notify('查看历史记录功能开发中')
}

const exportErrors = async () => {
  if (!currentTask.value.id || !errorDialog.tableName) return

  try {
    await ReportQCApi.exportErrors(currentTask.value.id, errorDialog.tableName)
    message.notifySuccess('错误清单导出成功')
  } catch (error) {
    console.error('导出错误清单失败:', error)
    message.notifyError('导出错误清单失败')
  }
}

// ==================== 生命周期 ====================

let statusTimer: any = null

onMounted(async () => {
  await loadTemplateDefinitions()
  await loadCurrentTask()

  if (currentTask.value.status === 2 && currentStep.value >= 3) {
    startStatusPolling()
  }
})

onUnmounted(() => {
  if (statusTimer) {
    clearInterval(statusTimer)
  }
})

// ==================== 数据加载方法 ====================

const loadCurrentTask = async () => {
  try {
    loading.value = true
    const task = await ReportTaskApi.getCurrentTask()

    if (task) {
      currentTask.value = task
      currentStep.value = task.currentStep || 0

      if (task.id) {
        if (currentStep.value >= 1) {
          await loadFileList(task.id)
        }
        if (currentStep.value >= 2) {
          await loadQCResults(task.id)
        }
        if (currentStep.value >= 3) {
          submitInfo.value = {
            submitTime: task.submitTime || new Date(),
            submitter: '当前用户',
            totalRecords: 0
          }
        }
        if (currentStep.value === 5) {
          completeInfo.value = {
            completeTime: task.completeTime || new Date(),
            batchNo: `BATCH-${task.id}`,
            qualityScore: 4.5,
            reviewComment: ''
          }
        }
      }
    } else {
      message.warning('当前没有激活的上报任务，请联系管理员')
    }
  } catch (error) {
    console.error('加载任务信息失败:', error)
    message.notifyError('加载任务信息失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

const loadFileList = async (taskId: number) => {
  try {
    try {
      const taskDetail = await request.get({
        url: `/drug/import-task/task-detail/${taskId}`
      })

      if (taskDetail && taskDetail.tableDetails && taskDetail.tableDetails.length > 0) {
        const typeMapping = {
          'HOSPITAL': 'hospital',
          'CATALOG': 'catalog',
          'INBOUND': 'inbound',
          'OUTBOUND': 'outbound',
          'USAGE': 'usage'
        }

        taskDetail.tableDetails.forEach((detail: any) => {
          const fileType = typeMapping[detail.fileType] || detail.fileType.toLowerCase()
          const localFile = fileList.value.find(f => f.type === fileType)

          if (localFile) {
            localFile.name = detail.fileName || localFile.name
            localFile.status = detail.parseStatus === 2 ? 'uploaded' : 'pending'
            localFile.size = detail.fileSize || 0
            localFile.recordCount = detail.totalRows || 0
            localFile.errorCount = detail.failedRows || 0
          }
        })
        return
      }
    } catch (e) {
      console.log('从新API获取任务详情失败，尝试使用旧API')
    }

    const files = await ReportFileApi.getFileList(taskId)
    fileList.value = fileList.value.map(localFile => {
      const serverFile = files.find((f: any) => f.fileType === localFile.type)
      if (serverFile) {
        return {
          ...localFile,
          status: serverFile.status,
          size: serverFile.size,
          recordCount: serverFile.recordCount
        }
      }
      return localFile
    })
  } catch (error) {
    console.error('加载文件列表失败:', error)
  }
}

const loadQCResults = async (taskId: number) => {
  try {
    if (currentStep.value >= 2) {
      const preQC = await ReportQCApi.getPreQCResult(taskId)
      preQCResult.value = preQC
    }

    if (currentStep.value >= 4) {
      const postQC = await ReportQCApi.getPostQCResult(taskId)
      postQCResult.value = postQC
    }
  } catch (error) {
    console.error('加载质控结果失败:', error)
  }
}

const startStatusPolling = () => {
  statusTimer = setInterval(async () => {
    if (currentTask.value.id) {
      await refreshStatus()
    }
  }, 5000)
}

const stopStatusPolling = () => {
  if (statusTimer) {
    clearInterval(statusTimer)
    statusTimer = null
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.content-card {
  min-height: 400px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.el-descriptions) {
    .el-descriptions__body {
      display: block;
    }
    .el-descriptions__item {
      display: block;
      width: 100% !important;
    }
  }
}
</style>