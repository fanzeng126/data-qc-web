// ===================== 药品使用情况管理 API =====================
import request from '@/config/axios'
export interface DrugUseInfoVO {
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
  sellDate: string
  sellPackPrice: number
  sellPackQuantity: number
  sellDosagePrice: number
  sellDosageQuantity: number
  departmentCode?: string
  departmentName?: string
  doctorCode?: string
  doctorName?: string
  patientType?: string
  importBatchNo?: string
  importTime?: Date
  createTime?: Date
}

// 查询药品使用情况分页列表
export const getDrugUseInfoPage = (params: PageParam) => {
  return request.get({ url: '/dataqc/drug-use/page', params })
}

// 查询药品使用情况详情
export const getDrugUseInfo = (id: number) => {
  return request.get({ url: '/dataqc/drug-use/get?id=' + id })
}

// 新增药品使用情况
export const createDrugUseInfo = (data: DrugUseInfoVO) => {
  return request.post({ url: '/dataqc/drug-use/create', data })
}

// 修改药品使用情况
export const updateDrugUseInfo = (data: DrugUseInfoVO) => {
  return request.put({ url: '/dataqc/drug-use/update', data })
}

// 删除药品使用情况
export const deleteDrugUseInfo = (id: number) => {
  return request.delete({ url: '/dataqc/drug-use/delete?id=' + id })
}

// 导出药品使用情况
export const exportDrugUseInfo = (params: any) => {
  return request.download({ url: '/dataqc/drug-use/export', params })
}

// 导入药品使用数据
export const importDrugUseData = (file: File, updateSupport: boolean = false) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('updateSupport', updateSupport.toString())
  return request.post({
    url: '/dataqc/drug-use/import',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 获取使用统计
export const getDrugUseStatistics = (params: any) => {
  return request.get({ url: '/dataqc/drug-use/statistics', params })
}

// 获取科室用药排名
export const getDepartmentRanking = (startDate: string, endDate: string) => {
  return request.get({
    url: '/dataqc/drug-use/department-ranking',
    params: { startDate, endDate }
  })
}

// 获取药品使用排名
export const getDrugUseRanking = (startDate: string, endDate: string) => {
  return request.get({
    url: '/dataqc/drug-use/drug-ranking',
    params: { startDate, endDate }
  })
}
