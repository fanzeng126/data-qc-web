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
      <el-card class="rule-info-card" shadow="never" v-if="ruleData">
        <template #header>
          <span>测试规则</span>
        </template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="规则编码">
            <el-tag type="primary">{{ ruleData.ruleCode }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="规则名称">
            {{ ruleData.ruleName }}
          </el-descriptions-item>
          <el-descriptions-item label="规则类型">
            <el-tag :type="ruleData.ruleType === 1 ? 'primary' : 'success'">
              {{ ruleData.ruleType === 1 ? '前置质控' : '后置质控' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="适用表">
            {{ ruleData.tableType || '全部表' }}
          </el-descriptions-item>
        </el-descriptions>
        <div class="expression-display">
          <div class="expression-label">规则表达式：</div>
          <pre class="expression-code">{{ ruleData.ruleExpression || '暂无表达式' }}</pre>
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
              <el-button type="danger" @click="removeCustomField(index)" circle size="small">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" plain @click="addCustomField" size="small">
              <el-icon><Plus /></el-icon>
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
              :disabled="!hasTestData || !ruleData?.ruleExpression"
            >
              <el-icon><VideoPlay /></el-icon>
              执行测试
            </el-button>
          </div>
        </template>

        <!-- 执行结果 -->
        <div class="test-result" v-if="testResult">
          <div class="result-header">
            <el-tag
              :type="testResult.testSuccess ? 'success' : 'danger'"
              size="large"
              effect="dark"
            >
              <el-icon>
                <CircleCheck v-if="testResult.testSuccess" />
                <CircleClose v-else />
              </el-icon>
              {{ testResult.testSuccess ? '测试成功' : '测试失败' }}
            </el-tag>
            <span class="execution-time">执行时间: {{ testResult.totalExecutionTime }}ms</span>
          </div>

          <!-- 详细信息 -->
          <div class="result-details">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="总测试用例">
                {{ testResult.totalTestCases }}
              </el-descriptions-item>
              <el-descriptions-item label="通过用例">
                <el-tag type="success">{{ testResult.passedCases }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="失败用例">
                <el-tag type="danger">{{ testResult.failedCases }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="异常用例">
                <el-tag type="warning">{{ testResult.exceptionCases }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="通过率">
                <el-tag :type="testResult.passRate >= 80 ? 'success' : 'warning'">
                  {{ testResult.passRate?.toFixed(2) }}%
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 详细测试结果 -->
          <div class="detailed-results" v-if="testResult.detailedResults?.length">
            <h4>详细测试结果：</h4>
            <el-table :data="testResult.detailedResults" size="small" max-height="300">
              <el-table-column prop="caseIndex" label="用例#" width="80" />
              <el-table-column label="结果" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.passed ? 'success' : 'danger'" size="small">
                    {{ row.passed ? '通过' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="executionTime" label="执行时间(ms)" width="120" />
              <el-table-column prop="errorMessage" label="错误信息" show-overflow-tooltip />
            </el-table>
          </div>

          <!-- 测试建议 -->
          <div class="test-suggestions" v-if="testResult.recommendations?.length">
            <h4>测试建议：</h4>
            <ul class="suggestions-list">
              <li v-for="suggestion in testResult.recommendations" :key="suggestion">
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
            :type="record.testSuccess ? 'success' : 'danger'"
            :timestamp="record.timestamp"
          >
            <div class="history-item">
              <div class="history-header">
                <span
                  class="result-badge"
                  :class="{ success: record.testSuccess, error: !record.testSuccess }"
                >
                  {{ record.testSuccess ? '成功' : '失败' }}
                </span>
                <span class="test-summary"> 通过率: {{ record.passRate?.toFixed(2) }}% </span>
              </div>
              <div class="test-data-preview"> 测试用例: {{ record.totalTestCases }}个 </div>
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
  VideoPlay,
  CircleCheck,
  CircleClose,
  Promotion,
  DocumentAdd,
  Plus
} from '@element-plus/icons-vue'
import { QcRuleApi } from '@/api/drug/qc/rule'

// ========================= Props定义 =========================

interface Props {
  rule?: any // 修改：接收rule对象
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

/** 规则数据 - 修改：从props.rule获取 */
const ruleData = computed(() => props.rule)

/**
 * 从表达式中检测字段
 */
const detectedFields = computed(() => {
  const expression = ruleData.value?.ruleExpression
  if (!expression) return []

  // 提取所有 #fieldName 格式的字段
  const fieldMatches = expression.match(/#(\w+)/g) || []
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
 * 执行测试 - 修改：调用真实API
 */
const executeTest = async () => {
  if (!ruleData.value?.ruleExpression) {
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

    // 构建测试请求
    const testRequest = {
      ruleExpression: ruleData.value.ruleExpression,
      testDataJson: JSON.stringify([fullTestData]), // 包装成数组
      testOptions: {
        enableDetailedOutput: true,
        enablePerformanceAnalysis: true,
        enableErrorAnalysis: true,
        timeout: 10000
      }
    }

    // 调用后端API
    const result = await QcRuleApi.testRuleExpression(testRequest)
    testResult.value = result

    // 添加到历史记录
    testHistory.value.unshift({
      timestamp: new Date().toLocaleString(),
      testSuccess: result.testSuccess,
      passRate: result.passRate,
      totalTestCases: result.totalTestCases,
      testData: fullTestData,
      expression: ruleData.value.ruleExpression
    })

    // 限制历史记录数量
    if (testHistory.value.length > 10) {
      testHistory.value = testHistory.value.slice(0, 10)
    }

    if (result.testSuccess) {
      ElMessage.success('规则测试执行成功')
    } else {
      ElMessage.warning('规则测试发现问题，请查看详细结果')
    }
  } catch (error) {
    console.error('测试执行失败:', error)
    ElMessage.error('测试执行失败: ' + (error.message || '未知错误'))

    // 构造错误结果
    testResult.value = {
      testSuccess: false,
      totalExecutionTime: 0,
      totalTestCases: 1,
      passedCases: 0,
      failedCases: 0,
      exceptionCases: 1,
      passRate: 0,
      detailedResults: [
        {
          caseIndex: 0,
          passed: false,
          executionTime: 0,
          errorMessage: error.message || '测试执行异常'
        }
      ],
      recommendations: ['请检查规则表达式语法和测试数据是否正确']
    }
  } finally {
    testing.value = false
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
      // TODO: 实现模板保存功能
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

// ========================= 对外方法 =========================

defineExpose({
  open: () => {
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
  }

  .detailed-results {
    margin-bottom: 16px;

    h4 {
      margin: 0 0 12px 0;
      color: #303133;
      font-size: 14px;
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
