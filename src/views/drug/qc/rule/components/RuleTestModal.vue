<template>
  <el-dialog
    v-model="dialogVisible"
    title="规则测试"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="rule-test-container">
      <!-- 规则信息展示 -->
      <el-card class="rule-info-card" shadow="never" v-if="ruleInfo">
        <template #header>
          <span>测试规则</span>
        </template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="规则编码">
            <el-tag type="primary">{{ ruleInfo.ruleCode }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="规则名称">
            {{ ruleInfo.ruleName }}
          </el-descriptions-item>
        </el-descriptions>
        <div class="expression-display">
          <div class="expression-label">规则表达式：</div>
          <pre class="expression-code">{{ expression }}</pre>
        </div>
      </el-card>

      <!-- 测试数据输入 -->
      <el-card class="test-data-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>测试数据</span>
            <div class="header-actions">
              <el-button size="small" @click="loadSampleData">
                <el-icon><MagicStick /></el-icon>
                加载示例数据
              </el-button>
              <el-button size="small" @click="clearTestData">
                <el-icon><Delete /></el-icon>
                清空数据
              </el-button>
            </div>
          </div>
        </template>

        <!-- 字段输入表单 -->
        <el-form :model="testData" label-width="120px" class="test-form">
          <el-row :gutter="20">
            <el-col
              :span="12"
              v-for="field in detectedFields"
              :key="field.name"
              class="field-input-col"
            >
              <el-form-item :label="field.label">
                <el-input
                  v-if="field.type === 'string'"
                  v-model="testData[field.name]"
                  :placeholder="field.placeholder"
                  clearable
                />
                <el-input-number
                  v-else-if="field.type === 'number'"
                  v-model="testData[field.name]"
                  :placeholder="field.placeholder"
                  :precision="field.precision"
                  style="width: 100%"
                />
                <el-switch v-else-if="field.type === 'boolean'" v-model="testData[field.name]" />
                <el-date-picker
                  v-else-if="field.type === 'datetime'"
                  v-model="testData[field.name]"
                  type="datetime"
                  placeholder="选择日期时间"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                />
                <el-input
                  v-else
                  v-model="testData[field.name]"
                  :placeholder="field.placeholder"
                  clearable
                />
                <div class="field-description" v-if="field.description">
                  {{ field.description }}
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 自定义字段添加 -->
          <el-divider content-position="left">自定义字段</el-divider>
          <div class="custom-fields">
            <div v-for="(field, index) in customFields" :key="index" class="custom-field-row">
              <el-input v-model="field.name" placeholder="字段名" style="width: 150px" />
              <el-select v-model="field.type" style="width: 100px">
                <el-option label="字符串" value="string" />
                <el-option label="数字" value="number" />
                <el-option label="布尔值" value="boolean" />
              </el-select>
              <el-input v-model="field.value" placeholder="字段值" style="flex: 1" />
              <el-button
                type="danger"
                icon="Delete"
                @click="removeCustomField(index)"
                circle
                size="small"
              />
            </div>
            <el-button type="primary" plain @click="addCustomField" icon="Plus" size="small">
              添加自定义字段
            </el-button>
          </div>
        </el-form>
      </el-card>

      <!-- 测试结果展示 -->
      <el-card class="test-result-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>测试结果</span>
            <el-button
              type="primary"
              @click="executeTest"
              :loading="testing"
              :disabled="!hasTestData"
            >
              <el-icon><Play /></el-icon>
              执行测试
            </el-button>
          </div>
        </template>

        <!-- 执行结果 -->
        <div class="test-result" v-if="testResult">
          <div class="result-header">
            <el-tag :type="testResult.passed ? 'success' : 'danger'" size="large" effect="dark">
              <el-icon>
                <CircleCheck v-if="testResult.passed" />
                <CircleClose v-else />
              </el-icon>
              {{ testResult.passed ? '测试通过' : '测试失败' }}
            </el-tag>
            <span class="execution-time">执行时间: {{ testResult.executionTime }}ms</span>
          </div>

          <!-- 详细信息 -->
          <div class="result-details" v-if="testResult.details">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="执行结果">
                {{ testResult.result }}
              </el-descriptions-item>
              <el-descriptions-item label="错误信息" v-if="testResult.errorMessage">
                <div class="error-message">{{ testResult.errorMessage }}</div>
              </el-descriptions-item>
              <el-descriptions-item label="执行过程" v-if="testResult.executionSteps">
                <ol class="execution-steps">
                  <li v-for="step in testResult.executionSteps" :key="step">
                    {{ step }}
                  </li>
                </ol>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 测试建议 -->
          <div class="test-suggestions" v-if="testResult.suggestions?.length">
            <h4>优化建议：</h4>
            <ul class="suggestions-list">
              <li v-for="suggestion in testResult.suggestions" :key="suggestion">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </div>

        <!-- 无结果提示 -->
        <div class="no-result" v-else>
          <el-icon class="no-result-icon"><Promotion /></el-icon>
          <p>请配置测试数据并点击"执行测试"查看结果</p>
        </div>
      </el-card>

      <!-- 历史测试记录 -->
      <el-card class="history-card" shadow="never" v-if="testHistory.length > 0">
        <template #header>
          <div class="card-header">
            <span>测试历史</span>
            <el-button size="small" @click="clearHistory">
              <el-icon><Delete /></el-icon>
              清空历史
            </el-button>
          </div>
        </template>

        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in testHistory"
            :key="index"
            :type="record.passed ? 'success' : 'danger'"
            :timestamp="record.timestamp"
          >
            <div class="history-item">
              <div class="history-header">
                <span
                  class="result-badge"
                  :class="{ success: record.passed, error: !record.passed }"
                >
                  {{ record.passed ? '通过' : '失败' }}
                </span>
                <span class="test-summary">{{ record.summary }}</span>
              </div>
              <div class="test-data-preview">
                测试数据: {{ formatTestDataPreview(record.testData) }}
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="saveAsTemplate" v-if="hasTestData">
          <el-icon><DocumentAdd /></el-icon>
          保存为模板
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  MagicStick,
  Delete,
  Plus,
  Play,
  CircleCheck,
  CircleClose,
  Promotion,
  DocumentAdd
} from '@element-plus/icons-vue'

