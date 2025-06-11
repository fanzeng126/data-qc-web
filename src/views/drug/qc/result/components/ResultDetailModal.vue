<template>
  <el-dialog
    v-model="dialogVisible"
    title="质控结果详情"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="result-detail-container">
      <template v-if="resultDetail">
        <!-- 基本信息卡片 - 提供结果的整体概览 -->
        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <!-- 状态标签用于快速识别结果的严重程度 -->
              <el-tag
                :type="resultDetail.resultStatus === 1 ? 'danger' : 'warning'"
                size="large"
                effect="dark"
              >
                {{ resultDetail.resultStatus === 1 ? '质控失败' : '质控警告' }}
              </el-tag>
            </div>
          </template>

          <!-- 使用描述列表来清晰展示基本信息，这种布局让用户能够快速扫描关键信息 -->
          <el-descriptions :column="2" border>
            <el-descriptions-item label="执行批次">
              <el-link type="primary" @click="viewExecution">
                {{ resultDetail.executionNo }}
              </el-link>
            </el-descriptions-item>
            <el-descriptions-item label="规则编码">
              <el-tag type="primary">{{ resultDetail.ruleCode }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="规则名称">
              {{ resultDetail.ruleName }}
            </el-descriptions-item>
            <el-descriptions-item label="检查表">
              {{ getDictLabel(DICT_TYPE.DRUG_QC_TABLE_TYPE, resultDetail.tableType) }}
            </el-descriptions-item>
            <el-descriptions-item label="记录ID">
              <el-link type="primary" @click="viewOriginalRecord">
                {{ resultDetail.recordId }}
              </el-link>
            </el-descriptions-item>
            <el-descriptions-item label="检查字段">
              <code class="field-code">{{ resultDetail.checkField }}</code>
            </el-descriptions-item>
            <el-descriptions-item label="检测时间">
              {{ formatDateTime(resultDetail.createTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="修复状态">
              <el-tag :type="resultDetail.isFixed ? 'success' : 'info'" size="small">
                {{ resultDetail.isFixed ? '已修复' : '待修复' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 错误详情卡片 - 这是最重要的部分，详细说明为什么会出现质控异常 -->
        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Warning /></el-icon>
              <span>错误详情</span>
            </div>
          </template>

          <!-- 错误信息展示区域 -->
          <div class="error-content">
            <div class="error-message">
              <h4 class="error-title">{{ resultDetail.errorDetail || '质控规则验证失败' }}</h4>
              <p class="error-description" v-if="resultDetail.errorDescription">
                {{ resultDetail.errorDescription }}
              </p>
            </div>

            <!-- 字段值对比 - 这个对比表让用户清楚地看到期望值和实际值的差异 -->
            <div class="value-comparison" v-if="resultDetail.checkField">
              <h4 class="comparison-title">字段值对比</h4>
              <div class="comparison-table">
                <div class="comparison-row">
                  <div class="comparison-cell label">检查字段</div>
                  <div class="comparison-cell value">
                    <code class="field-name">{{ resultDetail.checkField }}</code>
                  </div>
                </div>
                <div class="comparison-row">
                  <div class="comparison-cell label">实际值</div>
                  <div class="comparison-cell value">
                    <span class="actual-value">{{
                      formatFieldValue(resultDetail.fieldValue)
                    }}</span>
                  </div>
                </div>
                <div class="comparison-row">
                  <div class="comparison-cell label">期望值</div>
                  <div class="comparison-cell value">
                    <span class="expected-value">{{
                      formatFieldValue(resultDetail.expectedValue)
                    }}</span>
                  </div>
                </div>
                <div class="comparison-row">
                  <div class="comparison-cell label">差异说明</div>
                  <div class="comparison-cell value">
                    <span class="difference-note">{{ generateDifferenceNote() }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 规则表达式展示 - 帮助技术人员理解质控规则的具体逻辑 -->
            <div class="rule-expression" v-if="resultDetail.ruleExpression">
              <h4 class="expression-title">验证规则表达式</h4>
              <div class="expression-container">
                <pre class="expression-code">{{ resultDetail.ruleExpression }}</pre>
                <el-button size="small" type="text" @click="explainRule">
                  <el-icon><QuestionFilled /></el-icon>
                  规则说明
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 上下文信息卡片 - 提供相关的背景数据，帮助用户理解问题发生的环境 -->
        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>相关信息</span>
              <el-button size="small" type="text" @click="refreshContext" :loading="contextLoading">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>

          <div class="context-content" v-if="contextInfo">
            <!-- 使用网格布局来组织相关信息，让用户能够快速获取背景数据 -->
            <div class="context-grid">
              <div class="context-item">
                <div class="context-label">
                  <el-icon><Link /></el-icon>
                  关联记录
                </div>
                <div class="context-value">
                  <span v-if="contextInfo.relatedRecords > 0" class="has-related">
                    {{ contextInfo.relatedRecords }}条相关记录
                  </span>
                  <span v-else class="no-related">无关联记录</span>
                </div>
              </div>

              <div class="context-item">
                <div class="context-label">
                  <el-icon><Collection /></el-icon>
                  批次状态
                </div>
                <div class="context-value">
                  <el-tag size="small" :type="getBatchStatusType(contextInfo.batchStatus)">
                    {{ contextInfo.batchStatus }}
                  </el-tag>
                </div>
              </div>

              <div class="context-item">
                <div class="context-label">
                  <el-icon><Clock /></el-icon>
                  历史版本
                </div>
                <div class="context-value"> {{ contextInfo.historyCount || 0 }}个版本 </div>
              </div>

              <div class="context-item">
                <div class="context-label">
                  <el-icon><FolderOpened /></el-icon>
                  数据来源
                </div>
                <div class="context-value">
                  {{ contextInfo.dataSource || '未知' }}
                </div>
              </div>
            </div>

            <!-- 相关数据预览表格 - 显示与当前异常记录相关的其他数据样本 -->
            <div class="sample-preview" v-if="contextInfo.sampleData?.length">
              <h4 class="preview-title">相关数据样本</h4>
              <el-table :data="contextInfo.sampleData" size="small" border max-height="200">
                <el-table-column prop="id" label="记录ID" width="80" />
                <el-table-column
                  prop="fieldValue"
                  label="字段值"
                  width="120"
                  show-overflow-tooltip
                />
                <el-table-column prop="status" label="状态" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'normal' ? 'success' : 'danger'" size="small">
                      {{ row.status === 'normal' ? '正常' : '异常' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="updateTime" label="更新时间" min-width="150" />
              </el-table>
            </div>
          </div>
        </el-card>

        <!-- 修复建议卡片 - 这是实用功能区域，为用户提供具体的解决方案 -->
        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Tools /></el-icon>
              <span>修复建议</span>
            </div>
          </template>

          <div class="suggestions-content">
            <!-- 自动修复选项 - 为简单问题提供快速解决方案 -->
            <div class="suggestion-item auto-fix" v-if="resultDetail.autoFixSuggestion">
              <div class="suggestion-header">
                <el-icon><MagicStick /></el-icon>
                <span class="suggestion-title">自动修复</span>
                <el-tag type="success" size="small">推荐</el-tag>
              </div>
              <div class="suggestion-description">
                {{ resultDetail.autoFixSuggestion }}
              </div>
              <div class="suggestion-actions">
                <el-button size="small" type="primary" @click="autoFix">
                  <el-icon><Tools /></el-icon>
                  立即修复
                </el-button>
              </div>
            </div>

            <!-- 手动修复指导 - 为复杂问题提供详细的操作指南 -->
            <div class="suggestion-item manual-fix">
              <div class="suggestion-header">
                <el-icon><Edit /></el-icon>
                <span class="suggestion-title">手动修复指导</span>
                <el-tag type="warning" size="small">谨慎操作</el-tag>
              </div>
              <div class="suggestion-description">
                {{ getManualFixGuidance() }}
              </div>
              <div class="fix-steps" v-if="getFixSteps().length">
                <div class="steps-title">修复步骤：</div>
                <ol class="steps-list">
                  <li v-for="step in getFixSteps()" :key="step">{{ step }}</li>
                </ol>
              </div>
            </div>

            <!-- 忽略选项 - 为用户提供跳过某些不重要问题的选择 -->
            <div class="suggestion-item ignore-option">
              <div class="suggestion-header">
                <el-icon><Hide /></el-icon>
                <span class="suggestion-title">忽略此项</span>
                <el-tag type="info" size="small">可选</el-tag>
              </div>
              <div class="suggestion-description">
                如果确认此数据无误，可以忽略此质控提示，该记录将不再显示在待处理列表中
              </div>
              <div class="suggestion-actions">
                <el-button size="small" @click="ignoreResult">
                  <el-icon><Hide /></el-icon>
                  忽略此项
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 操作历史卡片 - 记录对这个异常结果的所有操作，提供完整的处理轨迹 -->
        <el-card class="detail-card" shadow="never" v-if="operationHistory.length">
          <template #header>
            <div class="card-header">
              <el-icon><Clock /></el-icon>
              <span>操作历史</span>
            </div>
          </template>

          <!-- 使用时间线组件来展示操作历史，这种展示方式让用户能够清楚地看到处理过程 -->
          <el-timeline>
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
        </el-card>
      </template>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="warning" @click="fixData" v-if="!resultDetail?.isFixed">
          <el-icon><Tools /></el-icon>
          修复数据
        </el-button>
        <el-button type="primary" @click="exportDetail">
          <el-icon><Download /></el-icon>
          导出详情
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Warning,
  Document,
  Tools,
  QuestionFilled,
  Refresh,
  Link,
  Collection,
  Clock,
  FolderOpened,
  MagicStick,
  Edit,
  Hide,
  Download
} from '@element-plus/icons-vue'
import { getDictLabel, DICT_TYPE } from '@/utils/dict'

/**
 * 这个组件的设计理念是"深度展示，易于理解"。
 * 它不仅要展示数据，更要帮助用户理解问题的本质和解决方案。
 * 就像一个经验丰富的质控专家在为你详细解释每一个发现的问题。
 */

interface Props {
  resultId?: number // 质控结果的ID，用于获取详细信息
}

const props = defineProps<Props>()
const emit = defineEmits<{
  viewExecution: [executionId: number]
  viewOriginal: [recordId: number, tableType: number]
  fixData: [resultId: number]
}>()

// ========================= 响应式数据 =========================

const dialogVisible = defineModel<boolean>({ default: false })
const loading = ref(false)
const contextLoading = ref(false)

/** 结果详细信息 - 存储从后端获取的完整质控结果数据 */
const resultDetail = ref<any>(null)

/** 上下文信息 - 提供与当前结果相关的环境数据 */
const contextInfo = ref<any>(null)

/** 操作历史 - 记录对该结果的所有操作轨迹 */
const operationHistory = ref<any[]>([])

// ========================= 监听器 =========================

/**
 * 当弹窗打开时自动加载数据
 * 这个监听器确保用户每次打开弹窗都能看到最新的信息
 */
watch(dialogVisible, (visible) => {
  if (visible && props.resultId) {
    loadResultDetail()
  }
})

// ========================= 核心数据加载方法 =========================

/**
 * 加载结果详情 - 这是组件的核心方法
 * 它协调多个数据源的加载，确保用户看到完整的信息画面
 */
const loadResultDetail = async () => {
  if (!props.resultId) return

  loading.value = true
  try {
    // 并行加载多种数据，提高页面响应速度
    // 在实际项目中，这些都应该是真实的API调用
    await Promise.all([loadBasicDetail(), loadContextInfo(), loadOperationHistory()])
  } catch (error) {
    ElMessage.error('加载结果详情失败')
    console.error('加载结果详情失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 加载基本详情信息
 * 这个方法获取质控结果的核心数据，包括错误信息、字段值等
 */
const loadBasicDetail = async () => {
  // 模拟API调用 - 在实际项目中这里应该调用真实的后端接口
  await new Promise((resolve) => setTimeout(resolve, 500))

  // 生成模拟数据来演示组件功能
  resultDetail.value = {
    id: props.resultId,
    executionNo: `EXEC_${String(props.resultId).padStart(6, '0')}`,
    executionId: Math.floor(Math.random() * 9999) + 1000,
    ruleCode: 'PRE_QC_001',
    ruleName: '必填字段验证',
    tableType: 2, // 药品目录表
    recordId: Math.floor(Math.random() * 99999) + 10000,
    checkField: 'drugName',
    fieldValue: '',
    expectedValue: '阿司匹林',
    resultStatus: 1, // 1-失败 2-警告
    errorDetail: '药品名称字段为空',
    errorDescription: '该记录的药品名称字段缺失，违反了必填字段验证规则',
    ruleExpression: '#drugName != null && #drugName.trim().length() > 0',
    autoFixSuggestion: '系统可以根据产品编码自动匹配对应的药品名称',
    isFixed: false,
    createTime: new Date().toISOString()
  }
}

/**
 * 加载上下文信息
 * 这个方法获取与当前结果相关的环境数据，帮助用户理解问题发生的背景
 */
const loadContextInfo = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300))

  contextInfo.value = {
    relatedRecords: Math.floor(Math.random() * 5),
    batchStatus: '处理中',
    historyCount: Math.floor(Math.random() * 3) + 1,
    dataSource: '批量导入-药品目录-20240610.xlsx',
    sampleData: [
      {
        id: 10001,
        fieldValue: '阿司匹林片',
        status: 'normal',
        updateTime: '2024-06-10 14:30:25'
      },
      {
        id: 10002,
        fieldValue: '',
        status: 'error',
        updateTime: '2024-06-10 14:30:26'
      }
    ]
  }
}

/**
 * 加载操作历史
 * 这个方法获取对该结果的所有操作记录，提供完整的处理轨迹
 */
const loadOperationHistory = async () => {
  await new Promise((resolve) => setTimeout(resolve, 200))

  operationHistory.value = [
    {
      operation: 'CREATE',
      operationName: '质控检测',
      operator: '系统',
      operationTime: resultDetail.value?.createTime,
      detail: '自动执行质控规则检测发现异常'
    },
    {
      operation: 'VIEW',
      operationName: '查看详情',
      operator: '当前用户',
      operationTime: new Date().toISOString(),
      detail: '打开详情查看异常信息'
    }
  ]
}

// ========================= 业务操作方法 =========================

/**
 * 查看执行批次详情
 * 这个方法让用户能够跳转到执行监控页面，查看整个质控批次的执行情况
 */
const viewExecution = () => {
  if (resultDetail.value?.executionId) {
    emit('viewExecution', resultDetail.value.executionId)
    dialogVisible.value = false
  }
}

/**
 * 查看原始记录
 * 这个方法让用户能够查看产生异常的原始数据记录，便于核实和修正
 */
const viewOriginalRecord = () => {
  if (resultDetail.value) {
    emit('viewOriginal', resultDetail.value.recordId, resultDetail.value.tableType)
  }
}

/**
 * 自动修复
 * 这个方法调用系统的自动修复功能，适用于可以程序化解决的简单问题
 */
const autoFix = async () => {
  try {
    await ElMessageBox.confirm('确认自动修复该数据问题？', '确认修复', {
      type: 'warning'
    })

    // 模拟自动修复过程
    ElMessage.success('自动修复成功')
    resultDetail.value.isFixed = true
  } catch (error) {
    // 用户取消操作，不需要处理
  }
}

/**
 * 忽略结果
 * 这个方法让用户可以标记某个结果为"可忽略"，适用于已确认无问题的情况
 */
const ignoreResult = async () => {
  try {
    await ElMessageBox.confirm('确认忽略该质控结果？忽略后将不再显示在待处理列表中。', '确认忽略', {
      type: 'warning'
    })

    ElMessage.success('已忽略该质控结果')
    dialogVisible.value = false
  } catch (error) {
    // 用户取消操作
  }
}

/**
 * 修复数据
 * 这个方法触发数据修复流程，通常会打开专门的修复界面
 */
const fixData = () => {
  if (resultDetail.value) {
    emit('fixData', resultDetail.value.id)
    dialogVisible.value = false
  }
}

/**
 * 导出详情
 * 这个方法生成包含所有详情信息的导出文件，便于离线分析和存档
 */
const exportDetail = async () => {
  try {
    ElMessage.success('详情导出已开始')
    // 在实际项目中，这里应该调用导出API
  } catch (error) {
    ElMessage.error('导出详情失败')
  }
}

// ========================= 工具方法 =========================

/**
 * 格式化日期时间
 * 将ISO格式的时间字符串转换为用户友好的显示格式
 */
const formatDateTime = (dateTime: string): string => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString()
}

/**
 * 格式化字段值
 * 处理各种类型的字段值，确保在界面上有合适的显示效果
 */
const formatFieldValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '(空值)'
  }
  if (value === '') {
    return '(空字符串)'
  }
  return String(value)
}

/**
 * 生成差异说明
 * 这个方法分析实际值和期望值的差异，生成用户友好的说明文字
 */
const generateDifferenceNote = (): string => {
  if (!resultDetail.value) return ''

  const actual = resultDetail.value.fieldValue
  const expected = resultDetail.value.expectedValue

  if (!actual && expected) {
    return '字段值为空，但规则要求必须有值'
  }
  if (actual && !expected) {
    return '字段有值，但规则要求应该为空'
  }
  if (typeof actual === 'number' && typeof expected === 'number') {
    const diff = Math.abs(actual - expected)
    return `数值差异: ${diff}`
  }

  return '值不符合预期要求'
}

/**
 * 获取手动修复指导
 * 根据不同类型的错误提供相应的修复指导说明
 */
const getManualFixGuidance = (): string => {
  if (!resultDetail.value) return ''

  const errorType = resultDetail.value.errorDetail || ''

  if (errorType.includes('为空')) {
    return '请手动填入正确的字段值。建议先查看相关文档或联系业务人员确认正确的数据内容。'
  }

  return '请根据业务规则和数据要求，手动修正该字段的值。如有疑问，请联系相关业务人员确认。'
}

/**
 * 获取修复步骤
 * 为不同类型的问题提供具体的操作步骤指导
 */
const getFixSteps = (): string[] => {
  if (!resultDetail.value) return []

  const field = resultDetail.value.checkField

  return [
    `找到记录ID为 ${resultDetail.value.recordId} 的数据`,
    `定位到字段 "${field}"`,
    '根据业务规则填入正确的值',
    '保存修改并重新执行质控验证'
  ]
}

/**
 * 获取批次状态类型
 * 为不同的批次状态返回对应的标签样式
 */
const getBatchStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    处理中: 'warning',
    已完成: 'success',
    已失败: 'danger'
  }
  return typeMap[status] || 'info'
}

/**
 * 获取操作类型
 * 为时间线中的不同操作类型返回相应的视觉样式
 */
const getOperationType = (operation: string): string => {
  const typeMap: Record<string, string> = {
    CREATE: 'primary',
    UPDATE: 'warning',
    DELETE: 'danger',
    VIEW: 'info'
  }
  return typeMap[operation] || 'info'
}

/**
 * 刷新上下文信息
 * 重新加载相关的环境数据，确保信息的时效性
 */
const refreshContext = async () => {
  contextLoading.value = true
  try {
    await loadContextInfo()
    ElMessage.success('上下文信息已刷新')
  } catch (error) {
    ElMessage.error('刷新上下文信息失败')
  } finally {
    contextLoading.value = false
  }
}

/**
 * 解释规则
 * 打开规则解释界面，帮助用户理解质控规则的具体含义
 */
const explainRule = () => {
  ElMessage.info('规则解释功能开发中...')
}
</script>

<style lang="scss" scoped>
/*
  样式设计理念：清晰的信息层次和良好的视觉引导
  使用不同的颜色、间距和排版来帮助用户快速理解信息的重要程度
*/

.result-detail-container {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-card {
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
}

.field-code {
  background-color: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  color: #e6a23c;
  border: 1px solid #ebeef5;
}

/* 错误详情样式 - 使用醒目的颜色来突出错误信息 */
.error-content {
  .error-message {
    background-color: #fef0f0;
    border: 1px solid #fbc4c4;
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 20px;

    .error-title {
      color: #f56c6c;
      margin: 0 0 8px 0;
      font-size: 16px;
    }

    .error-description {
      color: #999;
      margin: 0;
      line-height: 1.5;
    }
  }

  .value-comparison {
    margin-bottom: 20px;

    .comparison-title {
      margin-bottom: 12px;
      color: #303133;
    }

    .comparison-table {
      border: 1px solid #ebeef5;
      border-radius: 6px;
      overflow: hidden;

      .comparison-row {
        display: flex;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        .comparison-cell {
          padding: 12px;

          &.label {
            background-color: #fafbfc;
            width: 120px;
            font-weight: 600;
            color: #606266;
          }

          &.value {
            flex: 1;
            background-color: #fff;

            .field-name {
              background-color: #f0f9ff;
              color: #1890ff;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
            }

            .actual-value {
              color: #f56c6c;
              font-weight: 500;
            }

            .expected-value {
              color: #67c23a;
              font-weight: 500;
            }

            .difference-note {
              color: #606266;
              font-style: italic;
            }
          }
        }
      }
    }
  }

  .rule-expression {
    .expression-title {
      margin-bottom: 8px;
      color: #303133;
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
        margin: 0;
      }
    }
  }
}

/* 上下文信息样式 - 使用网格布局来整齐地展示相关信息 */
.context-content {
  .context-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 20px;

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
      margin-bottom: 12px;
      color: #303133;
    }
  }
}

/* 修复建议样式 - 使用不同颜色来区分不同类型的建议 */
.suggestions-content {
  .suggestion-item {
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &:last-child {
      margin-bottom: 0;
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

    .fix-steps {
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

/* 操作历史样式 */
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .result-detail-container {
    max-height: 60vh;
  }

  .context-grid {
    grid-template-columns: 1fr;
  }

  .comparison-row {
    flex-direction: column;

    .comparison-cell.label {
      width: auto;
    }
  }

  .expression-container {
    flex-direction: column;
  }
}

/* 表格和描述列表的全局样式优化 */
:deep(.el-descriptions__label) {
  background-color: #fafbfc;
  font-weight: 600;
  width: 120px;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}
</style>
