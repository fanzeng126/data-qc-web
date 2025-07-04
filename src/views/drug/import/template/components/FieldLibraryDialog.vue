<template>
  <Dialog
    title="从字段库添加字段"
    v-model="dialogVisible"
    width="800px"
    class="field-library-dialog"
  >
    <div class="library-container" v-loading="loading">
      <!-- 搜索和筛选 -->
      <div class="search-section">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索字段名称或编码"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <Icon icon="ep:search" />
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filterType" placeholder="字段类型" clearable @change="handleFilter">
              <el-option label="全部类型" value="" />
              <el-option
                v-for="(name, type) in FIELD_TYPE_NAMES"
                :key="type"
                :label="name"
                :value="type"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="filterScope"
              placeholder="适用范围"
              clearable
              @change="handleFilter"
            >
              <el-option label="全部范围" value="" />
              <el-option label="通用字段" value="common" />
              <el-option label="当前表类型" value="current" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="refreshLibrary" :loading="loading">
              <Icon icon="ep:refresh" class="mr-5px" />
              刷新
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 字段库列表 -->
      <div class="library-content">
        <div class="selection-info">
          <span class="info-text">
            共 {{ filteredFields.length }} 个字段，已选择 {{ selectedFields.length }} 个
            <span v-if="filteredFields.filter((f) => f.isUsed).length > 0" class="used-info">
              ({{ filteredFields.filter((f) => f.isUsed).length }} 个已使用)
            </span>
          </span>
          <!-- 批量操作按钮区域 -->
          <div class="batch-actions">
            <el-button size="small" @click="selectAll" :disabled="!getAvailableFields().length">
              全选可用 ({{ getAvailableFields().length }})
            </el-button>
            <el-button size="small" @click="clearSelection" :disabled="!selectedFields.length">
              清空
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="selectCommonFields"
              :disabled="!getAvailableCommonFields().length"
            >
              选择常用字段 ({{ getAvailableCommonFields().length }})
            </el-button>
          </div>
        </div>

        <div class="field-list" v-if="filteredFields.length">
          <!-- 字段列表中的字段项 -->
          <div
            v-for="field in filteredFields"
            :key="field.fieldCode"
            class="field-item"
            :class="{
              selected: isSelected(field),
              common: field.isCommon,
              used: field.isUsed,
              disabled: field.isUsed
            }"
            @click="handleFieldClick(field)"
          >
            <div class="field-checkbox">
              <el-checkbox
                :model-value="isSelected(field)"
                :disabled="Boolean(field.isUsed)"
                @change="(checked) => handleCheckboxChange(field, checked)"
                @click.stop
              />
            </div>

            <div class="field-info">
              <div class="field-header">
                <span class="field-name">{{ field.fieldName }}</span>
                <span class="field-code">{{ field.fieldCode }}</span>
                <el-tag
                  :type="FIELD_TYPE_COLORS[field.fieldType] || 'info'"
                  size="small"
                  class="field-type"
                >
                  {{ field.fieldTypeName || FIELD_TYPE_NAMES[field.fieldType] || field.fieldType }}
                </el-tag>
                <el-tag v-if="field.isCommon" type="warning" size="small" class="common-tag">
                  常用字段
                </el-tag>
                <el-tag v-if="field.isRequired" type="danger" size="small" class="required-tag">
                  必填
                </el-tag>
                <el-tag v-if="field.isUsed" type="info" size="small" class="used-tag">
                  已使用
                </el-tag>
                <span v-if="field.usageCount && field.usageCount > 0" class="usage-count">
                  使用{{ field.usageCount }}次
                </span>
              </div>

              <div class="field-details" v-if="field.description || field.exampleValue">
                <div v-if="field.description" class="field-desc">
                  {{ field.description }}
                </div>
                <div v-if="field.exampleValue" class="field-example">
                  示例：{{ field.exampleValue }}
                </div>
              </div>

              <!-- 已使用字段的提示 -->
              <div v-if="field.isUsed" class="used-notice">
                <Icon icon="ep:info-filled" class="mr-5px" />
                该字段已在当前模板中使用，无法重复添加
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-library">
          <el-empty description="暂无字段数据">
            <el-button type="primary" @click="refreshLibrary">
              <Icon icon="ep:refresh" class="mr-5px" />
              重新加载
            </el-button>
          </el-empty>
        </div>
      </div>

      <!-- 选中字段预览 -->
      <div class="selection-preview" v-if="selectedFields.length">
        <div class="preview-header">
          <h4>已选择字段预览 ({{ selectedFields.length }})</h4>
          <el-button size="small" text @click="clearSelection">
            <Icon icon="ep:close" class="mr-5px" />
            清空选择
          </el-button>
        </div>
        <div class="preview-list">
          <el-tag
            v-for="field in selectedFields"
            :key="field.fieldCode"
            closable
            @close="removeSelection(field)"
            class="preview-tag"
          >
            {{ field.fieldName }} ({{ field.fieldCode }})
          </el-tag>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!selectedFields.length">
          <Icon icon="ep:check" class="mr-5px" />
          确定添加 ({{ selectedFields.length }})
        </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { debounce } from 'lodash-es'
