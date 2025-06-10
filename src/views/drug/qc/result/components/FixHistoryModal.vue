<template>
  <el-dialog
    v-model="dialogVisible"
    title="数据修复历史"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="fix-history-container">
      <!-- 修复概览统计 -->
      <el-card class="summary-card" shadow="never" v-if="historySummary">
        <template #header>
          <div class="card-header">
            <el-icon><DataAnalysis /></el-icon>
            <span>修复概览</span>
          </div>
        </template>

        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">{{ historySummary.totalAttempts }}</div>
            <div class="summary-label">修复次数</div>
          </div>
          <div class="summary-item success">
            <div class="summary-value">{{ historySummary.successCount }}</div>
            <div class="summary-label">成功次数</div>
          </div>
          <div class="summary-item error">
            <div class="summary-value">{{ historySummary.failureCount }}</div>
            <div class="summary-label">失败次数</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">{{ historySummary.currentStatus }}</div>
            <div class="summary-label">当前状态</div>
          </div>
        </div>
      </el-card>

      <!-- 修复历史时间线 -->
      <el-card class="history-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Clock /></el-icon>
            <span>修复记录</span>
            <el-button size="small" @click="refreshHistory" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>

        <div class="history-content">
          <el-timeline v-if="fixHistory.length > 0">
            <el-timeline-item
              v-for="(record, index) in fixHistory"
              :key="index"
              :timestamp="formatDateTime(record.fixTime)"
              :type="getFixStatusType(record.status)"
              :hollow="record.status === 'pending'"
            >
              <div class="history-item">
                <!-- 修复记录头部信息 -->
                <div class="item-header">
                  <div class="header-left">
                    <span class="fix-method">{{ record.fixMethod }}</span>
                    <el-tag :type="getFixStatusType(record.status)" size="small" effect="plain">
                      {{ getFixStatusText(record.status) }}
                    </el-tag>
                  </div>
                  <div class="header-right">
                    <span class="operator">{{ record.operator }}</span>
                  </div>
                </div>

                <!-- 修复详情 -->
                <div class="item-content">
                  <div class="fix-description">{{ record.description }}</div>

                  <!-- 修复前后对比 -->
                  <div class="value-comparison" v-if="record.beforeValue !== undefined">
                    <div class="comparison-row">
                      <span class="comparison-label">修复前:</span>
                      <span class="before-value">{{ formatValue(record.beforeValue) }}</span>
                    </div>
                    <div class="comparison-row">
                      <span class="comparison-label">修复后:</span>
                      <span class="after-value">{{ formatValue(record.afterValue) }}</span>
                    </div>
                  </div>

                  <!-- 失败原因 -->
                  <div
                    class="failure-reason"
                    v-if="record.status === 'failed' && record.failureReason"
                  >
                    <div class="reason-label">失败原因:</div>
                    <div class="reason-content">{{ record.failureReason }}</div>
                  </div>

                  <!-- 修复结果统计 -->
                  <div class="fix-stats" v-if="record.stats">
                    <div class="stats-grid">
                      <div class="stat-item">
                        <span class="stat-label">影响记录:</span>
                        <span class="stat-value">{{ record.stats.affectedRecords }}条</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">处理时长:</span>
                        <span class="stat-value">{{ record.stats.duration }}秒</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="item-actions" v-if="record.status === 'success'">
                  <el-button type="text" size="small" @click="viewFixDetail(record)">
                    查看详情
                  </el-button>
                  <el-button
                    type="text"
                    size="small"
                    @click="rollbackFix(record)"
                    v-if="record.canRollback"
                  >
                    回滚修复
                  </el-button>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>

          <!-- 无历史记录提示 -->
          <div class="no-history" v-else>
            <el-icon class="no-history-icon"><DocumentCopy /></el-icon>
            <p class="no-history-text">暂无修复记录</p>
          </div>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportHistory" v-if="fixHistory.length > 0">
          <el-icon><Download /></el-icon>
          导出历史
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataAnalysis, Clock, Refresh, Download, DocumentCopy } from '@element-plus/icons-vue'

