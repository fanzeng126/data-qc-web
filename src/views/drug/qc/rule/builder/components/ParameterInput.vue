<template>
  <div class="parameter-input" :class="parameter.type">
    <!-- 字段参数 -->
    <div v-if="parameter.type === 'field'" class="param-field">
      <Icon icon="ep:key" class="param-icon" />
      <span class="param-value">{{ parameter.label || parameter.value }}</span>
    </div>

    <!-- 常量参数 -->
    <div v-else-if="parameter.type === 'constant'" class="param-constant">
      <el-select
        :model-value="parameterType"
        size="small"
        @change="handleTypeChange"
        class="type-selector"
      >
        <el-option label="文本" value="string" />
        <el-option label="数字" value="number" />
        <el-option label="布尔" value="boolean" />
        <el-option label="日期" value="date" />
      </el-select>

      <!-- 文本输入 -->
      <el-input
        v-if="parameterType === 'string'"
        :model-value="parameter.value"
        size="small"
        placeholder="输入文本"
        @input="handleValueChange"
        class="param-input"
      />

      <!-- 数字输入 -->
      <el-input-number
        v-else-if="parameterType === 'number'"
        :model-value="parameter.value"
        size="small"
        placeholder="输入数字"
        @change="handleValueChange"
        class="param-input"
        controls-position="right"
      />

      <!-- 布尔选择 -->
      <el-select
        v-else-if="parameterType === 'boolean'"
        :model-value="parameter.value"
        size="small"
        @change="handleValueChange"
        class="param-input"
      >
        <el-option label="true" :value="true" />
        <el-option label="false" :value="false" />
      </el-select>

      <!-- 日期选择 -->
      <el-date-picker
        v-else-if="parameterType === 'date'"
        :model-value="parameter.value"
        type="date"
        size="small"
        placeholder="选择日期"
        @change="handleValueChange"
        class="param-input"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
      />
    </div>

    <!-- 表达式参数 -->
    <div v-else-if="parameter.type === 'expression'" class="param-expression">
      <Icon icon="ep:cpu" class="param-icon" />
      <el-button size="small" text @click="editExpression" class="expression-btn">
        {{ parameter.label || '编辑表达式' }}
      </el-button>
    </div>

    <!-- 函数参数 -->
    <div v-else-if="parameter.type === 'function'" class="param-function">
      <Icon icon="ep:cpu" class="param-icon" />
      <span class="function-name">{{ parameter.value }}</span>
      <span class="bracket">(</span>

      <div class="nested-params">
        <div
          v-for="(nestedParam, nestedIndex) in parameter.parameters || []"
          :key="nestedIndex"
          class="nested-param"
        >
          <ParameterInput
            :parameter="nestedParam"
            :index="nestedIndex"
            @update="updateNestedParameter"
            @remove="removeNestedParameter"
          />
          <span v-if="nestedIndex < (parameter.parameters?.length || 0) - 1" class="separator"
            >,</span
          >
        </div>

        <el-button size="small" text @click="addNestedParameter" class="add-nested-btn">
          <Icon icon="ep:plus" />
        </el-button>
      </div>

      <span class="bracket">)</span>
    </div>

    <!-- 字段组参数 -->
    <div v-else-if="parameter.type === 'fieldGroup'" class="param-field-group">
      <Icon icon="ep:collection" class="param-icon" />
      <el-button size="small" text @click="selectFields" class="field-group-btn">
        {{ getFieldGroupLabel() }}
      </el-button>
    </div>

    <!-- 移除按钮 -->
    <el-button size="small" text @click="removeParameter" class="remove-param-btn">
      <Icon icon="ep:close" />
    </el-button>

    <!-- 字段选择对话框 -->
    <FieldSelectorDialog
      v-model="showFieldSelector"
      :selected-fields="parameter.fields || []"
      @confirm="handleFieldsSelected"
    />

    <!-- 表达式编辑器对话框 -->
    <ExpressionEditorDialog
      v-model="showExpressionEditor"
      :expression="parameter.expression || {}"
      @confirm="handleExpressionUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FieldSelectorDialog from './FieldSelectorDialog.vue'
import ExpressionEditorDialog from './ExpressionEditorDialog.vue'

interface Parameter {
  type: 'field' | 'constant' | 'expression' | 'function' | 'fieldGroup'
  value: any
  label?: string
  dataType?: string
  parameters?: Parameter[]
  fields?: any[]
  expression?: any
}

interface Props {
  parameter: Parameter
  index: number
}

