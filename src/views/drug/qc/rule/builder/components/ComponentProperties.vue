<template>
  <div class="component-properties">
    <div v-if="component" class="properties-content">
      <!-- 组件基本信息 -->
      <div class="component-info">
        <div class="info-header">
          <Icon :icon="getComponentIcon(component.type)" class="component-icon" />
          <span class="component-type">{{ getComponentTypeName(component.type) }}</span>
          <el-tag :type="getComponentTypeColor(component.type)" size="small">
            {{ getComponentTypeTag(component.type) }}
          </el-tag>
        </div>
        <div class="info-description">
          {{ getComponentDescription(component.type) }}
        </div>
      </div>

      <!-- 字段组件属性 -->
      <div v-if="component.type === 'field'" class="field-properties">
        <el-form :model="fieldProps" label-width="80px" size="small">
          <el-form-item label="字段名">
            <el-input v-model="fieldProps.fieldName" readonly />
          </el-form-item>
          <el-form-item label="表名">
            <el-input v-model="fieldProps.tableName" readonly />
          </el-form-item>
          <el-form-item label="数据类型">
            <el-select v-model="fieldProps.dataType" @change="handleFieldTypeChange">
              <el-option label="VARCHAR" value="VARCHAR" />
              <el-option label="INTEGER" value="INTEGER" />
              <el-option label="DECIMAL" value="DECIMAL" />
              <el-option label="DATE" value="DATE" />
              <el-option label="DATETIME" value="DATETIME" />
              <el-option label="BOOLEAN" value="BOOLEAN" />
            </el-select>
          </el-form-item>
          <el-form-item label="显示名称">
            <el-input v-model="fieldProps.label" @input="handleLabelChange" />
          </el-form-item>
          <el-form-item label="别名">
            <el-input v-model="fieldProps.alias" @input="handleAliasChange" />
          </el-form-item>
          <el-form-item label="是否必填">
            <el-switch v-model="fieldProps.isRequired" @change="handleRequiredChange" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 函数组件属性 -->
      <div v-else-if="component.type === 'function'" class="function-properties">
        <el-form :model="functionProps" label-width="80px" size="small">
          <el-form-item label="函数名">
            <el-input v-model="functionProps.value" readonly />
          </el-form-item>
          <el-form-item label="中文名">
            <el-input v-model="functionProps.label" @input="handleFunctionLabelChange" />
          </el-form-item>
          <el-form-item label="函数级别">
            <el-select v-model="functionProps.level" disabled>
              <el-option label="基础" :value="1" />
              <el-option label="高级" :value="2" />
              <el-option label="专家" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="返回类型">
            <el-select v-model="functionProps.returnType" @change="handleReturnTypeChange">
              <el-option label="布尔值" value="BOOLEAN" />
              <el-option label="数值" value="NUMBER" />
              <el-option label="字符串" value="STRING" />
              <el-option label="日期" value="DATE" />
              <el-option label="数组" value="ARRAY" />
            </el-select>
          </el-form-item>
        </el-form>

        <!-- 参数配置 -->
        <div class="parameter-config">
          <div class="config-header">
            <span>参数配置</span>
            <el-button size="small" text @click="addParameter">
              <Icon icon="ep:plus" class="mr-5px" />
              添加参数
            </el-button>
          </div>

          <div class="parameter-list">
            <div
              v-for="(param, index) in functionProps.parameters"
              :key="index"
              class="parameter-item"
            >
              <div class="param-header">
                <span class="param-index">参数 {{ index + 1 }}</span>
                <el-button size="small" text type="danger" @click="removeParameter(index)">
                  <Icon icon="ep:delete" />
                </el-button>
              </div>

              <el-form :model="param" label-width="60px" size="small">
                <el-form-item label="类型">
                  <el-select v-model="param.type" @change="handleParameterTypeChange(index)">
                    <el-option label="字段" value="field" />
                    <el-option label="常量" value="constant" />
                    <el-option label="表达式" value="expression" />
                    <el-option label="函数" value="function" />
                  </el-select>
                </el-form-item>

                <el-form-item label="值">
                  <el-input
                    v-if="param.type === 'constant'"
                    v-model="param.value"
                    @input="handleParameterValueChange(index)"
                  />
                  <el-select
                    v-else-if="param.type === 'field'"
                    v-model="param.value"
                    @change="handleParameterValueChange(index)"
                    filterable
                  >
                    <el-option
                      v-for="field in availableFields"
                      :key="field.value"
                      :label="field.label"
                      :value="field.value"
                    />
                  </el-select>
                  <el-button v-else size="small" @click="editParameterExpression(index)">
                    编辑{{ param.type === 'expression' ? '表达式' : '函数' }}
                  </el-button>
                </el-form-item>

                <el-form-item label="描述">
                  <el-input
                    v-model="param.description"
                    @input="handleParameterDescChange(index)"
                    placeholder="参数描述"
                  />
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作符组件属性 -->
      <div v-else-if="component.type === 'operator'" class="operator-properties">
        <el-form :model="operatorProps" label-width="80px" size="small">
          <el-form-item label="操作符">
            <el-input v-model="operatorProps.value" readonly />
          </el-form-item>
          <el-form-item label="中文名">
            <el-input v-model="operatorProps.label" @input="handleOperatorLabelChange" />
          </el-form-item>
          <el-form-item label="操作数">
            <el-input-number
              v-model="operatorProps.operandCount"
              :min="1"
              :max="3"
              @change="handleOperandCountChange"
            />
          </el-form-item>
          <el-form-item label="优先级">
            <el-slider
              v-model="operatorProps.precedence"
              :min="1"
              :max="10"
              show-stops
              @change="handlePrecedenceChange"
            />
          </el-form-item>
          <el-form-item label="结合性">
            <el-radio-group
              v-model="operatorProps.associativity"
              @change="handleAssociativityChange"
            >
              <el-radio label="LEFT">左结合</el-radio>
              <el-radio label="RIGHT">右结合</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <!-- 常量组件属性 -->
      <div v-else-if="component.type === 'constant'" class="constant-properties">
        <el-form :model="constantProps" label-width="80px" size="small">
          <el-form-item label="数据类型">
            <el-select v-model="constantProps.dataType" @change="handleConstantTypeChange">
              <el-option label="字符串" value="string" />
              <el-option label="数字" value="number" />
              <el-option label="布尔值" value="boolean" />
              <el-option label="日期" value="date" />
              <el-option label="空值" value="null" />
            </el-select>
          </el-form-item>

          <el-form-item label="值">
            <!-- 字符串输入 -->
            <el-input
              v-if="constantProps.dataType === 'string'"
              v-model="constantProps.value"
              @input="handleConstantValueChange"
            />

            <!-- 数字输入 -->
            <el-input-number
              v-else-if="constantProps.dataType === 'number'"
              v-model="constantProps.value"
              @change="handleConstantValueChange"
              controls-position="right"
            />

            <!-- 布尔值选择 -->
            <el-select
              v-else-if="constantProps.dataType === 'boolean'"
              v-model="constantProps.value"
              @change="handleConstantValueChange"
            >
              <el-option label="true" :value="true" />
              <el-option label="false" :value="false" />
            </el-select>

            <!-- 日期选择 -->
            <el-date-picker
              v-else-if="constantProps.dataType === 'date'"
              v-model="constantProps.value"
              type="date"
              @change="handleConstantValueChange"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />

            <!-- 空值 -->
            <el-input v-else value="NULL" readonly />
          </el-form-item>

          <el-form-item label="格式化">
            <el-input
              v-model="constantProps.format"
              @input="handleFormatChange"
              placeholder="如：#,##0.00"
            />
          </el-form-item>

          <el-form-item label="单位">
            <el-input
              v-model="constantProps.unit"
              @input="handleUnitChange"
              placeholder="如：元、%、mg"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 分组组件属性 -->
      <div v-else-if="component.type === 'group'" class="group-properties">
        <el-form :model="groupProps" label-width="80px" size="small">
          <el-form-item label="分组名称">
            <el-input v-model="groupProps.groupName" @input="handleGroupNameChange" />
          </el-form-item>
          <el-form-item label="逻辑运算符">
            <el-select v-model="groupProps.operator" @change="handleGroupOperatorChange">
              <el-option label="AND（且）" value="AND" />
              <el-option label="OR（或）" value="OR" />
              <el-option label="NOT（非）" value="NOT" />
            </el-select>
          </el-form-item>
          <el-form-item label="组件数量">
            <el-input-number v-model="groupProps.componentCount" :min="0" readonly />
          </el-form-item>
          <el-form-item label="嵌套级别">
            <el-input-number
              v-model="groupProps.nestingLevel"
              :min="1"
              :max="5"
              @change="handleNestingLevelChange"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 验证规则 -->
      <div class="validation-rules">
        <div class="rules-header">
          <Icon icon="ep:shield" class="rules-icon" />
          <span>验证规则</span>
        </div>

        <div class="rules-content">
          <el-form :model="validationRules" label-width="80px" size="small">
            <el-form-item label="必填验证">
              <el-switch v-model="validationRules.required" @change="handleValidationChange" />
            </el-form-item>
            <el-form-item label="格式验证">
              <el-input
                v-model="validationRules.pattern"
                @input="handleValidationChange"
                placeholder="正则表达式"
              />
            </el-form-item>
            <el-form-item label="长度限制">
              <div class="length-inputs">
                <el-input-number
                  v-model="validationRules.minLength"
                  placeholder="最小"
                  @change="handleValidationChange"
                />
                <span class="separator">-</span>
                <el-input-number
                  v-model="validationRules.maxLength"
                  placeholder="最大"
                  @change="handleValidationChange"
                />
              </div>
            </el-form-item>
            <el-form-item label="错误提示">
              <el-input
                v-model="validationRules.errorMessage"
                @input="handleValidationChange"
                placeholder="验证失败时的错误信息"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 样式配置 -->
      <div class="style-config">
        <div class="style-header">
          <Icon icon="ep:brush" class="style-icon" />
          <span>样式配置</span>
        </div>

        <div class="style-content">
          <el-form :model="styleConfig" label-width="80px" size="small">
            <el-form-item label="显示颜色">
              <el-color-picker v-model="styleConfig.color" @change="handleStyleChange" show-alpha />
            </el-form-item>
            <el-form-item label="背景颜色">
              <el-color-picker
                v-model="styleConfig.backgroundColor"
                @change="handleStyleChange"
                show-alpha
              />
            </el-form-item>
            <el-form-item label="边框样式">
              <el-select v-model="styleConfig.borderStyle" @change="handleStyleChange">
                <el-option label="实线" value="solid" />
                <el-option label="虚线" value="dashed" />
                <el-option label="点线" value="dotted" />
                <el-option label="无边框" value="none" />
              </el-select>
            </el-form-item>
            <el-form-item label="圆角大小">
              <el-slider
                v-model="styleConfig.borderRadius"
                :min="0"
                :max="20"
                @change="handleStyleChange"
              />
            </el-form-item>
            <el-form-item label="字体大小">
              <el-slider
                v-model="styleConfig.fontSize"
                :min="10"
                :max="24"
                @change="handleStyleChange"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 高级设置 -->
      <div class="advanced-settings">
        <div class="settings-header">
          <Icon icon="ep:setting" class="settings-icon" />
          <span>高级设置</span>
        </div>

        <div class="settings-content">
          <el-form :model="advancedSettings" label-width="80px" size="small">
            <el-form-item label="缓存结果">
              <el-switch v-model="advancedSettings.cacheResult" @change="handleAdvancedChange" />
            </el-form-item>
            <el-form-item label="异步执行">
              <el-switch v-model="advancedSettings.asyncExecution" @change="handleAdvancedChange" />
            </el-form-item>
            <el-form-item label="超时时间">
              <el-input-number
                v-model="advancedSettings.timeout"
                :min="100"
                :max="30000"
                @change="handleAdvancedChange"
              />
              <span class="unit-text">毫秒</span>
            </el-form-item>
            <el-form-item label="重试次数">
              <el-input-number
                v-model="advancedSettings.retryCount"
                :min="0"
                :max="5"
                @change="handleAdvancedChange"
              />
            </el-form-item>
            <el-form-item label="调试模式">
              <el-switch v-model="advancedSettings.debugMode" @change="handleAdvancedChange" />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <div v-else class="empty-properties">
      <Icon icon="ep:box" class="empty-icon" />
      <p>请选择一个组件</p>
      <p class="empty-tip">在表达式编辑器中点击组件可查看其属性</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface Props {
  component: any
  index: number
}

