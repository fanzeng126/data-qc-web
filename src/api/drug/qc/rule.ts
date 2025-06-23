import request from '@/config/axios'

// ========================= 类型定义 =========================

/**
 * 质控规则基础对象
 * 对应后端的QcRuleSaveReqVO和QcRuleRespVO
 */
export interface QcRuleVO {
  id?: number // 规则ID，新建时不传
  ruleCode: string // 规则编码，如 PRE_QC_001
  ruleName: string // 规则名称
  ruleType: number // 规则类型：1-前置质控，2-后置质控
  ruleCategory: string // 规则分类：GLOBAL-全局，FIELD-字段，LOGIC-逻辑
  tableType?: number | null // 适用表：1-机构，2-目录，3-入库，4-出库，5-使用，NULL-全部
  fieldName?: string // 检查字段名
  ruleExpression: string // 规则表达式（支持SpEL语法）
  errorMessage: string // 错误提示信息模板，支持变量占位符
  errorLevel: number // 错误级别：1-错误，2-警告
  thresholdValue?: string // 阈值配置（JSON格式字符串）
  priority: number // 优先级，数字越小优先级越高
  enabled: boolean // 是否启用
  description?: string // 规则详细说明
  creator?: string // 创建者
  createTime?: string // 创建时间
  updater?: string // 更新者
  updateTime?: string // 更新时间
  statusLoading?: boolean // 前端状态切换时的加载状态（非API字段）
}

/**
 * 分页查询请求参数
 * 对应后端的QcRulePageReqVO
 */
export interface QcRulePageReqVO {
  pageNo: number // 页码，从1开始
  pageSize: number // 每页大小
  ruleCode?: string // 规则编码（模糊查询）
  ruleName?: string // 规则名称（模糊查询）
  ruleType?: number // 规则类型筛选
  ruleCategory?: string // 规则分类筛选
  tableType?: number // 适用表筛选
  enabled?: boolean // 启用状态筛选
  createTimeStart?: string // 创建时间范围-开始
  createTimeEnd?: string // 创建时间范围-结束
  priority?: number // 优先级筛选
  fieldName?: string // 字段名筛选
}

/**
 * 分页查询响应对象
 */
export interface QcRulePageRespVO {
  list: QcRuleVO[] // 规则列表
  total: number // 总记录数
}

/**
 * 规则统计概览对象
 * 对应后端的QcRuleStatisticsVO
 */
export interface QcRuleStatisticsVO {
  totalRules: number // 规则总数
  preQcRules: number // 前置质控规则数
  postQcRules: number // 后置质控规则数
  preQcEnabled: number // 已启用的前置质控规则数
  postQcEnabled: number // 已启用的后置质控规则数
  todayExecutions: number // 今日执行次数
  successExecutions: number // 今日成功执行次数
  passRate: number // 通过率（百分比）
  passRateTrend: number // 通过率趋势（相比昨日的变化百分比）
}

/**
 * 规则执行统计对象
 * 对应后端的QcRuleExecutionStatsVO
 */
export interface QcRuleExecutionStatsVO {
  ruleId: number // 规则ID
  ruleCode: string // 规则编码
  ruleName: string // 规则名称
  totalExecutions: number // 总执行次数
  successExecutions: number // 成功执行次数
  failedExecutions: number // 失败执行次数
  exceptionExecutions: number // 异常执行次数
  overallSuccessRate: number // 整体成功率
  todayExecutions: number // 今日执行次数
  weekExecutions: number // 本周执行次数
  monthExecutions: number // 本月执行次数
  lastExecutionTime?: string // 最后执行时间
  firstExecutionTime?: string // 首次执行时间
  averageExecutionTime: number // 平均执行时间（毫秒）
  minExecutionTime: number // 最快执行时间（毫秒）
  maxExecutionTime: number // 最慢执行时间（毫秒）
  executionTimeStdDev: number // 执行时间标准差
  performanceTrend: string // 性能趋势
  totalProcessedRecords: number // 处理的数据总量
  totalAnomaliesFound: number // 发现的异常数量
  totalBlockedRecords: number // 阻止的问题数据量
  effectivenessScore: number // 规则效果评分(1-10)
  monthlyExecutionTrend: Record<string, number> // 近30天执行次数趋势
  monthlySuccessRateTrend: Record<string, number> // 近30天成功率趋势
  weeklyPerformanceTrend: Record<string, number> // 近7天性能趋势
  errorTypeDistribution: Record<string, number> // 常见错误类型统计
  errorTrend: string // 错误趋势分析
  improvementSuggestions: string[] // 问题改进建议
}

