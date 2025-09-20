<template>
  <div class="step-content">
    <div class="qc-section">
      <div class="qc-header">
        <h4>前置质控结果</h4>
        <el-tag :type="preQCResult.passed ? 'success' : 'danger'">
          {{ preQCResult.passed ? '质控通过' : '质控未通过' }}
        </el-tag>
      </div>

      <!-- 质控详情表格 -->
      <el-table :data="preQCResult.details" stripe>
        <el-table-column prop="tableName" label="数据表" width="180" />
        <el-table-column prop="checkItem" label="检查项" width="200" />
        <el-table-column prop="result" label="检查结果" width="100">
          <template #default="{ row }">
            <el-tag :type="row.passed ? 'success' : 'danger'" size="small">
              {{ row.passed ? '通过' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="errorCount" label="错误数" width="100">
          <template #default="{ row }">
            <span :class="{ 'error-count': row.errorCount > 0 }">
              {{ row.errorCount || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="说明" min-width="300" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.errorCount > 0"
              link
              type="primary"
              size="small"
              @click="handleViewQCErrors(row)"
            >
              查看详情
            </el-button>
            <el-button
              v-if="!row.passed"
              link
              type="warning"
              size="small"
              @click="handleFixAndReupload(row)"
            >
              修复重传
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="qc-actions">
        <el-button @click="handleBackToUpload">返回上传</el-button>
        <el-button @click="handleDownloadQCReport">
          <el-icon><Download /></el-icon>
          下载质控报告
        </el-button>
        <el-button
          type="primary"
          @click="handleSubmitReport"
          :disabled="!preQCResult.passed"
        >
          提交上报
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Download } from '@element-plus/icons-vue'
import type { Step2Props, Step2Emits, QCDetail } from './types'

// 定义组件名称
defineOptions({ name: 'Step2PreQC' })

// Props
const props = defineProps<Step2Props>()

// Emits
const emit = defineEmits<Step2Emits>()

// 查看质控错误
const handleViewQCErrors = (row: QCDetail) => {
  emit('view-qc-errors', row)
}

// 修复并重新上传
const handleFixAndReupload = (row: QCDetail) => {
  emit('fix-and-reupload', row)
}

// 返回上传
const handleBackToUpload = () => {
  emit('back-to-upload')
}

// 下载质控报告
const handleDownloadQCReport = () => {
  emit('download-qc-report', 'pre')
}

// 提交上报
const handleSubmitReport = () => {
  emit('submit-report')
}
</script>

<style scoped>
.step-content {
  padding: 20px 0;
}

/* 质控区域样式 */
.qc-section {
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

.error-count {
  color: #f56c6c;
  font-weight: 500;
}

.qc-actions {
  margin-top: 20px;
  text-align: center;
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .qc-actions {
    flex-direction: column;
  }
}
</style>