import request from '@/config/axios'

// 医疗机构资源信息
export interface HospitalResourceVO {
  id: number
  hospitalCode: string
  organizationName: string
  statDate: string
  bedsNum: number
  pracDockerNum: number
  assDockerNum: number
  visitCount: number
  leaveHosCount: number
  drugSellAmount: number
  ypPurchaseAmount: number
  ypSellAmount: number
  klPurchaseAmount: number
  klSellAmount: number
  createTime: Date
  updateTime: Date
}

// 医疗机构资源分页查询参数
export interface HospitalResourcePageReqVO extends PageParam {
  hospitalCode?: string
  organizationName?: string
  statDate?: string[]
}

// 医疗机构资源保存参数
export interface HospitalResourceSaveReqVO {
  id?: number
  hospitalCode: string
  organizationName: string
  statDate: string
  bedsNum: number
  pracDockerNum: number
  assDockerNum: number
  visitCount: number
  leaveHosCount: number
  drugSellAmount: number
  ypPurchaseAmount: number
  ypSellAmount: number
  klPurchaseAmount: number
  klSellAmount: number
}

// 医疗机构资源概览数据
export interface HospitalResourceOverviewVO {
  totalHospitals: number
  totalBeds: number
  totalDoctors: number
  totalVisits: number
  totalDrugIncome: number
}

// 资源利用率分析数据
export interface ResourceUtilizationVO {
  hospitalCode: string
  organizationName: string
  bedUtilizationRate: number
  doctorWorkload: number
  drugIncomeRatio: number
  tcmDevelopmentRatio: number
}

// 机构对比分析数据
export interface HospitalComparisonVO {
  hospitalCode: string
  organizationName: string
  bedsNum: number
  doctorsNum: number
  visitCount: number
  avgVisitsPerDoctor: number
  bedTurnoverRate: number
  drugIncome: number
  tcmIncome: number
  rank: number
}

// 资源趋势分析数据
export interface ResourceTrendVO {
  statDate: string
  bedsNum: number
  doctorsNum: number
  visitCount: number
  drugIncome: number
  yearOnYearGrowth: number
  monthOnMonthGrowth: number
}

// 创建医疗机构资源信息
export const createHospitalResource = (data: HospitalResourceSaveReqVO) => {
  return request.post({ url: '/dataqc/hospital-resource/create', data })
}

// 更新医疗机构资源信息
export const updateHospitalResource = (data: HospitalResourceSaveReqVO) => {
  return request.put({ url: '/dataqc/hospital-resource/update', data })
}

// 删除医疗机构资源信息
export const deleteHospitalResource = (id: number) => {
  return request.delete({ url: '/dataqc/hospital-resource/delete?id=' + id })
}

// 获得医疗机构资源详情
export const getHospitalResource = (id: number) => {
  return request.get({ url: '/dataqc/hospital-resource/get?id=' + id })
}

// 获得医疗机构资源分页列表
export const getHospitalResourcePage = (params: HospitalResourcePageReqVO) => {
  return request.get({ url: '/dataqc/hospital-resource/page', params })
}

// 导出医疗机构资源数据
export const exportHospitalResource = (params: HospitalResourcePageReqVO) => {
  return request.download({ url: '/dataqc/hospital-resource/export', params })
}

// 导入医疗机构资源数据
export const importHospitalResource = (file: File, updateSupport: boolean) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('updateSupport', String(updateSupport))
  return request.post({
    url: '/dataqc/hospital-resource/import',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取机构资源概览
export const getHospitalResourceOverview = () => {
  return request.get<HospitalResourceOverviewVO>({ url: '/dataqc/hospital-resource/overview' })
}

// 获取资源利用率分析
export const getResourceUtilizationAnalysis = (statDate: string) => {
  return request.get<ResourceUtilizationVO[]>({
    url: '/dataqc/hospital-resource/utilization-analysis',
    params: { statDate }
  })
}

// 获取机构对比分析
export const getHospitalComparisonAnalysis = (params: { statDate: string; limit?: number }) => {
  return request.get<HospitalComparisonVO[]>({
    url: '/dataqc/hospital-resource/comparison-analysis',
    params
  })
}

// 获取资源趋势分析
export const getResourceTrendAnalysis = (params: { hospitalCode: string; year: string }) => {
  return request.get<{ trends: ResourceTrendVO[]; summary: any }>({
    url: '/dataqc/hospital-resource/trend-analysis',
    params
  })
}