/**
 * 规则执行记录对象
 * 对应后端的QcRuleExecutionRecordVO
 */
export interface QcRuleExecutionRecordVO {
  executionId: number // 执行记录ID
  ruleId: number // 规则ID
  ruleCode: string // 规则编码
  taskId: number // 任务ID
  taskBatchNo: string // 任务批次号
  startTime: string // 执行开始时间
  endTime?: string // 执行结束时间
  executionTime: number // 执行耗时(毫秒)
  executionStatus: string // 执行状态
  executionMessage?: string // 执行结果描述
  processedRecords: number // 处理数据量
  passedRecords: number // 通过规则的数据量
  failedRecords: number // 未通过规则的数据量
  exceptionRecords: number // 异常数据量
  passRate: number // 通过率(%)
  executionServer?: string // 执行服务器
  executionThread?: string // 执行线程
  memoryUsage?: number // 内存使用(MB)
  cpuUsage?: number // CPU使用率(%)
  dataSource?: string // 数据来源
  businessScenario?: string // 业务场景
  triggerType: string // 触发方式
  ruleVersion?: string // 执行版本
  errorMessage?: string // 错误信息
  exceptionStack?: string // 异常堆栈
  retryCount?: number // 重试次数
  maxRetryCount?: number // 最大重试次数
}

/**
 * 规则操作日志对象
 * 对应后端的QcRuleOperationLogVO
 */
export interface QcRuleOperationLogVO {
  logId: number // 日志ID
  ruleId: number // 规则ID
  ruleCode: string // 规则编码
  operationType: string // 操作类型
  operationDescription: string // 操作描述
  operationTime: string // 操作时间
  operatorId: number // 操作人ID
  operatorName: string // 操作人姓名
  operatorIp?: string // 操作IP地址
  beforeData?: string // 变更前数据
  afterData?: string // 变更后数据
  changedFields?: string[] // 变更字段列表
  changeReason?: string // 变更原因
  businessContext?: string // 业务场景
  operationSuccess: boolean // 操作是否成功
  resultMessage?: string // 操作结果消息
  errorCode?: string // 错误代码
  errorDetails?: string // 错误详情
  approvalId?: number // 关联的审批单ID
  riskLevel: string // 风险等级
  complianceCheck?: boolean // 合规检查结果
  remarks?: string // 备注信息
}
/**
 * 质控规则响应对象 - 统一命名
 * 对应后端的QcRuleRespVO
 */
export interface QcRuleRespVO {
  id: number // 规则ID
  ruleCode: string // 规则编码
  ruleName: string // 规则名称
  ruleType: number // 规则类型：1-前置质控，2-后置质控
  ruleCategory: string // 规则分类
  tableType?: number | null // 适用表类型
  fieldName?: string // 检查字段名
  ruleExpression: string // 规则表达式
  errorMessage: string // 错误提示信息
  errorLevel: number // 错误级别
  thresholdValue?: string // 阈值配置
  priority: number // 优先级
  enabled: boolean // 是否启用
  description?: string // 规则详细说明
  creator?: string // 创建者
  createTime?: string // 创建时间
  updater?: string // 更新者
  updateTime?: string // 更新时间
  statusLoading?: boolean // 前端状态切换加载状态（非API字段）
}

/**
 * 质控规则保存请求对象
 * 对应后端的QcRuleSaveReqVO
 */
export interface QcRuleSaveReqVO {
  id?: number // 规则ID，新建时不传
  ruleCode: string // 规则编码
  ruleName: string // 规则名称
  ruleType: number // 规则类型
  ruleCategory: string // 规则分类
  tableType?: number | null // 适用表类型
  fieldName?: string // 检查字段名
  ruleExpression: string // 规则表达式
  errorMessage: string // 错误提示信息
  errorLevel: number // 错误级别
  thresholdValue?: string // 阈值配置
  priority: number // 优先级
  enabled: boolean // 是否启用
  description?: string // 规则详细说明
}

/**
 * 规则测试请求参数
 * 对应后端的QcRuleTestReqVO
 */
