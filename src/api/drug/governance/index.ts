// src/api/drug/governance/index.ts
import request from '@/config/axios'

export function DrugGovernanceApi() {}

// ========================= 类型定义 =========================

/**
 * 异常数据统计概览
 */
export interface AnomalyStatisticsVO {
  totalAnomalies: number // 异常数据总数
  ypidErrors: number // YPID相关错误数
  valueErrors: number // 数值异常数
  logicErrors: number // 逻辑错误数
  formatErrors: number // 格式错误数
  pendingAutoFix: number // 待自动修复数
  pendingManualFix: number // 待人工修复数
  todayFixed: number // 今日已修复数
  fixRate: number // 修复率（百分比）
  fixRateTrend: number // 修复率趋势
}

/**
 * 异常数据详情
 */
export interface AnomalyDataVO {
  id: number // 异常记录ID
  taskId: number // 任务ID
  taskNo: string // 任务编号
  tableType: number // 表类型
  tableName: string // 表名称
  recordId: number // 原始记录ID
  anomalyType: string // 异常类型
  anomalyCategory: string // 异常分类
  fieldName?: string // 异常字段
  originalValue?: string // 原始值
  expectedValue?: string // 期望值
  errorMessage: string // 错误描述
  fixStrategy?: string // 建议修复策略
  fixCode?: string // 修复代码（如FIX0049）
  confidence?: number // 修复置信度（0-100）
  priority: number // 处理优先级
  status: number // 状态：0-待处理，1-修复中，2-已修复，3-已忽略，4-修复失败
  hospitalName?: string // 医院名称
  ypid?: string // 药品编码
  drugName?: string // 药品名称
  createTime: string // 发现时间
}

/**
 * 异常数据查询参数
 */
export interface AnomalyQueryVO {
  pageNo: number
  pageSize: number
  taskId?: number // 任务ID
  taskNo?: string // 任务编号
  tableType?: number // 表类型
  anomalyType?: string // 异常类型
  anomalyCategory?: string // 异常分类
  status?: number // 状态
  priority?: number // 优先级
  createTimeStart?: string // 开始时间
  createTimeEnd?: string // 结束时间
  hospitalName?: string // 医院名称
  drugName?: string // 药品名称
}

/**
 * 修复策略
 */
export interface FixStrategyVO {
  fixCode: string // 修复代码
  fixName: string // 修复名称
  fixType: string // 修复类型：auto-自动，manual-手动
  description: string // 策略描述
  condition: string // 适用条件
  fixExpression: string // 修复表达式
  successRate: number // 历史成功率
  usageCount: number // 使用次数
  enabled: boolean // 是否启用
}

/**
 * 批量修复请求
 */
export interface BatchFixRequestVO {
  anomalyIds: number[] // 异常记录ID列表
  fixCode?: string // 修复策略代码
  fixOptions?: {
    preview?: boolean // 是否预览
    forceOverwrite?: boolean // 强制覆盖
    skipValidation?: boolean // 跳过验证
  }
  remark?: string // 备注
}

/**
 * 修复预览结果
 */
export interface FixPreviewVO {
  anomalyId: number // 异常记录ID
  fieldName: string // 字段名
  originalValue: string // 原始值
  fixedValue: string // 修复后的值
  changeDescription: string // 变更说明
  riskLevel: string // 风险等级
  validationResult?: string // 验证结果
}

/**
 * 修复执行结果
 */
export interface FixResultVO {
  batchNo: string // 批次号
  startTime: string // 开始时间
  endTime: string // 结束时间
  totalCount: number // 总记录数
  successCount: number // 成功数
  failureCount: number // 失败数
  skipCount: number // 跳过数
  successDetails: Array<{
    anomalyId: number
    fixedValue: string
    executionTime: number
  }>
  failureDetails: Array<{
    anomalyId: number
    errorMessage: string
    suggestion: string
  }>
  summary: string // 执行摘要
}

/**
 * 手动修复请求
 */
export interface ManualFixRequestVO {
  anomalyId: number // 异常记录ID
  fieldValues: Record<string, any> // 字段值映射
  fixReason: string // 修复原因
  referenceInfo?: string // 参考信息
}

/**
 * 修复历史记录
 */
export interface FixHistoryVO {
  id: number // 历史记录ID
  batchNo: string // 批次号
  anomalyId: number // 异常记录ID
  taskId: number // 任务ID
  taskNo: string // 任务编号
  tableType: number // 表类型
  fixType: string // 修复类型：auto-自动，manual-手动
  fixCode?: string // 修复策略代码
  fixStrategy?: string // 修复策略名称
  beforeData: string // 修复前数据（JSON）
  afterData: string // 修复后数据（JSON）
  changedFields: string[] // 变更字段列表
  operator: string // 操作人
  operatorId: number // 操作人ID
  fixTime: string // 修复时间
  executionTime: number // 执行耗时（毫秒）
  status: string // 状态：success-成功，failed-失败
  errorMessage?: string // 错误信息
  remark?: string // 备注
}

