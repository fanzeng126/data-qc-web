<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <!-- 导入步骤指示器 -->
    <el-steps :active="currentStep" align-center class="mb-6">
      <el-step title="选择文件" description="上传压缩包文件" />
      <el-step title="文件验证" description="验证文件格式和内容" />
      <el-step title="确认导入" description="确认任务信息并开始导入" />
    </el-steps>

    <!-- 步骤1: 文件上传 -->
    <div v-show="currentStep === 0" class="step-content">
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="100px">
        <el-form-item label="任务名称" prop="taskName">
          <el-input
            v-model="uploadForm.taskName"
            placeholder="请输入任务名称，便于后续查找和管理"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="备注说明" prop="description">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="3"
            placeholder="可选：描述本次导入的数据内容、时间范围等信息"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="导入文件" prop="file" required>
          <div class="upload-area">
            <el-upload
              ref="uploadRef"
              class="upload-dragger"
              drag
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleFileChange"
              accept=".zip,.rar"
            >
              <div v-if="!uploadForm.file" class="upload-content">
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">
                  <p>拖拽文件到此处，或<em>点击上传</em></p>
                  <p class="upload-hint">仅支持 .zip 或 .rar 格式，文件大小不超过 100MB</p>
                </div>
              </div>
              <div v-else class="file-info">
                <el-icon class="file-icon"><Document /></el-icon>
                <div class="file-details">
                  <div class="file-name">{{ uploadForm.file.name }}</div>
                  <div class="file-size">{{ formatFileSize(uploadForm.file.size) }}</div>
                </div>
                <el-button
                  type="danger"
                  size="small"
                  circle
                  @click="removeFile"
                  class="remove-btn"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </el-upload>
          </div>
        </el-form-item>
      </el-form>

      <!-- 导入说明 -->
      <el-alert
        title="导入文件要求"
        type="info"
        :closable="false"
        class="mt-4"
      >
        <template #default>
          <div class="import-requirements">
            <p><strong>压缩包应包含以下5个Excel文件：</strong></p>
            <ul>
              <li>机构信息.xlsx - 医疗机构基本信息</li>
              <li>药品目录.xlsx - 药品目录信息</li>
              <li>药品入库.xlsx - 药品入库情况</li>
              <li>药品出库.xlsx - 药品出库情况</li>
              <li>药品使用.xlsx - 药品使用情况</li>
            </ul>
            <p class="download-template">
              <el-button type="primary" link @click="downloadTemplate">
                <el-icon><Download /></el-icon>
                下载标准模板
              </el-button>
            </p>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 步骤2: 文件验证 -->
    <div v-show="currentStep === 1" class="step-content">
      <div v-loading="validating" class="validation-content">
        <div v-if="!validating && validationResult" class="validation-result">
          <el-result
            :icon="validationResult.valid ? 'success' : 'error'"
            :title="validationResult.valid ? '文件验证通过' : '文件验证失败'"
            :sub-title="validationResult.validationMessage"
          >
            <template #extra>
              <div v-if="validationResult.valid" class="validation-success">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="文件名称">{{ validationResult.fileName }}</el-descriptions-item>
                  <el-descriptions-item label="文件大小">{{ formatFileSize(validationResult.fileSize) }}</el-descriptions-item>
                  <el-descriptions-item label="预期文件数">{{ validationResult.expectedFileCount }}</el-descriptions-item>
                  <el-descriptions-item label="实际文件数">{{ validationResult.actualFileCount }}</el-descriptions-item>
                </el-descriptions>
              </div>
              <div v-else class="validation-error">
                <div v-if="validationResult.missingFiles?.length" class="error-section">
                  <h4>缺失文件：</h4>
                  <el-tag v-for="file in validationResult.missingFiles" :key="file" type="danger" class="mr-2">
                    {{ file }}
                  </el-tag>
                </div>
                <div v-if="validationResult.extraFiles?.length" class="error-section">
                  <h4>多余文件：</h4>
                  <el-tag v-for="file in validationResult.extraFiles" :key="file" type="warning" class="mr-2">
                    {{ file }}
                  </el-tag>
                </div>
                <div v-if="validationResult.invalidFiles?.length" class="error-section">
                  <h4>无效文件：</h4>
                  <el-tag v-for="file in validationResult.invalidFiles" :key="file" type="info" class="mr-2">
                    {{ file }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-result>
        </div>
      </div>
    </div>

    <!-- 步骤3: 确认导入 -->
    <div v-show="currentStep === 2" class="step-content">
      <div class="import-confirmation">
        <el-descriptions title="任务信息确认" :column="1" border>
          <el-descriptions-item label="任务名称">{{ uploadForm.taskName }}</el-descriptions-item>
          <el-descriptions-item label="文件名称">{{ uploadForm.file?.name }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ formatFileSize(uploadForm.file?.size || 0) }}</el-descriptions-item>
          <el-descriptions-item label="预计处理时间">约 5-15 分钟</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ new Date().toLocaleString() }}</el-descriptions-item>
        </el-descriptions>

        <el-alert
          title="导入说明"
          type="warning"
          :closable="false"
          class="mt-4"
        >
          <template #default>
            <ul>
              <li>导入过程将按照：机构信息 → 药品目录 → 入库/出库/使用 的顺序进行</li>
              <li>导入过程中请勿关闭浏览器，可在进度监控中查看实时状态</li>
              <li>如遇到错误，系统支持智能重试和部分重新导入</li>
              <li>导入完成后会自动进行数据质控检查</li>
            </ul>
          </template>
        </el-alert>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="importing">取消</el-button>
        <el-button
          v-if="currentStep > 0"
          @click="prevStep"
          :disabled="importing || validating"
        >
          上一步
        </el-button>
        <el-button
          v-if="currentStep < 2"
          type="primary"
          @click="nextStep"
          :disabled="!canNextStep"
          :loading="validating"
        >
          {{ currentStep === 1 ? '验证文件' : '下一步' }}
        </el-button>
        <el-button
          v-if="currentStep === 2"
          type="primary"
          @click="startImport"
          :loading="importing"
        >
          开始导入
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Document, Close, Download } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadInstance } from 'element-plus'
import { DrugBatchImportApi, type ImportTaskCreateParams, type FileValidationResult } from '@/api/drug/task'

