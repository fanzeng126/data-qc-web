<template>
  <div class="result-expand-content">
    <!-- 基本信息区域 -->
    <div class="expand-section basic-info">
      <div class="section-header">
        <el-icon><InfoFilled /></el-icon>
        <span class="section-title">检测详情</span>
      </div>
      <div class="section-content">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="规则类型">
            <el-tag :type="result.ruleType === 1 ? 'primary' : 'success'" size="small">
              {{ result.ruleType === 1 ? '前置质控' : '后置质控' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="检测表">
            {{ getDictLabel(DICT_TYPE.DRUG_QC_TABLE_TYPE, result.tableType) }}
          </el-descriptions-item>
          <el-descriptions-item label="记录ID">
            <el-link type="primary" @click="viewOriginalRecord">
              {{ result.recordId }}
            </el-link>
          </el-descriptions-item>
          <el-descriptions-item label="错误级别">
            <el-tag :type="result.errorLevel === 1 ? 'danger' : 'warning'" size="small">
              {{ result.errorLevel === 1 ? '错误' : '警告' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="检测时间">
            {{ formatDateTime(result.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="执行用时">
            {{ result.executionTime || '-' }}ms
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <!-- 错误详情区域 -->
    <div class="expand-section error-details">
      <div class="section-header">
        <el-icon><Warning /></el-icon>
        <span class="section-title">错误详情</span>
      </div>
      <div class="section-content">
        <div class="error-message-container">
          <div class="error-title">{{ result.errorDetail || '质控规则验证失败' }}</div>
          <div class="error-description" v-if="result.errorDescription">
            {{ result.errorDescription }}
          </div>
        </div>

        <!-- 字段对比 -->
        <div class="field-comparison" v-if="result.checkField">
          <h4 class="comparison-title">字段值对比</h4>
          <div class="comparison-grid">
            <div class="comparison-item">
              <div class="comparison-label">检查字段</div>
              <div class="comparison-value field-name">{{ result.checkField }}</div>
            </div>
            <div class="comparison-item">
              <div class="comparison-label">实际值</div>
              <div class="comparison-value actual-value">
                {{ formatFieldValue(result.fieldValue) }}
              </div>
            </div>
            <div class="comparison-item">
              <div class="comparison-label">期望值</div>
              <div class="comparison-value expected-value">
                {{ formatFieldValue(result.expectedValue) }}
              </div>
            </div>
            <div class="comparison-item">
              <div class="comparison-label">差异说明</div>
              <div class="comparison-value difference-note">
                {{ generateDifferenceNote(result) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 规则表达式展示 -->
        <div class="rule-expression" v-if="result.ruleExpression">
          <h4 class="expression-title">验证规则</h4>
          <div class="expression-container">
            <pre class="expression-code">{{ result.ruleExpression }}</pre>
            <el-button size="small" type="text" @click="explainRule">
              <el-icon><QuestionFilled /></el-icon>
              规则说明
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据上下文区域 -->
    <div class="expand-section data-context">
      <div class="section-header">
        <el-icon><Document /></el-icon>
        <span class="section-title">数据上下文</span>
        <el-button size="small" type="text" @click="loadContextData" :loading="loadingContext">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
      <div class="section-content">
        <div class="context-grid" v-if="contextData">
          <!-- 关联数据 -->
          <div class="context-item">
            <div class="context-label">
              <el-icon><Link /></el-icon>
              关联记录
            </div>
            <div class="context-value">
              <span v-if="contextData.relatedRecords > 0" class="has-related">
                {{ contextData.relatedRecords }}条相关记录
              </span>
              <span v-else class="no-related">无关联记录</span>
            </div>
          </div>

          <!-- 同批次数据 -->
          <div class="context-item">
            <div class="context-label">
              <el-icon><Collection /></el-icon>
              同批次状态
            </div>
            <div class="context-value">
              <el-tag
                v-if="contextData.batchStatus"
                :type="getBatchStatusType(contextData.batchStatus)"
                size="small"
              >
                {{ contextData.batchStatus }}
              </el-tag>
            </div>
          </div>

          <!-- 历史版本 -->
          <div class="context-item">
            <div class="context-label">
              <el-icon><Clock /></el-icon>
              历史版本
            </div>
            <div class="context-value"> {{ contextData.historyCount || 0 }}个版本 </div>
          </div>

          <!-- 数据来源 -->
          <div class="context-item">
            <div class="context-label">
              <el-icon><FolderOpened /></el-icon>
              数据来源
            </div>
            <div class="context-value">
              {{ contextData.dataSource || '未知' }}
            </div>
          </div>
        </div>

        <!-- 样本数据预览 -->
        <div class="sample-preview" v-if="contextData?.sampleData">
          <h4 class="preview-title">相关数据样本</h4>
          <el-table :data="contextData.sampleData" size="small" border max-height="200">
            <el-table-column
              v-for="column in sampleColumns"
              :key="column.prop"
              :prop="column.prop"
              :label="column.label"
              :width="column.width"
              show-overflow-tooltip
            />
          </el-table>
        </div>
      </div>
    </div>

    <!-- 修复建议区域 -->
    <div class="expand-section fix-suggestions">
      <div class="section-header">
        <el-icon><Tools /></el-icon>
        <span class="section-title">修复建议</span>
      </div>
      <div class="section-content">
        <div class="suggestions-container">
          <!-- 自动修复选项 -->
          <div class="suggestion-item auto-fix" v-if="result.autoFixSuggestion">
            <div class="suggestion-header">
              <el-icon><Magic /></el-icon>
              <span class="suggestion-title">自动修复</span>
              <el-tag type="success" size="small">推荐</el-tag>
            </div>
            <div class="suggestion-description">
              {{ result.autoFixSuggestion }}
            </div>
            <div class="suggestion-actions">
              <el-button size="small" type="primary" @click="autoFix">
                <el-icon><Tools /></el-icon>
                立即修复
              </el-button>
            </div>
          </div>

          <!-- 手动修复指导 -->
          <div class="suggestion-item manual-fix" v-if="result.manualFixGuide">
            <div class="suggestion-header">
              <el-icon><Edit /></el-icon>
              <span class="suggestion-title">手动修复</span>
              <el-tag type="warning" size="small">谨慎</el-tag>
            </div>
            <div class="suggestion-description">
              {{ result.manualFixGuide }}
            </div>
            <div class="suggestion-steps" v-if="manualFixSteps.length">
              <div class="steps-title">修复步骤：</div>
              <ol class="steps-list">
                <li v-for="step in manualFixSteps" :key="step">{{ step }}</li>
              </ol>
            </div>
          </div>

          <!-- 忽略选项 -->
          <div class="suggestion-item ignore-option">
            <div class="suggestion-header">
              <el-icon><Hide /></el-icon>
              <span class="suggestion-title">忽略此项</span>
              <el-tag type="info" size="small">可选</el-tag>
            </div>
            <div class="suggestion-description"> 如果确认此数据无误，可以忽略此质控提示 </div>
            <div class="suggestion-actions">
              <el-button size="small" @click="ignoreIssue">
                <el-icon><Hide /></el-icon>
                忽略
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作历史区域 -->
    <div class="expand-section operation-history" v-if="operationHistory.length">
      <div class="section-header">
        <el-icon><Clock /></el-icon>
        <span class="section-title">操作历史</span>
      </div>
      <div class="section-content">
        <el-timeline class="history-timeline">
          <el-timeline-item
            v-for="(record, index) in operationHistory"
            :key="index"
            :timestamp="formatDateTime(record.operationTime)"
            :type="getOperationType(record.operation)"
          >
            <div class="history-item">
              <div class="history-header">
                <span class="operation-name">{{ record.operationName }}</span>
                <span class="operator">{{ record.operator }}</span>
              </div>
              <div class="history-detail" v-if="record.detail">
                {{ record.detail }}
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  InfoFilled,
  Warning,
  Document,
  Tools,
  Link,
  Collection,
  Clock,
  FolderOpened,
  QuestionFilled,
  Refresh,
  Magic,
  Edit,
  Hide
} from '@element-plus/icons-vue'
import { getDictLabel, DICT_TYPE } from '@/utils/dict'

interface Props {
  result: any // 质控结果数据
}

const props = defineProps<Props>()
const emit = defineEmits<{
  viewOriginal: [recordId: number, tableType: number]
  explainRule: [ruleCode: string]
  autoFix: [resultId: number]
  ignore: [resultId: number]
}>()

// ========================= 响应式数据 =========================

const loadingContext = ref(false)
const contextData = ref<any>(null)
const operationHistory = ref<any[]>([])

// ========================= 计算属性 =========================

/** 手动修复步骤 */
const manualFixSteps = computed(() => {
  // 根据错误类型生成修复步骤
  const errorType = props.result.errorType || 'UNKNOWN'
  const stepMap: Record<string, string[]> = {
    EMPTY_VALUE: [
      '确认该字段的正确值',
      '在原始数据源中查找对应信息',
      '手动填入正确的字段值',
      '验证修改后的数据逻辑'
    ],
    VALUE_OUT_OF_RANGE: [
      '核对原始单据或凭证',
      '确认数值的正确性',
      '检查单位是否正确',
      '更正异常数值'
    ],
    FORMAT_ERROR: ['检查数据格式要求', '按照标准格式重新输入', '验证格式转换结果']
  }

  return stepMap[errorType] || ['请联系系统管理员获取具体修复指导']
})

/** 样本数据列配置 */
const sampleColumns = computed(() => {
  // 根据表类型动态生成列配置
  const baseColumns = [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'updateTime', label: '更新时间', width: 150 }
  ]

  const tableType = props.result.tableType
  if (tableType === 2) {
    // 药品目录表
    return [
      ...baseColumns,
      { prop: 'drugName', label: '药品名称', width: 150 },
      { prop: 'productName', label: '产品名称', width: 150 },
      { prop: 'specification', label: '规格', width: 100 }
    ]
  } else if (tableType === 5) {
    // 使用情况表
    return [
      ...baseColumns,
      { prop: 'amount', label: '金额', width: 100 },
      { prop: 'quantity', label: '数量', width: 100 },
      { prop: 'price', label: '单价', width: 100 }
    ]
  }

  return baseColumns
})

// ========================= 生命周期 =========================

onMounted(() => {
  loadInitialData()
})

// ========================= 核心方法 =========================

/** 加载初始数据 */
const loadInitialData = async () => {
  try {
    await Promise.all([loadContextData(), loadOperationHistory()])
  } catch (error) {
    console.error('加载展开数据失败:', error)
  }
}

/** 加载上下文数据 */
const loadContextData = async () => {
  loadingContext.value = true
  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 500))

    contextData.value = {
      relatedRecords: Math.floor(Math.random() * 10),
      batchStatus: '处理中',
      historyCount: Math.floor(Math.random() * 5) + 1,
      dataSource: '批量导入-20240610.xlsx',
      sampleData: generateSampleData()
    }
  } catch (error) {
    ElMessage.error('加载上下文数据失败')
  } finally {
    loadingContext.value = false
  }
}

/** 加载操作历史 */
const loadOperationHistory = async () => {
  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 300))

    operationHistory.value = [
      {
        operation: 'CREATE',
        operationName: '质控检测',
        operator: '系统',
        operationTime: props.result.createTime,
        detail: '自动执行质控规则检测'
      },
      {
        operation: 'VIEW',
        operationName: '查看详情',
        operator: '当前用户',
        operationTime: new Date().toISOString(),
        detail: '展开查看详细信息'
      }
    ]
  } catch (error) {
    console.error('加载操作历史失败:', error)
  }
}

/** 生成样本数据 */
const generateSampleData = () => {
  const sampleCount = 3
  const samples = []

  for (let i = 1; i <= sampleCount; i++) {
    samples.push({
      id: props.result.recordId + i,
      drugName: `示例药品${i}`,
      productName: `示例产品${i}`,
      specification: '10mg',
      amount: (Math.random() * 1000).toFixed(2),
      quantity: Math.floor(Math.random() * 100) + 1,
      price: (Math.random() * 50).toFixed(2),
      updateTime: new Date().toISOString().slice(0, 19)
    })
  }

  return samples
}

// ========================= 事件处理方法 =========================

/** 查看原始记录 */
const viewOriginalRecord = () => {
  emit('viewOriginal', props.result.recordId, props.result.tableType)
}

/** 解释规则 */
const explainRule = () => {
  emit('explainRule', props.result.ruleCode)
}

/** 自动修复 */
const autoFix = async () => {
  try {
    await ElMessageBox.confirm('确认自动修复该数据问题？', '确认修复', {
      type: 'warning'
    })

    emit('autoFix', props.result.id)
  } catch (error) {
    // 用户取消操作
  }
}

/** 忽略问题 */
const ignoreIssue = async () => {
  try {
    await ElMessageBox.confirm('确认忽略该质控问题？忽略后将不再显示此提示。', '确认忽略', {
      type: 'warning'
    })

    emit('ignore', props.result.id)
  } catch (error) {
    // 用户取消操作
  }
}

// ========================= 工具方法 =========================

/** 格式化日期时间 */
const formatDateTime = (dateTime: string): string => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString()
}

