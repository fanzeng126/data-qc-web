<template>
  <el-dialog
    v-model="dialogVisible"
    title="重试任务确认"
    width="600px"
    :close-on-click-modal="false"
    class="retry-confirm-dialog"
  >
    <div class="retry-content">
      <!-- 任务信息显示 -->
      <div class="task-info-section">
        <el-alert
          title="即将重试的任务信息"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="task-info">
              <div class="info-row">
                <span class="info-label">任务编号:</span>
                <span class="info-value">{{ task?.taskNo }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">任务名称:</span>
                <span class="info-value">{{ task?.taskName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">当前状态:</span>
                <el-tag :type="getStatusTagType(task?.status)" size="small">
                  {{ task?.statusDisplay }}
                </el-tag>
              </div>
              <div class="info-row">
                <span class="info-label">失败记录:</span>
                <span class="info-value error">{{ formatNumber(task?.failedRecords) }} 条</span>
              </div>
            </div>
          </template>
        </el-alert>
      </div>

      <!-- 重试策略选择 -->
      <div class="retry-strategy-section">
        <h4 class="section-title">
          <el-icon><Setting /></el-icon>
          选择重试策略
        </h4>

        <el-radio-group v-model="retryForm.retryType" class="retry-options">
          <div class="retry-option">
            <el-radio value="ALL" size="large">
              <div class="option-content">
                <div class="option-title">全部重试</div>
                <div class="option-description">重新执行整个导入流程，包括成功的部分</div>
                <div class="option-note">适用于：系统环境问题、配置变更后的重试</div>
              </div>
            </el-radio>
          </div>

          <div class="retry-option">
            <el-radio value="FAILED" size="large">
              <div class="option-content">
                <div class="option-title">仅失败部分重试 <el-tag type="success" size="small">推荐</el-tag></div>
                <div class="option-description">只重新处理失败的文件和记录，跳过已成功的部分</div>
                <div class="option-note">适用于：数据问题、网络超时等局部问题</div>
              </div>
            </el-radio>
          </div>

          <div class="retry-option">
            <el-radio value="FILE_TYPE" size="large">
              <div class="option-content">
                <div class="option-title">指定文件类型重试</div>
                <div class="option-description">只重新处理指定类型的文件</div>
                <div class="option-note">适用于：特定文件格式问题、业务规则调整</div>
              </div>
            </el-radio>
          </div>
        </el-radio-group>

        <!-- 指定文件类型选择 -->
        <div v-if="retryForm.retryType === 'FILE_TYPE'" class="file-type-selection">
          <el-form-item label="选择文件类型" required>
            <el-select
              v-model="retryForm.fileType"
              placeholder="请选择要重试的文件类型"
              style="width: 100%"
            >
              <el-option label="机构信息" value="HOSPITAL_INFO" />
              <el-option label="药品目录" value="DRUG_CATALOG" />
              <el-option label="药品入库" value="DRUG_INBOUND" />
              <el-option label="药品出库" value="DRUG_OUTBOUND" />
              <el-option label="药品使用" value="DRUG_USAGE" />
            </el-select>
          </el-form-item>
        </div>
      </div>

      <!-- 重试说明 -->
      <div class="retry-instructions-section">
        <h4 class="section-title">
          <el-icon><InfoFilled /></el-icon>
          重试说明
        </h4>

        <div class="instructions-content">
          <el-alert
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              <ul class="instruction-list">
                <li>重试将根据选择的策略重新执行相应的处理步骤</li>
                <li>重试过程中会保留原始任务的基本信息和配置</li>
                <li>系统会自动记录重试历史，便于后续问题追踪</li>
                <li>重试期间建议不要关闭浏览器，可通过进度监控查看状态</li>
                <li>如果重试仍然失败，建议检查数据格式或联系系统管理员</li>
              </ul>
            </template>
          </el-alert>
        </div>
      </div>

      <!-- 备注说明 -->
      <div class="retry-note-section">
        <el-form-item label="备注说明（可选）">
          <el-input
            v-model="retryForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入重试原因或备注信息，便于后续查看和分析"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </div>

      <!-- 预期影响说明 -->
      <div class="impact-estimation">
        <div class="estimation-card">
          <div class="estimation-header">
            <el-icon class="estimation-icon"><TrendCharts /></el-icon>
            <span class="estimation-title">预期影响评估</span>
          </div>
          <div class="estimation-content">
            <div class="estimation-item">
              <span class="estimation-label">预计处理时间:</span>
              <span class="estimation-value">{{ getEstimatedTime() }}</span>
            </div>
            <div class="estimation-item">
              <span class="estimation-label">影响记录数:</span>
              <span class="estimation-value">{{ getAffectedRecords() }} 条</span>
            </div>
            <div class="estimation-item">
              <span class="estimation-label">资源消耗:</span>
              <span class="estimation-value">{{ getResourceUsage() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          @click="handleConfirm"
          :disabled="!isFormValid"
          :loading="confirming"
        >
          确认重试
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting, InfoFilled, TrendCharts } from '@element-plus/icons-vue'
import type { ImportTaskRespVO, ImportRetryReqVO } from '@/api/drug/task'
import { TASK_STATUS } from '@/api/drug/task'

/** 组件名称定义 */
defineOptions({ name: 'RetryConfirmDialog' })

/** 组件属性 */
interface Props {
  modelValue: boolean
  task?: ImportTaskRespVO
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

/** 组件事件 */
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [params: ImportRetryReqVO]
}>()

// ========================= 响应式数据 =========================

const dialogVisible = ref(false)
const confirming = ref(false)

/** 重试表单数据 */
const retryForm = reactive({
  retryType: 'FAILED' as 'ALL' | 'FAILED' | 'FILE_TYPE',
  fileType: undefined as string | undefined,
  reason: ''
})

// ========================= 计算属性 =========================

/** 表单验证 */
const isFormValid = computed(() => {
  if (retryForm.retryType === 'FILE_TYPE') {
    return !!retryForm.fileType
  }
  return true
})

// ========================= 监听器 =========================

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    resetForm()
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

watch(() => retryForm.retryType, () => {
  // 切换重试类型时清空文件类型选择
  if (retryForm.retryType !== 'FILE_TYPE') {
    retryForm.fileType = undefined
  }
})

// ========================= 核心方法 =========================

/** 确认重试 */
const handleConfirm = async () => {
  if (!props.task || !isFormValid.value) {
    return
  }

  confirming.value = true
  try {
    const params: ImportRetryReqVO = {
      taskId: props.task.id,
      retryType: retryForm.retryType,
      fileType: retryForm.fileType,
      reason: retryForm.reason || undefined
    }

    emit('confirm', params)
    handleCancel()

  } catch (error) {
    ElMessage.error('重试确认失败')
  } finally {
    confirming.value = false
  }
}

/** 取消对话框 */
const handleCancel = () => {
  dialogVisible.value = false
}

/** 重置表单 */
const resetForm = () => {
  retryForm.retryType = 'FAILED'
  retryForm.fileType = undefined
  retryForm.reason = ''
}

// ========================= 工具方法 =========================

/** 获取状态标签类型 */
const getStatusTagType = (status?: number) => {
  if (!status) return 'info'

  const typeMap = {
    [TASK_STATUS.PENDING]: 'info',
    [TASK_STATUS.EXTRACTING]: 'warning',
    [TASK_STATUS.IMPORTING]: 'warning',
    [TASK_STATUS.QC_CHECKING]: 'warning',
    [TASK_STATUS.COMPLETED]: 'success',
    [TASK_STATUS.FAILED]: 'danger',
    [TASK_STATUS.PARTIAL_SUCCESS]: 'primary',
    [TASK_STATUS.CANCELLED]: 'info'
  }
  return typeMap[status] || 'info'
}

/** 格式化数字 */
const formatNumber = (num?: number) => {
  if (!num) return '0'
  return num.toLocaleString()
}

/** 获取预计处理时间 */
const getEstimatedTime = () => {
  if (!props.task) return '未知'

  const timeMap = {
    'ALL': '10-20分钟',
    'FAILED': '3-8分钟',
    'FILE_TYPE': '2-5分钟'
  }

  return timeMap[retryForm.retryType] || '未知'
}

/** 获取影响记录数 */
const getAffectedRecords = () => {
  if (!props.task) return '0'

  switch (retryForm.retryType) {
    case 'ALL':
      return formatNumber(props.task.totalRecords)
    case 'FAILED':
      return formatNumber(props.task.failedRecords)
    case 'FILE_TYPE':
      // 这里可以根据文件类型估算记录数
      return '待计算'
    default:
      return '0'
  }
}

/** 获取资源消耗 */
const getResourceUsage = () => {
  const usageMap = {
    'ALL': '高',
    'FAILED': '中等',
    'FILE_TYPE': '较低'
  }

  return usageMap[retryForm.retryType] || '未知'
}
</script>

<style scoped>
.retry-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.task-info-section {
  margin-bottom: 4px;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.info-label {
  color: #606266;
  font-weight: 500;
  min-width: 80px;
}

.info-value {
  color: #303133;
}

.info-value.error {
  color: #f56c6c;
  font-weight: 600;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.retry-options {
  width: 100%;
}

.retry-option {
  margin-bottom: 16px;
  padding: 16px;
  border: 2px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.retry-option:hover {
  border-color: #c6e2ff;
  background-color: #f0f9ff;
}

.retry-option:has(.el-radio.is-checked) {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.option-content {
  margin-left: 24px;
}

.option-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-description {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
  line-height: 1.4;
}

.option-note {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

.file-type-selection {
  margin-top: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.instructions-content {
  margin-top: 12px;
}

.instruction-list {
  margin: 0;
  padding-left: 20px;
  color: #606266;
}

.instruction-list li {
  margin-bottom: 6px;
  line-height: 1.5;
}

.retry-note-section {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.impact-estimation {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #b3e5fc;
}

.estimation-card {
  background: white;
  border-radius: 6px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.estimation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.estimation-icon {
  color: #409eff;
  font-size: 18px;
}

.estimation-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.estimation-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.estimation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.estimation-label {
  color: #606266;
}

.estimation-value {
  color: #303133;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .retry-content {
    gap: 16px;
  }

  .option-content {
    margin-left: 20px;
  }

  .retry-option {
    padding: 12px;
  }

  .impact-estimation {
    padding: 16px;
  }

  .estimation-content {
    flex-direction: column;
  }

  .estimation-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

/* 组件样式优化 */
:deep(.el-radio) {
  align-items: flex-start;
  margin-right: 0;
  width: 100%;
}

:deep(.el-radio__input) {
  margin-top: 2px;
}

:deep(.el-radio__label) {
  width: 100%;
  padding-left: 8px;
}

:deep(.el-alert) {
  border-radius: 6px;
}

:deep(.el-alert__content) {
  width: 100%;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #303133;
}

:deep(.el-textarea__inner) {
  border-radius: 6px;
}

:deep(.el-select) {
  width: 100%;
}

/* 动画效果 */
.retry-option {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.estimation-card {
  transition: transform 0.2s ease;
}

.estimation-card:hover {
  transform: translateY(-2px);
}

/* 焦点样式 */
.retry-option:focus-within {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}
</style>