interface Emits {
  (e: 'update', component: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 各类型组件的属性对象
const fieldProps = reactive({
  fieldName: '',
  tableName: '',
  dataType: 'VARCHAR',
  label: '',
  alias: '',
  isRequired: false
})

const functionProps = reactive({
  value: '',
  label: '',
  level: 1,
  returnType: 'BOOLEAN',
  parameters: []
})

const operatorProps = reactive({
  value: '',
  label: '',
  operandCount: 2,
  precedence: 5,
  associativity: 'LEFT'
})

const constantProps = reactive({
  value: '',
  dataType: 'string',
  format: '',
  unit: ''
})

const groupProps = reactive({
  groupName: '',
  operator: 'AND',
  componentCount: 0,
  nestingLevel: 1
})

// 验证规则
const validationRules = reactive({
  required: false,
  pattern: '',
  minLength: null,
  maxLength: null,
  errorMessage: ''
})

// 样式配置
const styleConfig = reactive({
  color: '#303133',
  backgroundColor: '#ffffff',
  borderStyle: 'solid',
  borderRadius: 4,
  fontSize: 14
})

// 高级设置
const advancedSettings = reactive({
  cacheResult: false,
  asyncExecution: false,
  timeout: 5000,
  retryCount: 0,
  debugMode: false
})

// 可用字段列表
const availableFields = ref([
  { value: 'drug_list.ypid', label: '药品本位码' },
  { value: 'drug_list.drug_name', label: '药品名称' },
  { value: 'drug_list.manufacturer', label: '生产企业' },
  { value: 'drug_post_inbound.amount', label: '入库金额' },
  { value: 'drug_post_inbound.quantity', label: '入库数量' }
])

// 监听组件变化
watch(
  () => props.component,
  (newComponent) => {
    if (newComponent) {
      loadComponentProperties(newComponent)
    }
  },
  { immediate: true }
)

// 加载组件属性
const loadComponentProperties = (component: any) => {
  switch (component.type) {
    case 'field':
      Object.assign(fieldProps, {
        fieldName: component.fieldName || '',
        tableName: component.tableName || '',
        dataType: component.dataType || 'VARCHAR',
        label: component.label || '',
        alias: component.alias || '',
        isRequired: component.isRequired || false
      })
      break

    case 'function':
      Object.assign(functionProps, {
        value: component.value || '',
        label: component.label || '',
        level: component.config?.functionLevel || 1,
        returnType: component.config?.returnType || 'BOOLEAN',
        parameters: component.parameters || []
      })
      break

    case 'operator':
      Object.assign(operatorProps, {
        value: component.value || '',
        label: component.label || '',
        operandCount: component.config?.operandCount || 2,
        precedence: component.config?.precedence || 5,
        associativity: component.config?.associativity || 'LEFT'
      })
      break

    case 'constant':
      Object.assign(constantProps, {
        value: component.value || '',
        dataType: getValueDataType(component.value) || 'string',
        format: component.format || '',
        unit: component.unit || ''
      })
      break

    case 'group':
      Object.assign(groupProps, {
        groupName: component.groupName || '',
        operator: component.operator || 'AND',
        componentCount: component.components?.length || 0,
        nestingLevel: component.nestingLevel || 1
      })
      break
  }

  // 加载通用属性
  loadValidationRules(component)
  loadStyleConfig(component)
  loadAdvancedSettings(component)
}

// 加载验证规则
const loadValidationRules = (component: any) => {
  const validation = component.validation || {}
  Object.assign(validationRules, {
    required: validation.required || false,
    pattern: validation.pattern || '',
    minLength: validation.minLength || null,
    maxLength: validation.maxLength || null,
    errorMessage: validation.errorMessage || ''
  })
}

// 加载样式配置
const loadStyleConfig = (component: any) => {
  const style = component.style || {}
  Object.assign(styleConfig, {
    color: style.color || '#303133',
    backgroundColor: style.backgroundColor || '#ffffff',
    borderStyle: style.borderStyle || 'solid',
    borderRadius: style.borderRadius || 4,
    fontSize: style.fontSize || 14
  })
}

// 加载高级设置
const loadAdvancedSettings = (component: any) => {
  const advanced = component.advanced || {}
  Object.assign(advancedSettings, {
    cacheResult: advanced.cacheResult || false,
    asyncExecution: advanced.asyncExecution || false,
    timeout: advanced.timeout || 5000,
    retryCount: advanced.retryCount || 0,
    debugMode: advanced.debugMode || false
  })
}

// 工具方法
const getComponentIcon = (type: string) => {
  const icons: Record<string, string> = {
    field: 'ep:key',
    function: 'ep:cpu',
    operator: 'ep:sort',
    constant: 'ep:price-tag',
    group: 'ep:collection'
  }
  return icons[type] || 'ep:document'
}

const getComponentTypeName = (type: string) => {
  const names: Record<string, string> = {
    field: '数据字段',
    function: '函数调用',
    operator: '操作符',
    constant: '常量值',
    group: '逻辑分组'
  }
  return names[type] || type
}

const getComponentTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    field: 'primary',
    function: 'warning',
    operator: 'success',
    constant: 'info',
    group: 'danger'
  }
  return colors[type] || ''
}

const getComponentTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    field: 'FIELD',
    function: 'FUNC',
    operator: 'OP',
    constant: 'CONST',
    group: 'GROUP'
  }
  return tags[type] || type.toUpperCase()
}

const getComponentDescription = (type: string) => {
  const descriptions: Record<string, string> = {
    field: '表示数据库表中的字段，用于获取具体的数据值',
    function: '执行特定的计算或逻辑操作，可以接受参数并返回结果',
    operator: '用于比较、计算或逻辑运算的符号',
    constant: '固定的数值、文本或其他类型的常量值',
    group: '将多个条件组合在一起的逻辑分组'
  }
  return descriptions[type] || '未知组件类型'
}

const getValueDataType = (value: any) => {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (value instanceof Date) return 'date'
  return 'string'
}

// 字段属性变化处理
const handleFieldTypeChange = () => {
  updateComponent({ dataType: fieldProps.dataType })
}

const handleLabelChange = () => {
  updateComponent({ label: fieldProps.label })
}

const handleAliasChange = () => {
  updateComponent({ alias: fieldProps.alias })
}

const handleRequiredChange = () => {
  updateComponent({ isRequired: fieldProps.isRequired })
}

// 函数属性变化处理
const handleFunctionLabelChange = () => {
  updateComponent({ label: functionProps.label })
}

