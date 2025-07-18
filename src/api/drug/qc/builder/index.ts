import request from '@/config/axios'

// 数据源分类配置 VO
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

// 数据源分类配置 API
export const QcBuilderDatasourceCategoryApi = {
  // 查询数据源分类配置分页
  getQcBuilderDatasourceCategoryPage: async (params: any) => {
    return await request.get({ url: `/drug/qc-builder/categories/page`, params })
  },

  // 查询数据源分类配置详情
  getQcBuilderDatasourceCategory: async (id: number) => {
    return await request.get({ url: `/drug/qc-builder/categories/get?id=` + id })
  },

  // 新增数据源分类配置
  createQcBuilderDatasourceCategory: async (data: QcBuilderDatasourceCategoryVO) => {
    return await request.post({ url: `/drug/qc-builder/categories/create`, data })
  },

  // 修改数据源分类配置
  updateQcBuilderDatasourceCategory: async (data: QcBuilderDatasourceCategoryVO) => {
    return await request.put({ url: `/drug/qc-builder/categories/update`, data })
  },

  // 删除数据源分类配置
  deleteQcBuilderDatasourceCategory: async (id: number) => {
    return await request.delete({ url: `/drug/qc-builder/categories/delete?id=` + id })
  },

  // 导出数据源分类配置 Excel
  exportQcBuilderDatasourceCategory: async (params) => {
    return await request.download({
      url: `/drug/qc-builder/categories/export-excel`,
      params
    })
  }
}

// 构建器表元数据 VO
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

// 构建器表元数据 API
export const QcBuilderTableMetadataApi = {
  // 查询构建器表元数据分页
  getQcBuilderTableMetadataPage: async (params: any) => {
    return await request.get({ url: `/drug/qc-builder/tables/page`, params })
  },

  // 查询构建器表元数据详情
  getQcBuilderTableMetadata: async (id: number) => {
    return await request.get({ url: `/drug/qc-builder/tables/get?id=` + id })
  },

  // 新增构建器表元数据
  createQcBuilderTableMetadata: async (data: QcBuilderTableMetadataVO) => {
    return await request.post({ url: `/drug/qc-builder/tables/create`, data })
  },

  // 修改构建器表元数据
  updateQcBuilderTableMetadata: async (data: QcBuilderTableMetadataVO) => {
    return await request.put({ url: `/drug/qc-builder/tables/update`, data })
  },

  // 删除构建器表元数据
  deleteQcBuilderTableMetadata: async (id: number) => {
    return await request.delete({ url: `/drug/qc-builder/tables/delete?id=` + id })
  },

  // 批量删除构建器表元数据
  deleteQcBuilderTableMetadataList: async (ids: number[]) => {
    return await request.delete({ url: `/drug/qc-builder/tables/delete-list?ids=` + ids.join(',') })
  },

  // 导出构建器表元数据 Excel
  exportQcBuilderTableMetadata: async (params) => {
    return await request.download({ url: `/drug/qc-builder/tables/export-excel`, params })
  },

  // 获取表字段列表
  getQcBuilderTableFields: async (tableId: number) => {
    return await request.get({ url: `/drug/qc-builder/tables/${tableId}/fields` })
  }
}

// 构建器字段元数据 VO
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

// 构建器字段元数据 API
export const QcBuilderFieldMetadataApi = {
  // 查询构建器字段元数据分页
  getQcBuilderFieldMetadataPage: async (params: any) => {
    return await request.get({ url: `/drug/qc-builder/fields/page`, params })
  },

  // 查询构建器字段元数据详情
  getQcBuilderFieldMetadata: async (id: number) => {
    return await request.get({ url: `/drug/qc-builder/fields/get?id=` + id })
  },

  // 新增构建器字段元数据
  createQcBuilderFieldMetadata: async (data: QcBuilderFieldMetadataVO) => {
    return await request.put({ url: `/drug/qc-builder/fields/create`, data })
  },

  // 修改构建器字段元数据
  updateQcBuilderFieldMetadata: async (data: QcBuilderFieldMetadataVO) => {
    return await request.put({ url: `/drug/qc-builder/fields/update`, data })
  },

  // 删除构建器字段元数据
  deleteQcBuilderFieldMetadata: async (id: number) => {
    return await request.delete({ url: `/drug/qc-builder/fields/delete?id=` + id })
  },

  // 批量删除构建器字段元数据
  deleteQcBuilderFieldMetadataList: async (ids: number[]) => {
    return await request.delete({ url: `/drug/qc-builder/fields/delete-list?ids=` + ids.join(',') })
  },

  // 导出构建器字段元数据 Excel
  exportQcBuilderFieldMetadata: async (params) => {
    return await request.download({ url: `/drug/qc-builder/fields/export-excel`, params })
  }
}

// 构建器同步表字段信息 VO
export interface QcBuilderSyncTableFieldVO {
  fieldName: string // 字段名
  chineseName: string // 中文名称
  dataType: string // 数据类型
  maxLength: number // 字段长度
  nullable: boolean // 是否可空
  primaryKey: boolean // 是否主键
  required: boolean // 是否必填
  defaultValue: string // 默认值
  comment: string // 字段注释
  sortOrder: number // 排序
  selected: boolean // 是否选中同步
}