/** 格式化字段值 */
const formatFieldValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '(空值)'
  }
  if (value === '') {
    return '(空字符串)'
  }
  return String(value)
}

/** 生成差异说明 */
const generateDifferenceNote = (result: any): string => {
  const actual = result.fieldValue
  const expected = result.expectedValue

  if (!actual && expected) {
    return '字段值为空，但规则要求有值'
  }
  if (actual && !expected) {
    return '字段有值，但规则要求为空'
  }
  if (typeof actual === 'number' && typeof expected === 'number') {
    const diff = Math.abs(actual - expected)
    return `数值差异: ${diff}`
  }
  if (typeof actual === 'string' && typeof expected === 'string') {
    return `长度差异: ${actual.length} vs ${expected.length}`
  }

  return '值类型或格式不匹配'
}

/** 获取批次状态类型 */
const getBatchStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    处理中: 'warning',
    已完成: 'success',
    已失败: 'danger'
  }
  return typeMap[status] || 'info'
}

/** 获取操作类型 */
const getOperationType = (operation: string): string => {
  const typeMap: Record<string, string> = {
    CREATE: 'primary',
    UPDATE: 'warning',
    DELETE: 'danger',
    VIEW: 'info'
  }
  return typeMap[operation] || 'info'
}
</script>

