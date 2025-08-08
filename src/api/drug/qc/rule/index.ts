import request from '@/config/axios'

// 质控规则 VO
export interface QcRuleVO {
  id: number // 规则ID
  ruleCode: string // 规则编码
  ruleName: string // 规则名称
  ruleType: number // 规则类型:1-前置,2-后置
  checkDimension: string // 检查维度:GLOBAL,ORGANIZATION,RECORD,PROVINCE
  ruleCategory: string // 规则分类:GLOBAL,FIELD,LOGIC,ALGORITHM
  tableType: number // 适用表类型:1-机构,2-目录,3-入库,4-出库,5-使用
  fieldName: string // 检查字段
  ruleExpression: string // 规则表达式
  expressionJson: string // 可视化表达式JSON
  errorMessageTemplate: string // 错误信息模板
  executeAction: string // 执行动作:RECORD_ERROR,INTERRUPT,MARK_ANOMALY,WARNING,SKIP
  priority: number // 优先级
  thresholdConfig: string // 阈值配置
  isSystem: number // 是否系统规则
  enabled: number // 是否启用
  description: string // 说明
  conditionGroups?: ConditionGroupVO[] // 条件组列表
}

// 条件组 VO
export interface ConditionGroupVO {
  id: number // 条件组ID
  ruleId: number // 规则ID
  groupName: string // 条件组名称
  groupExpression: string // 条件组表达式
  expressionJson: string // 可视化表达式JSON
  priority: number // 优先级
  executeAction: string // 执行动作
  errorMessageTemplate: string // 错误信息模板
  description: string // 说明
  isActive: number // 是否启用
  createTime: Date // 创建时间
}

// 质控规则 API
export const QcRuleApi = {
  // 查询质控规则分页
  getQcRulePage: async (params: any) => {
    return await request.get({ url: `/drug/qc-rule/page`, params })
  },

  // 查询质控规则详情
  getQcRule: async (id: number) => {
    return await request.get({ url: `/drug/qc-rule/get?id=` + id })
  },

  // 新增质控规则
  createQcRule: async (data: QcRuleVO) => {
    return await request.post({ url: `/drug/qc-rule/create`, data })
  },

  // 修改质控规则
  updateQcRule: async (data: QcRuleVO) => {
    return await request.put({ url: `/drug/qc-rule/update`, data })
  },

  // 删除质控规则
  deleteQcRule: async (id: number) => {
    return await request.delete({ url: `/drug/qc-rule/delete?id=` + id })
  },

  // 导出质控规则 Excel
  exportQcRule: async (params) => {
    return await request.download({ url: `/drug/qc-rule/export-excel`, params })
  }
}

// 质控条件组 VO
export interface QcConditionGroupVO {
  id: number // 条件组ID
  ruleId: number // 规则ID
  groupName: string // 条件组名称
  groupExpression: string // 条件组表达式
  expressionJson: string // 可视化表达式JSON
  priority: number // 优先级
  executeAction: string // 执行动作
  errorMessageTemplate: string // 错误信息模板
  isActive: number // 是否启用
}

// 质控条件组 API
export const QcConditionGroupApi = {
  // 查询质控条件组分页
  getQcConditionGroupPage: async (params: any) => {
    return await request.get({ url: `/drug/qc-condition-group/page`, params })
  },

  // 查询质控条件组详情
  getQcConditionGroup: async (id: number) => {
    return await request.get({ url: `/drug/qc-condition-group/get?id=` + id })
  },

  // 新增质控条件组
  createQcConditionGroup: async (data: QcConditionGroupVO) => {
    return await request.post({ url: `/drug/qc-condition-group/create`, data })
  },

  // 修改质控条件组
  updateQcConditionGroup: async (data: QcConditionGroupVO) => {
    return await request.put({ url: `/drug/qc-condition-group/update`, data })
  },

  // 删除质控条件组
  deleteQcConditionGroup: async (id: number) => {
    return await request.delete({ url: `/drug/qc-condition-group/delete?id=` + id })
  },

  // 导出质控条件组 Excel
  exportQcConditionGroup: async (params) => {
    return await request.download({ url: `/drug/qc-condition-group/export-excel`, params })
  }
}

// ========== 通用错误信息结构 ==========
export interface ValidationError {
  errorCode: string // 错误码
  errorMessage: string // 错误信息
  position?: number // 错误位置
  field?: string // 相关字段
}

// ========== 表达式操作通用请求 VO ==========
export interface ExpressionRequestVO {
  // 表达式内容
  ruleExpression?: string // 规则表达式字符串
  expressionJson?: any // 表达式JSON结构

  // 上下文信息
  checkDimension?: string // 检查维度:GLOBAL,ORGANIZATION,RECORD,PROVINCE
  tableType?: number // 表类型:1-机构,2-目录,3-入库,4-出库,5-使用
  ruleCategory?: string // 规则分类:GLOBAL,FIELD,LOGIC,ALGORITHM
  tableName?: string // 表名

  // 测试相关
  sampleSize?: number // 样本数量
  useRealData?: boolean // 是否使用真实数据
  mockData?: any[] // 模拟数据

  // 变量映射
  variables?: Record<string, any> // 变量映射
}

// ========== 表达式验证响应 VO ==========
export interface ExpressionValidationRespVO {
  isValid: boolean // 是否有效
  errors: ValidationError[] // 验证错误
  warnings: string[] // 警告信息
  suggestions: string[] // 优化建议
}

// ========== 表达式编译响应 VO ==========
export interface ExpressionCompileRespVO {
  sqlExpression: string // 生成的SQL表达式
  isValid: boolean // 是否有效
  errors: ValidationError[] // 编译错误
  usedTables: string[] // 使用的表
  usedFields: string[] // 使用的字段
  usedFunctions: string[] // 使用的函数
  estimatedCost?: number // 预估执行成本
}

// ========== 表达式测试响应 VO ==========
export interface ExpressionTestRespVO {
  totalRecords: number // 总记录数
  passedRecords: number // 通过记录数
  failedRecords: number // 失败记录数
  executionTime: number // 执行时间(毫秒)
  sampleErrors: TestError[] // 示例错误
  performance?: {
    avgExecutionTime: number // 平均执行时间
    memoryUsage: string // 内存使用
    queryComplexity: string // 查询复杂度
  }
}

export interface TestError {
  recordId: number // 记录ID
  errorMessage: string // 错误信息
  fieldValues: Record<string, any> // 字段值
  expectedResult?: any // 期望结果
  actualResult?: any // 实际结果
}

// ========== API 接口定义 ==========
export const ExpressionApi = {
  // 验证表达式
  validateExpression: async (data: ExpressionRequestVO) => {
    return await request.post({ url: '/drug/qc-rule/expression/validate', data })
  },

  // 编译表达式为SQL
  compileExpression: async (data: ExpressionRequestVO) => {
    return await request.post({ url: '/drug/qc-rule/expression/compile', data })
  },

  // 测试质控规则表达式
  testExpression: async (ruleId: number, data: ExpressionRequestVO) => {
    return await request.post({ url: `/drug/qc-rule/expression/test/${ruleId}`, data })
  }
}
