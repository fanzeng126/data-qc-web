import request from '@/config/axios'

// 药品机构标准库综合 VO
export interface InstitutionStandardVO {
  id: number // 主键ID
  versionId: number // 关联YPID版本表ID
  orgId: string // 机构唯一编码
  institutionId: string // 医疗机构ID
  institutionName: string // 机构名称
  institutionCategory: string // 机构类别(A-医院,B1-社区卫生服务中心,C-乡镇卫生院)
  institutionCategoryName?: string // 机构类别名称
  adminDivisionCode: string // 行政区划代码
  adminDivisionName?: string // 行政区划名称
  townshipStreetCode: string // 乡镇街道代码
  director: string // 负责人
  contactPerson: string // 联系人
  contactPhone: string // 联系电话
  institutionCode: string // 机构代码
  socialCreditCode: string // 统一社会信用代码
  economicType: string // 经济类型
  hospitalLevelGrade: string // 医院等级(等) 1-一级,2-二级,3-三级,9-未定级
  hospitalLevelClass: string // 医院等级(级) 1-甲等,2-乙等,3-丙等
  institutionLevel: string // 机构等级(1-一级,2-二级,3-三级,9-未定级)
  validFrom: Date // 有效期开始日期
  validTo: Date // 有效期结束日期
  status: number // 状态:1-启用,2-停用
}

// 药品机构标准库综合 API
export const InstitutionStandardApi = {
  // 查询药品机构标准库综合分页
  getInstitutionStandardPage: async (params: any) => {
    return await request.get({ url: `/drug/institution-standard/page`, params })
  },

  // 查询药品机构标准库综合详情
  getInstitutionStandard: async (id: number) => {
    return await request.get({ url: `/drug/institution-standard/get?id=` + id })
  },

  // 新增药品机构标准库综合
  createInstitutionStandard: async (data: InstitutionStandardVO) => {
    return await request.post({ url: `/drug/institution-standard/create`, data })
  },

  // 修改药品机构标准库综合
  updateInstitutionStandard: async (data: InstitutionStandardVO) => {
    return await request.put({ url: `/drug/institution-standard/update`, data })
  },

  // 删除药品机构标准库综合
  deleteInstitutionStandard: async (id: number) => {
    return await request.delete({ url: `/drug/institution-standard/delete?id=` + id })
  },

  // 导出药品机构标准库综合 Excel
  exportInstitutionStandard: async (params) => {
    return await request.download({ url: `/drug/institution-standard/export-excel`, params })
  },

  // 获取机构类别去重列表
  getInstitutionCategories: async (versionId?: number) => {
    return await request.get({ url: `/drug/institution-standard/institution-categories`, params: { versionId } })
  }
}