<style lang="scss" scoped>
.result-expand-content {
  background-color: #fafbfc;
  padding: 20px;
  border-radius: 8px;
}

.expand-section {
  margin-bottom: 24px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;

  &:last-child {
    margin-bottom: 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
    font-weight: 600;
    color: #303133;

    .section-title {
      flex: 1;
    }
  }

  .section-content {
    padding: 16px;
  }
}

.error-message-container {
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;

  .error-title {
    font-weight: 600;
    color: #f56c6c;
    margin-bottom: 4px;
  }

  .error-description {
    color: #999;
    font-size: 14px;
  }
}

.field-comparison {
  margin-bottom: 16px;

  .comparison-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }

  .comparison-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .comparison-item {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 12px;

    .comparison-label {
      font-size: 12px;
      color: #6c757d;
      margin-bottom: 4px;
    }

    .comparison-value {
      font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      font-size: 13px;
      word-break: break-all;

      &.field-name {
        color: #6f42c1;
        font-weight: 600;
      }

      &.actual-value {
        color: #dc3545;
        background-color: #f8d7da;
        padding: 2px 4px;
        border-radius: 3px;
      }

      &.expected-value {
        color: #28a745;
        background-color: #d1e7dd;
        padding: 2px 4px;
        border-radius: 3px;
      }

      &.difference-note {
        color: #6c757d;
        font-style: italic;
      }
    }
  }
}

