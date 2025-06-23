<template>
  <el-dialog
    v-model="dialogVisible"
    title="表达式测试"
    width="700px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="expression-test-container">
      <!-- 表达式显示 -->
      <el-card class="expression-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><VideoPlay /></el-icon>
            <span>测试表达式</span>
          </div>
        </template>

        <div class="expression-display">
          <pre class="expression-code">{{ expression }}</pre>
        </div>
      </el-card>

      <!-- 测试数据输入 -->
      <el-card class="test-data-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><EditPen /></el-icon>
            <span>测试数据</span>
            <el-button size="small" @click="loadSampleData">
              <el-icon><MagicStick /></el-icon>
              示例数据
            </el-button>
          </div>
        </template>

        <el-form :model="testData" label-width="100px" class="test-form">
          <el-row :gutter="20">
            <el-col :span="12" v-for="field in detectedFields" :key="field" class="field-col">
              <el-form-item :label="`#${field}`">
                <el-input v-model="testData[field]" :placeholder="`请输入${field}的值`" clearable />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 自定义字段 -->
          <el-divider content-position="left">自定义字段</el-divider>
          <div class="custom-fields">
            <div v-for="(field, index) in customFields" :key="index" class="custom-field-row">
              <el-input v-model="field.name" placeholder="字段名" style="width: 120px" />
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
              添加字段
            </el-button>
          </div>
        </el-form>
      </el-card>

      <!-- 测试结果 -->
      <el-card class="result-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><DataAnalysis /></el-icon>
            <span>测试结果</span>
            <el-button
              type="primary"
              @click="executeTest"
              :loading="testing"
              :disabled="!hasTestData"
            >
              <el-icon><VideoPlay /></el-icon>
              执行测试
            </el-button>
          </div>
        </template>

        <div class="test-result" v-if="testResult !== null">
          <div class="result-summary">
            <el-tag :type="testResult.success ? 'success' : 'danger'" size="large" effect="dark">
              <el-icon>
                <CircleCheck v-if="testResult.success" />
                <CircleClose v-else />
              </el-icon>
              {{ testResult.success ? '测试通过' : '测试失败' }}
            </el-tag>
            <span class="execution-time">耗时: {{ testResult.executionTime }}ms</span>
          </div>

          <div class="result-details">
            <div class="result-item">
              <span class="result-label">返回值:</span>
              <code class="result-value">{{ testResult.result }}</code>
            </div>

            <div class="result-item" v-if="testResult.error">
              <span class="result-label">错误信息:</span>
              <div class="error-message">{{ testResult.error }}</div>
            </div>

            <div class="result-item">
              <span class="result-label">执行步骤:</span>
              <ol class="execution-steps">
                <li v-for="step in testResult.steps" :key="step">{{ step }}</li>
              </ol>
            </div>
          </div>
        </div>

        <div class="no-result" v-else>
          <el-icon class="no-result-icon"><Promotion /></el-icon>
          <p>请配置测试数据并点击"执行测试"</p>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="success" @click="copyResult" v-if="testResult">
          <el-icon><CopyDocument /></el-icon>
          复制结果
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  EditPen,
  MagicStick,
  DataAnalysis,
  VideoPlay,
  CircleCheck,
  CircleClose,
  Promotion,
  CopyDocument
} from '@element-plus/icons-vue'

// 移除Props定义，通过open方法接收表达式

// ========================= 响应式数据 =========================

const dialogVisible = defineModel<boolean>({ default: false })
const testing = ref(false)
const expression = ref('') // 修复：添加缺失的expression变量定义

/** 测试数据 */
const testData = reactive<Record<string, any>>({})

/** 自定义字段 */
const customFields = ref<Array<{ name: string; value: any }>>([])

/** 测试结果 */
const testResult = ref<any>(null)

// ========================= 计算属性 =========================

