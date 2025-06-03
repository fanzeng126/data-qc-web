import request from '@/config/axios'

// ========================= 类型定义 =========================

/** 批量导入任务创建参数 */
export interface ImportTaskCreateParams {
  taskName: string
  description?: string
}

/** 批量导入任务创建结果 */
export interface ImportTaskCreateResult {
  taskId: number
  taskNo: string
  message: string
}

/** 导入进度信息 */
export interface ImportProgressVO {
  taskId: number
  taskNo: string
  taskName: string
  overallStatus: number
  overallProgress: number
  currentMessage: string
  currentStage: string
  estimatedRemainingTime?: number
  startTime?: string
  estimatedEndTime?: string
  totalFiles: number
  successFiles: number
  failedFiles: number
  totalRecords: number
  successRecords: number
  failedRecords: number
  tableProgress: TableProgressVO[]
  canRetry: boolean
}

/** 表级进度信息 */
export interface TableProgressVO {
  tableType: number
  tableName: string
  fileName?: string
  status: number
  statusDisplay: string
  currentStage: string
  progress: number
  currentMessage: string
  totalRecords: number
  successRecords: number
  failedRecords: number
  qcPassedRows?: number
  qcFailedRows?: number
  startTime?: string
  endTime?: string
  errorMessage?: string
}

/** 任务重试参数 */
export interface ImportRetryReqVO {
  taskId: number
  retryType: 'ALL' | 'FAILED' | 'FILE_TYPE'
  fileType?: string
  reason?: string
}

/** 任务重试结果 */
export interface ImportRetryResult {
  taskId: number
  taskNo: string
  success: boolean
  message: string
  retryType: string
  retryScope: string[]
  retryStartTime: string
  retryBatchNo: string
}

/** 任务详情 */
export interface ImportTaskDetailVO {
  id: number
  taskNo: string
  taskName: string
  importType: number
  fileName: string
  filePath: string
  fileSize: number
  extractedFiles?: any
  status: number
  statusDisplay: string
  extractStatus: number
  importStatus: number
  qcStatus: number
  totalFiles: number
  successFiles: number
  failedFiles: number
  totalRecords: number
  successRecords: number
  failedRecords: number
  progressPercent: number
  tableProgress?: any
  startTime?: string
  extractEndTime?: string
  importEndTime?: string
  qcEndTime?: string
  endTime?: string
  errorMessage?: string
  errorDetail?: any
  createTime: string
  updateTime: string
  creator: string
  canRetry: boolean
  taskDetails: ImportTaskDetailItemVO[]
}

/** 任务明细项 */
export interface ImportTaskDetailItemVO {
  id: number
  taskId: number
  fileType: string
  fileName: string
  targetTable: string
  tableType: number
  tableName: string
  status: number
  statusDisplay: string
  parseStatus: number
  importStatus: number
  qcStatus: number
  totalRows: number
  validRows: number
  successRows: number
  failedRows: number
  qcPassedRows: number
  qcFailedRows: number
  progressPercent: number
  startTime?: string
  endTime?: string
  errorMessage?: string
  retryCount: number
  maxRetryCount: number
}

/** 任务列表响应 */
export interface ImportTaskRespVO {
  id: number
  taskNo: string
  taskName: string
  fileName: string
  fileSize: number
  status: number
  statusDisplay: string
  totalFiles: number
  successFiles: number
  failedFiles: number
  totalRecords: number
  successRecords: number
  failedRecords: number
  progressPercent: number
  startTime?: string
  endTime?: string
  duration?: number
  creator: string
  createTime: string
  canRetry: boolean
  canCancel: boolean
}

/** 任务列表查询参数 */
export interface ImportTaskPageReqVO {
  pageNo: number
  pageSize: number
  taskNo?: string
  taskName?: string
  status?: number
  fileName?: string
  creator?: string
  createTime?: string[]
  startTime?: string[]
  endTime?: string[]
}

/** 文件验证结果 */
export interface FileValidationResult {
  valid: boolean
  fileName: string
  fileSize: number
  expectedFileCount: number
  actualFileCount: number
  validationMessage: string
  missingFiles?: string[]
  extraFiles?: string[]
  invalidFiles?: string[]
}

/** 导入统计信息 */
export interface ImportStatisticsVO {
  totalTasks: number
  successTasks: number
  failedTasks: number
  partialSuccessTasks: number
  runningTasks: number
  successRate: number
  averageProcessingTime: number
  totalRecordsProcessed: number
  todayTasks: number
  yesterdayTasks: number
  taskGrowthRate: number
}

// ========================= API方法 =========================

