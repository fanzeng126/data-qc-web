// 质控规则构建器API接口定义
import request from '@/config/axios'

// ================== 基础数据类型定义 ==================
// 数据源分类配置 VO (引用标准VO)
export interface QcBuilderDatasourceCategoryVO {
  id: number // 分类ID
  categoryCode: string // 分类编码
  categoryName: string // 分类名称
  categoryType: number // 分类类型:1-系统内置,2-用户自定义
  sortOrder: number // 排序
  icon: string // 图标
  description: string // 描述
  isActive: number // 是否启用
}

// 构建器表元数据 VO (引用标准VO)
export interface QcBuilderTableMetadataVO {
  id: number // 表ID
  categoryId: number // 所属分类ID
  tableName: string // 表名
  chineseName: string // 中文名称
  tableComment: string // 表说明
  syncSource: number // 同步来源:1-导入模板,2-数据库表
  sourceReference: string // 来源引用
  fieldCount: number // 字段数量
  isActive: number // 是否启用
  lastSyncTime: Date // 最后同步时间
}

// 构建器字段元数据 VO (引用标准VO)
export interface QcBuilderFieldMetadataVO {
  id: number // 字段ID
  tableId: number // 表ID
  fieldName: string // 字段名
  chineseName: string // 中文名称
  dataType: string // 数据类型
  maxLength: number // 最大长度
  isNullable: number // 是否可空
  isPrimaryKey: number // 是否主键
  isRequired: number // 是否必填
  defaultValue: string // 默认值
  fieldComment: string // 字段说明
  businessMeaning: string // 业务含义
  sortOrder: number // 排序
  isActive: number // 是否启用
}

// 构建器函数配置 VO (引用标准VO)
export interface QcFunctionConfigVO {
  id: number // 函数ID
  functionName: string // 函数名
  functionCategory: string // 函数分类
  chineseName: string // 中文名称
  description: string // 函数描述
  parameterConfig: string // 参数配置
  returnConfig: string // 返回值配置
  implementationType: number // 实现类型:1-内置函数,2-自定义函数,3-SQL函数
  implementationClass: string // 实现类
  sqlTemplate: string // SQL模板
  usageExample: string // 使用示例
  functionLevel: number // 函数级别:1-基础,2-高级,3-专家
  isSystem: number // 是否系统函数
  isActive: number // 是否启用
  sortOrder: number // 排序
}

// 构建器操作符配置 VO (引用标准VO)
export interface QcOperatorConfigVO {
  id: number // 操作符ID
  operatorSymbol: string // 操作符符号
  operatorName: string // 操作符名称
  operatorCategory: string // 操作符分类
  chineseName: string // 中文名称
  description: string // 描述
  precedence: number // 优先级
  associativity: string // 结合性:LEFT,RIGHT
  operandCount: number // 操作数数量
  supportedTypes: string // 支持的数据类型
  isActive: number // 是否启用
  sortOrder: number // 排序
}

// 质控规则 VO
export interface QcRuleVO {
  id?: number
  ruleCode: string
  ruleName: string
  ruleType: number
  checkDimension: string
  ruleCategory: string
  tableType?: number
  fieldName?: string
  ruleExpression: string
  expressionJson: any
  errorMessageTemplate: string
  executeAction: string
  priority: number
  thresholdConfig: any
  isSystem: number
  enabled: number
  conditionGroups?: ConditionGroupVO[]
  createTime?: string
}

// 条件组 VO
export interface ConditionGroupVO {
  id?: number
  ruleId?: number
  groupName: string
  groupExpression: string
  expressionJson: any
  priority: number
  executeAction: string
  errorMessageTemplate: string
  description?: string
  isActive: number
  expressionComponents?: ExpressionComponent[]
  compilationResult?: CompilationResult
  createTime?: string
}

export interface ExpressionComponent {
  type: 'field' | 'function' | 'operator' | 'constant' | 'group'
  value: any
  label?: string
  dataType?: string
  parameters?: any[]
  components?: ExpressionComponent[]
  operator?: string
  config?: any
}

export interface CompilationResult {
  isValid: boolean
  sqlExpression?: string
  validationErrors: string[]
  warnings?: string[]
  suggestions?: string[]
  usedTables?: string[]
  usedFields?: string[]
  usedFunctions?: string[]
}

// ================== 请求响应类型定义 ==================
// 编译表达式请求类型
export interface CompileExpressionReqVO {
  expressionJson: any
  tableName?: string
  checkDimension?: string
  tableType?: number
}

