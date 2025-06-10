<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="1000px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="data-fix-container">
      <!-- 修复概览 -->
      <el-card class="overview-card" shadow="never" v-if="fixSummary">
        <template #header>
          <div class="card-header">
            <el-icon><Tools /></el-icon>
            <span>修复概览</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="6">
            <div class="summary-item">
              <div class="summary-value">{{ fixSummary.totalRecords }}</div>
              <div class="summary-label">待修复记录</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-item">
              <div class="summary-value auto-fix">{{ fixSummary.autoFixable }}</div>
              <div class="summary-label">可自动修复</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-item">
              <div class="summary-value manual-fix">{{ fixSummary.manualRequired }}</div>
              <div class="summary-label">需手动处理</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-item">
              <div class="summary-value success">{{ fixSummary.estimatedTime }}</div>
              <div class="summary-label">预计用时(分钟)</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 修复策略选择 -->
      <el-card class="strategy-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Setting /></el-icon>
            <span>修复策略</span>
          </div>
        </template>

        <el-radio-group v-model="fixStrategy" class="strategy-options">
          <el-radio value="auto" class="strategy-option">
            <div class="strategy-content">
              <div class="strategy-title">
                <el-icon><Magic /></el-icon>
                自动修复
              </div>
              <div class="strategy-description">
                系统根据预定义规则自动修复数据，快速但可能不够精确
              </div>
              <div class="strategy-note">
                <el-tag size="small" type="success">推荐</el-tag>
                适用于格式错误、空值填充等标准问题
              </div>
            </div>
          </el-radio>

          <el-radio value="guided" class="strategy-option">
            <div class="strategy-content">
              <div class="strategy-title">
                <el-icon><Guide /></el-icon>
                引导修复
              </div>
              <div class="strategy-description">
                系统提供修复建议，用户确认后执行，精确度高但需要人工参与
              </div>
              <div class="strategy-note">
                <el-tag size="small" type="warning">平衡</el-tag>
                适用于业务逻辑复杂的数据问题
              </div>
            </div>
          </el-radio>

          <el-radio value="manual" class="strategy-option">
            <div class="strategy-content">
              <div class="strategy-title">
                <el-icon><Edit /></el-icon>
                手动修复
              </div>
              <div class="strategy-description">
                完全由用户手动编辑每条数据，精确度最高但耗时较长
              </div>
              <div class="strategy-note">
                <el-tag size="small" type="info">精确</el-tag>
                适用于关键数据或复杂业务场景
              </div>
            </div>
          </el-radio>
        </el-radio-group>
      </el-card>

      <!-- 数据问题列表 -->
      <el-card class="issues-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Warning /></el-icon>
            <span>数据问题详情</span>
            <div class="header-actions">
              <el-button size="small" @click="expandAll">
                {{ allExpanded ? '收起全部' : '展开全部' }}
              </el-button>
              <el-button size="small" type="primary" @click="previewFix">
                <el-icon><View /></el-icon>
                预览修复
              </el-button>
            </div>
          </div>
        </template>

        <div class="issues-list">
          <div
            v-for="(issue, index) in dataIssues"
            :key="`issue-${index}`"
            class="issue-item"
            :class="{ expanded: issue.expanded }"
          >
            <!-- 问题头部 -->
            <div class="issue-header" @click="toggleIssue(issue)">
              <div class="issue-info">
                <el-icon class="expand-icon" :class="{ rotated: issue.expanded }">
                  <ArrowRight />
                </el-icon>
                <div class="issue-title">
                  <span class="issue-rule">{{ issue.ruleName }}</span>
                  <el-tag :type="getIssueTypeColor(issue.issueType)" size="small">
                    {{ getIssueTypeText(issue.issueType) }}
                  </el-tag>
                </div>
                <div class="issue-description">{{ issue.description }}</div>
              </div>
              <div class="issue-meta">
                <span class="issue-count">{{ issue.recordCount }}条记录</span>
                <el-tag
                  :type="issue.autoFixable ? 'success' : 'warning'"
                  size="small"
                  effect="plain"
                >
                  {{ issue.autoFixable ? '可自动修复' : '需手动处理' }}
                </el-tag>
              </div>
            </div>

            <!-- 问题详情 -->
            <el-collapse-transition>
              <div v-show="issue.expanded" class="issue-content">
                <!-- 修复方案 -->
                <div class="fix-strategy-section">
                  <h4 class="section-title">修复方案</h4>
                  <div class="fix-method" v-if="issue.fixMethod">
                    <div class="method-title">
                      <el-icon><Cpu /></el-icon>
                      {{ issue.fixMethod.title }}
                    </div>
                    <div class="method-description">{{ issue.fixMethod.description }}</div>
                    <div class="method-steps" v-if="issue.fixMethod.steps">
                      <div class="steps-title">执行步骤：</div>
                      <ol class="steps-list">
                        <li v-for="step in issue.fixMethod.steps" :key="step">{{ step }}</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <!-- 示例数据 -->
                <div class="sample-data-section" v-if="issue.sampleRecords?.length">
                  <h4 class="section-title">示例数据</h4>
                  <el-table
                    :data="issue.sampleRecords.slice(0, 3)"
                    size="small"
                    border
                    class="sample-table"
                  >
                    <el-table-column label="记录ID" prop="recordId" width="100" />
                    <el-table-column label="问题字段" prop="problemField" width="120" />
                    <el-table-column label="当前值" width="150">
                      <template #default="{ row }">
                        <span class="current-value error">{{ row.currentValue }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="建议值" width="150">
                      <template #default="{ row }">
                        <span class="suggested-value success">{{ row.suggestedValue }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="修复原因" prop="fixReason" min-width="200" />
                  </el-table>
                  <div class="more-records" v-if="issue.recordCount > 3">
                    还有 {{ issue.recordCount - 3 }} 条类似记录...
                  </div>
                </div>

                <!-- 风险提示 */
                <div class="risk-section" v-if="issue.risks?.length">
                  <h4 class="section-title">风险提示</h4>
                  <el-alert
                    v-for="risk in issue.risks"
                    :key="risk"
                    :title="risk"
                    type="warning"
                    :show-icon="false"
                    :closable="false"
                    class="risk-alert"
                  />
                </div>
              </div>
            </el-collapse-transition>
          </div>
        </div>
      </el-card>

      <!-- 修复配置 -->
                <el-card class="config-card" shadow="never" v-if="fixStrategy !== 'auto'">
                  <template #header>
                    <div class="card-header">
                      <el-icon><Setting /></el-icon>
                      <span>修复配置</span>
                    </div>
                  </template>

                  <el-form :model="fixConfig" label-width="120px" class="config-form">
                    <el-form-item label="备份原数据">
                      <el-switch v-model="fixConfig.backupOriginal" />
                      <span class="form-help">修复前自动备份原始数据，便于回滚</span>
                    </el-form-item>

                    <el-form-item label="批量大小">
                      <el-input-number
                        v-model="fixConfig.batchSize"
                        :min="10"
                        :max="1000"
                        :step="10"
                        style="width: 150px"
                      />
                      <span class="form-help">每批处理的记录数，数值越大处理越快但占用资源更多</span>
                    </el-form-item>

                    <el-form-item label="失败处理">
                      <el-radio-group v-model="fixConfig.failureHandling">
                        <el-radio value="continue">继续处理其他记录</el-radio>
                        <el-radio value="stop">停止所有处理</el-radio>
                        <el-radio value="retry">自动重试3次</el-radio>
                      </el-radio-group>
                    </el-form-item>

                    <el-form-item label="通知设置">
                      <el-checkbox-group v-model="fixConfig.notifications">
                        <el-checkbox value="email">邮件通知</el-checkbox>
                        <el-checkbox value="sms">短信通知</el-checkbox>
                        <el-checkbox value="system">系统消息</el-checkbox>
                      </el-checkbox-group>
                    </el-form-item>
                  </el-form>
                </el-card>

                <!-- 修复预览 -->
                <el-card class="preview-card" shadow="never" v-if="showPreview">
                  <template #header>
                    <div class="card-header">
                      <el-icon><View /></el-icon>
                      <span>修复预览</span>
                      <el-button size="small" @click="showPreview = false">
                        <el-icon><Close /></el-icon>
                        关闭预览
                      </el-button>
                    </div>
                  </template>

                  <div class="preview-content">
                    <div class="preview-summary">
                      <el-descriptions :column="4" border>
                        <el-descriptions-item label="总记录数">{{ previewResult?.totalRecords }}</el-descriptions-item>
                        <el-descriptions-item label="将被修复">{{ previewResult?.willBeFixed }}</el-descriptions-item>
                        <el-descriptions-item label="预计成功率">{{ previewResult?.successRate }}%</el-descriptions-item>
                        <el-descriptions-item label="预计用时">{{ previewResult?.estimatedTime }}分钟</el-descriptions-item>
                      </el-descriptions>
                    </div>

                    <div class="preview-details" v-if="previewResult?.details">
                      <h4>修复详情</h4>
                      <el-table :data="previewResult.details" size="small" border>
                        <el-table-column label="问题类型" prop="issueType" width="120" />
                        <el-table-column label="记录数" prop="recordCount" width="100" />
                        <el-table-column label="修复方法" prop="fixMethod" width="150" />
                        <el-table-column label="成功率" prop="successRate" width="100">
                          <template #default="{ row }">{{ row.successRate }}%</template>
                        </el-table-column>
                        <el-table-column label="注意事项" prop="notes" min-width="200" />
                      </el-table>
                    </div>
                  </div>
                </el-card>
              </div>

              <template #footer>
                <div class="dialog-footer">
                  <el-button @click="dialogVisible = false">取消</el-button>
                  <el-button @click="previewFix" :loading="previewing">
                    <el-icon><View /></el-icon>
                    预览修复
                  </el-button>
                  <el-button
                    type="primary"
                    @click="executeFix"
                    :loading="fixing"
                    :disabled="!canExecuteFix"
                  >
                    <el-icon><Tools /></el-icon>
                    开始修复
                  </el-button>
                </div>
              </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  Tools,
  Setting,
  Magic,
  Guide,
  Edit,
  Warning,
  View,
  ArrowRight,
  Cpu,
  Close
} from '@element-plus/icons-vue'

interface Props {
  resultIds: number[]  // 需要修复的结果ID列表
}

const props = defineProps<Props>()
const emit = defineEmits<{
  success: []
}>()

// ========================= 响应式数据 =========================

const dialogVisible = defineModel<boolean>({ default: false })
const loading = ref(false)
const fixing = ref(false)
const previewing = ref(false)
const showPreview = ref(false)
const allExpanded = ref(false)

/** 修复策略 */
const fixStrategy = ref<'auto' | 'guided' | 'manual'>('auto')

/** 修复配置 */
const fixConfig = reactive({
  backupOriginal: true,
  batchSize: 100,
  failureHandling: 'continue',
  notifications: ['system']
})

/** 修复概览数据 */
const fixSummary = ref<any>(null)

/** 数据问题列表 */
const dataIssues = ref<any[]>([])

/** 预览结果 */
const previewResult = ref<any>(null)

// ========================= 计算属性 =========================

/** 对话框标题 */
const dialogTitle = computed(() => {
  const count = props.resultIds?.length || 0
  return `数据修复 (${count}条记录)`
})

/** 是否可以执行修复 */
const canExecuteFix = computed(() => {
  return fixSummary.value && dataIssues.value.length > 0
})

// ========================= 监听器 =========================

watch(dialogVisible, (visible) => {
  if (visible && props.resultIds?.length > 0) {
    loadFixData()
  }
})

// ========================= 核心方法 =========================

/** 加载修复数据 */
const loadFixData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    const [summary, issues] = await Promise.all([
      loadFixSummary(props.resultIds),
      loadDataIssues(props.resultIds)
    ])

    fixSummary.value = summary
    dataIssues.value = issues.map(issue => ({ ...issue, expanded: false }))

  } catch (error) {
    ElMessage.error('加载修复数据失败')
    console.error('加载修复数据失败:', error)
  } finally {
    loading.value = false
  }
}

