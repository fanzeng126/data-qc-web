/**
 * 进度条统一工具函数
 * 统一进度条状态和样式
 */

/**
 * 根据任务状态获取Element Plus进度条的status属性
 * 状态规则：
 * - 0,1,2,3,4 为处理中 - 显示默认样式（蓝色）
 * - 5,7 为成功 - 显示success样式（绿色）
 * - 6 为失败 - 显示exception样式（红色）
 * - 8 为取消 - 显示warning样式（橙色）
 */
export function getProgressStatus(status: number): 'success' | 'exception' | 'warning' | undefined {
  // 成功状态：5=完成成功, 7=部分成功
  if (status === 5 || status === 7) {
    return 'success'
  }
  
  // 失败状态：6=失败
  if (status === 6) {
    return 'exception'
  }
  
  // 取消状态：8=取消
  if (status === 8) {
    return 'warning'
  }
  
  // 处理中状态：0,1,2,3,4 - 返回undefined显示默认蓝色
  return undefined
}

/**
 * 根据任务状态获取进度条颜色
 * 用于自定义颜色场景
 */
export function getProgressColor(status: number): string {
  // 成功状态
  if (status === 5 || status === 7) {
    return '#67c23a' // 绿色
  }
  
  // 失败状态
  if (status === 6) {
    return '#f56c6c' // 红色
  }
  
  // 取消状态
  if (status === 8) {
    return '#e6a23c' // 橙色
  }
  
  // 处理中状态
  return '#409eff' // 蓝色
}

/**
 * 获取进度条描述文本
 */
export function getProgressText(status: number, percentage: number = 0): string {
  switch (status) {
    case 0: return '等待中'
    case 1: return '文件解压中'
    case 2: return '数据解析中'
    case 3: return '质控检查中'
    case 4: return '导入处理中'
    case 5: return '处理完成'
    case 6: return '处理失败'
    case 7: return '部分完成'
    case 8: return '已取消'
    default: return `${percentage}%`
  }
}

/**
 * 判断任务是否已完成（包括成功、失败、取消）
 */
export function isTaskCompleted(status: number): boolean {
  return status >= 5 // 5=成功, 6=失败, 7=部分成功, 8=取消
}

/**
 * 判断任务是否正在处理中
 */
export function isTaskProcessing(status: number): boolean {
  return status >= 0 && status <= 4
}

/**
 * 安全的进度百分比处理，确保在0-100范围内
 */
export function safeProgressPercentage(percentage: number | null | undefined): number {
  if (typeof percentage !== 'number' || isNaN(percentage)) {
    return 0
  }
  
  if (percentage < 0) return 0
  if (percentage > 100) return 100
  
  return Math.round(percentage)
}