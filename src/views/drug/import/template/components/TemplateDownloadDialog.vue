<template>
  <Dialog title="下载模板" v-model="dialogVisible" width="600px" class="template-download-dialog">
    <div class="download-container" v-loading="downloading">
      <!-- 模板信息 -->
      <div class="template-info" v-if="templateInfo">
        <el-alert
          :title="`正在配置下载：${templateInfo.templateName}`"
          type="info"
          :closable="false"
          class="template-alert"
        >
          <div class="template-meta">
            <span class="meta-item">模板编码：{{ templateInfo.templateCode }}</span>
            <span class="meta-item">表类型：{{ templateInfo.tableTypeName }}</span>
            <span class="meta-item">字段数量：{{ templateInfo.fieldCount }} 个</span>
          </div>
        </el-alert>
      </div>

      <!-- 下载配置 -->
      <el-form
        ref="formRef"
        :model="downloadConfig"
        :rules="formRules"
        label-width="120px"
        class="download-form"
      >
        <el-card shadow="never" class="config-card">
          <template #header>
            <div class="config-header">
              <Icon icon="ep:setting" class="header-icon" />
              <span class="header-title">下载配置</span>
            </div>
          </template>

          <el-form-item label="文件格式" prop="fileFormat">
            <el-radio-group v-model="downloadConfig.fileFormat">
              <el-radio value="xlsx">
                <div class="format-option">
                  <span class="format-name">Excel 2007+ (.xlsx)</span>
                  <span class="format-desc">推荐格式，兼容性好</span>
                </div>
              </el-radio>
              <el-radio value="xls">
                <div class="format-option">
                  <span class="format-name">Excel 97-2003 (.xls)</span>
                  <span class="format-desc">兼容老版本Excel</span>
                </div>
              </el-radio>
              <el-radio value="csv">
                <div class="format-option">
                  <span class="format-name">CSV 文件 (.csv)</span>
                  <span class="format-desc">纯文本格式，通用性强</span>
                </div>
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="示例数据" prop="includeExampleData">
            <el-switch
              v-model="downloadConfig.includeExampleData"
              active-text="包含示例数据"
              inactive-text="仅包含表头"
            />
            <div class="form-tip"> 包含示例数据可以帮助用户理解字段填写格式 </div>
          </el-form-item>

          <el-form-item
            label="示例行数"
            prop="exampleRows"
            v-if="downloadConfig.includeExampleData"
          >
            <el-input-number
              v-model="downloadConfig.exampleRows"
              :min="1"
              :max="20"
              style="width: 200px"
            />
            <div class="form-tip"> 设置Excel文件中包含的示例数据行数（1-20行） </div>
          </el-form-item>

          <el-form-item label="文件名称" prop="fileName">
            <el-input
              v-model="downloadConfig.fileName"
              placeholder="自定义文件名（不含扩展名）"
              maxlength="100"
              show-word-limit
            />
            <div class="form-tip"> 留空将使用默认文件名：{{ defaultFileName }} </div>
          </el-form-item>
        </el-card>

        <!-- 高级选项 -->
        <el-collapse v-model="activeCollapse" class="advanced-options">
          <el-collapse-item title="高级选项" name="advanced">
            <template #title>
              <div class="collapse-title">
                <Icon icon="ep:setting" class="mr-5px" />
                高级选项（可选）
              </div>
            </template>

            <div class="advanced-form">
              <el-form-item label="包含验证规则">
                <el-switch
                  v-model="downloadConfig.includeValidation"
                  active-text="是"
                  inactive-text="否"
                />
                <div class="form-tip"> 在Excel中添加数据验证规则，限制输入格式 </div>
              </el-form-item>

              <el-form-item label="冻结表头">
                <el-switch
                  v-model="downloadConfig.freezeHeader"
                  active-text="是"
                  inactive-text="否"
                />
                <div class="form-tip"> 冻结前3行（标题、说明、表头），滚动时保持可见 </div>
              </el-form-item>

              <el-form-item label="自动调整列宽">
                <el-switch
                  v-model="downloadConfig.autoColumnWidth"
                  active-text="是"
                  inactive-text="否"
                />
                <div class="form-tip"> 根据内容自动调整列宽，提高可读性 </div>
              </el-form-item>

              <el-form-item label="添加下拉选项" v-if="downloadConfig.includeValidation">
                <el-switch
                  v-model="downloadConfig.includeDropdown"
                  active-text="是"
                  inactive-text="否"
                />
                <div class="form-tip"> 为布尔类型字段添加下拉选择项（是/否） </div>
              </el-form-item>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-form>

      <!-- 预览信息 -->
      <div class="download-preview">
        <el-card shadow="never" class="preview-card">
          <template #header>
            <div class="preview-header">
              <Icon icon="ep:view" class="header-icon" />
              <span class="header-title">下载预览</span>
            </div>
          </template>

          <div class="preview-content">
            <div class="preview-item">
              <span class="preview-label">文件名：</span>
              <span class="preview-value">{{ finalFileName }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">文件格式：</span>
              <span class="preview-value">{{ getFormatDesc(downloadConfig.fileFormat) }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">文件结构：</span>
              <div class="file-structure">
                <div class="structure-item">第1行：标题文本</div>
                <div class="structure-item">第2行：说明文本</div>
                <div class="structure-item">第3行：字段表头</div>
                <div class="structure-item" v-if="downloadConfig.includeExampleData">
                  第4-{{ 3 + downloadConfig.exampleRows }}行：示例数据 ({{
                    downloadConfig.exampleRows
                  }}
                  行)
                </div>
                <div class="structure-item" v-else> 第4行及以后：用户填写数据 </div>
              </div>
            </div>
            <div class="preview-item">
              <span class="preview-label">特殊功能：</span>
              <div class="features-list">
                <el-tag v-if="downloadConfig.includeValidation" size="small" type="success">
                  数据验证
                </el-tag>
                <el-tag v-if="downloadConfig.freezeHeader" size="small" type="info">
                  冻结表头
                </el-tag>
                <el-tag v-if="downloadConfig.autoColumnWidth" size="small" type="warning">
                  自动列宽
                </el-tag>
                <el-tag v-if="downloadConfig.includeDropdown" size="small" type="primary">
                  下拉选项
                </el-tag>
                <span v-if="!hasAnyFeature" class="no-features">无</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button @click="resetConfig">
          <Icon icon="ep:refresh" class="mr-5px" />
          重置配置
        </el-button>
        <el-button type="primary" @click="handleDownload" :loading="downloading">
          <Icon icon="ep:download" class="mr-5px" />
          {{ downloading ? '下载中...' : '立即下载' }}
        </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ImportTemplateApi, ImportTemplateRespVO } from '@/api/drug/task/template'
import download from '@/utils/download'

defineOptions({ name: 'TemplateDownloadDialog' })

// ========================= 响应式数据 =========================
const dialogVisible = ref(false)
const downloading = ref(false)
const currentTemplateId = ref<number>()
const activeCollapse = ref<string[]>([])

const templateInfo = ref<ImportTemplateRespVO>()

const downloadConfig = reactive({
  fileFormat: 'xlsx',
  includeExampleData: true,
  exampleRows: 3,
  fileName: '',
  includeValidation: false,
  freezeHeader: true,
  autoColumnWidth: true,
  includeDropdown: false
})

const formRules = reactive({
  fileFormat: [{ required: true, message: '请选择文件格式', trigger: 'change' }],
  exampleRows: [
    { required: true, message: '请设置示例行数', trigger: 'blur' },
    { type: 'number', min: 1, max: 20, message: '示例行数必须在1-20之间', trigger: 'blur' }
  ]
})

const formRef = ref()

// ========================= 计算属性 =========================
const defaultFileName = computed(() => {
  if (!templateInfo.value) return '导入模板'
  return `${templateInfo.value.templateName}_导入模板`
})

const finalFileName = computed(() => {
  const name = downloadConfig.fileName || defaultFileName.value
  return `${name}.${downloadConfig.fileFormat}`
})

const hasAnyFeature = computed(() => {
  return (
    downloadConfig.includeValidation ||
    downloadConfig.freezeHeader ||
    downloadConfig.autoColumnWidth ||
    downloadConfig.includeDropdown
  )
})

// ========================= 核心方法 =========================

/** 打开弹窗 */
const open = async (templateId: number) => {
  dialogVisible.value = true
  currentTemplateId.value = templateId

  // 重置配置
  resetConfig()

  // 加载模板信息
  await loadTemplateInfo()
}

defineExpose({ open })

/** 加载模板信息 */
const loadTemplateInfo = async () => {
  if (!currentTemplateId.value) return

  try {
    templateInfo.value = await ImportTemplateApi.getImportTemplate(currentTemplateId.value)
  } catch (error) {
    console.error('加载模板信息失败:', error)
    ElMessage.error('加载模板信息失败')
  }
}

/** 处理下载 - 使用API调用，支持所有配置项 */
const handleDownload = async () => {
  try {
    // 表单验证
    const valid = await formRef.value?.validate()
    if (!valid) return

    downloading.value = true

    // 调用API下载模板
    const data = await ImportTemplateApi.downloadImportTemplateBlob(
      currentTemplateId.value!,
      downloadConfig.includeExampleData,
      downloadConfig.exampleRows,
      downloadConfig.fileFormat,
      downloadConfig.includeValidation,
      downloadConfig.freezeHeader,
      downloadConfig.autoColumnWidth,
      downloadConfig.includeDropdown
    )

    download.excel(data, finalFileName.value)

    ElMessage.success('模板下载成功')
    dialogVisible.value = false
  } catch (error) {
    console.error('下载失败:', error)

    // 详细的错误处理
    if (error?.response?.status === 404) {
      ElMessage.error('模板不存在或已被删除')
    } else if (error?.response?.status === 500) {
      ElMessage.error('服务器生成文件失败，请稍后重试')
    } else if (error?.code === 'ECONNABORTED') {
      ElMessage.error('下载超时，请检查网络连接')
    } else if (error?.message?.includes('Network Error')) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('下载失败，请重试')
    }
  } finally {
    downloading.value = false
  }
}
/** 重置配置 */
const resetConfig = () => {
  Object.assign(downloadConfig, {
    fileFormat: 'xlsx',
    includeExampleData: true,
    exampleRows: 3,
    fileName: '',
    includeValidation: false,
    freezeHeader: true,
    autoColumnWidth: true,
    includeDropdown: false
  })
  activeCollapse.value = []
  formRef.value?.resetFields()
}