/** 模拟加载修复概览 */
async function loadFixSummary(resultIds: number[]) {
  await new Promise(resolve => setTimeout(resolve, 800))

  return {
    totalRecords: resultIds.length,
    autoFixable: Math.floor(resultIds.length * 0.7),
    manualRequired: Math.floor(resultIds.length * 0.3),
    estimatedTime: Math.ceil(resultIds.length / 50)
  }
}

/** 模拟加载数据问题 */
async function loadDataIssues(resultIds: number[]) {
  await new Promise(resolve => setTimeout(resolve, 600))

  return [
    {
      ruleName: '字段值为空',
      issueType: 'EMPTY_VALUE',
      description: '必填字段存在空值',
      recordCount: 15,
      autoFixable: true,
      fixMethod: {
        title: '默认值填充',
        description: '使用预定义的默认值填充空字段',
        steps: [
          '识别空值字段',
          '根据字段类型确定默认值',
          '批量更新空值记录'
        ]
      },
      sampleRecords: [
        {
          recordId: 1001,
          problemField: 'drugName',
          currentValue: '',
          suggestedValue: '未知药品',
          fixReason: '使用默认药品名称'
        }
      ],
      risks: ['填充的默认值可能不符合实际情况']
    },
    {
      ruleName: '数值超出范围',
      issueType: 'VALUE_OUT_OF_RANGE',
      description: '药品金额超过合理范围',
      recordCount: 8,
      autoFixable: false,
      fixMethod: {
        title: '人工审核调整',
        description: '需要人工确认正确的金额值',
        steps: [
          '标记异常金额记录',
          '人工审核每条记录',
          '确认或修正金额值'
        ]
      },
      sampleRecords: [
        {
          recordId: 1002,
          problemField: 'amount',
          currentValue: '999999.99',
          suggestedValue: '99.99',
          fixReason: '疑似多输入了小数点位置'
        }
      ],
      risks: ['自动调整可能导致金额错误', '需要核实原始单据']
    }
  ]
}

