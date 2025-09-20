<template>
  <div class="step-content">
    <div class="complete-section">
      <el-result
        icon="success"
        title="数据上报完成"
        sub-title="您的数据已成功上报并通过所有质控检查"
      >
        <template #extra>
          <div class="complete-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="完成时间">
                {{ formatDateTime(completeInfo.completeTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="上报批次">
                {{ completeInfo.batchNo }}
              </el-descriptions-item>
              <el-descriptions-item label="数据质量评分">
                <el-rate
                  v-model="completeInfo.qualityScore"
                  disabled
                  show-score
                  text-color="#ff9900"
                />
              </el-descriptions-item>
              <el-descriptions-item label="审核意见">
                {{ completeInfo.reviewComment || '无' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="complete-actions">
            <el-button type="primary" @click="handleDownloadReports">
              <el-icon><Download /></el-icon>
              下载质控报告
            </el-button>
            <el-button @click="handleDownloadOriginalFiles">
              <el-icon><Download /></el-icon>
              下载原始文件
            </el-button>
            <el-button @click="handleViewReportHistory">
              查看历史记录
            </el-button>
          </div>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Download } from '@element-plus/icons-vue'
import type { Step5Props, Step5Emits } from './types'

// 定义组件名称
defineOptions({ name: 'Step5Complete' })

// Props
const props = defineProps<Step5Props>()

// Emits
const emit = defineEmits<Step5Emits>()

// 格式化日期时间
const formatDateTime = (date: Date | string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 下载质控报告
const handleDownloadReports = () => {
  emit('download-reports')
}

// 下载原始文件
const handleDownloadOriginalFiles = () => {
  emit('download-original-files')
}

// 查看历史记录
const handleViewReportHistory = () => {
  emit('view-report-history')
}
</script>

<style scoped>
.step-content {
  padding: 20px 0;
}

/* 完成区域样式 */
.complete-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 0;
}

.complete-info {
  margin: 20px 0;
}

.complete-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .complete-actions {
    flex-direction: column;
  }

  :deep(.el-descriptions) {
    .el-descriptions__body {
      display: block;
    }
    .el-descriptions__item {
      display: block;
      width: 100% !important;
    }
  }
}
</style>