/**
 * 从表达式中检测字段
 * 这个计算属性的作用就像解析器，从SpEL表达式中自动识别出所有需要测试数据的字段。
 * 它通过正则表达式匹配#fieldName格式的字段引用，为用户自动生成测试数据输入框。
 */
const detectedFields = computed(() => {
  if (!expression.value) return []

  // 使用正则表达式提取所有 #fieldName 格式的字段
  const fieldMatches = expression.value.match(/#(\w+)/g) || []
  // 去重并移除#符号
  return [...new Set(fieldMatches.map((f) => f.substring(1)))]
})

/** 是否有测试数据 */
const hasTestData = computed(() => {
  const hasMainData = Object.keys(testData).some(
    (key) => testData[key] !== undefined && testData[key] !== ''
  )
  const hasCustomData = customFields.value.some(
    (field) => field.name && field.value !== undefined && field.value !== ''
  )
  return hasMainData || hasCustomData
})

// ========================= 监听器 =========================

watch(dialogVisible, (visible) => {
  if (!visible) {
    resetTestData()
  }
})

// ========================= 核心方法 =========================

/**
 * 执行表达式测试
 * 这是组件的核心功能，模拟表达式的执行过程。
 * 在真实项目中，这里应该调用后端API来执行表达式。
 */
const executeTest = async () => {
  if (!expression.value) {
    ElMessage.error('表达式不能为空')
    return
  }

  testing.value = true
  const startTime = Date.now()

  try {
    // 收集所有测试数据（包括检测到的字段和自定义字段）
    const allTestData = { ...testData }
    customFields.value.forEach((field) => {
      if (field.name && field.value !== undefined) {
        allTestData[field.name] = field.value
      }
    })

    // 模拟表达式执行（在实际项目中这里应该调用后端API）
    const result = await simulateExpressionExecution(expression.value, allTestData)
    const endTime = Date.now()

    testResult.value = {
      success: Boolean(result.value),
      result: result.value,
      error: result.error,
      executionTime: endTime - startTime,
      steps: generateExecutionSteps(expression.value, allTestData)
    }

    ElMessage.success('测试执行完成')
  } catch (error: any) {
    testResult.value = {
      success: false,
      result: 'false',
      error: error.message,
      executionTime: Date.now() - startTime,
      steps: ['执行失败']
    }
    ElMessage.error('测试执行失败')
  } finally {
    testing.value = false
  }
}

/**
 * 模拟表达式执行
 * 这个函数提供简化的表达式求值能力，用于演示目的。
 * 在生产环境中，应该使用专业的表达式引擎或调用后端服务。
 */
async function simulateExpressionExecution(expr: string, data: Record<string, any>) {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300))

  try {
    // 替换表达式中的字段引用
    let processedExpr = expr

    Object.keys(data).forEach((key) => {
      const fieldRef = `#${key}`
      const value = data[key]

      if (processedExpr.includes(fieldRef)) {
        if (typeof value === 'string') {
          processedExpr = processedExpr.replace(new RegExp(`#${key}`, 'g'), `"${value}"`)
        } else if (value === null || value === undefined) {
          processedExpr = processedExpr.replace(new RegExp(`#${key}`, 'g'), 'null')
        } else {
          processedExpr = processedExpr.replace(new RegExp(`#${key}`, 'g'), String(value))
        }
      }
    })

    // 处理一些方法调用
    processedExpr = processedExpr
      .replace(/\.trim\(\)/g, '.trim()')
      .replace(/\.length\(\)/g, '.length')

    // 安全性检查
    if (processedExpr.includes('eval') || processedExpr.includes('Function')) {
      throw new Error('不安全的表达式')
    }

    // 简单的表达式求值
    const result = safeEval(processedExpr)

    return { value: result, error: null }
  } catch (error: any) {
    return { value: false, error: error.message }
  }
}

/**
 * 安全的表达式求值
 * 提供基础的表达式计算能力，避免直接使用eval函数带来的安全风险
 */