/** 预览修复 */
const previewFix = async () => {
  previewing.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    previewResult.value = {
      totalRecords: fixSummary.value.totalRecords,
      willBeFixed: Math.floor(fixSummary.value.totalRecords * 0.85),
      successRate: 85,
      estimatedTime: Math.ceil(fixSummary.value.totalRecords / 60),
      details: [
        {
          issueType: '空值填充',
          recordCount: 15,
          fixMethod: '默认值填充',
          successRate: 95,
          notes: '部分字段可能需要后续人工确认'
        },
        {
          issueType: '数值范围',
          recordCount: 8,
          fixMethod: '人工审核',
          successRate: 70,
          notes: '需要业务人员参与确认'
        }
      ]
    }

    showPreview.value = true
    ElMessage.success('预览生成成功')

  } catch (error) {
    ElMessage.error('预览生成失败')
  } finally {
    previewing.value = false
  }
}

/** 执行修复 */
const executeFix = async () => {
  try {
    const confirmMessage = `确认开始修复${fixSummary.value.totalRecords}条记录？`
    await ElMessageBox.confirm(confirmMessage, '确认修复', {
      type: 'warning',
      confirmButtonText: '开始修复',
      cancelButtonText: '取消'
    })

    fixing.value = true

    // 模拟修复过程
    await simulateFixProcess()

    ElNotification.success({
      title: '修复完成',
      message: `成功修复${previewResult.value?.willBeFixed || 0}条记录`,
      duration: 5000
    })

    emit('success')
    dialogVisible.value = false

  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('修复过程中出现错误')
    }
  } finally {
    fixing.value = false
  }
}