.rule-expression {
  .expression-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }

  .expression-container {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    .expression-code {
      flex: 1;
      background-color: #f5f7fa;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      padding: 12px;
      font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      font-size: 12px;
      color: #475669;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}

.context-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;

  .context-item {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 12px;

    .context-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #495057;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .context-value {
      .has-related {
        color: #28a745;
        font-weight: 500;
      }

      .no-related {
        color: #6c757d;
        font-style: italic;
      }
    }
  }
}

.sample-preview {
  .preview-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }
}

.suggestions-container {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .suggestion-item {
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &.auto-fix {
      border-color: #67c23a;
      background-color: #f0f9ff;
    }

    &.manual-fix {
      border-color: #e6a23c;
      background-color: #fffbf0;
    }

    &.ignore-option {
      border-color: #909399;
      background-color: #f5f7fa;
    }

    .suggestion-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .suggestion-title {
        font-weight: 600;
        color: #303133;
      }
    }

    .suggestion-description {
      color: #606266;
      margin-bottom: 12px;
      line-height: 1.5;
    }

    .suggestion-steps {
      margin-bottom: 12px;

      .steps-title {
        font-weight: 500;
        color: #303133;
        margin-bottom: 6px;
      }

      .steps-list {
        margin: 0;
        padding-left: 20px;

        li {
          color: #606266;
          margin-bottom: 4px;
        }
      }
    }

    .suggestion-actions {
      display: flex;
      gap: 8px;
    }
  }
}

.history-timeline {
  .history-item {
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;

      .operation-name {
        font-weight: 500;
        color: #303133;
      }

      .operator {
        font-size: 12px;
        color: #909399;
      }
    }

    .history-detail {
      color: #606266;
      font-size: 14px;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .result-expand-content {
    padding: 12px;
  }

  .expand-section .section-content {
    padding: 12px;
  }

  .comparison-grid {
    grid-template-columns: 1fr;
  }

  .context-grid {
    grid-template-columns: 1fr;
  }

  .expression-container {
    flex-direction: column;
  }
}

/* 表格样式 */
:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
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