/**
 * 修复历史查询参数
 */
export interface FixHistoryQueryVO {
  pageNo: number
  pageSize: number
  batchNo?: string // 批次号
  taskId?: number // 任务ID
  tableType?: number // 表类型
  fixType?: string // 修复类型
  status?: string // 状态
  operator?: string // 操作人
  fixTimeStart?: string // 开始时间
  fixTimeEnd?: string // 结束时间
}

/**
 * YPID参考信息
 */
export interface YpidReferenceVO {
  ypid: string // YPID编码
  drugName: string // 药品通用名
  productName: string // 产品名称
  specification: string // 规格
  dosageForm: string // 剂型
  manufacturer: string // 生产企业
  conversionFactor: number // 转换系数
  referencePrice?: number // 参考价格
  lastUpdateTime: string // 最后更新时间
}

// ========================= API 接口方法 =========================

export const DataGovernanceApi = {
  // ========================= 异常数据分析 =========================

  /**
   * 获取异常数据统计概览
   */
  async getAnomalyStatistics(taskId?: number): Promise<AnomalyStatisticsVO> {
    return request.get({
      url: '/drug/governance/anomaly-statistics',
      params: { taskId }
    })
  },

  /**
   * 分页查询异常数据
   */
  async getAnomalyPage(params: AnomalyQueryVO) {
    return request.get({
      url: '/drug/governance/anomaly-page',
      params
    })
  },

  /**
   * 获取异常数据详情
   */
  async getAnomalyDetail(id: number): Promise<AnomalyDataVO> {
    return request.get({
      url: '/drug/governance/anomaly-detail',
      params: { id }
    })
  },

  /**
   * 导出异常数据
   */
  async exportAnomalyData(params: AnomalyQueryVO): Promise<void> {
    return request.download({
      url: '/drug/governance/export-anomaly',
      params
    })
  },

  // ========================= 自动修复 =========================

  /**
   * 获取修复策略列表
   */
  async getFixStrategies(anomalyType?: string): Promise<FixStrategyVO[]> {
    return request.get({
      url: '/drug/governance/fix-strategies',
      params: { anomalyType }
    })
  },

  /**
   * 预览修复效果
   */
  async previewFix(params: BatchFixRequestVO): Promise<FixPreviewVO[]> {
    return request.post({
      url: '/drug/governance/preview-fix',
      data: params
    })
  },

  /**
   * 执行批量修复
   */
  async executeBatchFix(params: BatchFixRequestVO): Promise<FixResultVO> {
    return request.post({
      url: '/drug/governance/batch-fix',
      data: params
    })
  },

  /**
   * 获取修复进度
   */
  async getFixProgress(batchNo: string) {
    return request.get({
      url: '/drug/governance/fix-progress',
      params: { batchNo }
    })
  },

  // ========================= 手动修复 =========================

  /**
   * 获取待手动修复列表
   */
  async getManualFixList(params: {
    pageNo: number
    pageSize: number
    priority?: number
    tableType?: number
  }) {
    return request.get({
      url: '/drug/governance/manual-fix-list',
      params
    })
  },

  /**
   * 获取YPID参考信息
   */
  async getYpidReference(keyword: string): Promise<YpidReferenceVO[]> {
    return request.get({
      url: '/drug/governance/ypid-reference',
      params: { keyword }
    })
  },

  /**
   * 提交手动修复
   */
  async submitManualFix(params: ManualFixRequestVO): Promise<boolean> {
    return request.post({
      url: '/drug/governance/manual-fix',
      data: params
    })
  },

  /**
   * 忽略异常数据
   */
  async ignoreAnomaly(id: number, reason: string): Promise<boolean> {
    return request.post({
      url: '/drug/governance/ignore-anomaly',
      data: { id, reason }
    })
  },

  // ========================= 修复历史 =========================

  /**
   * 分页查询修复历史
   */
  async getFixHistoryPage(params: FixHistoryQueryVO) {
    return request.get({
      url: '/drug/governance/fix-history-page',
      params
    })
  },

  /**
   * 获取修复历史详情
   */
  async getFixHistoryDetail(id: number): Promise<FixHistoryVO> {
    return request.get({
      url: '/drug/governance/fix-history-detail',
      params: { id }
    })
  },

  /**
   * 导出修复历史
   */
  async exportFixHistory(params: FixHistoryQueryVO): Promise<void> {
    return request.download({
      url: '/drug/governance/export-fix-history',
      params
    })
  },

  /**
   * 获取修复统计分析
   */
  async getFixAnalytics(timeRange: { start: string; end: string }) {
    return request.get({
      url: '/drug/governance/fix-analytics',
      params: timeRange
    })
  }
}