import {
  TemplateFieldApi,
  FieldLibraryApi,
  FieldLibraryVO,
  FIELD_TYPE_NAMES,
  FIELD_TYPE
} from '@/api/drug/task/template'

defineOptions({ name: 'FieldLibraryDialog' })

// ========================= Props =========================
interface Props {
  templateId?: number
}

const props = withDefaults(defineProps<Props>(), {})

// ========================= 响应式数据 =========================
const dialogVisible = ref(false)
const loading = ref(false)
const currentTableType = ref<number>()

const searchKeyword = ref('')
const filterType = ref<string | ''>('')
const filterScope = ref<string>('')

const allFields = ref<FieldLibraryVO[]>([])
const selectedFields = ref<FieldLibraryVO[]>([])

// 字段类型颜色映射
const FIELD_TYPE_COLORS = {
  [FIELD_TYPE.TEXT]: 'primary',
  [FIELD_TYPE.NUMBER]: 'success',
  [FIELD_TYPE.DATE]: 'warning',
  [FIELD_TYPE.DECIMAL]: 'info',
  [FIELD_TYPE.BOOLEAN]: 'danger'
}

// ========================= 计算属性 =========================
const filteredFields = computed(() => {
  let fields = allFields.value

  // 关键字搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    fields = fields.filter(
      (field) =>
        field.fieldName.toLowerCase().includes(keyword) ||
        field.fieldCode.toLowerCase().includes(keyword)
    )
  }

  // 字段类型筛选
  if (filterType.value !== '') {
    fields = fields.filter((field) => field.fieldType === filterType.value)
  }

  // 适用范围筛选
  if (filterScope.value === 'common') {
    fields = fields.filter((field) => field.isCommon)
  } else if (filterScope.value === 'current' && currentTableType.value) {
    fields = fields.filter((field) => field.tableType === currentTableType.value || field.isCommon)
  }

  return fields
})

// ========================= 辅助计算属性 =========================
const getAvailableFields = () => {
  return filteredFields.value.filter((field) => !field.isUsed)
}

const getAvailableCommonFields = () => {
  return filteredFields.value.filter((field) => field.isCommon && !field.isUsed)
}

// ========================= 核心方法 =========================

/** 打开弹窗 */
const open = async (tableType?: number) => {
  dialogVisible.value = true
  currentTableType.value = tableType

  // 重置状态
  resetState()

  // 加载字段库数据
  await loadFieldLibrary()
}

defineExpose({ open })

/** 加载字段库数据 */
const loadFieldLibrary = async () => {
  loading.value = true
  try {
    // 根据搜索条件构建参数
    const scope =
      filterScope.value === 'common'
        ? 'COMMON'
        : filterScope.value === 'current'
          ? 'TABLE_TYPE'
          : 'ALL'

    const params = {
      scope,
      tableType: scope === 'TABLE_TYPE' ? currentTableType.value : undefined,
      templateId: props.templateId,
      keyword: searchKeyword.value || undefined,
      fieldType: filterType.value || undefined
    }

    // 使用修复后的字段库搜索API
    const data = await FieldLibraryApi.searchFieldsByScope(params)
    console.log('原始字段库数据:', data.slice(0, 3)) // 调试日志
    allFields.value = data.map((field) => ({
      ...field,
      // 确保字段有完整的属性，显式转换为布尔类型
      isCommon: Boolean(field.isCommon),
      isUsed: Boolean(field.isUsed),
      isRequired: Boolean(field.isRequired),
      usageCount: Number(field.usageCount) || 0,
      fieldTypeName: field.fieldTypeName || FIELD_TYPE_NAMES[field.fieldType] || field.fieldType
    }))

    console.log('字段库数据处理后:', allFields.value.slice(0, 3)) // 调试日志

    // 如果有templateId，获取详细的字段使用统计
    if (props.templateId && allFields.value.length > 0) {
      try {
        const usageStats = await FieldLibraryApi.getFieldUsageStats(props.templateId)

        // 如果数据正常，再更新字段状态
        allFields.value.forEach((field) => {
          const stat = usageStats.find((s) => s.fieldCode === field.fieldCode)
          if (stat) {
            // 保持原有的 isUsed 状态，只更新 usageCount
            field.usageCount = Number(stat.usageCount) || 0
            // 或者你可以根据实际需要决定是否更新 isUsed
          }
        })
      } catch (error) {
        console.warn('获取字段使用统计失败:', error)
      }
    }
  } catch (error) {
    console.error('加载字段库失败:', error)
    ElMessage.error('加载字段库失败')
  } finally {
    loading.value = false
  }
}

