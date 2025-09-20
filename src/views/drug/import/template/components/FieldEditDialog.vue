<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px" class="field-edit-dialog">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="field-form"
    >
      <el-form-item label="字段名称" prop="fieldName">
        <el-input
          v-model="formData.fieldName"
          placeholder="请输入字段名称（Excel表头显示文本）"
          maxlength="50"
          show-word-limit
        />
        <div class="form-tip">在Excel表头中显示的字段名称</div>
      </el-form-item>

      <el-form-item label="字段编码" prop="fieldCode">
        <el-input
          v-model="formData.fieldCode"
          placeholder="请输入字段编码（英文字母、数字、下划线）"
          maxlength="50"
          show-word-limit
        />
        <div class="form-tip">用于数据处理的字段标识，建议使用英文</div>
      </el-form-item>

      <el-form-item label="字段类型" prop="fieldType">
        <el-select v-model="formData.fieldType" placeholder="请选择字段类型" style="width: 100%">
          <el-option
            v-for="(name, type) in FIELD_TYPE_NAMES"
            :key="type"
            :label="name"
            :value="type"
          >
            <div class="field-type-option">
              <span class="type-name">{{ name }}</span>
              <span class="type-desc">{{ getFieldTypeDesc(type) }}</span>
            </div>
          </el-option>
        </el-select>
        <div class="form-tip">{{ getFieldTypeDesc(formData.fieldType) }}</div>
      </el-form-item>

      <el-form-item label="是否必填" prop="isRequired">
        <el-radio-group v-model="formData.isRequired">
          <el-radio :value="true">
            <span class="radio-label">
              <Icon icon="ep:check" class="required-icon" />
              必填字段
            </span>
          </el-radio>
          <el-radio :value="false">
            <span class="radio-label">
              <Icon icon="ep:minus" class="optional-icon" />
              可选字段
            </span>
          </el-radio>
        </el-radio-group>
        <div class="form-tip">必填字段在Excel表头会标红显示</div>
      </el-form-item>

      <el-form-item label="示例值" prop="exampleValue">
        <el-input
          v-model="formData.exampleValue"
          :placeholder="getExamplePlaceholder(formData.fieldType)"
          maxlength="100"
          show-word-limit
        />
        <div class="form-tip">在Excel示例行中显示的参考数据</div>
      </el-form-item>

      <el-form-item label="排序序号" prop="sortOrder">
        <el-input-number
          v-model="formData.sortOrder"
          :min="1"
          :max="maxSortOrder"
          placeholder="字段显示顺序"
          style="width: 100%"
        />
        <div class="form-tip">字段在表格中的显示顺序，数字越小越靠前</div>
      </el-form-item>

      <el-form-item label="字段说明" prop="helpText">
        <el-input
          v-model="formData.helpText"
          type="textarea"
          :rows="3"
          placeholder="请输入字段的详细说明，用于帮助用户理解字段含义和填写要求"
          maxlength="200"
          show-word-limit
        />
        <div class="form-tip">字段的详细说明和填写要求</div>
      </el-form-item>

      <!-- 字段验证规则（高级配置） -->
      <el-collapse v-model="activeCollapse" class="advanced-config">
        <el-collapse-item title="高级配置" name="advanced">
          <template #title>
            <div class="collapse-title">
              <Icon icon="ep:setting" class="mr-5px" />
              高级配置（可选）
            </div>
          </template>

          <div class="advanced-form">
            <el-form-item label="最小长度" v-if="formData.fieldType === FIELD_TYPE.TEXT">
              <el-input-number
                v-model="formData.minLength"
                :min="0"
                :max="1000"
                placeholder="最小字符长度"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="最大长度" v-if="formData.fieldType === FIELD_TYPE.TEXT">
              <el-input-number
                v-model="formData.maxLength"
                :min="1"
                :max="1000"
                placeholder="最大字符长度"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item
              label="数值范围"
              v-if="[FIELD_TYPE.NUMBER, FIELD_TYPE.DECIMAL].includes(formData.fieldType)"
            >
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-input-number
                    v-model="formData.minValue"
                    placeholder="最小值"
                    style="width: 100%"
                  />
                </el-col>
                <el-col :span="12">
                  <el-input-number
                    v-model="formData.maxValue"
                    placeholder="最大值"
                    style="width: 100%"
                  />
                </el-col>
              </el-row>
            </el-form-item>

            <el-form-item label="小数位数" v-if="formData.fieldType === FIELD_TYPE.DECIMAL">
              <el-input-number
                v-model="formData.decimalPlaces"
                :min="0"
                :max="10"
                placeholder="小数点后位数"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="日期格式" v-if="formData.fieldType === FIELD_TYPE.DATE">
              <el-select
                v-model="formData.dateFormat"
                placeholder="选择日期格式"
                style="width: 100%"
              >
                <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
                <el-option label="YYYY/MM/DD" value="YYYY/MM/DD" />
                <el-option label="DD/MM/YYYY" value="DD/MM/YYYY" />
                <el-option label="MM/DD/YYYY" value="MM/DD/YYYY" />
                <el-option label="YYYY-MM-DD HH:mm:ss" value="YYYY-MM-DD HH:mm:ss" />
              </el-select>
            </el-form-item>

            <el-form-item label="正则表达式">
              <el-input
                v-model="formData.pattern"
                placeholder="请输入验证正则表达式（可选）"
                maxlength="200"
              />
              <div class="form-tip">用于验证字段值格式的正则表达式</div>
            </el-form-item>

            <el-form-item label="错误提示">
              <el-input
                v-model="formData.errorMessage"
                placeholder="验证失败时的错误提示信息"
                maxlength="100"
              />
            </el-form-item>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="submitting">
          <Icon icon="ep:check" class="mr-5px" />
          确定
        </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { TemplateFieldSaveReqVO, FIELD_TYPE_NAMES, FIELD_TYPE } from '@/api/drug/task/template'