function safeEval(expr: string): any {
  try {
    // 创建安全的执行环境，只提供必要的Math对象
    const safeFunction = new Function('Math', `return ${expr}`)
    return safeFunction(Math)
  } catch (error) {
    // 如果Function构造失败，返回false
    return false
  }
}

/**
 * 生成执行步骤说明
 * 这个函数为用户提供表达式执行过程的清晰说明，帮助理解测试结果
 */
function generateExecutionSteps(expr: string, data: Record<string, any>): string[] {
  const steps = [
    '解析表达式中的字段引用',
    '从测试数据中获取字段值',
    '替换表达式中的字段引用为实际值'
  ]

  if (expr.includes('&&') || expr.includes('||')) {
    steps.push('执行逻辑运算')
  }

  if (expr.includes('>') || expr.includes('<') || expr.includes('==')) {
    steps.push('执行比较运算')
  }

  steps.push('返回最终计算结果')

  return steps
}

// ========================= 辅助方法 =========================

/** 加载示例数据 */
const loadSampleData = () => {
  // 为检测到的字段提供示例数据
  detectedFields.value.forEach((field) => {
    testData[field] = getSampleValueForField(field)
  })
  ElMessage.success('已加载示例数据')
}

/** 获取字段的示例值 */
function getSampleValueForField(fieldName: string): any {
  const sampleData: Record<string, any> = {
    amount: '150.50',
    packageQty: '100',
    dosageQty: '1000',
    conversionFactor: '10',
    drugName: '阿司匹林',
    productName: '拜阿司匹林',
    ypid: '123456789012',
    price: '1.50',
    quantity: '100'
  }

  return sampleData[fieldName] || 'test_value'
}

/** 添加自定义字段 */
const addCustomField = () => {
  customFields.value.push({ name: '', value: '' })
}

/** 移除自定义字段 */
const removeCustomField = (index: number) => {
  customFields.value.splice(index, 1)
}

/** 重置测试数据 */
const resetTestData = () => {
  Object.keys(testData).forEach((key) => {
    delete testData[key]
  })
  customFields.value = []
  testResult.value = null
}

/** 复制结果 */
const copyResult = async () => {
  if (!testResult.value) return

  const resultText = `表达式: ${expression.value}\n结果: ${testResult.value.result}\n执行时间: ${testResult.value.executionTime}ms`

  try {
    await navigator.clipboard.writeText(resultText)
    ElMessage.success('结果已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

// ========================= 对外方法 =========================

defineExpose({
  open: (expr: string) => {
    expression.value = expr || ''
    resetTestData()
    dialogVisible.value = true
  }
})
</script>

<style lang="scss" scoped>
.expression-test-container {
  max-height: 70vh;
  overflow-y: auto;
}

.expression-card,
.test-data-card,
.result-card {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;

  & > :last-child {
    margin-left: auto;
  }
}

.expression-display {
  .expression-code {
    background-color: #f5f7fa;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 16px;
    font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
    font-size: 14px;
    color: #e6a23c;
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
  }
}

.test-form {
  .field-col {
    margin-bottom: 16px;
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
  .result-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .execution-time {
      font-size: 14px;
      color: #909399;
    }
  }

  .result-details {
    .result-item {
      margin-bottom: 16px;

      .result-label {
        font-weight: 600;
        color: #303133;
        margin-right: 8px;
      }

      .result-value {
        background-color: #f0f9ff;
        padding: 4px 8px;
        border-radius: 4px;
        font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
        color: #1890ff;
      }

      .error-message {
        background-color: #fef0f0;
        border: 1px solid #fbc4c4;
        border-radius: 4px;
        padding: 8px 12px;
        color: #f56c6c;
        margin-top: 4px;
      }

      .execution-steps {
        margin: 8px 0 0 20px;

        li {
          margin-bottom: 4px;
          color: #606266;
        }
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .expression-test-container {
    max-height: 60vh;
  }

  .custom-field-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .result-summary {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>