export interface RuleTestReqVO {
  ruleExpression: string // 要测试的表达式
  errorMessage?: string // 错误提示信息
  testDataJson: string // 测试数据（JSON格式）
  tableType?: number // 适用表类型
  testOptions?: {
    // 测试选项配置
    verboseOutput?: boolean // 是否详细输出
    performanceTest?: boolean // 是否性能测试
    dataLimit?: number // 测试数据条数限制
    simulateExceptions?: boolean // 是否模拟异常场景
    timeoutSeconds?: number // 超时设置(秒)
  }
  testDescription?: string // 测试场景描述
}

/**
 * 规则测试响应结果
 * 对应后端的QcRuleTestResultVO
 */
export interface RuleTestRespVO {
  testSuccess: boolean // 测试是否成功
  testStartTime: string // 测试开始时间
  testEndTime: string // 测试结束时间
  totalExecutionTime: number // 总测试耗时(毫秒)
  totalTestCases: number // 测试数据总数
  passedCases: number // 通过的测试数量
  failedCases: number // 失败的测试数量
  exceptionCases: number // 异常的测试数量
  passRate: number // 测试通过率(%)
  detailedResults: Array<{
    // 详细测试结果列表
    caseIndex: number // 测试用例序号
    testData: string // 测试数据
    passed: boolean // 执行结果
    executionTime: number // 执行耗时(毫秒)
    returnValue: string // 返回值
    errorMessage?: string // 错误信息
    exceptionStack?: string // 异常堆栈
    executionContext?: Record<string, any> // 执行上下文信息
  }>
  performanceAnalysis?: {
    // 性能分析报告
    averageExecutionTime: number // 平均执行时间(毫秒)
    minExecutionTime: number // 最快执行时间(毫秒)
    maxExecutionTime: number // 最慢执行时间(毫秒)
    executionTimeStdDev: number // 执行时间标准差
    executionTimeDistribution: Record<string, number> // 执行时间分布
    performanceGrade: string // 性能等级
    performanceSuggestions: string[] // 性能建议
  }
  errorAnalysis?: {
    // 错误分析报告
    errorTypeCount: Record<string, number> // 错误类型统计
    mostCommonError: string // 最常见错误
    errorFrequency: number // 错误发生频率
    typicalErrorExamples: string[] // 典型错误示例
    errorFixSuggestions: string[] // 错误解决建议
  }
  recommendations: string[] // 测试建议
}

/**
 * 表达式语法验证请求
 * 对应后端的QcRuleSyntaxReqVO
 */
export interface ExpressionValidationReqVO {
  expression: string // 要验证的表达式
  tableType?: number // 表类型(用于字段验证)
}

/**
 * 表达式语法验证响应
 * 对应后端的QcRuleSyntaxValidationVO
 */
export interface ExpressionValidationRespVO {
  syntaxValid: boolean // 语法是否正确
  validationMessage: string // 验证结果消息
  syntaxErrors: Array<{
    // 语法错误详情
    errorType: string // 错误类型
    errorPosition: number // 错误位置(字符索引)
    errorLength: number // 错误长度
    errorDescription: string // 错误描述
    fixSuggestion: string // 修复建议
  }>
  warnings: string[] // 警告信息
  suggestions: string[] // 建议信息
  complexityScore: number // 表达式复杂度评分(1-10)
  performanceRating: string // 预估执行性能评级
}

/**
 * 规则试运行请求参数
 * 对应后端的QcRuleDryRunReqVO
 */
export interface RuleDryRunReqVO {
  runMode: string // 试运行模式
  dataSource?: {
    // 数据来源设置
    sourceType: string // 数据来源类型
    dataLimit?: number // 数据条数限制
    timeRangeDays?: number // 时间范围(天)
    specificTaskId?: number // 指定任务ID
  }
  options?: {
    // 试运行选项
    detailedReport?: boolean // 是否详细报告
    performanceAnalysis?: boolean // 是否性能分析
    impactAnalysis?: boolean // 是否影响分析
    maxExecutionMinutes?: number // 最大执行时间(分钟)
  }
  description?: string // 试运行描述
}

/**
 * 规则试运行结果
 * 对应后端的QcRuleDryRunResultVO
 */