defineOptions({ name: 'FieldEditDialog' })

// ========================= Props =========================
const props = defineProps<{
  tableType?: string
  templateId?: number
  totalFieldsCount?: number
}>()

// ========================= 响应式数据 =========================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formType = ref('')
const editIndex = ref<number>()
const submitting = ref(false)
const activeCollapse = ref<string[]>([])

const formData = ref<
  TemplateFieldSaveReqVO & {
    minLength?: number
    maxLength?: number
    minValue?: number
    maxValue?: number
    decimalPlaces?: number
    dateFormat?: string
    pattern?: string
    errorMessage?: string
  }
>({
  fieldName: '',
  fieldCode: '',
  fieldType: FIELD_TYPE.TEXT,
  isRequired: false,
  exampleValue: '',
  sortOrder: 1,
  helpText: ''
})

const formRules = reactive({
  fieldName: [
    { required: true, message: '字段名称不能为空', trigger: 'blur' },
    { min: 1, max: 50, message: '字段名称长度在1到50个字符', trigger: 'blur' }
  ],
  fieldCode: [
    { required: true, message: '字段编码不能为空', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: '字段编码必须以字母开头，只能包含字母、数字和下划线',
      trigger: 'blur'
    },
    { min: 1, max: 50, message: '字段编码长度在1到50个字符', trigger: 'blur' }
  ],
  fieldType: [{ required: true, message: '字段类型不能为空', trigger: 'change' }],
  sortOrder: [
    { required: true, message: '排序序号不能为空', trigger: 'blur' },
    { 
      type: 'number', 
      min: 1, 
      message: '排序序号必须大于等于1', 
      trigger: 'blur' 
    }
  ]
})

const formRef = ref()

// ========================= 计算属性 =========================
const isCreateMode = computed(() => formType.value === 'create')
const maxSortOrder = computed(() => {
  // 编辑模式时，最大值为总字段数
  // 新增模式时，最大值为总字段数+1
  const total = props.totalFieldsCount || 1
  return isCreateMode.value ? total + 1 : total
})

// ========================= 核心方法 =========================

/** 打开弹窗 */
const open = (type: string, field: any, index?: number) => {
  dialogVisible.value = true
  formType.value = type
  editIndex.value = index
  dialogTitle.value = type === 'create' ? '添加字段' : '编辑字段'

  // 重置表单
  resetForm()

  // 设置数据
  if (field) {
    Object.assign(formData.value, field)
  }
}

defineExpose({ open })