/** 药品数据批量导入API */
export const DrugBatchImportApi = {

  /**
   * 创建批量导入任务
   * @param file 压缩包文件
   * @param params 任务参数
   */
  createImportTask: async (file: File, params: ImportTaskCreateParams): Promise<ImportTaskCreateResult> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskName', params.taskName)
    if (params.description) {
      formData.append('description', params.description)
    }

    return await request.post({
      url: '/drug/batch-import/create-task',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * 获取任务详细信息
   * @param taskId 任务ID
   */
  getTaskDetail: async (taskId: number): Promise<ImportTaskDetailVO> => {
    return await request.get({
      url: `/drug/batch-import/task-detail/${taskId}`
    })
  },

  /**
   * 获取任务实时进度
   * @param taskId 任务ID
   */
  getTaskProgress: async (taskId: number): Promise<ImportProgressVO> => {
    return await request.get({
      url: `/drug/batch-import/task-progress/${taskId}`
    })
  },

  /**
   * 重试失败任务
   * @param params 重试参数
   */
  retryImportTask: async (params: ImportRetryReqVO): Promise<ImportRetryResult> => {
    return await request.post({
      url: '/drug/batch-import/retry-task',
      data: params
    })
  },

  /**
   * 取消正在进行的任务
   * @param taskId 任务ID
   */
  cancelTask: async (taskId: number): Promise<boolean> => {
    return await request.post({
      url: `/drug/batch-import/cancel-task/${taskId}`
    })
  },

  /**
   * 分页查询导入任务列表
   * @param params 查询参数
   */
  getTaskPage: async (params: ImportTaskPageReqVO) => {
    return await request.get({
      url: '/drug/batch-import/task-page',
      params
    })
  },

  /**
   * 验证导入文件
   * @param file 待验证文件
   */
  validateImportFile: async (file: File): Promise<FileValidationResult> => {
    const formData = new FormData()
    formData.append('file', file)

    return await request.post({
      url: '/drug/batch-import/validate-file',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * 获取导入统计信息
   * @param startDate 开始日期
   * @param endDate 结束日期
   */
  getImportStatistics: async (startDate?: string, endDate?: string): Promise<ImportStatisticsVO> => {
    return await request.get({
      url: '/drug/batch-import/statistics',
      params: { startDate, endDate }
    })
  },

  /**
   * 下载导入模板
   * @param templateType 模板类型
   */
  downloadTemplate: async (templateType: string = 'STANDARD') => {
    return await request.download({
      url: '/drug/batch-import/download-template',
      params: { templateType }
    })
  },

  /**
   * 导出任务列表
   * @param params 查询参数
   */
  exportTaskList: async (params: ImportTaskPageReqVO) => {
    return await request.download({
      url: '/drug/batch-import/export-tasks',
      params
    })
  }
}

// ========================= 常量定义 =========================

/** 任务状态枚举 */
export const TASK_STATUS = {
  PENDING: 0,       // 待处理
  EXTRACTING: 1,    // 解压中
  IMPORTING: 2,     // 导入中
  QC_CHECKING: 3,   // 质控中
  COMPLETED: 4,     // 完成
  FAILED: 5,        // 失败
  PARTIAL_SUCCESS: 6, // 部分成功
  CANCELLED: 7      // 已取消
} as const

/** 任务状态显示文本 */
export const TASK_STATUS_TEXT = {
  [TASK_STATUS.PENDING]: '待处理',
  [TASK_STATUS.EXTRACTING]: '解压中',
  [TASK_STATUS.IMPORTING]: '导入中',
  [TASK_STATUS.QC_CHECKING]: '质控中',
  [TASK_STATUS.COMPLETED]: '已完成',
  [TASK_STATUS.FAILED]: '失败',
  [TASK_STATUS.PARTIAL_SUCCESS]: '部分成功',
  [TASK_STATUS.CANCELLED]: '已取消'
} as const

/** 重试类型枚举 */
export const RETRY_TYPE = {
  ALL: 'ALL',           // 全部重试
  FAILED: 'FAILED',     // 仅失败部分重试
  FILE_TYPE: 'FILE_TYPE' // 指定文件类型重试
} as const

/** 表类型枚举 */
export const TABLE_TYPE = {
  HOSPITAL_INFO: 1,   // 机构信息
  DRUG_CATALOG: 2,    // 药品目录
  DRUG_INBOUND: 3,    // 入库情况
  DRUG_OUTBOUND: 4,   // 出库情况
  DRUG_USAGE: 5       // 使用情况
} as const

/** 表类型显示文本 */
export const TABLE_TYPE_TEXT = {
  [TABLE_TYPE.HOSPITAL_INFO]: '机构信息',
  [TABLE_TYPE.DRUG_CATALOG]: '药品目录',
  [TABLE_TYPE.DRUG_INBOUND]: '药品入库',
  [TABLE_TYPE.DRUG_OUTBOUND]: '药品出库',
  [TABLE_TYPE.DRUG_USAGE]: '药品使用'
} as const
