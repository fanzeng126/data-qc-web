<template>
  <el-dialog
    v-model="dialogVisible"
    title="质控规则详情"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="rule-detail-container">
      <template v-if="ruleDetail">
        <!-- 基本信息 -->
        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <el-tag :type="ruleDetail.enabled ? 'success' : 'danger'" size="small">
                {{ ruleDetail.enabled ? '已启用' : '已禁用' }}
              </el-tag>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="规则编码">
              <el-tag type="primary">{{ ruleDetail.ruleCode }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="规则名称">
              {{ ruleDetail.ruleName }}
            </el-descriptions-item>
            <el-descriptions-item label="规则类型">
              <el-tag :type="ruleDetail.ruleType === 1 ? 'primary' : 'success'">
                {{ ruleDetail.ruleType === 1 ? '前置质控' : '后置质控' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="规则分类">
              <el-tag>{{
                getDictLabel(DICT_TYPE.DRUG_QC_RULE_CATEGORY, ruleDetail.ruleCategory)
              }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="适用表">
              <span v-if="ruleDetail.tableType">
                {{ getDictLabel(DICT_TYPE.DRUG_QC_TABLE_TYPE, ruleDetail.tableType) }}
              </span>
              <span v-else class="text-muted">全部表</span>
            </el-descriptions-item>
            <el-descriptions-item label="检查字段">
              <code v-if="ruleDetail.fieldName" class="field-name">{{ ruleDetail.fieldName }}</code>
              <span v-else class="text-muted">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="错误级别">
              <el-tag :type="ruleDetail.errorLevel === 1 ? 'danger' : 'warning'">
                {{ getDictLabel(DICT_TYPE.DRUG_QC_ERROR_LEVEL, ruleDetail.errorLevel) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="优先级">
              <el-tag type="info">{{ ruleDetail.priority }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 规则表达式 -->
        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>规则表达式</span>
              <el-button size="small" type="primary" @click="testExpression">
                <el-icon><Connection /></el-icon>
                测试表达式
              </el-button>
            </div>
          </template>

          <div class="expression-section">
            <div class="expression-display">
              <pre class="expression-code">{{ ruleDetail.ruleExpression }}</pre>
            </div>

            <!-- 表达式解析 -->
            <el-divider content-position="left">表达式说明</el-divider>
            <div class="expression-explanation">
              <div class="expression-info">
                <p><strong>表达式类型：</strong>SpEL (Spring Expression Language)</p>
                <p><strong>表达式长度：</strong>{{ ruleDetail.ruleExpression.length }} 字符</p>
                <p
                  ><strong>复杂度评估：</strong>
                  <el-tag :type="getComplexityType(ruleDetail.ruleExpression)">
                    {{ getComplexityLevel(ruleDetail.ruleExpression) }}
                  </el-tag>
                </p>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 错误配置 -->
        <el-card class="detail-card" shadow="never">
          <template #header>
            <span>错误配置</span>
          </template>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="错误提示信息">
              <div class="error-message">{{ ruleDetail.errorMessage }}</div>
            </el-descriptions-item>
            <el-descriptions-item label="阈值配置" v-if="ruleDetail.thresholdValue">
              <div class="threshold-config">
                <pre>{{ formatJson(ruleDetail.thresholdValue) }}</pre>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="规则说明" v-if="ruleDetail.description">
              <div class="rule-description">{{ ruleDetail.description }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 执行统计 -->
        <el-card class="detail-card" shadow="never">
          <template #header>
            <span>执行统计</span>
          </template>

          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value">{{ executionStats.totalExecutions || 0 }}</div>
                <div class="stat-label">总执行次数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value success">{{ executionStats.successExecutions || 0 }}</div>
                <div class="stat-label">成功次数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value error">{{ executionStats.failedExecutions || 0 }}</div>
                <div class="stat-label">失败次数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value">{{ executionStats.averageExecutionTime || 0 }}ms</div>
                <div class="stat-label">平均执行时间</div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 最近执行记录 -->
        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>最近执行记录</span>
              <el-button size="small" @click="viewAllHistory"> 查看全部历史 </el-button>
            </div>
          </template>

          <div v-if="recentExecutions.length > 0">
            <el-table :data="recentExecutions" stripe>
              <el-table-column prop="executionId" label="执行ID" width="120" />
              <el-table-column prop="taskId" label="任务ID" width="100" />
              <el-table-column
                prop="processedRecords"
                label="处理记录数"
                width="120"
                align="center"
              />
              <el-table-column prop="failedRecords" label="失败记录数" width="120" align="center">
                <template #default="{ row }">
                  <span :class="{ 'error-text': row.failedRecords > 0 }">
                    {{ row.failedRecords || 0 }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="executionTime" label="执行耗时" width="120" align="center">
                <template #default="{ row }"> {{ row.executionTime || 0 }}ms </template>
              </el-table-column>
              <el-table-column
                prop="startTime"
                label="执行时间"
                min-width="150"
                :formatter="dateFormatter"
              />
            </el-table>
          </div>
          <div v-else class="no-data">
            <el-empty description="暂无执行记录" />
          </div>
        </el-card>

        <!-- 操作记录 -->
        <el-card class="detail-card" shadow="never">
          <template #header>
            <span>操作记录</span>
          </template>

          <div v-if="operationLogs.length > 0">
            <el-timeline>
              <el-timeline-item
                v-for="log in operationLogs"
                :key="log.logId"
                :timestamp="formatTime(log.operationTime)"
                :type="getLogType(log.operationType)"
              >
                <div class="timeline-content">
                  <div class="operation-title">{{ log.operationDescription }}</div>
                  <div class="operation-detail">操作类型: {{ log.operationType }}</div>
                  <div class="operation-user">操作人: {{ log.operatorName }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
          <div v-else class="no-data">
            <el-empty description="暂无操作记录" />
          </div>
        </el-card>
      </template>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="editRule" v-if="ruleDetail">
          <el-icon><Edit /></el-icon>
          编辑规则
        </el-button>
      </div>
    </template>

    <!-- 规则测试弹窗 - 修改：使用v-model方式 -->
    <RuleTestModal v-model="testVisible" :rule="ruleDetail" />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection, Edit } from '@element-plus/icons-vue'
import { dateFormatter } from '@/utils/formatTime'
import { getDictLabel, DICT_TYPE } from '@/utils/dict'
import {
  QcRuleApi,
  type QcRuleRespVO,
  type QcRuleExecutionStatsVO,
  type QcRuleExecutionRecordVO,
  type QcRuleOperationLogVO
} from '@/api/drug/qc/rule'

// 导入子组件
import RuleTestModal from './RuleTestModal.vue'

interface Props {
  ruleId?: number
}

const props = defineProps<Props>()
const emit = defineEmits(['edit'])

// ========================= 响应式数据 =========================

const dialogVisible = defineModel<boolean>({ default: false })
const loading = ref(false)

// 测试相关状态 - 新增
const testVisible = ref(false)

/** 规则详细信息 */
const ruleDetail = ref<QcRuleRespVO>()

/** 执行统计 */
const executionStats = reactive<Partial<QcRuleExecutionStatsVO>>({
  totalExecutions: 0,
  successExecutions: 0,
  failedExecutions: 0,
  averageExecutionTime: 0
})

/** 最近执行记录 */
const recentExecutions = ref<QcRuleExecutionRecordVO[]>([])

/** 操作记录 */
const operationLogs = ref<QcRuleOperationLogVO[]>([])

// ========================= 监听器 =========================

watch(dialogVisible, (visible) => {
  if (visible && props.ruleId) {
    loadRuleDetail()
  }
})

// ========================= 核心方法 =========================

/** 加载规则详情 */
const loadRuleDetail = async () => {
  if (!props.ruleId) return

  loading.value = true
  try {
    // 优先加载基本信息
    ruleDetail.value = await QcRuleApi.getQcRule(props.ruleId) // 修改：使用getQcRule而不是getRuleDetail

    // 并行加载其他数据，失败时不影响基本信息显示
    const promises = [
      QcRuleApi.getRuleExecutionStats(props.ruleId).catch(() => ({})),
      QcRuleApi.getRecentExecutions(props.ruleId, 10).catch(() => []),
      QcRuleApi.getOperationLogs(props.ruleId, 20).catch(() => [])
    ]

    const [stats, executions, logs] = await Promise.all(promises)

    Object.assign(executionStats, stats)
    recentExecutions.value = executions
    operationLogs.value = logs
  } catch (error) {
    ElMessage.error('加载规则详情失败')
    console.error('加载规则详情失败:', error)
  } finally {
    loading.value = false
  }
}

// ========================= 业务方法 =========================

/** 测试表达式 - 修改：使用v-model方式打开测试弹窗 */
const testExpression = () => {
  if (!ruleDetail.value) {
    ElMessage.warning('规则信息未加载完成')
    return
  }

  if (!ruleDetail.value.ruleExpression) {
    ElMessage.warning('该规则没有配置表达式')
    return
  }

  // 直接显示测试弹窗，ruleDetail会通过props传递
  testVisible.value = true
}

/** 编辑规则 */
const editRule = () => {
  if (ruleDetail.value) {
    emit('edit', ruleDetail.value.id)
    dialogVisible.value = false
  }
}

/** 查看全部历史 */
const viewAllHistory = () => {
  ElMessage.info('执行历史功能开发中...')
}

// ========================= 工具方法 =========================

/** 格式化时间 */
const formatTime = (time: string): string => {
  return new Date(time).toLocaleString()
}

/** 获取日志类型 */
const getLogType = (operation: string): string => {
  switch (operation) {
    case 'CREATE':
      return 'success'
    case 'UPDATE':
      return 'primary'
    case 'DELETE':
      return 'danger'
    case 'ENABLE':
      return 'success'
    case 'DISABLE':
      return 'warning'
    default:
      return 'info'
  }
}

/** 格式化JSON */
const formatJson = (jsonStr: string): string => {
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2)
  } catch (e) {
    return jsonStr
  }
}

/** 获取表达式复杂度类型 */
const getComplexityType = (expression: string): string => {
  const length = expression.length
  if (length < 50) return 'success'
  if (length < 100) return 'warning'
  return 'danger'
}

/** 获取表达式复杂度级别 */
const getComplexityLevel = (expression: string): string => {
  const length = expression.length
  if (length < 50) return '简单'
  if (length < 100) return '中等'
  return '复杂'
}

// ========================= 对外方法 =========================

defineExpose({
  open: (ruleId: number) => {
    if (ruleId) {
      // 通过重新定义props来处理，这里直接加载数据
      Object.assign(props, { ruleId })
      loadRuleDetail()
      dialogVisible.value = true
    }
  }
})
</script>

<style lang="scss" scoped>
.rule-detail-container {
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

  :deep(.el-card__header) {
    background-color: #fafbfc;
    border-bottom: 1px solid #ebeef5;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.text-muted {
  color: #909399;
  font-style: italic;
}

.field-name {
  background-color: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  color: #e6a23c;
  border: 1px solid #ebeef5;
}

.expression-section {
  .expression-display {
    margin-bottom: 16px;
  }

  .expression-code {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 16px;
    font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
    font-size: 14px;
    color: #495057;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .expression-explanation {
    background-color: #f0f9ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 12px;

    .expression-info {
      p {
        margin: 4px 0;
        font-size: 14px;
      }
    }
  }
}

.error-message {
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  padding: 12px;
  color: #f56c6c;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
}

.threshold-config {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;

  pre {
    margin: 0;
    font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
    font-size: 12px;
  }
}

.rule-description {
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 4px;

    &.success {
      color: #67c23a;
    }

    &.error {
      color: #f56c6c;
    }
  }

  .stat-label {
    font-size: 12px;
    color: #909399;
  }
}

.error-text {
  color: #f56c6c;
  font-weight: 600;
}

.timeline-content {
  .operation-title {
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
  }

  .operation-detail {
    color: #606266;
    margin-bottom: 4px;
    font-size: 14px;
  }

  .operation-user {
    color: #909399;
    font-size: 12px;
  }
}

.no-data {
  text-align: center;
  padding: 40px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 描述列表样式优化 */
:deep(.el-descriptions__body) {
  background-color: #fff;
}

:deep(.el-descriptions__label) {
  background-color: #fafbfc;
  font-weight: 600;
  color: #303133;
  width: 120px;
}

:deep(.el-descriptions__content) {
  background-color: #fff;
}

/* 表格样式 */
:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

/* 时间线样式 */
:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .rule-detail-container {
    max-height: 60vh;
  }

  .stat-item {
    margin-bottom: 12px;
  }

  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .expression-code {
    font-size: 12px;
    padding: 12px;
  }
}
</style>