const handleReturnTypeChange = () => {
  updateComponent({
    config: {
      ...props.component.config,
      returnType: functionProps.returnType
    }
  })
}

const addParameter = () => {
  const newParam = {
    type: 'constant',
    value: '',
    description: ''
  }
  functionProps.parameters.push(newParam)
  updateComponent({ parameters: [...functionProps.parameters] })
}

const removeParameter = (index: number) => {
  functionProps.parameters.splice(index, 1)
  updateComponent({ parameters: [...functionProps.parameters] })
}

const handleParameterTypeChange = (index: number) => {
  const param = functionProps.parameters[index]
  if (param.type !== 'constant') {
    param.value = ''
  }
  updateComponent({ parameters: [...functionProps.parameters] })
}

const handleParameterValueChange = (index: number) => {
  updateComponent({ parameters: [...functionProps.parameters] })
}

const handleParameterDescChange = (index: number) => {
  updateComponent({ parameters: [...functionProps.parameters] })
}

const editParameterExpression = (index: number) => {
  ElMessage.info('表达式编辑功能开发中...')
}

// 操作符属性变化处理
const handleOperatorLabelChange = () => {
  updateComponent({ label: operatorProps.label })
}

const handleOperandCountChange = () => {
  updateComponent({
    config: {
      ...props.component.config,
      operandCount: operatorProps.operandCount
    }
  })
}

