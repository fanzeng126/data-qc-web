import request from '@/config/axios'

// 药品入库情况 VO
export interface InboundVO {
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
  inboundDate: Date // 入库日期
  inboundPackQuantity: number // 入库数量（最小销售包装单位）
  inboundDosageQuantity: number // 入库数量（最小制剂单位）
  inboundTotalAmount: number // 入库总金额（元）
  inboundPackPrice: number // 入库价格（最小销售包装单位）
  inboundDosagePrice: number // 入库价格（最小制剂单位）
  qcStatus: number // 质控状态:0-未质控,1-质控通过,2-质控失败
  qcResult: string // 质控结果详情(JSON格式)
  errorMessage: string // 错误信息
  priceStatus: number // 价格状态:0-正常,1-价格过高,2-价格过低
}

// 药品入库情况 API
export const InboundApi = {
  // 查询药品入库情况分页
  getInboundPage: async (params: any) => {
    return await request.get({ url: `/drug/inbound/page`, params })
  },

  // 查询药品入库情况详情
  getInbound: async (id: number) => {
    return await request.get({ url: `/drug/inbound/get?id=` + id })
  },

  // 新增药品入库情况
  createInbound: async (data: InboundVO) => {
    return await request.post({ url: `/drug/inbound/create`, data })
  },

  // 修改药品入库情况
  updateInbound: async (data: InboundVO) => {
    return await request.put({ url: `/drug/inbound/update`, data })
  },

  // 删除药品入库情况
  deleteInbound: async (id: number) => {
    return await request.delete({ url: `/drug/inbound/delete?id=` + id })
  },

  // 导出药品入库情况 Excel
  exportInbound: async (params) => {
    return await request.download({ url: `/drug/inbound/export-excel`, params })
  },

  // 获取维度筛选选项
  getDimensionFilters: async () => {
    return await request.get({ url: `/drug/inbound/dimension-filters` })
  }
}