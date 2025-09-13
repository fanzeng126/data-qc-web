import request from '@/config/axios'

// ========================= 类型定义 =========================

/** 质控结果查询参数 - 基于ImportTask */
export interface QcResultPageReqVO {
  pageNo: number
  pageSize: number
  taskNo?: string
  taskName?: string
  status?: number
  executeMode?: number
  creator?: string
  createTime?: string[]
  startTime?: string[]
  endTime?: string[]
}

/** 质控结果列表响应 - 基于ImportTask */
export interface QcResultRespVO {
  id: number
  taskNo: string
  taskName: string
  fileName: string
  fileSize: number
  executeMode: number
  status: number
  progressPercent: number
  totalFiles: number
  successFiles: number
  failedFiles: number
  totalRecords: number
  successRecords: number
  failedRecords: number
  warningRecords: number
  anomalyRecords: number
  totalRules: number
  executedRules: number
  passedRules: number
  failedRules: number
  qualityScore?: number
  durationMs?: number
  hasErrorFile: boolean
  startTime?: string
  endTime?: string
  createTime: string
  creator: string
}

/** 质控结果详情 - 基于ImportTask */
export interface QcResultDetailVO {
  id: number
  taskNo: string
  taskName: string
  fileName: string
  fileSize: number
  executeMode: number
  status: number
  
  // 记录统计
  totalRecords: number
  successRecords: number
  failedRecords: number
  warningRecords: number
  anomalyRecords: number
  
  // 规则执行统计
  totalRules: number
  executedRules: number
  passedRules: number
  failedRules: number
  
  // 质量评分
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
  
  // 其他信息
  creator: string
  createTime: string
}

/** 质控结果明细列表查询参数 */
export interface QcResultDetailPageReqVO {
  pageNo: number
  pageSize: number
  taskId?: number
  taskNo?: string
  ruleId?: number
  ruleCode?: string
  ruleType?: number
  checkStatus?: number
  tableType?: number
}

/** 质控结果明细响应 */
export interface QcResultDetailRespVO {
  id: number
  taskId: number
  taskNo: string
  ruleId: number
  ruleCode: string
  ruleName: string
  ruleType: number // 1-前置,2-后置
  checkDimension: string
  rulePriority: number
  tableType: number
  tableName: string
  conditionGroupId?: number
  conditionGroupName?: string
  executeAction: string
  checkStatus: number // 0-通过,1-失败,2-警告,3-异常,4-跳过,5-中断
  anomalyCount: number
  checkedCount: number
  passRate: number
  errorCount: number
  errorTemplate?: string
  variableValues?: string
  warningCount: number
  errorMessage?: string
  errorSamples?: string
  errorRecordIds?: string
  errorFileLines?: string
  fixSuggestion?: string
  autoFixable: boolean
  fixedCount: number
  isThreeSigma: boolean
  sigmaStatistics?: string
  interruptMessage?: string
  createTime: string
}

/** 分表质控结果 - 基于QcResultDetailByTaskVO */
export interface QcTableResultVO {
  taskId: number
  taskNo: string
  tableType: string
  tableName: string
  totalRules: number
  passedRules: number
  failedRules: number
  warningRules: number
  checkedRecords: number
  errorRecords: number
  warningRecords: number
  anomalyRecords: number
  passRate: number
  ruleDetails: QcRuleDetailVO[]
}

/** 规则执行详情 */
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
  errorSamples?: string
  errorRecordIds?: string
  errorFileLines?: string
  fixSuggestion?: string
  autoFixable: boolean
  fixedCount: number
  isThreeSigma: boolean
  sigmaStatistics?: string
  interruptMessage?: string
  createTime: string
}

/** 全局统计数据 */
export interface QcGlobalStatsVO {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  partialSuccessTasks: number
  avgQualityScore: number
  passRate: number
  failureRate: number
}

/** 问题汇总 */
export interface QcIssueSummaryVO {
  issueType: string
  count: number
  severity: 'danger' | 'warning' | 'info'
  description: string
  suggestion: string
}

// ========================= API方法 =========================

