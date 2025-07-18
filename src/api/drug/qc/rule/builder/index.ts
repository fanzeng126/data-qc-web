// 质控构建器API接口定义
import request from '@/config/axios'

// ================== 基础数据类型定义 ==================
export interface DataSourceCategory {
  id: number
  categoryCode: string
  categoryName: string
  categoryType: number
  sortOrder: number
  icon: string
  description: string
  isActive: number
  createTime: string
}

export interface TableMetadata {
  id: number
  categoryId: number
  tableName: string
  chineseName: string
  tableComment: string
  syncSource: number
  sourceReference: string
  fieldCount: number
  isActive: number
  lastSyncTime: string
  createTime: string
}

export interface FieldMetadata {
  id: number
  tableId: number
  fieldName: string
  chineseName: string
  dataType: string
  maxLength: number
  isNullable: number
  isPrimaryKey: number
  isRequired: number
  defaultValue: string
  fieldComment: string
  businessMeaning: string
  sortOrder: number
  isActive: number
  createTime: string
}

export interface FunctionConfig {
  id: number
  functionName: string
  functionCategory: string
  chineseName: string
  description: string
  parameterConfig: any
  returnConfig: any
  implementationType: number
  implementationClass: string
  sqlTemplate: string
  usageExample: string
  functionLevel: number
  isSystem: number
  isActive: number
  sortOrder: number
  createTime: string
}

export interface OperatorConfig {
  id: number
  operatorSymbol: string
  operatorName: string
  operatorCategory: string
  chineseName: string
  description: string
  precedence: number
  associativity: string
  operandCount: number
  supportedTypes: string[]
  isActive: number
  sortOrder: number
  createTime: string
}

export interface QcRule {
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
  conditionGroups?: ConditionGroup[]
  createTime?: string
}

