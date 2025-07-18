<template>
  <el-dialog
    v-model="dialogVisible"
    title="错误详情"
    width="60%"
    :before-close="handleClose"
    destroy-on-close
    class="error-detail-dialog"
  >
    <div v-if="errorInfo" class="error-container">
      <!-- 错误基本信息 -->
      <div class="error-basic-info">
        <div class="info-header">
          <Icon icon="ep:warning-filled" class="error-icon" />
          <span class="error-title">错误基本信息</span>
        </div>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">
            {{ errorInfo.recordId }}
          </el-descriptions-item>
          <el-descriptions-item label="规则编码">
            {{ errorInfo.ruleCode }}
          </el-descriptions-item>
          <el-descriptions-item label="规则名称">
            {{ errorInfo.ruleName }}
          </el-descriptions-item>
          <el-descriptions-item label="错误类型">
            <el-tag :type="getErrorTypeColor(errorInfo.errorType)" size="small">
              {{ getErrorTypeName(errorInfo.errorType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发生时间">
            {{ errorInfo.errorTime || new Date().toLocaleString() }}
          </el-descriptions-item>
          <el-descriptions-item label="严重程度">
            <el-tag :type="getSeverityColor(errorInfo.severity)" size="small">
              {{ getSeverityName(errorInfo.severity) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 错误信息详情 -->
      <div class="error-message-detail">
        <div class="detail-header">
          <Icon icon="ep:chat-line-square" class="header-icon" />
          <span class="detail-title">错误信息</span>
        </div>

        <div class="message-content">
          <div class="original-message">
            <div class="message-label">原始错误信息：</div>
            <div class="message-text">{{ errorInfo.errorMessage }}</div>
          </div>

          <div v-if="errorInfo.detailedMessage" class="detailed-message">
            <div class="message-label">详细说明：</div>
            <div class="message-text">{{ errorInfo.detailedMessage }}</div>
          </div>

          <div v-if="errorInfo.technicalDetails" class="technical-details">
            <div class="message-label">技术详情：</div>
            <div class="technical-content">
              <pre>{{ errorInfo.technicalDetails }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 字段值详情 -->
      <div class="field-values-detail">
        <div class="detail-header">
          <Icon icon="ep:document" class="header-icon" />
          <span class="detail-title">相关字段值</span>
        </div>

        <div class="field-table">
          <el-table :data="fieldValuesArray" border stripe>
            <el-table-column prop="fieldName" label="字段名" width="150" />
            <el-table-column prop="fieldLabel" label="字段描述" width="180" />
            <el-table-column prop="currentValue" label="当前值" show-overflow-tooltip>
              <template #default="{ row }">
                <span :class="{ 'error-value': isErrorValue(row) }" class="field-value">
                  {{ formatFieldValue(row.currentValue) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="expectedValue" label="期望值" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.expectedValue" class="expected-value">
                  {{ formatFieldValue(row.expectedValue) }}
                </span>
                <span v-else class="no-expected">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="dataType" label="数据类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="getDataTypeColor(row.dataType)">
                  {{ row.dataType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <Icon
                  :icon="isErrorValue(row) ? 'ep:close' : 'ep:check'"
                  :class="isErrorValue(row) ? 'error-status' : 'success-status'"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 规则详情 -->
      <div class="rule-detail">
        <div class="detail-header">
          <Icon icon="ep:cpu" class="header-icon" />
          <span class="detail-title">规则详情</span>
        </div>

        <div class="rule-content">
          <el-tabs v-model="activeTab" type="border-card">
            <el-tab-pane label="规则表达式" name="expression">
              <div class="rule-expression">
                <div class="expression-label">表达式：</div>
                <div class="expression-code">
                  <code>{{ errorInfo.ruleExpression || '未提供规则表达式' }}</code>
                </div>

                <div v-if="errorInfo.compiledSQL" class="compiled-sql">
                  <div class="sql-label">编译后的SQL：</div>
                  <div class="sql-code">
                    <pre><code>{{ formatSQL(errorInfo.compiledSQL) }}</code></pre>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="执行上下文" name="context">
              <div class="execution-context">
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="表名">
                    {{ errorInfo.tableName || '未知' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="检查维度">
                    {{ errorInfo.checkDimension || '未知' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="执行动作">
                    <el-tag :type="getActionTypeColor(errorInfo.executeAction)" size="small">
                      {{ getActionTypeName(errorInfo.executeAction) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="优先级">
                    {{ errorInfo.priority || '未设置' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="执行时间">
                    {{ errorInfo.executionTime || '未知' }}ms
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-tab-pane>

            <el-tab-pane label="修复建议" name="suggestions">
              <div class="fix-suggestions">
                <div v-if="errorInfo.fixSuggestion" class="system-suggestion">
                  <div class="suggestion-header">
                    <Icon icon="ep:lightbulb" class="suggestion-icon" />
                    <span>系统建议</span>
                  </div>
                  <div class="suggestion-content">
                    {{ errorInfo.fixSuggestion }}
                  </div>
                </div>

                <div class="smart-suggestions">
                  <div class="suggestion-header">
                    <Icon icon="ep:magic-stick" class="suggestion-icon" />
                    <span>智能建议</span>
                  </div>
                  <div class="suggestion-list">
                    <div
                      v-for="suggestion in generateSmartSuggestions()"
                      :key="suggestion.id"
                      class="suggestion-item"
                    >
                      <div class="suggestion-title">{{ suggestion.title }}</div>
                      <div class="suggestion-desc">{{ suggestion.description }}</div>
                      <div v-if="suggestion.example" class="suggestion-example">
                        <span class="example-label">示例：</span>
                        <code>{{ suggestion.example }}</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="action-buttons">
                  <el-button type="primary" size="small" @click="copyFixSuggestion">
                    <Icon icon="ep:document-copy" class="mr-5px" />
                    复制建议
                  </el-button>
                  <el-button type="success" size="small" @click="applyQuickFix">
                    <Icon icon="ep:magic-stick" class="mr-5px" />
                    快速修复
                  </el-button>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 相关记录 -->
      <div v-if="relatedErrors.length > 0" class="related-errors">
        <div class="detail-header">
          <Icon icon="ep:connection" class="header-icon" />
          <span class="detail-title">相关错误记录</span>
          <el-tag size="small" type="info">{{ relatedErrors.length }} 条</el-tag>
        </div>

        <div class="related-table">
          <el-table :data="relatedErrors" border stripe max-height="200">
            <el-table-column prop="recordId" label="记录ID" width="100" />
            <el-table-column prop="ruleCode" label="规则编码" width="120" />
            <el-table-column prop="errorMessage" label="错误信息" show-overflow-tooltip />
            <el-table-column prop="errorTime" label="错误时间" width="160" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button size="small" text @click="viewRelatedError(row)">
                  <Icon icon="ep:view" />
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button @click="exportErrorReport">
            <Icon icon="ep:download" class="mr-5px" />
            导出报告
          </el-button>
          <el-button @click="markAsResolved">
            <Icon icon="ep:check" class="mr-5px" />
            标记已解决
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">关闭</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
  errorInfo: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'resolved', errorInfo: any): void
  (e: 'viewRelated', errorInfo: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 对话框状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 数据状态
const activeTab = ref('expression')
const relatedErrors = ref([])

// 计算字段值数组
const fieldValuesArray = computed(() => {
  if (!props.errorInfo?.fieldValues) return []

  return Object.entries(props.errorInfo.fieldValues).map(([fieldName, value]) => ({
    fieldName,
    fieldLabel: getFieldLabel(fieldName),
    currentValue: value,
    expectedValue: getExpectedValue(fieldName),
    dataType: getFieldDataType(fieldName)
  }))
})

// 监听错误信息变化
watch(
  () => props.errorInfo,
  (newError) => {
    if (newError) {
      loadRelatedErrors(newError)
    }
  },
  { immediate: true }
)

// 加载相关错误
const loadRelatedErrors = async (errorInfo: any) => {
  // 模拟加载相关错误数据
  if (errorInfo.recordId) {
    relatedErrors.value = [
      {
        recordId: errorInfo.recordId + 1,
        ruleCode: 'PRE_QC_003',
        errorMessage: '相关字段验证失败',
        errorTime: new Date().toLocaleString()
      },
      {
        recordId: errorInfo.recordId + 2,
        ruleCode: 'PRE_QC_004',
        errorMessage: '数据完整性检查失败',
        errorTime: new Date().toLocaleString()
      }
    ]
  }
}

// 工具方法
const getErrorTypeColor = (errorType: string) => {
  const colors: Record<string, string> = {
    VALIDATION_ERROR: 'danger',
    BUSINESS_ERROR: 'warning',
    SYSTEM_ERROR: 'danger',
    DATA_ERROR: 'warning'
  }
  return colors[errorType] || 'info'
}

const getErrorTypeName = (errorType: string) => {
  const names: Record<string, string> = {
    VALIDATION_ERROR: '验证错误',
    BUSINESS_ERROR: '业务错误',
    SYSTEM_ERROR: '系统错误',
    DATA_ERROR: '数据错误'
  }
  return names[errorType] || errorType
}

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    HIGH: 'danger',
    MEDIUM: 'warning',
    LOW: 'info'
  }
  return colors[severity] || 'info'
}

const getSeverityName = (severity: string) => {
  const names: Record<string, string> = {
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低'
  }
  return names[severity] || severity
}

const getDataTypeColor = (dataType: string) => {
  const colors: Record<string, string> = {
    STRING: '',
    NUMBER: 'success',
    DATE: 'info',
    BOOLEAN: 'warning'
  }
  return colors[dataType] || ''
}

const getActionTypeColor = (action: string) => {
  const colors: Record<string, string> = {
    RECORD_ERROR: 'danger',
    INTERRUPT: 'danger',
    MARK_ANOMALY: 'warning',
    WARNING: 'warning'
  }
  return colors[action] || 'info'
}

const getActionTypeName = (action: string) => {
  const names: Record<string, string> = {
    RECORD_ERROR: '记录错误',
    INTERRUPT: '中断处理',
    MARK_ANOMALY: '标记异常',
    WARNING: '警告'
  }
  return names[action] || action
}

const getFieldLabel = (fieldName: string) => {
  const labels: Record<string, string> = {
    ypid: '药品本位码',
    drug_name: '药品名称',
    manufacturer: '生产企业',
    amount: '金额',
    quantity: '数量'
  }
  return labels[fieldName] || fieldName
}

const getExpectedValue = (fieldName: string) => {
  // 根据字段名和错误类型返回期望值
  if (fieldName === 'ypid') {
    return '12位数字编码'
  }
  if (fieldName.includes('name')) {
    return '非空字符串'
  }
  if (fieldName.includes('amount') || fieldName.includes('quantity')) {
    return '大于0的数值'
  }
  return null
}

const getFieldDataType = (fieldName: string) => {
  const types: Record<string, string> = {
    ypid: 'STRING',
    drug_name: 'STRING',
    manufacturer: 'STRING',
    amount: 'NUMBER',
    quantity: 'NUMBER'
  }
  return types[fieldName] || 'STRING'
}

const isErrorValue = (row: any) => {
  // 判断字段值是否有错误
  if (row.fieldName === 'ypid') {
    return !row.currentValue || !/^\d{12}$/.test(row.currentValue)
  }
  if (row.fieldName.includes('name')) {
    return !row.currentValue || row.currentValue.trim() === ''
  }
  if (row.fieldName.includes('amount') || row.fieldName.includes('quantity')) {
    return !row.currentValue || isNaN(Number(row.currentValue)) || Number(row.currentValue) <= 0
  }
  return false
}

const formatFieldValue = (value: any) => {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  if (value === '') {
    return '(空字符串)'
  }
  return String(value)
}

const formatSQL = (sql: string) => {
  return sql
    .replace(/SELECT/gi, 'SELECT')
    .replace(/FROM/gi, '\nFROM')
    .replace(/WHERE/gi, '\nWHERE')
    .replace(/AND/gi, '\n  AND')
    .replace(/OR/gi, '\n  OR')
}

const generateSmartSuggestions = () => {
  const suggestions = []

  if (props.errorInfo?.ruleCode === 'PRE_QC_002') {
    suggestions.push({
      id: 'fill_required',
      title: '填写必填字段',
      description: '确保所有标记为必填的字段都有有效值',
      example: '药品名称: 阿司匹林片, 生产企业: XX制药有限公司'
    })
  }

  if (props.errorInfo?.fieldValues?.ypid && !/^\d{12}$/.test(props.errorInfo.fieldValues.ypid)) {
    suggestions.push({
      id: 'fix_ypid',
      title: '修正YPID格式',
      description: 'YPID必须是12位数字编码',
      example: '123456789012'
    })
  }

  suggestions.push({
    id: 'check_data_source',
    title: '检查数据源',
    description: '确认原始数据的完整性和准确性',
    example: '重新核对Excel文件或数据库中的源数据'
  })

  return suggestions
}

// 操作方法
const copyFixSuggestion = async () => {
  const suggestion = props.errorInfo?.fixSuggestion || '暂无修复建议'
  try {
    await navigator.clipboard.writeText(suggestion)
    ElMessage.success('修复建议已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const applyQuickFix = () => {
  // 实现快速修复逻辑
  ElMessage.info('快速修复功能开发中...')
}

const exportErrorReport = () => {
  const report = {
    errorInfo: props.errorInfo,
    fieldValues: fieldValuesArray.value,
    relatedErrors: relatedErrors.value,
    exportTime: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `error_report_${props.errorInfo?.recordId || 'unknown'}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('错误报告已导出')
}

const markAsResolved = () => {
  emit('resolved', props.errorInfo)
  ElMessage.success('已标记为已解决')
  handleClose()
}

const viewRelatedError = (error: any) => {
  emit('viewRelated', error)
}

const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style lang="scss" scoped>
.error-detail-dialog {
  .error-container {
    max-height: 70vh;
    overflow-y: auto;

    .error-basic-info,
    .error-message-detail,
    .field-values-detail,
    .rule-detail,
    .related-errors {
      margin-bottom: 20px;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;
    }

    .info-header,
    .detail-header {
      padding: 12px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e4e7ed;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;

      .error-icon,
      .header-icon {
        color: #f56c6c;
      }

      .error-title,
      .detail-title {
        flex: 1;
      }
    }

    .error-basic-info {
      .info-header .error-icon {
        font-size: 18px;
      }

      :deep(.el-descriptions) {
        margin: 16px;
      }
    }

    .error-message-detail {
      .message-content {
        padding: 16px;

        .original-message,
        .detailed-message,
        .technical-details {
          margin-bottom: 16px;

          .message-label {
            font-weight: 500;
            color: #606266;
            margin-bottom: 8px;
          }

          .message-text {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 6px;
            border-left: 4px solid #f56c6c;
          }

          .technical-content {
            background: #2d3748;
            color: #e2e8f0;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;

            pre {
              margin: 0;
              font-family: 'Fira Code', Consolas, monospace;
              line-height: 1.4;
            }
          }
        }
      }
    }

    .field-values-detail {
      .field-table {
        padding: 16px;

        .field-value {
          font-family: 'Fira Code', Consolas, monospace;

          &.error-value {
            color: #f56c6c;
            font-weight: 500;
          }
        }

        .expected-value {
          color: #67c23a;
          font-family: 'Fira Code', Consolas, monospace;
        }

        .no-expected {
          color: #c0c4cc;
        }

        .error-status {
          color: #f56c6c;
        }

        .success-status {
          color: #67c23a;
        }
      }
    }

    .rule-detail {
      .rule-content {
        padding: 16px;

        .rule-expression {
          .expression-label,
          .sql-label {
            font-weight: 500;
            color: #606266;
            margin-bottom: 8px;
          }

          .expression-code {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 16px;

            code {
              font-family: 'Fira Code', Consolas, monospace;
            }
          }

          .sql-code {
            background: #2d3748;
            color: #e2e8f0;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;

            pre code {
              font-family: 'Fira Code', Consolas, monospace;
              line-height: 1.4;
            }
          }
        }

        .execution-context {
          :deep(.el-descriptions) {
            margin: 0;
          }
        }

        .fix-suggestions {
          .system-suggestion,
          .smart-suggestions {
            margin-bottom: 20px;

            .suggestion-header {
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 12px;
              font-weight: 500;

              .suggestion-icon {
                color: #409eff;
              }
            }

            .suggestion-content {
              background: #e7f3ff;
              padding: 12px;
              border-radius: 6px;
              border-left: 4px solid #409eff;
            }

            .suggestion-list {
              .suggestion-item {
                background: white;
                border: 1px solid #e4e7ed;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 12px;

                .suggestion-title {
                  font-weight: 500;
                  color: #303133;
                  margin-bottom: 4px;
                }

                .suggestion-desc {
                  color: #606266;
                  font-size: 14px;
                  margin-bottom: 8px;
                }

                .suggestion-example {
                  font-size: 13px;

                  .example-label {
                    color: #909399;
                  }

                  code {
                    background: #f5f5f5;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Fira Code', Consolas, monospace;
                  }
                }
              }
            }
          }

          .action-buttons {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            margin-top: 16px;
          }
        }
      }
    }

    .related-errors {
      .related-table {
        padding: 16px;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .footer-left {
      display: flex;
      gap: 8px;
    }

    .footer-right {
      display: flex;
      gap: 8px;
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .error-detail-dialog {
    .error-container {
      .error-basic-info :deep(.el-descriptions) {
        :deep(.el-descriptions__body) {
          .el-descriptions__table {
            .el-descriptions__cell {
              padding: 8px;
            }
          }
        }
      }

      .fix-suggestions .action-buttons {
        flex-direction: column;
      }
    }

    .dialog-footer {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .footer-left,
      .footer-right {
        justify-content: center;
      }
    }
  }
}
</style>