// ========================= 字段选择相关方法 =========================

/** 处理字段点击 */
const handleFieldClick = (field: FieldLibraryVO) => {
  if (field.isUsed) {
    ElMessage.warning('该字段已在当前模板中使用，无法重复添加')
    return
  }
  toggleSelection(field)
}

/** 处理复选框变化 */
const handleCheckboxChange = (field: FieldLibraryVO, checked: boolean) => {
  if (field.isUsed) {
    ElMessage.warning('该字段已在当前模板中使用，无法重复添加')
    return
  }

  if (checked) {
    if (!isSelected(field)) {
      selectedFields.value.push({ ...field })
    }
  } else {
    removeSelection(field)
  }
}

/** 选择常用字段 */
const selectCommonFields = () => {
  const availableCommonFields = getAvailableCommonFields()

  if (availableCommonFields.length === 0) {
    ElMessage.info('没有可添加的常用字段')
    return
  }

  // 合并已选择的字段和可用的常用字段，去重
  const currentSelected = new Set(selectedFields.value.map((f) => f.fieldCode))
  const newCommonFields = availableCommonFields.filter(
    (field) => !currentSelected.has(field.fieldCode)
  )

  if (newCommonFields.length === 0) {
    ElMessage.info('所有可用的常用字段已被选择')
    return
  }

  selectedFields.value = [...selectedFields.value, ...newCommonFields]
  ElMessage.success(`已选择 ${newCommonFields.length} 个常用字段`)
}

/** 切换字段选择状态 */
const toggleSelection = (field: FieldLibraryVO) => {
  // 如果字段已被当前模板使用，不允许选择
  if (field.isUsed) {
    ElMessage.warning('该字段已在当前模板中使用，无法重复添加')
    return
  }

  const index = selectedFields.value.findIndex((f) => f.fieldCode === field.fieldCode)
  if (index > -1) {
    selectedFields.value.splice(index, 1)
  } else {
    selectedFields.value.push({ ...field })
  }
}

/** 全选 */
const selectAll = () => {
  const availableFields = getAvailableFields()

  if (availableFields.length === 0) {
    ElMessage.info('没有可选择的字段')
    return
  }

  selectedFields.value = [...availableFields]
  ElMessage.success(`已选择 ${availableFields.length} 个可用字段`)
}

/** 处理搜索 */
const handleSearch = debounce(() => {
  loadFieldLibrary()
}, 300)

/** 处理筛选 */
const handleFilter = () => {
  loadFieldLibrary()
}

/** 刷新字段库 */
const refreshLibrary = () => {
  loadFieldLibrary()
}

/** 重置状态 */
const resetState = () => {
  searchKeyword.value = ''
  filterType.value = ''
  filterScope.value = ''
  selectedFields.value = []
}

/** 确认添加 */
const emit = defineEmits(['confirm'])
const handleConfirm = () => {
  if (!selectedFields.value.length) {
    ElMessage.warning('请选择要添加的字段')
    return
  }

  emit('confirm', [...selectedFields.value])
  dialogVisible.value = false
}

// ========================= 选择相关方法 =========================

/** 判断字段是否已选择 */
const isSelected = (field: FieldLibraryVO): boolean => {
  return selectedFields.value.some((f) => f.fieldCode === field.fieldCode)
}

