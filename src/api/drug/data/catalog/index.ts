import request from '@/config/axios'

// 药品目录 VO
export interface CatalogVO {
  id: number // 主键ID
  taskId: number // 导入任务ID
  organizationCode: string // 组织机构代码
  hospitalCode: string // 医疗机构代码
  organizationName: string // 组织机构名称
  domainCode: string // 省级行政区划代码
  ypid: string // 国家药管平台药品编码(YPID)
  hospitalDrugId: string // 院内药品唯一码
  provinceDrugId: string // 省级药品集中采购平台药品编码
  approvalNumber: string // 批准文号
  drugName: string // 品种通用名（不含剂型）
  productName: string // 产品名称
  tradeName: string // 商品名
  tradeNameEn: string // 商品名（英文）
  manufacturer: string // 生产企业
  drugForm: string // 剂型名称
  drugSpec: string // 制剂规格
  dosageUnit: string // 制剂单位
  packUnit: string // 最小销售包装单位
  conversionFactor: number // 转换系数
  isCentralizedPurchase: string // 是否网上集中采购药品:1-是,2-否
  isBasicDrug: string // 是否基本药物:1-是,2-否
  isConsistencyEvaluation: string // 是否通过一致性评价:1-是,2-否
  qcStatus: number // 质控状态:0-未质控,1-质控通过,2-质控失败
  qcResult: string // 质控结果详情(JSON格式)
  errorMessage: string // 错误信息
  ypidMatchStatus: number // YPID匹配状态:0-未匹配,1-自动匹配,2-手动匹配,3-匹配失败
}

// 药品目录 API
export const CatalogApi = {
  // 查询药品目录分页
  getCatalogPage: async (params: any) => {
    return await request.get({ url: `/drug/catalog/page`, params })
  },

  // 查询药品目录详情
  getCatalog: async (id: number) => {
    return await request.get({ url: `/drug/catalog/get?id=` + id })
  },

  // 新增药品目录
  createCatalog: async (data: CatalogVO) => {
    return await request.post({ url: `/drug/catalog/create`, data })
  },

  // 修改药品目录
  updateCatalog: async (data: CatalogVO) => {
    return await request.put({ url: `/drug/catalog/update`, data })
  },

  // 删除药品目录
  deleteCatalog: async (id: number) => {
    return await request.delete({ url: `/drug/catalog/delete?id=` + id })
  },

  // 导出药品目录 Excel
  exportCatalog: async (params) => {
    return await request.download({ url: `/drug/catalog/export-excel`, params })
  },

  // 获取维度筛选选项
  getDimensionFilters: async () => {
    return await request.get({ url: `/drug/catalog/dimension-filters` })
  }
}