/** 组件名称定义 */
defineOptions({ name: 'BatchImportModal' })

/** 组件属性 */
interface Props {
  modelValue: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

/** 组件事件 */
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': [taskId: number, taskNo: string]
}>()

// ========================= 响应式数据 =========================

const dialogVisible = ref(false)
const currentStep = ref(0)
const importing = ref(false)
const validating = ref(false)

const uploadFormRef = ref<FormInstance>()
const uploadRef = ref<UploadInstance>()

/** 上传表单数据 */
const uploadForm = reactive({
  taskName: '',
  description: '',
  file: null as File | null
})

/** 表单验证规则 */
const uploadRules: FormRules = {
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 100, message: '任务名称长度在 2 到 100 个字符', trigger: 'blur' }
  ]
}

/** 文件验证结果 */
const validationResult = ref<FileValidationResult | null>(null)

// ========================= 计算属性 =========================

const dialogTitle = computed(() => {
  const titles = ['选择导入文件', '验证文件内容', '确认开始导入']
  return `批量导入 - ${titles[currentStep.value]}`
})

const canNextStep = computed(() => {
  switch (currentStep.value) {
    case 0:
      return uploadForm.taskName && uploadForm.file
    case 1:
      return validationResult.value?.valid
    default:
      return false
  }
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

// ========================= 核心方法 =========================

/** 文件改变处理 */
const handleFileChange = (file: any) => {
  // 验证文件类型
  const allowedTypes = ['.zip', '.rar']
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

  if (!allowedTypes.includes(fileExtension)) {
    ElMessage.error('仅支持 .zip 或 .rar 格式的文件')
    return false
  }

  // 验证文件大小 (100MB)
  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 100MB')
    return false
  }

  uploadForm.file = file.raw
  ElMessage.success('文件选择成功')
}

/** 移除文件 */
const removeFile = () => {
  uploadForm.file = null
  validationResult.value = null
  if (currentStep.value > 0) {
    currentStep.value = 0
  }
}

/** 下一步 */
const nextStep = async () => {
  if (currentStep.value === 0) {
    // 验证表单
    const valid = await uploadFormRef.value?.validate()
    if (!valid) return

    // 进入文件验证步骤
    currentStep.value = 1
    await validateFile()
  } else if (currentStep.value === 1) {
    // 进入确认导入步骤
    currentStep.value = 2
  }
}

/** 上一步 */
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

/** 验证文件 */
const validateFile = async () => {
  if (!uploadForm.file) return

  validating.value = true
  try {
    validationResult.value = await DrugBatchImportApi.validateImportFile(uploadForm.file)

    if (validationResult.value.valid) {
      ElMessage.success('文件验证通过，可以开始导入')
    } else {
      ElMessage.error('文件验证失败，请检查文件内容')
    }
  } catch (error) {
    ElMessage.error('文件验证失败，请稍后重试')
    console.error('文件验证失败:', error)
  } finally {
    validating.value = false
  }
}

/** 开始导入 */
const startImport = async () => {
  if (!uploadForm.file) return

  try {
    await ElMessageBox.confirm(
      '确认开始导入？导入过程可能需要几分钟时间，请耐心等待。',
      '确认导入',
      {
        type: 'warning',
        confirmButtonText: '开始导入',
        cancelButtonText: '再想想'
      }
    )

    importing.value = true

    const params: ImportTaskCreateParams = {
      taskName: uploadForm.taskName,
      description: uploadForm.description || undefined
    }

    const result = await DrugBatchImportApi.createImportTask(uploadForm.file, params)

    ElMessage.success('导入任务创建成功，正在后台处理中')

    // 发送成功事件，传递任务信息
    emit('success', result.taskId, result.taskNo)

    // 关闭对话框
    handleClose()

  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('创建导入任务失败：' + (error.message || '未知错误'))
      console.error('创建导入任务失败:', error)
    }
  } finally {
    importing.value = false
  }
}