/** 移除选择 */
const removeSelection = (field: FieldLibraryVO) => {
  const index = selectedFields.value.findIndex((f) => f.fieldCode === field.fieldCode)
  if (index > -1) {
    selectedFields.value.splice(index, 1)
  }
}

/** 清空选择 */
const clearSelection = () => {
  selectedFields.value = []
}
</script>

<style scoped>
.field-library-dialog {
  --dialog-width: 800px;
}

.library-container {
  height: 600px;
  display: flex;
  flex-direction: column;
}

/* 搜索区域 */
.search-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

/* 已使用字段样式 - 关键修复 */
.field-item.used {
  background-color: #f5f7fa !important;
  border-color: #dcdfe6 !important;
  opacity: 0.6;
  cursor: not-allowed !important;
}

.field-item.used * {
  color: #909399 !important;
}

.field-item.used .field-name {
  color: #909399 !important;
}

.field-item.used .field-code {
  color: #c0c4cc !important;
  background: #f0f2f5 !important;
}

.field-item.used .field-details {
  color: #c0c4cc !important;
}

.field-item.used .usage-count {
  color: #c0c4cc !important;
  background: #f0f2f5 !important;
}

.field-item.used:hover {
  border-color: #dcdfe6 !important;
  box-shadow: none !important;
  background-color: #f5f7fa !important;
}

/* 常用字段样式 - 黄色背景 */
.field-item.common {
  background: #fff7e6;
  border-color: #fadb91;
}

.field-item.common:hover {
  background: #fff2d7;
  border-color: #f2c55c;
}

.field-item.common.selected {
  background: #fff2d7;
  border-color: #409eff;
}

/* 已使用的常用字段 - 覆盖黄色背景 */
.field-item.common.used {
  background: #f5f7fa !important;
  border-color: #dcdfe6 !important;
}

.used-tag {
  background-color: #e4e7ed !important;
  color: #606266 !important;
  border-color: #dcdfe6 !important;
}

.used-info {
  color: #909399;
  font-size: 12px;
}

.used-notice {
  font-size: 12px;
  color: #e6a23c;
  margin-top: 4px;
  display: flex;
  align-items: center;
}

/* 内容区域 */
.library-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.selection-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 16px;
}

.info-text {
  color: #606266;
  font-size: 14px;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

/* 字段列表 */
.field-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.field-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.field-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.field-item.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.field-checkbox {
  margin-right: 12px;
  margin-top: 2px;
}

.field-info {
  flex: 1;
}

.field-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.field-name {
  font-weight: 600;
  color: #303133;
}

.field-code {
  color: #606266;
  font-family: 'Courier New', monospace;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.field-type {
  font-size: 12px;
}

.common-tag {
  font-size: 12px;
  background-color: #f4a261;
  color: white;
  border-color: #f4a261;
}

.required-tag {
  font-size: 12px;
}

.usage-count {
  font-size: 11px;
  color: #909399;
  margin-left: 8px;
  padding: 2px 6px;
  background: #f5f7fa;
  border-radius: 3px;
}

.field-details {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.field-desc {
  margin-bottom: 2px;
}

.field-example {
  font-style: italic;
}

.empty-library {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 选择预览 */
.selection-preview {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  max-height: 150px;
  overflow-y: auto;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.preview-header h4 {
  margin: 0;
  font-size: 14px;
  color: #303133;
}

.preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-tag {
  max-width: 200px;
  cursor: pointer;
}

.preview-tag :deep(.el-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 弹窗底部 */
.dialog-footer {
  display: flex;
  justify-content: end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .field-library-dialog {
    --dialog-width: 95vw;
  }

  .library-container {
    height: 70vh;
  }

  .search-section {
    padding: 12px;
  }

  .search-section .el-row {
    --el-row-gutter: 8px;
  }

  .search-section .el-col {
    margin-bottom: 8px;
  }

  .selection-info {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .batch-actions {
    width: 100%;
    justify-content: space-between;
  }

  .field-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .preview-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .dialog-footer {
    flex-direction: column-reverse;
    gap: 8px;
  }
}

/* 滚动条样式 */
.field-list::-webkit-scrollbar {
  width: 6px;
}

.field-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.field-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.field-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 复选框样式 */
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409eff;
  border-color: #409eff;
}

:deep(.el-checkbox__input.is-disabled .el-checkbox__inner) {
  background-color: #f5f7fa;
  border-color: #dcdfe6;
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
}
</style>
