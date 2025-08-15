import request from '@/config/axios'

// 标准库版本管理 VO (统一版本管理)
export interface StandardVersionVO {
  id: number
  versionCode: string
  versionName: string
  versionDescription: string
  libraryType: number // 库类型: 1-YPID标准库, 2-机构标准库
  importType: number
  sourceFileName: string
  totalRecords: number
  newRecords: number
  updatedRecords: number
  deletedRecords: number
  status: number
  importStartTime: Date
  importEndTime: Date
  publishTime: Date
  errorMessage: string
  createTime: Date
}

// 标准库版本管理 API (统一API)
export const StandardVersionApi = {
  // 查询标准库版本分页
  getStandardVersionPage: async (params: any) => {
    return await request.get({ url: `/drug/standard-version/page`, params })
  },

  // 查询标准库版本详情
  getStandardVersion: async (id: number) => {
    return await request.get({ url: `/drug/standard-version/get?id=` + id })
  },

  // 查询标准库版本列表 (支持按类型筛选)
  getStandardVersionList: async (libraryType?: number) => {
    const params = libraryType ? { libraryType } : {}
    return await request.get({ url: `/drug/standard-version/list`, params })
  },

  // 新增标准库版本
  createStandardVersion: async (data: StandardVersionVO) => {
    return await request.post({ url: `/drug/standard-version/create`, data })
  },

  // 创建版本并导入数据
  createVersionAndImport: (formData: FormData) => {
    return request.post({
      url: '/drug/standard-version/create-and-import',
      data: formData,
      timeout: 300000, // 5分钟超时
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 导入数据到指定版本
  importDataToVersion: (versionId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post({
      url: `/drug/standard-version/import?versionId=${versionId}`,
      data: formData,
      timeout: 300000,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 发布版本
  publishVersion: async (versionId: number) => {
    return await request.post({ url: `/drug/standard-version/publish?versionId=` + versionId })
  },

  // 修改标准库版本
  updateStandardVersion: async (data: StandardVersionVO) => {
    return await request.put({ url: `/drug/standard-version/update`, data })
  },

  // 删除标准库版本
  deleteStandardVersion: async (id: number) => {
    return await request.delete({ url: `/drug/standard-version/delete?id=` + id })
  },

  // 导出标准库版本 Excel
  exportStandardVersion: async (params) => {
    return await request.download({ url: `/drug/standard-version/export-excel`, params })
  },

  // 获取导入模板
  getImportTemplate: async () => {
    return await request.download({ url: `/drug/standard-version/get-import-template` })
  },

  // 获取导入进度
  getImportProgress: async (versionId: number) => {
    return await request.get({ url: `/drug/standard-version/import-progress/${versionId}` })
  }
}

// YPID标准库版本管理 API (向后兼容)
export const YpidVersionApi = {
  // 查询YPID版本分页
  getYpidVersionPage: async (params: any) => {
    return await StandardVersionApi.getStandardVersionPage({ ...params, libraryType: 1 })
  },

  // 查询YPID版本详情
  getYpidVersion: async (id: number) => {
    return await StandardVersionApi.getStandardVersion(id)
  },

  // 查询YPID版本列表
  getYpidVersionList: async () => {
    return await StandardVersionApi.getStandardVersionList(1)
  },

  // 新增YPID版本
  createYpidVersion: async (data: StandardVersionVO) => {
    return await StandardVersionApi.createStandardVersion({ ...data, libraryType: 1 })
  },

  // 创建版本并导入数据
  createVersionAndImport: (formData: FormData) => {
    // 确保FormData包含libraryType
    if (!formData.has('libraryType')) {
      formData.append('libraryType', '1')
    }
    return StandardVersionApi.createVersionAndImport(formData)
  },

  // 导入数据到指定版本
  importDataToVersion: StandardVersionApi.importDataToVersion,

  // 发布版本
  publishVersion: StandardVersionApi.publishVersion,

  // 修改YPID版本
  updateYpidVersion: async (data: StandardVersionVO) => {
    return await StandardVersionApi.updateStandardVersion({ ...data, libraryType: 1 })
  },

  // 删除YPID版本
  deleteYpidVersion: StandardVersionApi.deleteStandardVersion,

  // 导出YPID版本 Excel
  exportYpidVersion: StandardVersionApi.exportStandardVersion,

  // 获取导入模板
  getImportTemplate: StandardVersionApi.getImportTemplate,

  // 获取导入进度
  getImportProgress: StandardVersionApi.getImportProgress
}

// 机构标准库版本管理 API (向后兼容)
export const InstitutionVersionApi = {
  // 查询机构标准库版本分页
  getInstitutionVersionPage: async (params: any) => {
    return await StandardVersionApi.getStandardVersionPage({ ...params, libraryType: 2 })
  },

  // 查询机构标准库版本详情
  getInstitutionVersion: async (id: number) => {
    return await StandardVersionApi.getStandardVersion(id)
  },

  // 查询机构标准库版本列表
  getInstitutionVersionList: async () => {
    return await StandardVersionApi.getStandardVersionList(2)
  },

  // 新增机构标准库版本
  createInstitutionVersion: async (data: StandardVersionVO) => {
    return await StandardVersionApi.createStandardVersion({ ...data, libraryType: 2 })
  },

  // 创建版本并导入数据
  createVersionAndImport: (formData: FormData) => {
    // 确保FormData包含libraryType
    if (!formData.has('libraryType')) {
      formData.append('libraryType', '2')
    }
    return StandardVersionApi.createVersionAndImport(formData)
  },

  // 导入数据到指定版本
  importDataToVersion: StandardVersionApi.importDataToVersion,

  // 发布版本
  publishVersion: StandardVersionApi.publishVersion,

  // 修改机构标准库版本
  updateInstitutionVersion: async (data: StandardVersionVO) => {
    return await StandardVersionApi.updateStandardVersion({ ...data, libraryType: 2 })
  },

  // 删除机构标准库版本
  deleteInstitutionVersion: StandardVersionApi.deleteStandardVersion,

  // 导出机构标准库版本 Excel
  exportInstitutionVersion: StandardVersionApi.exportStandardVersion,

  // 获取导入模板
  getImportTemplate: StandardVersionApi.getImportTemplate,

  // 获取导入进度
  getImportProgress: StandardVersionApi.getImportProgress
}