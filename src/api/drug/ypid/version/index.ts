import request from '@/config/axios'

// YPID版本管理 VO
export interface YpidVersionVO {
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

// YPID版本管理 API
export const YpidVersionApi = {
  // 查询YPID版本分页
  getYpidVersionPage: async (params: any) => {
    return await request.get({ url: `/drug/ypid-version/page`, params })
  },

  // 查询YPID版本详情
  getYpidVersion: async (id: number) => {
    return await request.get({ url: `/drug/ypid-version/get?id=` + id })
  },

  // 查询YPID版本列表
  getYpidVersionList: async () => {
    return await request.get({ url: `/drug/ypid-version/list` })
  },

  // 新增YPID版本
  createYpidVersion: async (data: YpidVersionVO) => {
    return await request.post({ url: `/drug/ypid-version/create`, data })
  },

  // 创建版本并导入数据
  createVersionAndImport: (formData: FormData) => {
    return request.post({
      url: '/drug/ypid-version/create-and-import',
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
      url: `/drug/ypid-version/${versionId}/import`,
      data: formData,
      timeout: 300000, // 5分钟超时
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 发布版本
  publishVersion: async (versionId: number) => {
    return await request.post({ url: `/drug/ypid-version/publish?versionId=` + versionId })
  },

  // 修改YPID版本
  updateYpidVersion: async (data: YpidVersionVO) => {
    return await request.put({ url: `/drug/ypid-version/update`, data })
  },

  // 删除YPID版本
  deleteYpidVersion: async (id: number) => {
    return await request.delete({ url: `/drug/ypid-version/delete?id=` + id })
  },

  // 导出YPID版本 Excel
  exportYpidVersion: async (params) => {
    return await request.download({ url: `/drug/ypid-version/export-excel`, params })
  },

  // 获取导入模板
  getImportTemplate: async () => {
    return await request.download({ url: `/drug/ypid-version/get-import-template` })
  }
}
