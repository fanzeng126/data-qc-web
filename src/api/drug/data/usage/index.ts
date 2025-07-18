import request from '@/config/axios'

// 药品使用情况 VO
export interface UsageVO {
  id: number // 主键ID
  taskId: number // 导入任务ID
  organizationCode: string // 组织机构代码
  hospitalCode: string // 医疗机构代码
  organizationName: string // 组织机构名称
  domainCode: string // 省级行政区划代码
  ypid: string // 国家药管平台药品编码(YPID)
  hospitalDrugId: string // 院内药品唯一码
  provinceDrugId: string // 省级药品集中采购平台药品编码
  productName: string // 产品名称
  usageDate: Date // 药品销售日期
  usagePackQuantity: number // 销售数量（最小销售包装单位）
  usageDosageQuantity: number // 销售数量（最小制剂单位）
  usageTotalAmount: number // 销售总金额（元）
  usagePackPrice: number // 销售价格（最小销售包装单位）
  usageDosagePrice: number // 销售价格（最小制剂单位）
  qcStatus: number // 质控状态:0-未质控,1-质控通过,2-质控失败
  qcResult: string // 质控结果详情(JSON格式)
  errorMessage: string // 错误信息
  priceStatus: number // 价格状态:0-正常,1-价格过高,2-价格过低,3-价格异常
  fixStatus: number // 修复状态:0-未修复,1-自动修复,2-手动修复
  fixRule: string // 修复规则标记(如FIX0081)
}

// 药品使用情况 API
export const UsageApi = {
  // 查询药品使用情况分页
  getUsagePage: async (params: any) => {
    return await request.get({ url: `/drug/usage/page`, params })
  },

  // 查询药品使用情况详情
  getUsage: async (id: number) => {
    return await request.get({ url: `/drug/usage/get?id=` + id })
  },

  // 新增药品使用情况
  createUsage: async (data: UsageVO) => {
    return await request.post({ url: `/drug/usage/create`, data })
  },

  // 修改药品使用情况
  updateUsage: async (data: UsageVO) => {
    return await request.put({ url: `/drug/usage/update`, data })
  },

  // 删除药品使用情况
  deleteUsage: async (id: number) => {
    return await request.delete({ url: `/drug/usage/delete?id=` + id })
  },

  // 导出药品使用情况 Excel
  exportUsage: async (params) => {
    return await request.download({ url: `/drug/usage/export-excel`, params })
  },

  // 获取维度筛选选项
  getDimensionFilters: async () => {
    return await request.get({ url: `/drug/usage/dimension-filters` })
  }
}