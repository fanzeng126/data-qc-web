import request from '@/config/axios'

export function DrugHospitalApi() {}

// 医疗机构基本情况 VO
export interface HospitalInfoVO {
  id: number // 主键ID
  taskId: number // 导入任务ID
  organizationCode: string // 组织机构代码（9位）
  hospitalCode: string // 医疗机构代码（22位）
  organizationName: string // 组织机构名称
  domainCode: string // 省级行政区划代码（6位）
  bedCount: number // 实有床位数
  doctorCount: number // 执业医师数
  assistantDoctorCount: number // 执业助理医师数
  visitCount: number // 总诊疗人次数
  dischargeCount: number // 出院人数
  annualDrugIncome: number // 年度药品总收入
  ypPurchaseAmount: number // 中药饮片总采购额
  ypSellAmount: number // 中药饮片总销售额
  klPurchaseAmount: number // 中药颗粒剂总采购额
  klSellAmount: number // 中药颗粒剂总销售额
  qcStatus: number // 质控状态:0-未质控,1-质控通过,2-质控失败
  qcResult: string // 质控结果详情(JSON格式)
  errorMessage: string // 错误信息
}

// 医疗机构基本情况 API
export const HospitalInfoApi = {
  // 查询医疗机构基本情况分页
  getHospitalInfoPage: async (params: any) => {
    return await request.get({ url: `/drug/hospital-info/page`, params })
  },

  // 查询医疗机构基本情况详情
  getHospitalInfo: async (id: number) => {
    return await request.get({ url: `/drug/hospital-info/get?id=` + id })
  },

  // 新增医疗机构基本情况
  createHospitalInfo: async (data: HospitalInfoVO) => {
    return await request.post({ url: `/drug/hospital-info/create`, data })
  },

  // 修改医疗机构基本情况
  updateHospitalInfo: async (data: HospitalInfoVO) => {
    return await request.put({ url: `/drug/hospital-info/update`, data })
  },

  // 删除医疗机构基本情况
  deleteHospitalInfo: async (id: number) => {
    return await request.delete({ url: `/drug/hospital-info/delete?id=` + id })
  },

  // 导出医疗机构基本情况 Excel
  exportHospitalInfo: async (params) => {
    return await request.download({ url: `/drug/hospital-info/export-excel`, params })
  }
}