/** 确认提交 */
const emit = defineEmits(['confirm'])
const handleConfirm = async () => {
  try {
    // 表单验证
    await formRef.value.validate()

    submitting.value = true

    // 构建提交数据
    const submitData: TemplateFieldSaveReqVO & {
      minLength?: number
      maxLength?: number
      minValue?: number
      maxValue?: number
      decimalPlaces?: number
      dateFormat?: string
      pattern?: string
      errorMessage?: string
    } = {
      fieldName: formData.value.fieldName,
      fieldCode: formData.value.fieldCode,
      fieldType: formData.value.fieldType,
      isRequired: formData.value.isRequired,
      exampleValue: formData.value.exampleValue,
      sortOrder: formData.value.sortOrder,
      helpText: formData.value.helpText
    }

    // 添加高级配置字段
    if (formData.value.minLength !== undefined && formData.value.minLength !== null) {
      submitData.minLength = formData.value.minLength
    }
    if (formData.value.maxLength !== undefined && formData.value.maxLength !== null) {
      submitData.maxLength = formData.value.maxLength
    }
    if (formData.value.minValue !== undefined && formData.value.minValue !== null) {
      submitData.minValue = formData.value.minValue
    }
    if (formData.value.maxValue !== undefined && formData.value.maxValue !== null) {
      submitData.maxValue = formData.value.maxValue
    }
    if (formData.value.decimalPlaces !== undefined && formData.value.decimalPlaces !== null) {
      submitData.decimalPlaces = formData.value.decimalPlaces
    }
    if (formData.value.dateFormat) {
      submitData.dateFormat = formData.value.dateFormat
    }
    if (formData.value.pattern) {
      submitData.pattern = formData.value.pattern
    }
    if (formData.value.errorMessage) {
      submitData.errorMessage = formData.value.errorMessage
    }

    // 如果有ID，传递ID（编辑模式）
    if (formData.value.id) {
      submitData.id = formData.value.id
    }

    emit('confirm', submitData, editIndex.value)

    ElMessage.success(isCreateMode.value ? '添加成功' : '编辑成功')
    dialogVisible.value = false
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    fieldName: '',
    fieldCode: '',
    fieldType: FIELD_TYPE.TEXT,
    isRequired: false,
    exampleValue: '',
    sortOrder: 1,
    helpText: ''
  }
  activeCollapse.value = []
  formRef.value?.resetFields()
}

// ========================= 工具方法 =========================

/** 获取字段类型描述 */
const getFieldTypeDesc = (fieldType: string): string => {
  const descriptions = {
    [FIELD_TYPE.TEXT]: '文本类型，支持字母、数字、中文等字符',
    [FIELD_TYPE.NUMBER]: '整数类型，只能输入数字',
    [FIELD_TYPE.DATE]: '日期类型，支持多种日期格式',
    [FIELD_TYPE.DECIMAL]: '小数类型，支持带小数点的数字',
    [FIELD_TYPE.BOOLEAN]: '布尔类型，只能输入true/false或是/否'
  }
  return descriptions[fieldType] || '未知类型'
}

/** 获取示例值占位符 */
const getExamplePlaceholder = (fieldType: string): string => {
  const placeholders = {
    [FIELD_TYPE.TEXT]: '如：张三医院',
    [FIELD_TYPE.NUMBER]: '如：100',
    [FIELD_TYPE.DATE]: '如：2024-01-01',
    [FIELD_TYPE.DECIMAL]: '如：99.99',
    [FIELD_TYPE.BOOLEAN]: '如：是 或 true'
  }
  return placeholders[fieldType] || '请输入示例值'
}
</script>

<style scoped>
.field-edit-dialog {
  --dialog-width: 600px;
}

.field-form {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 10px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.field-type-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-name {
  font-weight: 600;
  color: #303133;
}

.type-desc {
  font-size: 12px;
  color: #909399;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.required-icon {
  color: #f56c6c;
}

.optional-icon {
  color: #909399;
}

.advanced-config {
  margin-top: 20px;
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

.dialog-footer {
  display: flex;
  justify-content: end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .field-edit-dialog {
    --dialog-width: 95vw;
  }

  .field-form {
    max-height: 60vh;
  }

  .field-type-option {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .dialog-footer {
    flex-direction: column-reverse;
    gap: 8px;
  }
}

/* 表单样式优化 */
:deep(.el-form-item__label) {
  font-weight: 600;
  color: #24292f;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-textarea__inner) {
  border-radius: 6px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-radio__label) {
  color: #606266;
  font-weight: 500;
}

:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #409eff;
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

/* 数字输入框样式 */
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  border-radius: 6px;
}
</style>
