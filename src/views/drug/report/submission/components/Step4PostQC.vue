<template>
  <div class="step-content">
    <div class="post-qc-section">
      <div class="qc-header">
        <h4>后置质控结果</h4>
        <el-tag :type="getPostQCStatusType()">
          {{ getPostQCStatusText() }}
        </el-tag>
      </div>

      <!-- 后置质控结果 -->
      <div v-if="postQCResult.status === 'rejected'" class="rejection-info">
        <el-alert
          title="数据被退回，请修正后重新上报"
          type="error"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="rejection-details">
              <p><strong>退回原因：</strong>{{ postQCResult.rejectReason }}</p>
              <p><strong>退回时间：</strong>{{ formatDateTime(postQCResult.rejectTime) }}</p>
              <p><strong>审核人：</strong>{{ postQCResult.reviewer }}</p>
            </div>
          </template>
        </el-alert>

        <!-- 需要修正的表格列表 -->
        <div class="fix-tables">
          <h5>需要修正的数据表：</h5>
          <el-table :data="postQCResult.errorTables" stripe>
            <el-table-column prop="tableName" label="数据表" width="180" />
            <el-table-column prop="errorType" label="错误类型" width="150" />
            <el-table-column prop="errorCount" label="错误数量" width="120" />
            <el-table-column prop="description" label="错误说明" min-width="300" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="handleDownloadErrorData(row)"
                >
                  下载错误数据
                </el-button>
                <el-button
                  link
                  type="warning"
                  size="small"
                  @click="handleReuploadTable(row)"
                >
                  重新上传
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="rejection-actions">
          <el-button @click="handleDownloadQCReport">
            <el-icon><Download /></el-icon>
            下载质控报告
          </el-button>
          <el-button type="primary" @click="handleRestartProcess">
            重新开始上报流程
          </el-button>
        </div>
      </div>

      <div v-else-if="postQCResult.status === 'processing'" class="processing-info">
        <el-result
          icon="info"
          title="后置质控进行中"
          sub-title="管理端正在对所有机构的数据进行综合质控"
        >
          <template #extra>
            <div class="processing-progress">
              <el-progress
                :percentage="postQCResult.progress"
                :stroke-width="20"
                :text-inside="true"
              />
              <p class="progress-hint">预计完成时间：{{ postQCResult.estimatedTime }}</p>
            </div>
          </template>
        </el-result>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Download } from '@element-plus/icons-vue'
import type { Step4Props, Step4Emits, ErrorTable } from './types'

// 定义组件名称
defineOptions({ name: 'Step4PostQC' })

// Props
const props = defineProps<Step4Props>()

// Emits
const emit = defineEmits<Step4Emits>()

// 格式化日期时间
const formatDateTime = (date: Date | string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 获取后置质控状态类型
const getPostQCStatusType = () => {
  const map: Record<string, string> = {
    processing: 'info',
    passed: 'success',
    rejected: 'danger'
  }
  return map[props.postQCResult.status] || 'info'
}

// 获取后置质控状态文本
const getPostQCStatusText = () => {
  const map: Record<string, string> = {
    processing: '审核中',
    passed: '审核通过',
    rejected: '已退回'
  }
  return map[props.postQCResult.status] || '未知'
}

// 下载错误数据
const handleDownloadErrorData = (row: ErrorTable) => {
  emit('download-error-data', row)
}

// 重新上传表格
const handleReuploadTable = (row: ErrorTable) => {
  emit('reupload-table', row)
}

// 重新开始流程
const handleRestartProcess = () => {
  emit('restart-process')
}

// 下载质控报告
const handleDownloadQCReport = () => {
  emit('download-qc-report', 'post')
}
</script>

<style scoped>
.step-content {
  padding: 20px 0;
}

/* 后置质控样式 */
.post-qc-section {
  max-width: 1200px;
  margin: 0 auto;
}

.qc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.qc-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.rejection-info {
  margin-top: 20px;
}

.rejection-details {
  line-height: 1.8;
}

.rejection-details p {
  margin: 8px 0;
}

.fix-tables {
  margin-top: 20px;
}

.fix-tables h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.rejection-actions {
  margin-top: 20px;
  text-align: center;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.processing-info {
  padding: 40px 0;
}

.processing-progress {
  margin-top: 20px;
}

.progress-hint {
  margin-top: 12px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .rejection-actions {
    flex-direction: column;
  }
}
</style>