interface Props {
  expression?: string
  ruleInfo?: any
}

const props = defineProps<Props>()

// ========================= 响应式数据 =========================

const dialogVisible = defineModel<boolean>({ default: false })
const testing = ref(false)

/** 测试数据 */
const testData = reactive<Record<string, any>>({})

/** 自定义字段 */
const customFields = ref<Array<{ name: string; type: string; value: any }>>([])

/** 测试结果 */
const testResult = ref<any>(null)

/** 测试历史 */
const testHistory = ref<Array<any>>([])

// ========================= 计算属性 =========================

/**
 * 从表达式中检测字段
 * 这个函数就像是"侦探"，从表达式中找出所有需要的数据字段
 */
const detectedFields = computed(() => {
  if (!props.expression) return []

  // 提取所有 #fieldName 格式的字段
  const fieldMatches = props.expression.match(/#(\w+)/g) || []
  const uniqueFields = [...new Set(fieldMatches.map((f) => f.substring(1)))]

  return uniqueFields.map((fieldName) => ({
    name: fieldName,
    label: getFieldLabel(fieldName),
    type: getFieldType(fieldName),
    placeholder: getFieldPlaceholder(fieldName),
    description: getFieldDescription(fieldName),
    precision: getFieldPrecision(fieldName)
  }))
})

/** 是否有测试数据 */
const hasTestData = computed(() => {
  return Object.keys(testData).some((key) => testData[key] !== undefined && testData[key] !== '')
})

// ========================= 监听器 =========================

watch(dialogVisible, (visible) => {
  if (visible) {
    resetTestData()
  }
})

// ========================= 核心方法 =========================

/**
 * 执行测试
 * 这是组件的核心功能，模拟规则执行过程
 */
const executeTest = async () => {
  if (!props.expression) {
    ElMessage.error('没有可测试的表达式')
    return
  }

  testing.value = true
  testResult.value = null

  try {
    // 准备测试数据，合并检测字段和自定义字段
    const fullTestData = { ...testData }
    customFields.value.forEach((field) => {
      if (field.name && field.value !== undefined) {
        fullTestData[field.name] = convertFieldValue(field.value, field.type)
      }
    })

    // 模拟API调用执行测试
    const startTime = Date.now()
    const result = await simulateRuleExecution(props.expression, fullTestData)
    const endTime = Date.now()

    testResult.value = {
      ...result,
      executionTime: endTime - startTime,
      testData: fullTestData
    }

    // 添加到历史记录
    testHistory.value.unshift({
      timestamp: new Date().toLocaleString(),
      passed: result.passed,
      summary: generateTestSummary(result),
      testData: fullTestData,
      expression: props.expression
    })

    // 限制历史记录数量
    if (testHistory.value.length > 10) {
      testHistory.value = testHistory.value.slice(0, 10)
    }
  } catch (error) {
    ElMessage.error('测试执行失败: ' + error.message)
    testResult.value = {
      passed: false,
      result: 'false',
      errorMessage: error.message,
      executionTime: 0
    }
  } finally {
    testing.value = false
  }
}

/**
 * 模拟规则执行
 * 这个函数模拟后端的规则引擎，用于测试目的
 */
async function simulateRuleExecution(expression: string, data: Record<string, any>) {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500))

  try {
    // 这里简化处理，实际应该调用后端API
    const result = evaluateExpression(expression, data)

    return {
      passed: Boolean(result),
      result: String(result),
      details: `表达式 "${expression}" 在给定数据下的执行结果`,
      executionSteps: generateExecutionSteps(expression, data),
      suggestions: generateSuggestions(expression, data, result)
    }
  } catch (error) {
    throw new Error(`表达式执行错误: ${error.message}`)
  }
}