export interface ConditionGroup {
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
export interface PageResult<T> {
  list: T[]
  total: number
}

export interface ApiResponse<T = any> {
  code: number
  data: T
  msg: string
}

// 查询参数类型
export interface CategoryPageReqVO {
  categoryCode?: string
  categoryName?: string
  categoryType?: number
  sortOrder?: number
  icon?: string
  description?: string
  isActive?: number
  createTime?: string[]
  pageNo: number
  pageSize: number
}

export interface TablePageReqVO {
  categoryId?: number
  tableName?: string
  chineseName?: string
  syncSource?: number
  sourceReference?: string
  isActive?: number
  createTime?: string[]
  pageNo: number
  pageSize: number
}

export interface FieldPageReqVO {
  tableId?: number
  fieldName?: string
  chineseName?: string
  dataType?: string
  isRequired?: number
  isPrimaryKey?: number
  isActive?: number
  createTime?: string[]
  pageNo: number
  pageSize: number
}

export interface FunctionPageReqVO {
  functionName?: string
  functionCategory?: string
  chineseName?: string
  functionLevel?: number
  isSystem?: number
  isActive?: number
  createTime?: string[]
  pageNo: number
  pageSize: number
}

export interface OperatorPageReqVO {
  operatorSymbol?: string
  operatorName?: string
  operatorCategory?: string
  chineseName?: string
  isActive?: number
  createTime?: string[]
  pageNo: number
  pageSize: number
}

export interface QcRulePageReqVO {
  ruleCode?: string
  ruleName?: string
  ruleType?: number
  checkDimension?: string
  ruleCategory?: string
  tableType?: number
  isSystem?: number
  enabled?: number
  createTime?: string[]
  pageNo: number
  pageSize: number
}

// 创建更新请求类型
export interface CategorySaveReqVO {
  id?: number
  categoryCode: string
  categoryName: string
  categoryType: number
  sortOrder: number
  icon: string
  description: string
  isActive: number
}

export interface TableSaveReqVO {
  id?: number
  categoryId: number
  tableName: string
  chineseName: string
  tableComment?: string
  syncSource: number
  sourceReference: string
  isActive: number
}

export interface FieldSaveReqVO {
  id?: number
  tableId: number
  fieldName: string
  chineseName: string
  dataType: string
  maxLength?: number
  isNullable: number
  isPrimaryKey: number
  isRequired: number
  defaultValue?: string
  fieldComment?: string
  businessMeaning?: string
  sortOrder: number
  isActive: number
}

export interface FunctionSaveReqVO {
  id?: number
  functionName: string
  functionCategory: string
  chineseName: string
  description: string
  parameterConfig: any
  returnConfig: any
  implementationType: number
  implementationClass?: string
  sqlTemplate?: string
  usageExample?: string
  functionLevel: number
  isSystem: number
  isActive: number
  sortOrder: number
}

export interface OperatorSaveReqVO {
  id?: number
  operatorSymbol: string
  operatorName: string
  operatorCategory: string
  chineseName: string
  description: string
  precedence: number
  associativity: string
  operandCount: number
  supportedTypes: string[]
  isActive: number
  sortOrder: number
}

export interface QcRuleSaveReqVO {
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
  conditionGroups?: ConditionGroupSaveReqVO[]
}

export interface ConditionGroupSaveReqVO {
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
}

// 特殊请求类型
export interface SyncTableReqVO {
  categoryId: number
  syncMode?: 'MERGE' | 'OVERWRITE'
  overwriteExisting?: boolean
  tables: SyncTableInfo[]
}

export interface SyncTableInfo {
  tableName: string
  chineseName: string
  tableComment?: string
  syncSource: number
  sourceReference: string
  fieldCount: number
  description?: string
}

export interface CompileExpressionReqVO {
  expressionJson: any
  tableName?: string
  checkDimension?: string
  tableType?: number
}

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

export const getDataSourceCategories = () => {
  return request.get<DataSourceCategory[]>('/drug/qc-builder/categories/list')
}

export const getTablesByCategory = (categoryId: number) => {
  return request.get<TableMetadata[]>(`/drug/qc-builder/categories/${categoryId}/tables`)
}

export const getFieldsByTable = (tableId: number) => {
  return request.get<FieldMetadata[]>(`/drug/qc-builder/tables/${tableId}/fields`)
}

// 获取函数配置列表（推荐使用getFunctionTree）
export const getFunctionConfigs = () => {
  return request.get<PageResult<FunctionConfig>>('/drug/qc-builder/functions/page', {
    params: { pageNo: 1, pageSize: 1000, isActive: 1 }
  })
}

// 获取操作符配置列表（推荐使用getOperatorTree）
export const getOperatorConfigs = () => {
  return request.get<PageResult<OperatorConfig>>('/drug/qc-builder/operators/page', {
    params: { pageNo: 1, pageSize: 1000, isActive: 1 }
  })
}

export const getQcRule = (id: number) => {
  return request.get<QcRule>(`/drug/qc-rule/get?id=${id}`)
}

export const createQcRule = (data: QcRuleSaveReqVO) => {
  return request.post<number>('/drug/qc-rule/create', data)
}

export const updateQcRule = (data: QcRuleSaveReqVO) => {
  return request.put('/drug/qc-rule/update', data)
}

export const testRuleExpression = (ruleId: number, data: TestRuleReqVO) => {
  return request.post<any>(`/drug/qc-rules/${ruleId}/test`, data)
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

// 获取数据源树结构（包含分类、表、字段的完整树形结构）
export const getDataSourceTree = (params?: {
  categoryId?: number
  keyword?: string
  isActive?: number
}) => {
  return request.get<DataSourceTreeResponse>('/drug/qc-rule/builder/datasource/tree', { params })
}

// 获取函数分类树（按分类分组的函数列表）
export const getFunctionTree = (params?: {
  functionCategory?: string
  functionLevel?: number
  keyword?: string
  isActive?: number
}) => {
  return request.get<FunctionTreeResponse>('/drug/qc-rule/builder/functions/tree', { params })
}

// 获取操作符分类树（按分类分组的操作符列表）
export const getOperatorTree = (params?: {
  operatorCategory?: string
  keyword?: string
  isActive?: number
}) => {
  return request.get<OperatorTreeResponse>('/drug/qc-rule/builder/operators/tree', { params })
}

// 预览完整规则SQL
export const previewRuleSQL = (data: PreviewSqlRequest) => {
  return request.post<PreviewSqlResponse>('/drug/qc-rule/builder/expression/preview-sql', data)
}

// 验证表达式语法
export const validateExpression = (expressionJson: any, context?: any) => {
  return request.post<CompilationResult>('/drug/qc-rule/expression/validate', {
    expressionJson,
    context
  })
}

// ================== 工具函数 ==================

// 构建数据源树形结构的工具函数
export const buildDataSourceTree = (
  categories: DataSourceCategory[],
  tables: TableMetadata[],
  fields: FieldMetadata[]
) => {
  const tree: any[] = []

  categories.forEach((category) => {
    const categoryNode = {
      id: `category_${category.id}`,
      label: category.categoryName,
      type: 'category',
      icon: category.icon,
      children: []
    }

    const categoryTables = tables.filter((table) => table.categoryId === category.id)
    categoryTables.forEach((table) => {
      const tableNode = {
        id: `table_${table.id}`,
        label: table.chineseName || table.tableName,
        type: 'table',
        tableName: table.tableName,
        children: []
      }

      const tableFields = fields.filter((field) => field.tableId === table.id)
      tableFields.forEach((field) => {
        tableNode.children.push({
          id: `field_${field.id}`,
          label: field.chineseName || field.fieldName,
          type: 'field',
          fieldName: field.fieldName,
          tableName: table.tableName,
          dataType: field.dataType,
          isRequired: field.isRequired
        })
      })

      categoryNode.children.push(tableNode)
    })

    tree.push(categoryNode)
  })

  return tree
}

// 构建函数分类树的工具函数
export const buildFunctionCategories = (functions: FunctionConfig[]) => {
  const categoryMap = new Map()

  functions.forEach((func) => {
    if (!categoryMap.has(func.functionCategory)) {
      categoryMap.set(func.functionCategory, {
        name: getCategoryDisplayName(func.functionCategory),
        code: func.functionCategory,
        functions: []
      })
    }
    categoryMap.get(func.functionCategory).functions.push(func)
  })

  return Array.from(categoryMap.values())
}

// 构建操作符分类树的工具函数
export const buildOperatorCategories = (operators: OperatorConfig[]) => {
  const categoryMap = new Map()

  operators.forEach((operator) => {
    if (!categoryMap.has(operator.operatorCategory)) {
      categoryMap.set(operator.operatorCategory, {
        name: getCategoryDisplayName(operator.operatorCategory),
        code: operator.operatorCategory,
        operators: []
      })
    }
    categoryMap.get(operator.operatorCategory).operators.push(operator)
  })

  return Array.from(categoryMap.values())
}

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