/** 下载模板 */
const downloadTemplate = async () => {
  try {
    await DrugBatchImportApi.downloadTemplate('STANDARD')
    ElMessage.success('模板下载成功')
  } catch (error) {
    ElMessage.error('模板下载失败')
    console.error('下载模板失败:', error)
  }
}

/** 重置表单 */
const resetForm = () => {
  currentStep.value = 0
  importing.value = false
  validating.value = false
  validationResult.value = null

  uploadForm.taskName = ''
  uploadForm.description = ''
  uploadForm.file = null

  uploadFormRef.value?.resetFields()
}

/** 关闭对话框 */
const handleClose = () => {
  if (importing.value) {
    ElMessage.warning('导入正在进行中，无法关闭')
    return
  }

  dialogVisible.value = false
}

// ========================= 工具方法 =========================

/** 格式化文件大小 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.step-content {
  min-height: 300px;
  padding: 20px 0;
}

.upload-area {
  width: 100%;
}

.upload-dragger {
  width: 100%;
}

.upload-content {
  padding: 40px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.upload-text p {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

.file-info {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 6px;
  position: relative;
}

.file-icon {
  font-size: 32px;
  color: #409eff;
  margin-right: 12px;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
}

.import-requirements ul {
  margin: 8px 0;
  padding-left: 20px;
}

.import-requirements li {
  margin: 4px 0;
  color: #606266;
}

.download-template {
  margin-top: 12px;
}

.validation-content {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.validation-result {
  width: 100%;
}

.validation-success {
  margin-top: 20px;
}

.validation-error .error-section {
  margin-bottom: 16px;
}

.validation-error h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
}

.import-confirmation {
  padding: 20px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

:deep(.el-descriptions__title) {
  font-weight: 600;
  color: #303133;
}

:deep(.el-upload-dragger) {
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
}

:deep(.el-upload-dragger.is-dragover) {
  background-color: rgba(64, 158, 255, 0.06);
  border: 2px dashed #409eff;
}
</style>