// ========================= 工具方法 =========================

/** 获取格式描述 */
const getFormatDesc = (format: string): string => {
  const descriptions = {
    xlsx: 'Excel 2007+ 格式，支持高级功能',
    xls: 'Excel 97-2003 格式，兼容性强',
    csv: 'CSV 纯文本格式，通用性好'
  }
  return descriptions[format] || '未知格式'
}
</script>

<style scoped>
.template-download-dialog {
  --dialog-width: 600px;
}

.download-container {
  max-height: 70vh;
  overflow-y: auto;
}

/* 模板信息 */
.template-info {
  margin-bottom: 20px;
}

.template-alert {
  border-radius: 6px;
}

.template-meta {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
}

.meta-item {
  display: flex;
  align-items: center;
}

/* 配置卡片 */
.config-card {
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.config-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 16px;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 表单样式 */
.download-form {
  padding: 0;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.format-option {
  display: flex;
  flex-direction: column;
}

.format-name {
  font-weight: 600;
  color: #303133;
  line-height: 1.2; /* 减少行高 */
}

.format-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.2; /* 减少行高 */
}
/* 高级选项 */
.advanced-options {
  margin-bottom: 20px;
}

.collapse-title {
  display: flex;
  align-items: center;
  color: #606266;
  font-weight: 500;
}

.advanced-form {
  padding: 16px 0;
  border-left: 3px solid #e4e7ed;
  padding-left: 16px;
  margin-left: 8px;
}

/* 预览卡片 */
.preview-card {
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-content {
  line-height: 1.6;
}

.preview-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-label {
  font-weight: 600;
  color: #606266;
  min-width: 80px;
  flex-shrink: 0;
}

.preview-value {
  color: #303133;
  flex: 1;
}

.file-structure {
  flex: 1;
}

.structure-item {
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 12px;
  color: #606266;
}

.structure-item:last-child {
  margin-bottom: 0;
}

.features-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.no-features {
  color: #909399;
  font-style: italic;
}

/* 弹窗底部 */
.dialog-footer {
  display: flex;
  justify-content: end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .template-download-dialog {
    --dialog-width: 95vw;
  }

  .download-container {
    max-height: 60vh;
  }

  .template-meta {
    flex-direction: column;
    gap: 8px;
  }

  .format-option {
    align-items: flex-start;
  }

  .preview-item {
    flex-direction: column;
    gap: 4px;
  }

  .preview-label {
    min-width: auto;
  }

  .dialog-footer {
    flex-direction: column-reverse;
    gap: 8px;
  }
}

/* 单选框样式 */
:deep(.el-radio) {
  width: 100%;
  margin-bottom: 12px;
  margin-right: 0;
}

:deep(.el-radio:last-child) {
  margin-bottom: 0;
}

:deep(.el-radio__label) {
  width: 100%;
  padding-left: 8px;
}

/* 开关样式 */
:deep(.el-switch) {
  --el-switch-on-color: #67c23a;
  --el-switch-off-color: #dcdfe6;
}

/* 卡片样式优化 */
:deep(.el-card) {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

:deep(.el-card__header) {
  background: #fafbfc;
  border-bottom: 1px solid #e1e4e8;
  padding: 16px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}

/* 表单项样式 */
:deep(.el-form-item__label) {
  font-weight: 600;
  color: #24292f;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-input-number .el-input__wrapper) {
  border-radius: 6px;
}

/* 折叠面板样式 */
:deep(.el-collapse) {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

:deep(.el-collapse-item__header) {
  background: #f8f9fa;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-collapse-item__content) {
  padding: 16px;
  background: #fafbfc;
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
}
/* 标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}
</style>