interface Emits {
  (e: 'update', index: number, parameter: Parameter): void
  (e: 'remove', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 参数类型
const parameterType = ref('string')

// 对话框状态
const showFieldSelector = ref(false)
const showExpressionEditor = ref(false)

// 初始化参数类型
watch(
  () => props.parameter,
  (newParam) => {
    if (newParam.type === 'constant') {
      // 根据值的类型推断参数类型
      if (typeof newParam.value === 'number') {
        parameterType.value = 'number'
      } else if (typeof newParam.value === 'boolean') {
        parameterType.value = 'boolean'
      } else if (newParam.value instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(newParam.value)) {
        parameterType.value = 'date'
      } else {
        parameterType.value = 'string'
      }
    }
  },
  { immediate: true }
)

// 更新参数 - 通用方法
const updateParameter = (changes: Partial<Parameter>) => {
  const updatedParameter = {
    ...props.parameter,
    ...changes
  }
  emit('update', props.index, updatedParameter)
}

// 移除参数
const removeParameter = () => {
  emit('remove', props.index)
}

// 处理类型变化
const handleTypeChange = (newType: string) => {
  parameterType.value = newType

  let newValue: any
  switch (newType) {
    case 'number':
      newValue = 0
      break
    case 'boolean':
      newValue = true
      break
    case 'date':
      newValue = new Date().toISOString().split('T')[0]
      break
    default:
      newValue = ''
  }

  updateParameter({ value: newValue })
}

// 处理值变化
const handleValueChange = (value: any) => {
  updateParameter({ value })
}

// 嵌套参数处理
const addNestedParameter = () => {
  const currentParameters = props.parameter.parameters || []
  const newParameters = [
    ...currentParameters,
    {
      type: 'constant',
      value: '',
      label: '参数'
    }
  ]

  updateParameter({ parameters: newParameters })
}

const updateNestedParameter = (index: number, nestedParam: Parameter) => {
  const currentParameters = props.parameter.parameters || []
  if (index >= 0 && index < currentParameters.length) {
    const newParameters = [...currentParameters]
    newParameters[index] = nestedParam
    updateParameter({ parameters: newParameters })
  }
}

const removeNestedParameter = (index: number) => {
  const currentParameters = props.parameter.parameters || []
  if (index >= 0 && index < currentParameters.length) {
    const newParameters = [...currentParameters]
    newParameters.splice(index, 1)
    updateParameter({ parameters: newParameters })
  }
}

// 字段组处理
const selectFields = () => {
  showFieldSelector.value = true
}

const getFieldGroupLabel = () => {
  const fields = props.parameter.fields || []
  if (fields.length === 0) {
    return '选择字段组'
  }

  if (fields.length === 1) {
    return fields[0].label || fields[0].fieldName
  }

  return `已选择 ${fields.length} 个字段`
}

const handleFieldsSelected = (fields: any[]) => {
  const fieldNames = fields.map((f) => f.fieldName).join(', ')
  updateParameter({
    fields,
    value: fieldNames
  })
}

// 表达式处理
const editExpression = () => {
  showExpressionEditor.value = true
}

const handleExpressionUpdated = (expression: any) => {
  const expressionText = generateExpressionText(expression)
  updateParameter({
    expression,
    value: expressionText
  })
}

// 生成表达式文本
const generateExpressionText = (expression: any) => {
  // 简化的表达式文本生成逻辑
  if (!expression || !expression.components) return '空表达式'

  return expression.components
    .map((comp: any) => {
      if (comp.type === 'function') {
        const params = comp.parameters ? comp.parameters.map((p: any) => p.value).join(', ') : ''
        return `${comp.value}(${params})`
      }
      return comp.value
    })
    .join(' ')
}
</script>

<style lang="scss" scoped>
.parameter-input {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: white;
  position: relative;

  &:hover {
    border-color: #c0c4cc;

    .remove-param-btn {
      opacity: 1;
    }
  }

  .param-icon {
    font-size: 14px;
    color: #909399;
  }

  // 字段参数样式
  .param-field {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #e7f3ff;
    padding: 2px 6px;
    border-radius: 3px;

    .param-value {
      font-size: 12px;
      font-family: 'Fira Code', Consolas, monospace;
      color: #409eff;
    }
  }

  // 常量参数样式
  .param-constant {
    display: flex;
    align-items: center;
    gap: 4px;

    .type-selector {
      width: 60px;
    }

    .param-input {
      min-width: 80px;
    }
  }

  // 表达式参数样式
  .param-expression {
    display: flex;
    align-items: center;
    gap: 4px;

    .expression-btn {
      font-size: 12px;
      color: #e6a23c;

      &:hover {
        background: rgba(230, 162, 60, 0.1);
      }
    }
  }

  // 函数参数样式
  .param-function {
    display: flex;
    align-items: center;
    gap: 2px;
    background: #fff7e6;
    padding: 2px 6px;
    border-radius: 3px;

    .function-name {
      font-size: 12px;
      font-weight: 500;
      font-family: 'Fira Code', Consolas, monospace;
      color: #e6a23c;
    }

    .bracket {
      font-weight: 600;
      color: #e6a23c;
    }

    .nested-params {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-wrap: wrap;

      .nested-param {
        display: flex;
        align-items: center;
        gap: 2px;
      }

      .separator {
        color: #606266;
        font-size: 12px;
      }

      .add-nested-btn {
        font-size: 10px;
        width: 16px;
        height: 16px;
        padding: 0;
        color: #e6a23c;

        &:hover {
          background: rgba(230, 162, 60, 0.1);
        }
      }
    }
  }

  // 字段组参数样式
  .param-field-group {
    display: flex;
    align-items: center;
    gap: 4px;

    .field-group-btn {
      font-size: 12px;
      color: #67c23a;

      &:hover {
        background: rgba(103, 194, 58, 0.1);
      }
    }
  }

  // 移除按钮
  .remove-param-btn {
    width: 16px;
    height: 16px;
    padding: 0;
    margin-left: 2px;
    color: #c0c4cc;
    opacity: 0;
    transition: all 0.3s;

    &:hover {
      color: #f56c6c;
      background: rgba(245, 108, 108, 0.1);
    }
  }
}

// 不同参数类型的边框颜色
.parameter-input {
  &.field {
    border-color: #409eff;
  }

  &.constant {
    border-color: #909399;
  }

  &.expression {
    border-color: #e6a23c;
  }

  &.function {
    border-color: #e6a23c;
  }

  &.fieldGroup {
    border-color: #67c23a;
  }
}

// 响应式调整
@media (max-width: 768px) {
  .parameter-input {
    .param-constant {
      flex-direction: column;
      gap: 2px;

      .type-selector,
      .param-input {
        width: 100%;
        min-width: auto;
      }
    }

    .param-function .nested-params {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>