// 测试规则请求类型
export interface TestRuleReqVO {
  ruleId?: number
  ruleExpression?: string
  expressionJson?: any
  testData?: {
    tableName: string
    sampleSize: number
    mockData?: any[]
  }
}

// ================== 基础数据API（采用统一的接口调用方式） ==================

// 数据源分类配置 API
export const QcBuilderDatasourceCategoryApi = {
  // 查询数据源分类配置列表
  getQcBuilderDatasourceCategoryList: async () => {
    return await request.get({ url: `/drug/qc-rule/builder/datasource/tree` })
  },

  // 查询指定分类下的表列表
  getQcBuilderTablesByCategory: async (categoryId: number) => {
    return await request.get({ url: `/drug/qc-builder/categories/${categoryId}/tables` })
  }
}

// 构建器表元数据 API
export const QcBuilderTableMetadataApi = {
  // 获取表字段列表
  getQcBuilderTableFields: async (tableId: number) => {
    return await request.get({ url: `/drug/qc-builder/tables/${tableId}/fields` })
  }
}

// 质控规则 API
export const QcRuleApi = {
  // 查询质控规则详情
  getQcRule: async (id: number) => {
    return await request.get({ url: `/drug/qc-rule/get?id=${id}` })
  },

  // 新增质控规则
  createQcRule: async (data: QcRuleVO) => {
    return await request.post({ url: `/drug/qc-rule/create`, data })
  },

  // 修改质控规则
  updateQcRule: async (data: QcRuleVO) => {
    return await request.put({ url: `/drug/qc-rule/update`, data })
  },

  // 测试规则表达式
  testRuleExpression: async (ruleId: number, data: TestRuleReqVO) => {
    return await request.post({ url: `/drug/qc-rules/${ruleId}/test`, data })
  }
}
// ================== 构建器树形数据接口 ==================

// 数据源树结构响应类型
export interface DataSourceTreeResponse {
  treeData: TreeNodeItem[]
}

export interface TreeNodeItem {
  id: string
  label: string
  type: 'category' | 'table' | 'field'
  categoryCode?: string
  tableName?: string
  fieldName?: string
  fieldType?: string
  icon?: string
  description?: string
  isActive: boolean
  sortOrder?: number
  children?: TreeNodeItem[]
}

// 函数分类树响应类型
export interface FunctionTreeResponse {
  categories: FunctionCategory[]
}

export interface FunctionCategory {
  categoryCode: string
  categoryName: string
  icon?: string
  description?: string
  sortOrder?: number
  functions: FunctionItem[]
}

export interface FunctionItem {
  id: number
  functionName: string
  displayName: string
  description?: string
  syntax?: string
  example?: string
  functionLevel?: number
  isActive: boolean
  sortOrder?: number
}

// 操作符分类树响应类型
export interface OperatorTreeResponse {
  categories: OperatorCategory[]
}

export interface OperatorCategory {
  categoryCode: string
  categoryName: string
  icon?: string
  description?: string
  sortOrder?: number
  operators: OperatorItem[]
}

export interface OperatorItem {
  id: number
  operatorSymbol: string
  displayName: string
  description?: string
  operatorType?: string
  example?: string
  isActive: boolean
  sortOrder?: number
}

// 预览SQL响应类型
export interface PreviewSqlResponse {
  sql: string
  explanation?: string
  parameters?: SqlParameter[]
  estimatedRows?: number
  hasSyntaxError: boolean
  errorMessage?: string
}

export interface SqlParameter {
  name: string
  type: string
  value?: string
  description?: string
}

// 预览SQL请求类型
export interface PreviewSqlRequest {
  ruleForm: {
    ruleCode?: string
    ruleName?: string
    ruleType?: number
    checkDimension?: string
    ruleCategory?: string
  }
  conditionGroups: ConditionGroupPreview[]
}

export interface ConditionGroupPreview {
  groupName?: string
  priority?: number
  executeAction?: string
  errorMessageTemplate?: string
  expressionComponents?: ExpressionComponentPreview[]
}

export interface ExpressionComponentPreview {
  type?: string
  value?: string
  label?: string
  parameters?: string[]
}

// ================== 构建器树形数据API ==================

