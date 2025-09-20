<template>
  <div class="step-content">
    <div class="submit-section">
      <el-result
        icon="info"
        title="数据已提交上报"
        sub-title="正在等待管理端进行后置质控审核"
      >
        <template #extra>
          <div class="submit-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="提交时间">
                {{ formatDateTime(submitInfo.submitTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="提交人">
                {{ submitInfo.submitter }}
              </el-descriptions-item>
              <el-descriptions-item label="数据条数">
                {{ submitInfo.totalRecords }}
              </el-descriptions-item>
              <el-descriptions-item label="审核状态">
                <el-tag type="warning">待审核</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <div class="submit-actions">
            <el-button @click="handleRefreshStatus">
              <el-icon><Refresh /></el-icon>
              刷新状态
            </el-button>
            <el-button @click="handleViewSubmitLog">查看提交日志</el-button>
          </div>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import type { Step3Props, Step3Emits } from './types'

// 定义组件名称
defineOptions({ name: 'Step3Submit' })

// Props
const props = defineProps<Step3Props>()

// Emits
const emit = defineEmits<Step3Emits>()

// 格式化日期时间
const formatDateTime = (date: Date | string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 刷新状态
const handleRefreshStatus = () => {
  emit('refresh-status')
}

// 查看提交日志
const handleViewSubmitLog = () => {
  emit('view-submit-log')
}
</script>

<style scoped>
.step-content {
  padding: 20px 0;
}

/* 提交区域样式 */
.submit-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 0;
}

.submit-info {
  margin: 20px 0;
}

.submit-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .submit-actions {
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