/** 质控结果管理API */
export const QcResultApi = {
  /**
   * 分页查询质控结果列表 - 基于ImportTask
   * @param params 查询参数
   */
  getQcResultPage: async (params: QcResultPageReqVO) => {
    return await request.get({
      url: '/drug/import-task/page',
      params
    })
  },

  /**
   * 获取质控结果详情 - 基于ImportTask
   * @param id ImportTask ID
   */
  getQcResultDetail: async (id: number): Promise<QcResultDetailVO> => {
    return await request.get({
      url: `/drug/import-task/get?id=${id}`
    })
  },

  /**
   * 获取分表质控结果 - 基于QcResultDetail按任务分组
   * @param taskId 任务ID
   */
  getTableResults: async (taskId: number): Promise<QcTableResultVO[]> => {
    return await request.get({
      url: `/drug/qc-result-detail/by-task/${taskId}`
    })
  },

  /**
   * 获取规则执行详情 - 基于QcResultDetail分页查询
   * @param taskId 任务ID
   */
  getRuleDetails: async (taskId: number): Promise<QcRuleDetailVO[]> => {
    const params = {
      pageNo: 1,
      pageSize: -1, // 获取所有规则详情
      taskId: taskId
    }
    const result = await request.get({
      url: '/drug/qc-result-detail/page',
      params
    })
    return result.list || []
  },

  /**
   * 获取质控结果明细分页
   * @param params 查询参数
   */
  getQcResultDetailPage: async (params: QcResultDetailPageReqVO) => {
    return await request.get({
      url: '/drug/qc-result-detail/page',
      params
    })
  },

  /**
   * 获取质控结果明细详情
   * @param id 明细ID
   */
  getQcResultDetailById: async (id: number): Promise<QcResultDetailRespVO> => {
    return await request.get({
      url: `/drug/qc-result-detail/get?id=${id}`
    })
  },

  /**
   * 获取全局统计数据 - 基于ImportTask统计
   */
  getGlobalStats: async (): Promise<QcGlobalStatsVO> => {
    // 这里需要后端提供统计接口，暂时使用模拟数据结构
    return await request.get({
      url: '/drug/import-task/statistics'
    })
  },

  /**
   * 获取问题汇总 - 基于QcResultDetail统计
   * @param taskId 任务ID
   */
  getIssueSummary: async (taskId: number): Promise<QcIssueSummaryVO[]> => {
    // 这里需要后端提供问题汇总接口，暂时使用基础数据
    return await request.get({
      url: `/drug/qc-result-detail/issue-summary/${taskId}`
    })
  },

  /**
   * 生成质控报告
   * @param id ImportTask ID
   */
  generateReport: async (id: number) => {
    return await request.download({
      url: `/drug/import-task/generate-report/${id}`,
      filename: `质控报告_${id}.pdf`
    })
  },

  /**
   * 导出错误数据
   * @param id ImportTask ID
   */
  exportErrors: async (id: number) => {
    return await request.download({
      url: `/drug/import-task/export-errors/${id}`,
      filename: `错误数据_${id}.zip`
    })
  },

  /**
   * 导出质控结果列表
   * @param params 查询参数
   */
  exportQcResultList: async (params: QcResultPageReqVO) => {
    return await request.download({
      url: '/drug/import-task/export-excel',
      params,
      filename: '质控结果列表.xlsx'
    })
  },

  /**
   * 导出质控结果明细
   * @param params 查询参数
   */
  exportQcResultDetail: async (params: QcResultDetailPageReqVO) => {
    return await request.download({
      url: '/drug/qc-result-detail/export-excel',
      params,
      filename: '质控结果明细.xlsx'
    })
  },

  /**
   * 导出质控结果（失败任务用）
   * @param id ImportTask ID
   */
  exportResult: async (id: number) => {
    return await request.download({
      url: `/drug/import-task/export-result/${id}`,
      filename: `质控结果_${id}.zip`
    })
  }
}

// ========================= 常量定义 =========================

/** 执行模式枚举 */
export const EXECUTE_MODE = {
  PRE_ONLY: 1, // 仅前置
  POST_ONLY: 2, // 仅后置
  ALL: 3 // 全部执行
} as const

/** 任务状态枚举 */
export const QC_STATUS = {
  PENDING: 0, // 待处理
  PARSING: 1, // 解析中
  PRE_QC_RUNNING: 2, // 前置质控中
  IMPORTING: 3, // 数据导入中
  POST_QC_RUNNING: 4, // 后置质控中
  COMPLETED: 5, // 完成
  FAILED: 6, // 失败
  PARTIAL_SUCCESS: 7, // 部分成功
  CANCELLED: 8 // 已取消
} as const

/** 规则检查状态枚举 */
export const RULE_CHECK_STATUS = {
  PASSED: 0, // 通过
  FAILED: 1, // 失败
  WARNING: 2, // 警告
  ANOMALY: 3, // 异常
  SKIPPED: 4, // 跳过
  INTERRUPTED: 5 // 中断
} as const

/** 规则类型枚举 */
export const RULE_TYPE = {
  PRE: 1, // 前置
  POST: 2 // 后置
} as const