export interface RuleDryRunRespVO {
  dryRunId: string // 试运行ID
  success: boolean // 试运行是否成功
  startTime: string // 开始时间
  endTime: string // 结束时间
  totalExecutionSeconds: number // 总执行时间(秒)
  totalRecords: number // 处理数据总数
  passedRecords: number // 规则通过数量
  failedRecords: number // 规则失败数量
  exceptionRecords: number // 异常记录数量
  passRate: number // 通过率(%)
  impactAnalysis?: {
    // 影响分析报告
    impactedTaskCount: number // 预计影响的任务数量
    impactedRecordCount: number // 预计影响的记录数量
    impactLevel: string // 影响程度评级
    riskAssessment: string // 风险评估
    businessImpacts: string[] // 业务影响说明
  }
  performanceEvaluation?: {
    // 性能评估报告
    averageResponseTime: number // 平均响应时间(毫秒)
    throughput: number // 吞吐量(记录/秒)
    resourceUsage: string // 资源使用评估
    bottleneckAnalysis: string[] // 性能瓶颈分析
    scalabilityAssessment: string // 扩展性评估
  }
  conclusion: string // 试运行结论
  deploymentRecommendations: string[] // 部署建议
}

/**
 * 规则导入响应结果
 * 对应后端的QcRuleImportResultVO
 */
export interface RuleImportRespVO {
  importBatchNo: string // 导入批次号
  importStartTime: string // 导入开始时间
  importEndTime: string // 导入结束时间
  totalDurationSeconds: number // 总耗时(秒)
  totalRecords: number // 总记录数
  successCount: number // 成功导入数
  failureCount: number // 失败记录数
  skipCount: number // 跳过记录数
  successRate: number // 成功率(%)
  successRules: Array<{
    // 成功导入的规则列表
    rowNumber: number // 行号
    ruleId: number // 规则ID
    ruleCode: string // 规则编码
    ruleName: string // 规则名称
    importAction: string // 导入操作
  }>
  failureDetails: Array<{
    // 失败记录详情
    rowNumber: number // 行号
    errorType: string // 错误类型
    errorField: string // 错误字段
    errorValue: string // 错误值
    errorMessage: string // 错误描述
    fixSuggestion: string // 修复建议
    originalData: string // 原始数据
  }>
  skippedRules: Array<{
    // 跳过记录详情
    rowNumber: number // 行号
    ruleCode: string // 规则编码
    skipReason: string // 跳过原因
    skipType: string // 跳过类型
    originalData: string // 原始数据
  }>
  validationPassRate: number // 数据验证通过率
  errorTypeCount: Record<string, number> // 常见错误类型统计
  importSuggestions: string[] // 导入建议
  nextStepSuggestions: string[] // 后续操作建议
}

/**
 * 规则字段信息
 * 对应后端的QcRuleFieldVO
 */
export interface QcRuleFieldVO {
  fieldName: string // 字段名称
  fieldDisplayName: string // 字段显示名
  fieldType: string // 字段类型
  fieldDescription: string // 字段描述
  required: boolean // 是否必填
  defaultValue?: string // 默认值
  valueRange?: string // 取值范围
  usageExample?: string // 使用示例
  tableName: string // 相关表名
  fieldGroup: string // 字段分组
}

/**
 * 规则复制请求参数
 * 对应后端的QcRuleCopyReqVO
 */
export interface QcRuleCopyReqVO {
  newRuleCode: string // 新规则编码
  newRuleName: string // 新规则名称
  copyExecutionHistory?: boolean // 是否复制执行历史
  copyDescription?: string // 复制说明
}

/**
 * 规则依赖关系
 * 对应后端的QcRuleDependencyVO
 */
export interface QcRuleDependencyVO {
  ruleId: number // 规则ID
  ruleCode: string // 规则编码
  dependencies: Array<{
    // 依赖的规则列表
    ruleId: number // 规则ID
    ruleCode: string // 规则编码
    ruleName: string // 规则名称
    dependencyType: string // 依赖类型
    dependencyStrength: string // 依赖强度
    dependencyDescription: string // 依赖描述
  }>
  dependents: Array<{
    // 被依赖的规则列表
    ruleId: number // 规则ID
    ruleCode: string // 规则编码
    ruleName: string // 规则名称
    dependencyType: string // 依赖类型
    dependencyStrength: string // 依赖强度
    dependencyDescription: string // 依赖描述
  }>
  hasCircularDependency: boolean // 循环依赖检查结果
  dependencyLevel: number // 依赖层级
  impactAssessment: string // 影响范围评估
}