/**
 * 这个组件就像一个详细的病历档案，记录了数据从"生病"到"康复"的完整过程。
 * 每一次修复尝试都被完整记录下来，让用户能够追踪问题的解决历程。
 */

interface Props {
  resultId?: number // 质控结果ID，用于查询该结果的修复历史
}

const props = defineProps<Props>()

// ========================= 响应式数据 =========================

const dialogVisible = defineModel<boolean>({ default: false })
const loading = ref(false)

/** 历史概览统计 - 提供修复活动的整体概况 */
const historySummary = ref<any>(null)

/** 修复历史记录列表 - 按时间倒序排列的所有修复尝试 */
const fixHistory = ref<any[]>([])

// ========================= 监听器 =========================

/**
 * 当弹窗打开时加载修复历史数据
 * 这样确保用户每次查看都能看到最新的修复情况
 */
watch(dialogVisible, (visible) => {
  if (visible && props.resultId) {
    loadFixHistory()
  }
})

// ========================= 核心数据加载方法 =========================

/**
 * 加载修复历史数据
 * 这个方法协调加载概览统计和详细历史记录
 */
const loadFixHistory = async () => {
  if (!props.resultId) return

  loading.value = true
  try {
    // 并行加载概览和详细记录，提高加载效率
    await Promise.all([loadHistorySummary(), loadDetailHistory()])
  } catch (error) {
    ElMessage.error('加载修复历史失败')
    console.error('加载修复历史失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 加载历史概览统计
 * 提供修复活动的总体情况，让用户快速了解修复效果
 */
const loadHistorySummary = async () => {
  // 模拟API调用
  await new Promise((resolve) => setTimeout(resolve, 400))

  historySummary.value = {
    totalAttempts: 3, // 总共尝试了3次修复
    successCount: 2, // 其中2次成功
    failureCount: 1, // 1次失败
    currentStatus: '已修复' // 当前状态
  }
}

/**
 * 加载详细历史记录
 * 获取每次修复尝试的完整信息，包括修复方法、结果等
 */
const loadDetailHistory = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500))

  // 生成模拟的修复历史数据
  fixHistory.value = [
    {
      id: 3,
      fixTime: '2024-06-10 15:45:30',
      operator: '张三',
      fixMethod: '手动修复',
      status: 'success',
      description: '手动填入正确的药品名称',
      beforeValue: '',
      afterValue: '阿司匹林片',
      canRollback: true,
      stats: {
        affectedRecords: 1,
        duration: 15
      }
    },
    {
      id: 2,
      fixTime: '2024-06-10 14:30:15',
      operator: '系统',
      fixMethod: '自动修复',
      status: 'failed',
      description: '尝试从产品编码自动匹配药品名称',
      failureReason: '产品编码在药品字典中未找到对应记录',
      stats: {
        affectedRecords: 0,
        duration: 2
      }
    },
    {
      id: 1,
      fixTime: '2024-06-10 14:28:45',
      operator: '李四',
      fixMethod: '批量修复',
      status: 'success',
      description: '批量导入修复数据',
      beforeValue: '',
      afterValue: '阿司匹林',
      canRollback: false,
      stats: {
        affectedRecords: 5,
        duration: 8
      }
    }
  ]
}

// ========================= 业务操作方法 =========================

/**
 * 刷新历史记录
 * 重新加载最新的修复历史数据
 */
const refreshHistory = () => {
  loadFixHistory()
}

/**
 * 查看修复详情
 * 显示特定修复记录的详细信息
 */
const viewFixDetail = (record: any) => {
  const detailInfo = `
修复ID: ${record.id}
修复时间: ${record.fixTime}
操作人员: ${record.operator}
修复方法: ${record.fixMethod}
处理记录: ${record.stats?.affectedRecords}条
处理时长: ${record.stats?.duration}秒
修复说明: ${record.description}
  `

  ElMessageBox.alert(detailInfo, '修复详情', {
    confirmButtonText: '知道了',
    type: 'info'
  })
}

/**
 * 回滚修复
 * 撤销某次修复操作，将数据恢复到修复前的状态
 */
