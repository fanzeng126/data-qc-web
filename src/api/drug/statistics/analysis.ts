import request from '@/config/axios'

// 药品统计分析 API 封装
// 统一使用项目内 request 封装，自动携带鉴权与基础路径

export const AnalysisApi = {
  // 基础筛选项
  hospitalList: (params?: any) => {
    return request.get<any[]>({ url: '/analysis/hospitalList', params })
  },
  regionList: (params?: any) => {
    return request.get<any[]>({ url: '/analysis/regionList', params })
  },

  // 概览与趋势
  drugAllocationRate: (params?: any) => {
    return request.get<any[]>({ url: '/analysis/drugAllocationRate', params })
  },
  proportionTrend: (params?: any) => {
    return request.get<any[]>({ url: '/analysis/proportionTrend', params })
  },
  keyDrugsProportionTrend: (params?: any) => {
    return request.get<any[]>({ url: '/analysis/keyDrugsProportionTrend', params })
  },

  // 基药
  basicDrugsEquipRate: (params?: any) => {
    return request.get<any[]>({ url: '/analysis/basicDrugsEquipRate', params })
  },
  basicDrugsUsageRate: (params?: any) => {
    return request.get<any[]>({ url: '/analysis/basicDrugsUsageRate', params })
  },

  // 地区与同比
  basisDrugUsageByRegion: (params?: any) => {
    return request.get<any[]>({ url: '/analysis/basisDrugUsageByRegion', params })
  },
  drugUsageYearOnYear: (params?: any) => {
    return request.get<any[]>({ url: '/analysis/drugUsageYearOnYear', params })
  },

  // 定基比
  drugUsageFixedBase: (params: { baseYear: number }) => {
    return request.get<any[]>({ url: '/analysis/drugUsageFixedBase', params })
  },

  // 省内城市对比
  provincialCityComparison: (params: { domainCode: string }) => {
    return request.get<any[]>({ url: '/analysis/provincialCityComparison', params })
  },

  // 机构效率
  hospitalEfficiencyComparison: (params?: any) => {
    return request.get<any[]>({ url: '/analysis/hospitalEfficiencyComparison', params })
  }
}

export type { }