// ========================= API 接口方法 =========================

/**
 * 质控规则管理API类
 * 基于后端控制器的实际接口路径和参数进行调整
 */
export const QcRuleApi = {
  // ========================= 基础CRUD操作 =========================

  /**
   * 分页查询质控规则
   * 对应后端：GET /drug/qc-rule/page
   */
  async getQcRulePage(params: QcRulePageReqVO): Promise<QcRulePageRespVO> {
    return request.get({
      url: '/drug/qc-rule/page',
      params
    })
  },

  /**
   * 获取单个规则详情
   * 对应后端：GET /drug/qc-rule/get?id={id}
   */
  async getQcRule(id: number): Promise<QcRuleVO> {
    return request.get({
      url: '/drug/qc-rule/get',
      params: { id }
    })
  },
  /**
   * 获取规则详情 - 别名方法，保持向后兼容
   * 实际调用getQcRule方法
   */
  async getRuleDetail(id: number): Promise<QcRuleRespVO> {
    return this.getQcRule(id)
  },

  /**
   * 创建质控规则
   * 对应后端：POST /drug/qc-rule/create
   */
  async createQcRule(data: QcRuleVO): Promise<number> {
    return request.post({
      url: '/drug/qc-rule/create',
      data
    })
  },

  /**
   * 更新质控规则
   * 对应后端：PUT /drug/qc-rule/update
   */
  async updateQcRule(data: QcRuleVO): Promise<boolean> {
    return request.put({
      url: '/drug/qc-rule/update',
      data
    })
  },

  /**
   * 删除质控规则
   * 对应后端：DELETE /drug/qc-rule/delete?id={id}
   */
  async deleteQcRule(id: number): Promise<boolean> {
    return request.delete({
      url: '/drug/qc-rule/delete',
      params: { id }
    })
  },

  /**
   * 批量删除质控规则
   * 对应后端：DELETE /drug/qc-rule/delete-list?ids={ids}
   */
  async batchDeleteQcRule(ids: number[]): Promise<boolean> {
    return request.delete({
      url: '/drug/qc-rule/delete-list',
      params: { ids: ids.join(',') }
    })
  },

  // ========================= 状态管理 =========================

  /**
   * 更新规则启用状态
   * 对应后端：PUT /drug/qc-rule/update-status?id={id}&enabled={enabled}
   */
  async updateQcRuleStatus(id: number, enabled: boolean): Promise<boolean> {
    return request.put({
      url: '/drug/qc-rule/update-status',
      params: { id, enabled }
    })
  },

  /**
   * 批量更新规则状态
   * 对应后端：PUT /drug/qc-rule/batch-update-status?ids={ids}&enabled={enabled}
   */
  async batchUpdateStatus(ids: number[], enabled: boolean): Promise<boolean> {
    return request.put({
      url: '/drug/qc-rule/batch-update-status',
      params: { ids: ids.join(','), enabled }
    })
  },

  // ========================= 统计分析 =========================

  /**
   * 获取规则统计概览
   * 对应后端：GET /drug/qc-rule/statistics
   */
  async getQcRuleStatistics(): Promise<QcRuleStatisticsVO> {
    return request.get({
      url: '/drug/qc-rule/statistics'
    })
  },

  /**
   * 获取特定规则的执行统计
   * 对应后端：GET /drug/qc-rule/execution-stats/{id}
   */
  async getRuleExecutionStats(ruleId: number): Promise<QcRuleExecutionStatsVO> {
    return request.get({
      url: `/drug/qc-rule/execution-stats/${ruleId}`
    })
  },

  /**
   * 获取规则的最近执行记录
   * 对应后端：GET /drug/qc-rule/recent-executions/{id}?limit={limit}
   */
  async getRecentExecutions(
    ruleId: number,
    limit: number = 10
  ): Promise<QcRuleExecutionRecordVO[]> {
    return request.get({
      url: `/drug/qc-rule/recent-executions/${ruleId}`,
      params: { limit }
    })
  },

  /**
   * 获取规则的操作日志
   * 对应后端：GET /drug/qc-rule/operation-logs/{id}?limit={limit}
   */
  async getOperationLogs(ruleId: number, limit: number = 20): Promise<QcRuleOperationLogVO[]> {
    return request.get({
      url: `/drug/qc-rule/operation-logs/${ruleId}`,
      params: { limit }
    })
  },

  // ========================= 规则测试验证 =========================

  /**
   * 测试规则表达式
   * 对应后端：POST /drug/qc-rule/test-expression
   */
  async testRuleExpression(params: RuleTestReqVO): Promise<RuleTestRespVO> {
    return request.post({
      url: '/drug/qc-rule/test-expression',
      data: params
    })
  },

  /**
   * 验证表达式语法
   * 对应后端：POST /drug/qc-rule/validate-syntax
   */
  async validateRuleSyntax(params: ExpressionValidationReqVO): Promise<ExpressionValidationRespVO> {
    return request.post({
      url: '/drug/qc-rule/validate-syntax',
      data: params
    })
  },

  /**
   * 规则试运行
   * 对应后端：POST /drug/qc-rule/dry-run/{id}
   */
  async dryRunRule(ruleId: number, params: RuleDryRunReqVO): Promise<RuleDryRunRespVO> {
    return request.post({
      url: `/drug/qc-rule/dry-run/${ruleId}`,
      data: params
    })
  },

  // ========================= 导入导出 =========================

  /**
   * 导出规则列表
   * 对应后端：GET /drug/qc-rule/export-excel
   */
  async exportQcRuleList(params: QcRulePageReqVO): Promise<void> {
    return request.download({
      url: '/drug/qc-rule/export-excel',
      params
    })
  },

  /**
   * 下载规则导入模板
   * 对应后端：GET /drug/qc-rule/export-template
   */
  async downloadImportTemplate(): Promise<void> {
    return request.download({
      url: '/drug/qc-rule/export-template'
    })
  },

  /**
   * 批量导入规则
   * 对应后端：POST /drug/qc-rule/import-excel
   */
  async importQcRules(file: File, overwrite: boolean = false): Promise<RuleImportRespVO> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('overwrite', String(overwrite))

    return request.upload({
      url: '/drug/qc-rule/import-excel',
      data: formData
    })
  },

  // ========================= 规则管理辅助接口 =========================

  /**
   * 获取规则分类列表
   * 对应后端：GET /drug/qc-rule/rule-categories
   */
  async getRuleCategories(): Promise<string[]> {
    return request.get({
      url: '/drug/qc-rule/rule-categories'
    })
  },

  /**
   * 获取指定表的可用字段列表
   * 对应后端：GET /drug/qc-rule/rule-fields/{tableType}
   */
  async getRuleFields(tableType: number): Promise<QcRuleFieldVO[]> {
    return request.get({
      url: `/drug/qc-rule/rule-fields/${tableType}`
    })
  },

  /**
   * 复制质控规则
   * 对应后端：POST /drug/qc-rule/copy/{id}
   */
  async copyQcRule(id: number, copyData: QcRuleCopyReqVO): Promise<number> {
    return request.post({
      url: `/drug/qc-rule/copy/${id}`,
      data: copyData
    })
  },

  /**
   * 获取规则依赖关系
   * 对应后端：GET /drug/qc-rule/rule-dependency/{id}
   */
  async getRuleDependency(ruleId: number): Promise<QcRuleDependencyVO> {
    return request.get({
      url: `/drug/qc-rule/rule-dependency/${ruleId}`
    })
  },

  // ========================= 辅助功能 =========================

  /**
   * 检查规则编码是否可用
   * 这是前端常用的功能，可能需要后端添加对应接口
   */
  async checkRuleCodeAvailable(
    ruleCode: string,
    excludeId?: number
  ): Promise<{
    available: boolean
    message?: string
    suggestion?: string
  }> {
    return request.get({
      url: '/drug/qc-rule/check-code',
      params: { ruleCode, excludeId }
    })
  }
}

// ========================= 类型导出 =========================

export type {
  QcRuleRespVO,
  QcRuleSaveReqVO,
  QcRulePageReqVO,
  QcRulePageRespVO,
  QcRuleStatisticsVO,
  QcRuleExecutionStatsVO,
  QcRuleExecutionRecordVO,
  QcRuleOperationLogVO,
  RuleTestReqVO,
  RuleTestRespVO,
  ExpressionValidationReqVO,
  ExpressionValidationRespVO,
  RuleDryRunReqVO,
  RuleDryRunRespVO,
  RuleImportRespVO,
  QcRuleFieldVO,
  QcRuleCopyReqVO,
  QcRuleDependencyVO
}
