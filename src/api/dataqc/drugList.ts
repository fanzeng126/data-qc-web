import request from '@/config/axios'

// ===================== 药品目录管理 API =====================

export interface DrugListVO {
  id?: number
  serialNum: number
  domainCode: string
  organizationCode: string
  organizationName: string
  hospitalCode: string
  uploadDate: string
  ypid: string
  prDrugId?: string
  hosDrugId: string
  approvalNum?: string
  drugName: string
  productName: string
  tradeName?: string
  tradeEngName?: string
  manufacturer?: string
  drugForm?: string
  drugSpec?: string
  dosageUnit: string
  packUnit: string
  drugFactor: number
  unityPurchaseFlag: string
  baseFlag: string
  uniformityFlag: string
  importBatchNo?: string
  importTime?: Date
  createTime?: Date
}

// 查询药品目录分页列表
export const getDrugListPage = (params: PageParam) => {
  return request.get({ url: '/dataqc/drug-list/page', params })
}

// 查询药品目录详情
export const getDrugList = (id: number) => {
  return request.get({ url: '/dataqc/drug-list/get?id=' + id })
}

// 新增药品目录
export const createDrugList = (data: DrugListVO) => {
  return request.post({ url: '/dataqc/drug-list/create', data })
}

// 修改药品目录
export const updateDrugList = (data: DrugListVO) => {
  return request.put({ url: '/dataqc/drug-list/update', data })
}

// 删除药品目录
export const deleteDrugList = (id: number) => {
  return request.delete({ url: '/dataqc/drug-list/delete?id=' + id })
}

// 批量删除药品目录
export const deleteDrugListBatch = (ids: number[]) => {
  return request.delete({ url: '/dataqc/drug-list/delete-batch', data: ids })
}

// 导出药品目录
export const exportDrugList = (params: any) => {
  return request.download({ url: '/dataqc/drug-list/export', params })
}

// 导入药品目录
export const importDrugList = (file: File, updateSupport: boolean = false) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('updateSupport', updateSupport.toString())
  return request.post({
    url: '/dataqc/drug-list/import',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 下载药品目录导入模板
export const getDrugListTemplate = () => {
  return request.download({ url: '/dataqc/drug-list/get-import-template' })
}
