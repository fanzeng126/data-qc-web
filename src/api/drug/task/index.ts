import request from '@/config/axios'

// ========================= 类型定义 =========================

/** 批量导入任务创建参数 */
export interface ImportTaskCreateParams {
  taskName: string
  description?: string
  dataSource?: string
  executeMode?: string
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
  extractEndTime?: string // 新增：解压完成时间
  importEndTime?: string // 新增：导入完成时间
  qcEndTime?: string // 新增：质控完成时间
  endTime?: string // 新增：任务结束时间
  totalFiles: number
  warningFiles: number
  successFiles: number
  failedFiles: number
  totalRecords: number
  successRecords: number
  failedRecords: number
  tableProgress: TableProgressVO[]
  canRetry: boolean
  // 新增：QC状态相关
  qcStatus?: number // 质控状态: 0-未开始,1-进行中,2-成功,3-失败
  extractStatus?: number // 解压状态: 0-未开始,1-进行中,2-成功,3-失败
  importStatus?: number // 导入状态: 0-未开始,1-进行中,2-成功,3-失败
}

/** 表级进度信息 */
export interface TableProgressVO {
  tableType: number | string // 支持字符串类型的tableType
  tableName: string
  fileName?: string
  status: number | string // 支持字符串状态如 "PENDING", "PROCESSING", "SUCCESS", "FAILED"
  statusDisplay: string
  currentStage: string
  progress: number
  progressPercent?: number // 新增：进度百分比
  currentMessage: string
  totalRecords: number
  processedRecords?: number // 新增：已处理记录数
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

/** 任务详情 - 匹配drug_import_task表结构 */
export interface ImportTaskDetailVO {
  // 基本信息
  id: number
  taskNo: string
  taskName: string
  fileName: string
  filePath: string
  fileSize: number
  extractedFiles?: string // JSON字符串
  executeMode: number
  status: number
  currentStage?: string
  message?: string
  qcStages?: string // JSON字符串
  
  // 文件统计
  totalFiles: number
  successFiles: number
  warningFiles: number
  failedFiles: number
  
  // 记录统计
  totalRecords: number
  successRecords: number
  failedRecords: number
  warningRecords: number
  anomalyRecords: number
  
  // 规则相关
  totalRules: number
  executedRules: number
  passedRules: number
  failedRules: number
  
  // 进度和质量
  progressPercent: number
  qualityScore?: number
  scoreDetail?: string // JSON字符串
  
  // 时间相关
  startTime?: string
  endTime?: string
  durationMs?: number
  avgRecordTime?: number
  
  // 错误处理
  hasErrorFile: boolean
  errorFilePath?: string
  errorMessage?: string
  errorDetail?: string // JSON字符串
  
  // 其他字段
  dataSource?: string
  description?: string
  deptId?: number
  createTime: string
  updateTime: string
  creator: string
  updater: string
  tenantId: number
}

/** 质控结果详情 - 按表分组 */
export interface QcResultDetailVO {
  taskId: number
  taskNo: string
  tableType: string
  tableName: string
  ruleDetails: QcRuleDetailVO[]
  // 统计汇总
  totalRules: number
  passedRules: number
  failedRules: number
  warningRules: number
  checkedRecords: number
  errorRecords: number
  warningRecords: number
  anomalyRecords: number
  passRate: number
}

/** 质控规则详情 */
export interface QcRuleDetailVO {
  id: number
  taskId: number
  taskNo: string
  ruleId: number
  ruleCode: string
  ruleName: string
  ruleType: number // 1-前置,2-后置
  rulePriority: number
  checkDimension: string
  tableType: string
  tableName: string
  checkStatus: number // 0-通过,1-失败,2-警告,3-异常,4-跳过,5-中断
  checkedCount: number
  errorCount: number
  warningCount: number
  anomalyCount: number
  passRate: number
  errorMessage?: string
  errorSamples?: any
  errorRecordIds?: any
  errorFileLines?: any
  fixSuggestion?: string
  autoFixable: boolean
  fixedCount: number
  isThreeSigma: boolean
  sigmaStatistics?: any
  interruptMessage?: string
  createTime: string
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

/** 任务日志VO - 与后端保持一致 */
export interface TaskLogVO {
  taskId: number
  logs: string
  logLevel: string
  totalLines: number
  lastUpdateTime: number
  logFileSize: number
  hasMoreLogs: boolean
}

/** 日志查询参数 */
export interface TaskLogQueryParams {
  logLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'ALL'
  fromLine?: number
  maxLines?: number
  keyword?: string
  startTime?: string
  endTime?: string
}

// ========================= API方法 =========================

/** 药品数据批量导入API */
export const DrugBatchImportApi = {
  /**
   * 创建批量导入任务
   * @param file 压缩包文件
   * @param params 任务参数
   */
  createImportTask: async (
    file: File,
    params: ImportTaskCreateParams
  ): Promise<ImportTaskCreateResult> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskName', params.taskName)
    if (params.dataSource) {
      formData.append('dataSource', params.dataSource)
    }
    if (params.description) {
      formData.append('description', params.description)
    }
    if (params.executeMode) {
      formData.append('executeMode', params.executeMode)
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
  getImportStatistics: async (
    startDate?: string,
    endDate?: string
  ): Promise<ImportStatisticsVO> => {
    return await request.get({
      url: '/drug/batch-import/statistics',
      params: { startDate, endDate }
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
  },
  /**
   * 获取任务质控详情（按表分组）
   * @param taskId 任务ID
   */
  getQcResultDetails: async (taskId: number): Promise<QcResultDetailVO[]> => {
    return await request.get({
      url: `/drug/qc-result-detail/by-task/${taskId}`
    })
  },

  /**
   * 获取任务执行日志
   * @param taskId 任务ID
   * @param logLevel 日志级别，默认INFO
   * @param queryParams 可选的查询参数
   */
  getTaskLogs: async (
    taskId: number,
    logLevel: string = 'INFO',
    queryParams?: TaskLogQueryParams
  ): Promise<TaskLogVO> => {
    const params = {
      logLevel,
      ...queryParams
    }

    return await request.get({
      url: `/drug/batch-import/task-logs/${taskId}`,
      params
    })
  }
}

// ========================= 常量定义 =========================

/** 任务状态枚举 */
export const TASK_STATUS = {
  PENDING: 0, // 待处理
  PARSING: 1, // 解压中
  QC_PRE_CHECKING: 2, // 前置质控中
  IMPORTING: 3, // 数据导入中
  QC_POST_CHECKING: 4, // 后置质控中
  COMPLETED: 5, // 完成
  FAILED: 6, // 失败
  PARTIAL_SUCCESS: 7, // 部分成功
  CANCELLED: 8 // 已取消
} as const

/** 任务状态显示文本 */
export const TASK_STATUS_TEXT = {
  [TASK_STATUS.PENDING]: '待处理',
  [TASK_STATUS.PARSING]: '解压中',
  [TASK_STATUS.QC_PRE_CHECKING]: '前置质控中',
  [TASK_STATUS.IMPORTING]: '数据导入中',
  [TASK_STATUS.QC_POST_CHECKING]: '后置质控中',
  [TASK_STATUS.COMPLETED]: '已完成',
  [TASK_STATUS.FAILED]: '失败',
  [TASK_STATUS.PARTIAL_SUCCESS]: '部分成功',
  [TASK_STATUS.CANCELLED]: '已取消'
} as const