/**
 * 简单的表达式求值器
 * 这个函数提供基本的表达式计算能力（实际项目中应该使用专业的表达式引擎）
 */
function evaluateExpression(expression: string, data: Record<string, any>): any {
  // 替换表达式中的字段引用
  let processedExpression = expression

  // 处理字段引用 #fieldName
  Object.keys(data).forEach((key) => {
    const fieldRef = `#${key}`
    const value = data[key]

    if (processedExpression.includes(fieldRef)) {
      // 根据值类型进行相应处理
      if (typeof value === 'string') {
        processedExpression = processedExpression.replace(new RegExp(`#${key}`, 'g'), `"${value}"`)
      } else if (value === null) {
        processedExpression = processedExpression.replace(new RegExp(`#${key}`, 'g'), 'null')
      } else {
        processedExpression = processedExpression.replace(new RegExp(`#${key}`, 'g'), String(value))
      }
    }
  })

  // 处理一些常见的方法调用
  processedExpression = processedExpression
    .replace(/\.trim\(\)/g, '.trim()')
    .replace(/\.length\(\)/g, '.length')
    .replace(/Math\.abs\(/g, 'Math.abs(')

  // 简单的安全性检查
  if (processedExpression.includes('eval') || processedExpression.includes('Function')) {
    throw new Error('不安全的表达式')
  }

  try {
    // 创建安全的执行环境
    const safeEval = new Function('Math', `return ${processedExpression}`)
    return safeEval(Math)
  } catch (error) {
    throw new Error(`表达式语法错误: ${error.message}`)
  }
}

// ========================= 辅助方法 =========================

/** 加载示例数据 */
const loadSampleData = () => {
  detectedFields.value.forEach((field) => {
    testData[field.name] = getSampleValue(field.name, field.type)
  })
  ElMessage.success('已加载示例数据')
}

/** 清空测试数据 */
const clearTestData = () => {
  Object.keys(testData).forEach((key) => {
    delete testData[key]
  })
  customFields.value = []
  ElMessage.success('已清空测试数据')
}

/** 重置测试数据 */
const resetTestData = () => {
  Object.keys(testData).forEach((key) => {
    delete testData[key]
  })
  customFields.value = []
  testResult.value = null
}

/** 添加自定义字段 */
const addCustomField = () => {
  customFields.value.push({
    name: '',
    type: 'string',
    value: ''
  })
}

/** 移除自定义字段 */
const removeCustomField = (index: number) => {
  customFields.value.splice(index, 1)
}

/** 清空历史记录 */
const clearHistory = () => {
  testHistory.value = []
  ElMessage.success('已清空测试历史')
}

/** 保存为模板 */
const saveAsTemplate = async () => {
  try {
    const templateName = await ElMessageBox.prompt('请输入模板名称', '保存测试模板', {
      confirmButtonText: '保存',
      cancelButtonText: '取消'
    })

    if (templateName.value) {
      // 这里应该调用API保存模板
      ElMessage.success(`测试模板"${templateName.value}"已保存`)
    }
  } catch (error) {
    // 用户取消操作
  }
}

// ========================= 字段处理辅助函数 =========================

function getFieldLabel(fieldName: string): string {
  const labelMap: Record<string, string> = {
    amount: '金额',
    packageQty: '包装数量',
    dosageQty: '制剂数量',
    conversionFactor: '转换系数',
    drugName: '药品名称',
    productName: '产品名称',
    ypid: 'YPID编码',
    mobile: '手机号码',
    email: '邮箱地址'
  }
  return labelMap[fieldName] || fieldName
}

function getFieldType(fieldName: string): string {
  const typeMap: Record<string, string> = {
    amount: 'number',
    packageQty: 'number',
    dosageQty: 'number',
    conversionFactor: 'number',
    createTime: 'datetime',
    updateTime: 'datetime'
  }
  return typeMap[fieldName] || 'string'
}

function getFieldPlaceholder(fieldName: string): string {
  const placeholderMap: Record<string, string> = {
    amount: '请输入金额，如：150.50',
    packageQty: '请输入包装数量，如：100',
    dosageQty: '请输入制剂数量，如：1000',
    conversionFactor: '请输入转换系数，如：10',
    drugName: '请输入药品名称，如：阿司匹林',
    ypid: '请输入12位YPID编码'
  }
  return placeholderMap[fieldName] || `请输入${fieldName}`
}

function getFieldDescription(fieldName: string): string {
  const descMap: Record<string, string> = {
    conversionFactor: '包装单位到制剂单位的转换比例',
    ypid: '国家药管平台药品编码，12位数字'
  }
  return descMap[fieldName] || ''
}

function getFieldPrecision(fieldName: string): number {
  const precisionMap: Record<string, number> = {
    amount: 2,
    conversionFactor: 0
  }
  return precisionMap[fieldName] || 0
}

function getSampleValue(fieldName: string, type: string): any {
  const sampleMap: Record<string, any> = {
    amount: 150.5,
    packageQty: 100,
    dosageQty: 1000,
    conversionFactor: 10,
    drugName: '阿司匹林',
    productName: '拜阿司匹林',
    ypid: '123456789012',
    mobile: '13800138000',
    email: 'test@example.com'
  }

  if (sampleMap[fieldName] !== undefined) {
    return sampleMap[fieldName]
  }

  switch (type) {
    case 'number':
      return 100
    case 'boolean':
      return true
    case 'datetime':
      return new Date().toISOString().slice(0, 19)
    default:
      return 'test_value'
  }
}

function convertFieldValue(value: any, type: string): any {
  switch (type) {
    case 'number':
      return Number(value)
    case 'boolean':
      return Boolean(value)
    default:
      return String(value)
  }
}

function generateExecutionSteps(expression: string, data: Record<string, any>): string[] {
  return ['解析表达式中的字段引用', '从测试数据中获取字段值', '执行表达式计算', '返回计算结果']
}

function generateSuggestions(expression: string, data: Record<string, any>, result: any): string[] {
  const suggestions: string[] = []

  if (!result) {
    suggestions.push('表达式返回false，请检查测试数据是否符合规则要求')
  }

  if (Object.keys(data).length < 3) {
    suggestions.push('建议增加更多测试数据以验证规则的完整性')
  }

  return suggestions
}

function generateTestSummary(result: any): string {
  return result.passed ? '规则验证通过' : '规则验证失败'
}

function formatTestDataPreview(data: Record<string, any>): string {
  const keys = Object.keys(data).slice(0, 3)
  const preview = keys.map((key) => `${key}=${data[key]}`).join(', ')
  return keys.length < Object.keys(data).length ? `${preview}...` : preview
}

// ========================= 对外方法 =========================

defineExpose({
  open: (expression: string, ruleInfo?: any) => {
    // 设置表达式和规则信息
    if (ruleInfo) {
      // 通过props传递或直接设置
    }
    dialogVisible.value = true
  }
})
</script>

<style lang="scss" scoped>
.rule-test-container {
  max-height: 70vh;
  overflow-y: auto;
}

.rule-info-card,
.test-data-card,
.test-result-card,
.history-card {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.expression-display {
  margin-top: 12px;

  .expression-label {
    font-size: 14px;
    color: #606266;
    margin-bottom: 8px;
  }

  .expression-code {
    background-color: #f5f7fa;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 12px;
    font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
    font-size: 13px;
    color: #475669;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.test-form {
  .field-input-col {
    margin-bottom: 16px;
  }

  .field-description {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1.4;
  }
}

.custom-fields {
  .custom-field-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
}

.test-result {
  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .execution-time {
      font-size: 14px;
      color: #909399;
    }
  }

  .result-details {
    margin-bottom: 16px;

    .error-message {
      color: #f56c6c;
      background-color: #fef0f0;
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #fbc4c4;
    }

    .execution-steps {
      margin: 0;
      padding-left: 20px;

      li {
        margin-bottom: 4px;
        color: #606266;
      }
    }
  }

  .test-suggestions {
    background-color: #f0f9ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 12px;

    h4 {
      margin: 0 0 8px 0;
      color: #1e40af;
      font-size: 14px;
    }

    .suggestions-list {
      margin: 0;
      padding-left: 20px;

      li {
        color: #3b82f6;
        margin-bottom: 4px;
      }
    }
  }
}

.no-result {
  text-align: center;
  padding: 40px 20px;
  color: #909399;

  .no-result-icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.history-item {
  .history-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    .result-badge {
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 500;

      &.success {
        background-color: #f0f9ff;
        color: #059669;
      }

      &.error {
        background-color: #fef2f2;
        color: #dc2626;
      }
    }

    .test-summary {
      font-weight: 500;
      color: #303133;
    }
  }

  .test-data-preview {
    font-size: 12px;
    color: #909399;
    font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .rule-test-container {
    max-height: 60vh;
  }

  .test-form {
    .field-input-col {
      margin-bottom: 12px;
    }
  }

  .custom-field-row {
    flex-direction: column;
    align-items: stretch;
  }

  .result-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}

/* 描述列表样式 */
:deep(.el-descriptions__label) {
  background-color: #fafbfc;
  font-weight: 600;
  width: 100px;
}

/* 时间线样式 */
:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}
</style>