const handlePrecedenceChange = () => {
  updateComponent({
    config: {
      ...props.component.config,
      precedence: operatorProps.precedence
    }
  })
}

const handleAssociativityChange = () => {
  updateComponent({
    config: {
      ...props.component.config,
      associativity: operatorProps.associativity
    }
  })
}

// 常量属性变化处理
const handleConstantTypeChange = () => {
  // 根据数据类型重置值
  switch (constantProps.dataType) {
    case 'string':
      constantProps.value = ''
      break
    case 'number':
      constantProps.value = 0
      break
    case 'boolean':
      constantProps.value = true
      break
    case 'date':
      constantProps.value = new Date().toISOString().split('T')[0]
      break
    case 'null':
      constantProps.value = null
      break
  }
  updateComponent({
    value: constantProps.value,
    dataType: constantProps.dataType
  })
}

const handleConstantValueChange = () => {
  updateComponent({ value: constantProps.value })
}

const handleFormatChange = () => {
  updateComponent({ format: constantProps.format })
}

const handleUnitChange = () => {
  updateComponent({ unit: constantProps.unit })
}

// 分组属性变化处理
const handleGroupNameChange = () => {
  updateComponent({ groupName: groupProps.groupName })
}

const handleGroupOperatorChange = () => {
  updateComponent({ operator: groupProps.operator })
}

