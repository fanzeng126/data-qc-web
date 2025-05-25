// ===================== 药品出入库管理 API =====================
import request from '@/config/axios'
export interface DrugInoutInfoVO {
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
  productName: string
  outInDate: string
  ioType: string
  inPackQuantity?: number
  inDosageQuantity?: number
  inPackPrice?: number
  inDosagePrice?: number
  outPackQuantity?: number
  outDosageQuantity?: number
  supplierCode?: string
  supplierName?: string
  batchNo?: string
  productionDate?: string
  expiryDate?: string
  importBatchNo?: string
  importTime?: Date
  sourceType?: string
  createTime?: Date
}

export interface InoutStatVO {
  inCount: number
  inQuantity: number
  inAmount: number
  outCount: number
  outQuantity: number
  supplierCount: number
}

// 查询药品出入库分页列表
export const getDrugInoutInfoPage = (params: PageParam) => {
  return request.get({ url: '/dataqc/drug-inout/page', params })
}

// 查询药品出入库详情
export const getDrugInoutInfo = (id: number) => {
  return request.get({ url: '/dataqc/drug-inout/get?id=' + id })
}

// 新增药品出入库
export const createDrugInoutInfo = (data: DrugInoutInfoVO) => {
  return request.post({ url: '/dataqc/drug-inout/create', data })
}

// 修改药品出入库
export const updateDrugInoutInfo = (data: DrugInoutInfoVO) => {
  return request.put({ url: '/dataqc/drug-inout/update', data })
}

// 删除药品出入库
export const deleteDrugInoutInfo = (id: number) => {
  return request.delete({ url: '/dataqc/drug-inout/delete?id=' + id })
}

// 导出药品出入库
export const exportDrugInoutInfo = (params: any) => {
  return request.download({ url: '/dataqc/drug-inout/export', params })
}

// 导入药品入库数据
export const importDrugInData = (file: File, updateSupport: boolean = false) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('updateSupport', updateSupport.toString())
  return request.post({
    url: '/dataqc/drug-inout/import-in',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 导入药品出库数据
export const importDrugOutData = (file: File, updateSupport: boolean = false) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('updateSupport', updateSupport.toString())
  return request.post({
    url: '/dataqc/drug-inout/import-out',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 获取库存汇总
export const getStockSummary = (params: any) => {
  return request.get({ url: '/dataqc/drug-inout/stock-summary', params })
}

// 获取出入库统计
export const getInoutStatistics = (startDate: string, endDate: string) => {
  return request.get({
    url: '/dataqc/drug-inout/statistics',
    params: { startDate, endDate }
  })
}