// 构建器同步表 VO
export interface QcBuilderSyncTableVO {
  tableName: string // 表名
  chineseName: string // 中文名称
  tableComment: string // 表说明
  syncSource: number // 同步来源:1-导入模板,2-数据库表
  sourceReference: string // 来源引用
  fieldCount: number // 字段/列数量
  createTime: Date // 创建时间
  updateTime: Date // 更新时间
  lastModified: Date // 最后修改时间
  description: string // 描述
  templateType: string // 模板类型
  templatePath: string // 模板路径
  tableType: string // 表类型
  engine: string // 表引擎
  charset: string // 字符集
  fields: QcBuilderSyncTableFieldVO[] // 字段列表
}

// 构建器导入表响应 VO
export interface QcBuilderSyncImportTablesRespVO {
  importResult: {
    totalTables: number // 总表数
    successTables: number // 成功表数
    failedTables: number // 失败表数
    importTime: Date // 导入时间
    results: Array<{
      tableName: string // 表名
      chineseName: string // 中文名称
      status: string // 状态
      tableId: number // 表ID
      fieldCount: number // 字段数量
      newFields: number // 新增字段数
      updatedFields: number // 更新字段数
      message: string // 消息
      errorDetail: string // 错误详情
    }>
  }
}

// 数据源同步管理 API
export const QcBuilderSyncApi = {
  // 获取可同步的表列表
  getSyncTables: async (params: { syncSource: number; keyword?: string }) => {
    return await request.get({ url: `/drug/qc-builder/sync/tables`, params })
  },

  // 导入表元数据
  importTables: async (
    params: {
      categoryId: number
      syncMode?: string
      overwriteExisting?: boolean
    },
    tables: QcBuilderSyncTableVO[]
  ) => {
    return await request.post({
      url: `/drug/qc-builder/sync/import-tables`,
      params,
      data: tables
    })
  }
}

// 构建器函数配置 VO
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

// 构建器函数配置 API
export const QcFunctionConfigApi = {
  // 查询构建器函数配置分页
  getQcFunctionConfigPage: async (params: any) => {
    return await request.get({ url: `/drug/qc-builder/functions/page`, params })
  },

  // 查询构建器函数配置详情
  getQcFunctionConfig: async (id: number) => {
    return await request.get({ url: `/drug/qc-builder/functions/get?id=` + id })
  },

  // 新增构建器函数配置
  createQcFunctionConfig: async (data: QcFunctionConfigVO) => {
    return await request.post({ url: `/drug/qc-builder/functions/create`, data })
  },

  // 修改构建器函数配置
  updateQcFunctionConfig: async (data: QcFunctionConfigVO) => {
    return await request.put({ url: `/drug/qc-builder/functions/update`, data })
  },

  // 删除构建器函数配置
  deleteQcFunctionConfig: async (id: number) => {
    return await request.delete({ url: `/drug/qc-builder/functions/delete?id=` + id })
  },

  // 批量删除构建器函数配置
  deleteQcFunctionConfigList: async (ids: number[]) => {
    return await request.delete({
      url: `/drug/qc-builder/functions/delete-list?ids=` + ids.join(',')
    })
  },

  // 导出构建器函数配置 Excel
  exportQcFunctionConfig: async (params) => {
    return await request.download({ url: `/drug/qc-builder/functions/export-excel`, params })
  }
}

// 构建器操作符配置 VO
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

// 构建器操作符配置 API
export const QcOperatorConfigApi = {
  // 查询构建器操作符配置分页
  getQcOperatorConfigPage: async (params: any) => {
    return await request.get({ url: `/drug/qc-builder/operators/page`, params })
  },

  // 查询构建器操作符配置详情
  getQcOperatorConfig: async (id: number) => {
    return await request.get({ url: `/drug/qc-builder/operators/get?id=` + id })
  },

  // 新增构建器操作符配置
  createQcOperatorConfig: async (data: QcOperatorConfigVO) => {
    return await request.post({ url: `/drug/qc-builder/operators/create`, data })
  },

  // 修改构建器操作符配置
  updateQcOperatorConfig: async (data: QcOperatorConfigVO) => {
    return await request.put({ url: `/drug/qc-builder/operators/update`, data })
  },

  // 删除构建器操作符配置
  deleteQcOperatorConfig: async (id: number) => {
    return await request.delete({ url: `/drug/qc-builder/operators/delete?id=` + id })
  },

  // 批量删除构建器操作符配置
  deleteQcOperatorConfigList: async (ids: number[]) => {
    return await request.delete({
      url: `/drug/qc-builder/operators/delete-list?ids=` + ids.join(',')
    })
  },

  // 导出构建器操作符配置 Excel
  exportQcOperatorConfig: async (params) => {
    return await request.download({ url: `/drug/qc-builder/operators/export-excel`, params })
  }
}

// 导出所有API
export default {
  QcBuilderDatasourceCategoryApi,
  QcBuilderTableMetadataApi,
  QcBuilderFieldMetadataApi,
  QcBuilderSyncApi,
  QcFunctionConfigApi,
  QcOperatorConfigApi
}

// 数据源同步相关常量
export const SYNC_SOURCE = {
  EXCEL_TEMPLATE: 1, // Excel模板
  DATABASE_TABLE: 2 // 数据库表
} as const

export const SYNC_MODE = {
  MERGE: 'MERGE', // 合并模式
  OVERWRITE: 'OVERWRITE' // 覆盖模式
} as const

export const IMPORT_STATUS = {
  SUCCESS: 'SUCCESS', // 成功
  FAILED: 'FAILED' // 失败
} as const