const handleNestingLevelChange = () => {
  updateComponent({ nestingLevel: groupProps.nestingLevel })
}

// 验证规则变化处理
const handleValidationChange = () => {
  updateComponent({
    validation: {
      required: validationRules.required,
      pattern: validationRules.pattern,
      minLength: validationRules.minLength,
      maxLength: validationRules.maxLength,
      errorMessage: validationRules.errorMessage
    }
  })
}

// 样式配置变化处理
const handleStyleChange = () => {
  updateComponent({
    style: {
      color: styleConfig.color,
      backgroundColor: styleConfig.backgroundColor,
      borderStyle: styleConfig.borderStyle,
      borderRadius: styleConfig.borderRadius,
      fontSize: styleConfig.fontSize
    }
  })
}

// 高级设置变化处理
const handleAdvancedChange = () => {
  updateComponent({
    advanced: {
      cacheResult: advancedSettings.cacheResult,
      asyncExecution: advancedSettings.asyncExecution,
      timeout: advancedSettings.timeout,
      retryCount: advancedSettings.retryCount,
      debugMode: advancedSettings.debugMode
    }
  })
}

// 统一的组件更新方法
const updateComponent = (changes: any) => {
  const updatedComponent = {
    ...props.component,
    ...changes
  }
  emit('update', updatedComponent)
}
</script>

<style lang="scss" scoped>
.component-properties {
  height: 100%;
  overflow-y: auto;

  .properties-content {
    .component-info,
    .field-properties,
    .function-properties,
    .operator-properties,
    .constant-properties,
    .group-properties,
    .validation-rules,
    .style-config,
    .advanced-settings {
      margin-bottom: 16px;
      border: 1px solid #e4e7ed;
      border-radius: 6px;
      overflow: hidden;
    }

    .component-info {
      padding: 12px;
      background: #f8f9fa;

      .info-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .component-icon {
          font-size: 18px;
          color: #409eff;
        }

        .component-type {
          font-weight: 500;
          flex: 1;
        }
      }

      .info-description {
        font-size: 13px;
        color: #606266;
        line-height: 1.4;
      }
    }

    .field-properties,
    .function-properties,
    .operator-properties,
    .constant-properties,
    .group-properties {
      padding: 12px;

      .parameter-config {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e4e7ed;

        .config-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-weight: 500;
        }

        .parameter-list {
          .parameter-item {
            margin-bottom: 16px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 6px;

            .param-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;

              .param-index {
                font-weight: 500;
                color: #606266;
              }
            }
          }
        }
      }

      .length-inputs {
        display: flex;
        align-items: center;
        gap: 8px;

        .separator {
          color: #909399;
        }
      }

      .unit-text {
        margin-left: 8px;
        color: #909399;
        font-size: 12px;
      }
    }

    .validation-rules,
    .style-config,
    .advanced-settings {
      .rules-header,
      .style-header,
      .settings-header {
        padding: 8px 12px;
        background: #f8f9fa;
        border-bottom: 1px solid #e4e7ed;
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;

        .rules-icon,
        .style-icon,
        .settings-icon {
          color: #409eff;
        }
      }

      .rules-content,
      .style-content,
      .settings-content {
        padding: 12px;
      }
    }
  }

  .empty-properties {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #909399;

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-tip {
      font-size: 12px;
      margin-top: 4px;
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .component-properties {
    .properties-content {
      .component-info .info-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .parameter-config .parameter-list .parameter-item {
        padding: 8px;
      }

      .length-inputs {
        flex-direction: column;
        align-items: stretch;

        .separator {
          text-align: center;
        }
      }
    }
  }
}
</style>