const rollbackFix = async (record: any) => {
  try {
    await ElMessageBox.confirm(`确认回滚修复操作？数据将恢复到修复前的状态。`, '确认回滚', {
      type: 'warning',
      confirmButtonText: '确认回滚',
      cancelButtonText: '取消'
    })

    // 模拟回滚操作
    ElMessage.success('修复已回滚')

    // 刷新历史记录
    await loadFixHistory()
  } catch (error) {
    // 用户取消操作
  }
}

/**
 * 导出历史记录
 * 将修复历史导出为文件，便于存档和分析
 */
const exportHistory = async () => {
  try {
    // 模拟导出操作
    ElMessage.success('修复历史导出已开始')
  } catch (error) {
    ElMessage.error('导出修复历史失败')
  }
}

// ========================= 工具方法 =========================

/**
 * 格式化日期时间显示
 */
const formatDateTime = (dateTime: string): string => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString()
}

/**
 * 格式化字段值显示
 * 处理空值、null等特殊情况的显示
 */
const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '(空值)'
  }
  if (value === '') {
    return '(空字符串)'
  }
  return String(value)
}

/**
 * 获取修复状态对应的标签类型
 * 这个方法为不同的修复状态返回相应的视觉样式
 */
const getFixStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    success: 'success', // 成功 - 绿色
    failed: 'danger', // 失败 - 红色
    pending: 'warning' // 进行中 - 黄色
  }
  return typeMap[status] || 'info'
}

/**
 * 获取修复状态的中文显示文本
 */
const getFixStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    success: '修复成功',
    failed: '修复失败',
    pending: '修复中'
  }
  return textMap[status] || '未知状态'
}
</script>

<style lang="scss" scoped>
.fix-history-container {
  max-height: 70vh;
  overflow-y: auto;
}

.summary-card,
.history-card {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;

  & > :last-child {
    margin-left: auto;
  }
}

/* 概览统计样式 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  .summary-item {
    text-align: center;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;

    .summary-value {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
      color: #303133;
    }

    .summary-label {
      font-size: 14px;
      color: #606266;
    }

    &.success .summary-value {
      color: #67c23a;
    }

    &.error .summary-value {
      color: #f56c6c;
    }
  }
}

/* 历史记录样式 */
.history-content {
  .history-item {
    background-color: #fafbfc;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 8px;

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .fix-method {
          font-weight: 600;
          color: #303133;
        }
      }

      .header-right {
        .operator {
          font-size: 14px;
          color: #909399;
        }
      }
    }

    .item-content {
      .fix-description {
        color: #606266;
        margin-bottom: 12px;
        line-height: 1.5;
      }

      .value-comparison {
        background-color: #f0f9ff;
        border: 1px solid #c6e2ff;
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 12px;

        .comparison-row {
          display: flex;
          align-items: center;
          margin-bottom: 6px;

          &:last-child {
            margin-bottom: 0;
          }

          .comparison-label {
            width: 80px;
            font-weight: 500;
            color: #606266;
          }

          .before-value {
            color: #f56c6c;
            font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
          }

          .after-value {
            color: #67c23a;
            font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
          }
        }
      }

      .failure-reason {
        background-color: #fef0f0;
        border: 1px solid #fbc4c4;
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 12px;

        .reason-label {
          font-weight: 500;
          color: #f56c6c;
          margin-bottom: 4px;
        }

        .reason-content {
          color: #7d2c2c;
        }
      }

      .fix-stats {
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;

          .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            background-color: #f5f7fa;
            border-radius: 4px;

            .stat-label {
              color: #606266;
            }

            .stat-value {
              color: #303133;
              font-weight: 500;
            }
          }
        }
      }
    }

    .item-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e4e7ed;
    }
  }
}

/* 无记录提示样式 */
.no-history {
  text-align: center;
  padding: 40px 20px;
  color: #909399;

  .no-history-icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .no-history-text {
    margin: 0;
    font-size: 14px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .fix-history-container {
    max-height: 60vh;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .comparison-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;

    .comparison-label {
      width: auto;
    }
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* 时间线样式优化 */
:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}

:deep(.el-timeline-item__content) {
  padding-bottom: 16px;
}
</style>