/** 模拟修复过程 */
async function simulateFixProcess() {
  const totalSteps = 5
  const stepDelay = 800

  for (let i = 1; i <= totalSteps; i++) {
    await new Promise(resolve => setTimeout(resolve, stepDelay))

    const progress = Math.round((i / totalSteps) * 100)
    console.log(`修复进度: ${progress}%`)

    // 这里可以更新进度条或显示当前步骤
  }
}

// ========================= 辅助方法 =========================

/** 切换问题展开状态 */
const toggleIssue = (issue: any) => {
  issue.expanded = !issue.expanded
}

/** 展开/收起全部 */
const expandAll = () => {
  allExpanded.value = !allExpanded.value
  dataIssues.value.forEach(issue => {
    issue.expanded = allExpanded.value
  })
}

/** 获取问题类型颜色 */
const getIssueTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    EMPTY_VALUE: 'warning',
    VALUE_OUT_OF_RANGE: 'danger',
    FORMAT_ERROR: 'info',
    LOGIC_ERROR: 'danger'
  }
  return colorMap[type] || 'default'
}

/** 获取问题类型文本 */
const getIssueTypeText = (type: string): string => {
  const textMap: Record<string, string> = {
    EMPTY_VALUE: '空值',
    VALUE_OUT_OF_RANGE: '超范围',
    FORMAT_ERROR: '格式错误',
    LOGIC_ERROR: '逻辑错误'
  }
  return textMap[type] || '未知'
}
</script>

