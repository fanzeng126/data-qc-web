import request from '@/config/axios'

// 机构标准库版本管理 VO
export interface InstitutionVersionVO {
  id: number
  versionCode: string
  versionName: string
  versionDescription: string
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

// 机构标准库版本管理 API
export const InstitutionVersionApi = {
  // 查询机构标准库版本分页
  getInstitutionVersionPage: async (params: any) => {
    return await request.get({ url: `/drug/institution-version/page`, params })
  },

  // 查询机构标准库版本详情
  getInstitutionVersion: async (id: number) => {
    return await request.get({ url: `/drug/institution-version/get?id=` + id })
  },

  // 查询机构标准库版本列表
  getInstitutionVersionList: async () => {
    return await request.get({ url: `/drug/institution-version/list` })
  },

  // 新增机构标准库版本
  createInstitutionVersion: async (data: InstitutionVersionVO) => {
    return await request.post({ url: `/drug/institution-version/create`, data })
  },

  // 创建版本并导入数据
  createVersionAndImport: (formData: FormData) => {
    return request.post({
      url: '/drug/institution-version/create-and-import',
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
      url: `/drug/institution-version/import?versionId=${versionId}`,
      data: formData,
      timeout: 300000,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 发布版本
  publishVersion: async (versionId: number) => {
    return await request.post({ url: `/drug/institution-version/publish?versionId=` + versionId })
  },

  // 修改机构标准库版本
  updateInstitutionVersion: async (data: InstitutionVersionVO) => {
    return await request.put({ url: `/drug/institution-version/update`, data })
  },

  // 删除机构标准库版本
  deleteInstitutionVersion: async (id: number) => {
    return await request.delete({ url: `/drug/institution-version/delete?id=` + id })
  },

  // 导出机构标准库版本 Excel
  exportInstitutionVersion: async (params) => {
    return await request.download({ url: `/drug/institution-version/export-excel`, params })
  },

  // 获取导入模板
  getImportTemplate: async () => {
    return await request.download({ url: `/drug/institution-version/get-import-template` })
  },

  // 获取导入进度
  getImportProgress: async (taskId: string) => {
    return await request.get({ url: `/drug/institution-version/import-progress/${taskId}` })
  }
}