// 质控规则构建器 API
export const QcRuleBuilderApi = {
  // 获取数据源树结构（包含分类、表、字段的完整树形结构）
  getDataSourceTree: async (params?: {
    categoryId?: number
    keyword?: string
    isActive?: number
  }) => {
    return await request.get({ url: `/drug/qc-rule/builder/datasource/tree`, params })
  },

  // 获取函数分类树（按分类分组的函数列表）
  getFunctionTree: async (params?: {
    functionCategory?: string
    functionLevel?: number
    keyword?: string
    isActive?: number
  }) => {
    return await request.get({ url: `/drug/qc-rule/builder/functions/tree`, params })
  },

  // 获取操作符分类树（按分类分组的操作符列表）
  getOperatorTree: async (params?: {
    operatorCategory?: string
    keyword?: string
    isActive?: number
  }) => {
    return await request.get({ url: `/drug/qc-rule/builder/operators/tree`, params })
  },

  // 预览完整规则SQL
  previewRuleSQL: async (data: PreviewSqlRequest) => {
    return await request.post({ url: `/drug/qc-rule/builder/expression/preview-sql`, data })
  },

  // 验证表达式语法
  validateExpression: async (expressionJson: any, context?: any) => {
    return await request.post({
      url: `/drug/qc-rule/expression/validate`,
      data: { expressionJson, context }
    })
  },

  // 编译表达式
  compileExpression: async (data: CompileExpressionReqVO) => {
    return await request.post({ url: `/drug/qc-rule/expression/compile`, data })
  }
}

// ================== 导出统一API ==================
export default {
  QcBuilderDatasourceCategoryApi,
  QcBuilderTableMetadataApi,
  QcRuleApi,
  QcRuleBuilderApi
}

// ================== 工具函数 ==================

// 获取分类显示名称的工具函数
export const getCategoryDisplayName = (categoryCode: string) => {
  const nameMap: Record<string, string> = {
    STATISTICS: '统计函数',
    STRING: '字符串函数',
    NULL_CHECK: '空值检查',
    NUMERIC: '数值函数',
    TIME: '时间函数',
    ANALYSIS: '分析函数',
    COMPARISON: '比较操作符',
    LOGICAL: '逻辑操作符',
    SET: '集合操作符',
    PATTERN: '模式匹配',
    ARITHMETIC: '算术操作符',
    RANGE: '范围操作符'
  }

  return nameMap[categoryCode] || categoryCode
}

// ================== 向后兼容的导出（已废弃，建议使用上面的API）==================

// @deprecated 使用 QcBuilderDatasourceCategoryApi.getQcBuilderDatasourceCategoryList 替代
export const getDataSourceCategories =
  QcBuilderDatasourceCategoryApi.getQcBuilderDatasourceCategoryList

// @deprecated 使用 QcBuilderDatasourceCategoryApi.getQcBuilderTablesByCategory 替代
export const getTablesByCategory = QcBuilderDatasourceCategoryApi.getQcBuilderTablesByCategory

// @deprecated 使用 QcBuilderTableMetadataApi.getQcBuilderTableFields 替代
export const getFieldsByTable = QcBuilderTableMetadataApi.getQcBuilderTableFields

// @deprecated 使用 QcRuleBuilderApi.getFunctionTree 替代
export const getFunctionTree = QcRuleBuilderApi.getFunctionTree

// @deprecated 使用 QcRuleBuilderApi.getOperatorTree 替代
export const getOperatorTree = QcRuleBuilderApi.getOperatorTree

export const getFunctionConfigs = QcRuleBuilderApi.getFunctionTree

export const getOperatorConfigs = QcRuleBuilderApi.getOperatorTree

// @deprecated 使用 QcRuleBuilderApi.getDataSourceTree 替代
export const getDataSourceTree = QcRuleBuilderApi.getDataSourceTree

// @deprecated 使用 QcRuleBuilderApi.previewRuleSQL 替代
export const previewRuleSQL = QcRuleBuilderApi.previewRuleSQL

// @deprecated 使用 QcRuleBuilderApi.validateExpression 替代
export const validateExpression = QcRuleBuilderApi.validateExpression

// @deprecated 使用 QcRuleBuilderApi.compileExpression 替代
export const compileRuleExpression = QcRuleBuilderApi.compileExpression

// @deprecated 使用 QcRuleApi.getQcRule 替代
export const getQcRule = QcRuleApi.getQcRule

// @deprecated 使用 QcRuleApi.createQcRule 替代
export const createQcRule = QcRuleApi.createQcRule

// @deprecated 使用 QcRuleApi.updateQcRule 替代
export const updateQcRule = QcRuleApi.updateQcRule

// @deprecated 使用 QcRuleApi.testRuleExpression 替代
export const testRuleExpression = QcRuleApi.testRuleExpression