<style lang="scss" scoped>
.data-fix-container {
  max-height: 70vh;
  overflow-y: auto;
}

.overview-card,
.strategy-card,
.issues-card,
.config-card,
.preview-card {
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

  .header-actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
  }
}

.summary-item {
  text-align: center;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;

  .summary-value {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;

    &.auto-fix {
      color: #67c23a;
    }

    &.manual-fix {
      color: #e6a23c;
    }

    &.success {
      color: #409eff;
    }
  }

  .summary-label {
    font-size: 14px;
    color: #606266;
  }
}

.strategy-options {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .strategy-option {
    border: 2px solid #f0f0f0;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.3s ease;
    width: 100%;

    &:hover {
      border-color: #c6e2ff;
      background-color: #f6f9ff;
    }

    :deep(.el-radio__input.is-checked + .el-radio__label) {
      color: inherit;
    }

    &:has(.el-radio__input.is-checked) {
      border-color: #409eff;
      background-color: #f0f7ff;
    }
  }
}

.strategy-content {
  margin-left: 24px;

  .strategy-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }

  .strategy-description {
    color: #606266;
    margin-bottom: 8px;
    line-height: 1.5;
  }

  .strategy-note {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #909399;
  }
}

.issues-list {
  .issue-item {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 12px;
    overflow: hidden;

    &:last-child {
      margin-bottom: 0;
    }

    &.expanded {
      border-color: #c6e2ff;
    }
  }

  .issue-header {
    padding: 16px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #f8f9fa;
    }

    .issue-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;

      .expand-icon {
        transition: transform 0.3s ease;
        color: #909399;

        &.rotated {
          transform: rotate(90deg);
        }
      }

      .issue-title {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .issue-rule {
          font-weight: 600;
          color: #303133;
        }
      }

      .issue-description {
        color: #606266;
        font-size: 14px;
      }
    }

    .issue-meta {
      display: flex;
      align-items: center;
      gap: 12px;

      .issue-count {
        font-size: 14px;
        color: #909399;
      }
    }
  }

  .issue-content {
    padding: 0 16px 16px 16px;
    background-color: #fafbfc;
    border-top: 1px solid #ebeef5;

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin: 16px 0 12px 0;
    }

    .fix-method {
      background-color: #f0f9ff;
      border: 1px solid #c6e2ff;
      border-radius: 6px;
      padding: 12px;

      .method-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 8px;
      }

      .method-description {
        color: #4b5563;
        margin-bottom: 8px;
      }

      .steps-title {
        font-weight: 500;
        color: #374151;
        margin-bottom: 4px;
      }

      .steps-list {
        margin: 0;
        padding-left: 20px;

        li {
          color: #6b7280;
          margin-bottom: 2px;
        }
      }
    }

    .sample-table {
      margin-bottom: 8px;

      .current-value.error {
        color: #f56c6c;
        background-color: #fef0f0;
        padding: 2px 6px;
        border-radius: 3px;
      }

      .suggested-value.success {
        color: #67c23a;
        background-color: #f0f9ff;
        padding: 2px 6px;
        border-radius: 3px;
      }
    }

    .more-records {
      font-size: 12px;
      color: #909399;
      font-style: italic;
    }

    .risk-alert {
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.config-form {
  .form-help {
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
  }
}

.preview-content {
  .preview-summary {
    margin-bottom: 20px;
  }

  .preview-details h4 {
    margin: 16px 0 12px 0;
    color: #303133;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-fix-container {
    max-height: 60vh;
  }

  .strategy-options {
    .strategy-option {
      padding: 12px;

      .strategy-content {
        margin-left: 20px;
      }
    }
  }

  .issue-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .summary-item {
    padding: 12px;

    .summary-value {
      font-size: 20px;
    }
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
</style>
