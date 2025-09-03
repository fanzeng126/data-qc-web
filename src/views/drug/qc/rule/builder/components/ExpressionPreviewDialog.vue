<template>
  <el-dialog
    v-model="dialogVisible"
    title="表达式预览"
    width="80%"
    :before-close="handleClose"
    destroy-on-close
    class="expression-preview-dialog"
  >
    <div class="preview-container">
      <!-- 规则基本信息 -->
      <div class="rule-info-section">
        <div class="section-header">
          <Icon icon="ep:info-filled" class="header-icon" />
          <span class="header-title">规则信息</span>
        </div>
        <div class="rule-info-content">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="规则编码">
              {{ ruleForm.ruleCode || '自动生成' }}
            </el-descriptions-item>
            <el-descriptions-item label="规则名称">
              {{ ruleForm.ruleName }}
            </el-descriptions-item>
            <el-descriptions-item label="规则类型">
              {{ getRuleTypeText(ruleForm.ruleType) }}
            </el-descriptions-item>
            <el-descriptions-item label="检查维度">
              {{ getCheckDimensionText(ruleForm.checkDimension) }}
            </el-descriptions-item>
            <el-descriptions-item label="规则分类">
              {{ ruleForm.ruleCategory }}
            </el-descriptions-item>
            <el-descriptions-item label="优先级">
              {{ ruleForm.priority }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 条件组预览 -->
      <div class="condition-groups-section">
        <div class="section-header">
          <Icon icon="ep:cpu" class="header-icon" />
          <span class="header-title">条件组预览</span>
          <el-tag size="small" type="info">{{ conditionGroups.length }} 个条件组</el-tag>
        </div>

        <div class="condition-groups-content">
          <div
            v-for="(group, index) in conditionGroups"
            :key="group.id"
            class="condition-group-preview"
          >
            <div class="group-header">
              <div class="group-info">
                <span class="group-name">{{ group.groupName || `条件组 ${index + 1}` }}</span>
                <el-tag size="small" :type="getActionType(group.executeAction)">
                  {{ getActionText(group.executeAction) }}
                </el-tag>
                <el-tag size="small" type="info">优先级: {{ group.priority }}</el-tag>
              </div>
              <div class="group-actions">
                <el-button
                  size="small"
                  text
                  @click="compileGroup(group)"
                  :loading="group.compiling"
                >
                  <Icon icon="ep:cpu" class="mr-5px" />
                  编译SQL
                </el-button>
                <el-button size="small" text @click="toggleGroupExpand(index)">
                  <Icon :icon="group.expanded ? 'ep:arrow-up' : 'ep:arrow-down'" />
                </el-button>
              </div>
            </div>

            <!-- 表达式预览 -->
            <div class="group-expression">
              <div class="expression-text">
                <span class="expression-label">表达式：</span>
                <code class="expression-code">{{
                  generateExpressionText(group.expressionComponents)
                }}</code>
              </div>

              <!-- 编译结果 -->
              <div v-if="group.compilationResult" class="compilation-result">
                <el-alert
                  :type="group.compilationResult.isValid ? 'success' : 'error'"
                  :title="group.compilationResult.isValid ? '语法正确' : '语法错误'"
                  :description="group.compilationResult.message"
                  show-icon
                  :closable="false"
                />

                <!-- SQL预览 -->
                <div
                  v-if="group.compilationResult.isValid && group.compilationResult.sqlExpression"
                  class="sql-preview"
                >
                  <div class="sql-header">
                    <span>生成的SQL：</span>
                    <el-button
                      size="small"
                      text
                      @click="copySql(group.compilationResult.sqlExpression)"
                    >
                      <Icon icon="ep:document-copy" class="mr-5px" />
                      复制SQL
                    </el-button>
                  </div>
                  <div class="sql-content">
                    <pre><code class="sql">{{ formatSql(group.compilationResult.sqlExpression) }}</code></pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- 展开详情 -->
            <div v-if="group.expanded" class="group-details">
              <div class="detail-tabs">
                <el-tabs v-model="group.activeTab" type="border-card">
                  <!-- 错误信息模板 -->
                  <el-tab-pane label="错误信息" name="error">
                    <div class="error-template">
                      <div class="template-input">
                        <span class="template-label">模板：</span>
                        <el-input
                          v-model="group.errorMessageTemplate"
                          type="textarea"
                          :rows="2"
                          readonly
                          placeholder="未设置错误信息模板"
                        />
                      </div>
                      <div class="template-preview">
                        <span class="template-label">预览：</span>
                        <div class="preview-text">{{ previewErrorMessage(group) }}</div>
                      </div>
                      <div class="available-variables">
                        <span class="variables-label">可用变量：</span>
                        <div class="variables-list">
                          <el-tag
                            v-for="variable in getAvailableVariables(group)"
                            :key="variable"
                            size="small"
                            class="variable-tag"
                          >
                            {{ variable }}
                          </el-tag>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>

                  <!-- 使用的资源 -->
                  <el-tab-pane label="依赖分析" name="dependencies">
                    <div class="dependencies-analysis">
                      <div v-if="group.compilationResult?.usedTables?.length" class="used-tables">
                        <h4>使用的表：</h4>
                        <el-tag
                          v-for="table in group.compilationResult.usedTables"
                          :key="table"
                          type="info"
                          class="resource-tag"
                        >
                          {{ table }}
                        </el-tag>
                      </div>
                      <div v-if="group.compilationResult?.usedFields?.length" class="used-fields">
                        <h4>使用的字段：</h4>
                        <el-tag
                          v-for="field in group.compilationResult.usedFields"
                          :key="field"
                          type="primary"
                          class="resource-tag"
                        >
                          {{ field }}
                        </el-tag>
                      </div>
                      <div
                        v-if="group.compilationResult?.usedFunctions?.length"
                        class="used-functions"
                      >
                        <h4>使用的函数：</h4>
                        <el-tag
                          v-for="func in group.compilationResult.usedFunctions"
                          :key="func"
                          type="warning"
                          class="resource-tag"
                        >
                          {{ func }}
                        </el-tag>
                      </div>
                    </div>
                  </el-tab-pane>

                  <!-- 组件详情 -->
                  <el-tab-pane label="组件详情" name="components">
                    <div class="components-detail">
                      <div
                        v-for="(component, compIndex) in group.expressionComponents"
                        :key="compIndex"
                        class="component-item"
                      >
                        <div class="component-header">
                          <Icon :icon="getComponentIcon(component.type)" class="component-icon" />
                          <span class="component-type">{{
                            getComponentTypeText(component.type)
                          }}</span>
                          <el-tag size="small">{{ component.value }}</el-tag>
                        </div>
                        <div v-if="component.label" class="component-label">{{
                          component.label
                        }}</div>
                        <div v-if="component.parameters?.length" class="component-params">
                          <span class="params-label">参数：</span>
                          <span
                            v-for="(param, paramIndex) in component.parameters"
                            :key="paramIndex"
                            class="param-item"
                          >
                            {{ param.value
                            }}{{ paramIndex < component.parameters.length - 1 ? ', ' : '' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 整体规则预览 -->
      <div class="rule-summary-section">
        <div class="section-header">
          <Icon icon="ep:document" class="header-icon" />
          <span class="header-title">规则总览</span>
          <el-button
            size="small"
            type="primary"
            @click="generateCompletePreview"
            :loading="generatingPreview"
          >
            <Icon icon="ep:refresh" class="mr-5px" />
            生成完整预览
          </el-button>
        </div>

        <div v-if="completePreview" class="rule-summary-content">
          <el-tabs v-model="summaryActiveTab" type="border-card">
            <!-- 完整SQL -->
            <el-tab-pane label="完整SQL" name="sql">
              <div class="complete-sql">
                <div class="sql-header">
                  <span>完整的规则SQL：</span>
                  <div class="sql-actions">
                    <el-button size="small" text @click="copySql(completePreview.completeSql)">
                      <Icon icon="ep:document-copy" class="mr-5px" />
                      复制
                    </el-button>
                    <el-button size="small" text @click="downloadSql">
                      <Icon icon="ep:download" class="mr-5px" />
                      下载
                    </el-button>
                  </div>
                </div>
                <div class="sql-content">
                  <pre><code class="sql">{{ formatSql(completePreview.completeSql) }}</code></pre>
                </div>
              </div>
            </el-tab-pane>

            <!-- 执行计划 -->
            <el-tab-pane label="执行统计" name="stats">
              <div class="execution-stats">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <div class="stat-item">
                      <div class="stat-label">条件组数量</div>
                      <div class="stat-value">{{ conditionGroups.length }}</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="stat-item">
                      <div class="stat-label">涉及表数量</div>
                      <div class="stat-value">{{ completePreview.totalTables }}</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="stat-item">
                      <div class="stat-label">涉及字段数量</div>
                      <div class="stat-value">{{ completePreview.totalFields }}</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="stat-item">
                      <div class="stat-label">使用函数数量</div>
                      <div class="stat-value">{{ completePreview.totalFunctions }}</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="stat-item">
                      <div class="stat-label">估计复杂度</div>
                      <div class="stat-value">
                        <el-tag :type="getComplexityType(completePreview.complexity)">
                          {{ completePreview.complexity }}
                        </el-tag>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="stat-item">
                      <div class="stat-label">预估执行时间</div>
                      <div class="stat-value">{{ completePreview.estimatedTime }}ms</div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>

            <!-- 规则文档 -->
            <el-tab-pane label="规则文档" name="document">
              <div class="rule-document">
                <div class="document-header">
                  <el-button size="small" type="primary" @click="exportDocument">
                    <Icon icon="ep:download" class="mr-5px" />
                    导出文档
                  </el-button>
                </div>
                <div class="document-content" v-html="completePreview.documentHtml"></div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleSave">
          <Icon icon="ep:check" class="mr-5px" />
          确认并保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { compileRuleExpression, previewRuleSQL } from '@/api/drug/qc/rule/builder'

interface Props {
  modelValue: boolean
  ruleForm: any
  conditionGroups: any[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 对话框状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 数据状态
const summaryActiveTab = ref('sql')
const generatingPreview = ref(false)
const completePreview = ref<any>(null)

// 初始化条件组展开状态
const initializeGroups = () => {
  props.conditionGroups.forEach((group) => {
    if (!group.hasOwnProperty('expanded')) {
      group.expanded = false
    }
    if (!group.hasOwnProperty('activeTab')) {
      group.activeTab = 'error'
    }
    if (!group.hasOwnProperty('compiling')) {
      group.compiling = false
    }
  })
}

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible) {
    initializeGroups()
  }
})

// 文本生成方法
const getRuleTypeText = (type: number) => {
  return type === 1 ? '前置质控' : '后置质控'
}

const getCheckDimensionText = (dimension: string) => {
  const map: Record<string, string> = {
    GLOBAL: '全局维度',
    ORGANIZATION: '机构维度',
    RECORD: '记录维度',
    PROVINCE: '省份维度'
  }
  return map[dimension] || dimension
}

const getActionType = (action: string) => {
  const types: Record<string, string> = {
    RECORD_ERROR: 'danger',
    INTERRUPT: 'danger',
    MARK_ANOMALY: 'warning',
    WARNING: 'warning',
    SKIP: 'info'
  }
  return types[action] || ''
}

const getActionText = (action: string) => {
  const texts: Record<string, string> = {
    RECORD_ERROR: '记录错误',
    INTERRUPT: '直接中断',
    MARK_ANOMALY: '标记异常',
    WARNING: '警告',
    SKIP: '跳过'
  }
  return texts[action] || action
}

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

const getComponentTypeText = (type: string) => {
  const texts: Record<string, string> = {
    field: '字段',
    function: '函数',
    operator: '操作符',
    constant: '常量',
    group: '分组'
  }
  return texts[type] || type
}

const getComplexityType = (complexity: string) => {
  const types: Record<string, string> = {
    简单: 'success',
    中等: 'warning',
    复杂: 'danger'
  }
  return types[complexity] || 'info'
}

// 表达式处理方法
const generateExpressionText = (components: any[]) => {
  if (!components || components.length === 0) return '空表达式'

  return components
    .map((comp) => {
      if (comp.type === 'function') {
        const params = comp.parameters ? comp.parameters.map((p: any) => p.value).join(', ') : ''
        return `${comp.value}(${params})`
      }
      return comp.value
    })
    .join(' ')
}

const formatSql = (sql: string) => {
  if (!sql) return ''

  // 简单的SQL格式化
  return sql
    .replace(/SELECT/gi, 'SELECT')
    .replace(/FROM/gi, '\nFROM')
    .replace(/WHERE/gi, '\nWHERE')
    .replace(/AND/gi, '\n  AND')
    .replace(/OR/gi, '\n  OR')
    .replace(/ORDER BY/gi, '\nORDER BY')
    .replace(/GROUP BY/gi, '\nGROUP BY')
    .replace(/HAVING/gi, '\nHAVING')
}

// 编译条件组
const compileGroup = async (group: any) => {
  try {
    group.compiling = true

    const expressionJson = {
      type: 'expression',
      components: group.expressionComponents
    }

    const { data } = await compileRuleExpression({
      expressionJson,
      tableName: 'temp_table',
      checkDimension: props.ruleForm.checkDimension
    })

    group.compilationResult = {
      isValid: data.isValid,
      message: data.isValid ? '语法正确' : data.validationErrors.join('; '),
      sqlExpression: data.sqlExpression,
      usedTables: data.usedTables || [],
      usedFields: data.usedFields || [],
      usedFunctions: data.usedFunctions || []
    }
  } catch (error: any) {
    group.compilationResult = {
      isValid: false,
      message: '编译失败: ' + error.message,
      sqlExpression: '',
      usedTables: [],
      usedFields: [],
      usedFunctions: []
    }
  } finally {
    group.compiling = false
  }
}

// 切换条件组展开状态
const toggleGroupExpand = (index: number) => {
  const group = props.conditionGroups[index]
  group.expanded = !group.expanded
}

// 预览错误信息
const previewErrorMessage = (group: any) => {
  if (!group.errorMessageTemplate) return '未设置错误信息模板'

  // 简单的变量替换示例
  let message = group.errorMessageTemplate
  message = message.replace(/\$\{tableName\}/g, 'drug_list')
  message = message.replace(/\$\{fieldName\}/g, 'drug_name')
  message = message.replace(/\$\{.*?\.result\}/g, '示例值')

  return message
}

// 获取可用变量
const getAvailableVariables = (group: any) => {
  const variables = ['${tableName}', '${fieldName}']

  // 根据使用的函数添加变量
  if (group.compilationResult?.usedFunctions) {
    group.compilationResult.usedFunctions.forEach((func: string) => {
      variables.push(`\${${func}.result}`)
    })
  }

  return variables
}

// 生成完整预览
const generateCompletePreview = async () => {
  try {
    generatingPreview.value = true

    const ruleData = {
      ...props.ruleForm,
      conditionGroups: props.conditionGroups
    }

    const { data } = await previewRuleSQL(ruleData)

    completePreview.value = {
      completeSql: data.sql,
      totalTables: data.statistics.totalTables,
      totalFields: data.statistics.totalFields,
      totalFunctions: data.statistics.totalFunctions,
      complexity: data.statistics.complexity,
      estimatedTime: data.statistics.estimatedTime,
      documentHtml: generateDocumentHtml()
    }

    ElMessage.success('预览生成成功')
  } catch (error: any) {
    ElMessage.error('预览生成失败: ' + error.message)
  } finally {
    generatingPreview.value = false
  }
}

// 生成文档HTML
const generateDocumentHtml = () => {
  let html = `
    <div class="rule-document">
      <h2>${props.ruleForm.ruleName}</h2>
      <p><strong>规则编码：</strong>${props.ruleForm.ruleCode}</p>
      <p><strong>规则类型：</strong>${getRuleTypeText(props.ruleForm.ruleType)}</p>
      <p><strong>检查维度：</strong>${getCheckDimensionText(props.ruleForm.checkDimension)}</p>

      <h3>条件组列表</h3>
      <ol>
  `

  props.conditionGroups.forEach((group, index) => {
    html += `
      <li>
        <strong>${group.groupName || `条件组 ${index + 1}`}</strong>
        <p>表达式：<code>${generateExpressionText(group.expressionComponents)}</code></p>
        <p>执行动作：${getActionText(group.executeAction)}</p>
        <p>错误信息：${group.errorMessageTemplate || '无'}</p>
      </li>
    `
  })

  html += `
      </ol>

      <h3>规则说明</h3>
      <p>此规则用于${getRuleTypeText(props.ruleForm.ruleType)}，检查维度为${getCheckDimensionText(props.ruleForm.checkDimension)}。</p>
    </div>
  `

  return html
}

// 工具方法
const copySql = async (sql: string) => {
  try {
    await navigator.clipboard.writeText(sql)
    ElMessage.success('SQL已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const downloadSql = () => {
  if (!completePreview.value?.completeSql) return

  const blob = new Blob([completePreview.value.completeSql], { type: 'text/sql' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.ruleForm.ruleCode || 'rule'}.sql`
  a.click()
  URL.revokeObjectURL(url)
}

const exportDocument = () => {
  if (!completePreview.value?.documentHtml) return

  const blob = new Blob([completePreview.value.documentHtml], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.ruleForm.ruleName || '规则文档'}.html`
  a.click()
  URL.revokeObjectURL(url)
}

// 事件处理
const handleClose = () => {
  dialogVisible.value = false
}

const handleSave = () => {
  emit('save')
  handleClose()
}
</script>

<style lang="scss" scoped>
.expression-preview-dialog {
  .preview-container {
    max-height: 70vh;
    overflow-y: auto;

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e4e7ed;

      .header-icon {
        color: #409eff;
      }

      .header-title {
        font-size: 16px;
        font-weight: 500;
        flex: 1;
      }
    }

    .rule-info-section,
    .condition-groups-section,
    .rule-summary-section {
      margin-bottom: 24px;
      background: white;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e4e7ed;
    }
  }

  .condition-groups-content {
    .condition-group-preview {
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;

      .group-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: #f8f9fa;
        border-bottom: 1px solid #e4e7ed;

        .group-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .group-name {
            font-weight: 500;
          }
        }

        .group-actions {
          display: flex;
          gap: 8px;
        }
      }

      .group-expression {
        padding: 16px;

        .expression-text {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;

          .expression-label {
            font-weight: 500;
            color: #606266;
          }

          .expression-code {
            background: #f5f5f5;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: 'Fira Code', Consolas, monospace;
            flex: 1;
          }
        }

        .compilation-result {
          margin-top: 12px;

          .sql-preview {
            margin-top: 12px;

            .sql-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 8px;
              font-weight: 500;
            }

            .sql-content {
              background: #2d3748;
              border-radius: 6px;
              padding: 16px;
              overflow-x: auto;

              code.sql {
                color: #e2e8f0;
                font-family: 'Fira Code', Consolas, monospace;
                line-height: 1.5;
                white-space: pre;
              }
            }
          }
        }
      }

      .group-details {
        border-top: 1px solid #e4e7ed;

        .detail-tabs {
          :deep(.el-tabs__content) {
            padding: 16px;
          }
        }

        .error-template {
          .template-input,
          .template-preview {
            margin-bottom: 16px;

            .template-label {
              display: inline-block;
              width: 60px;
              font-weight: 500;
              color: #606266;
            }
          }

          .template-preview .preview-text {
            background: #f5f5f5;
            padding: 8px 12px;
            border-radius: 4px;
            margin-top: 4px;
          }

          .available-variables {
            .variables-label {
              display: block;
              font-weight: 500;
              color: #606266;
              margin-bottom: 8px;
            }

            .variables-list {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;

              .variable-tag {
                font-family: 'Fira Code', Consolas, monospace;
              }
            }
          }
        }

        .dependencies-analysis {
          h4 {
            margin: 16px 0 8px 0;
            color: #303133;
          }

          .resource-tag {
            margin: 4px 8px 4px 0;
          }
        }

        .components-detail {
          .component-item {
            border: 1px solid #e4e7ed;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 12px;

            .component-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 4px;

              .component-icon {
                color: #409eff;
              }

              .component-type {
                font-weight: 500;
              }
            }

            .component-label {
              color: #606266;
              font-size: 13px;
              margin-bottom: 4px;
            }

            .component-params {
              font-size: 13px;

              .params-label {
                color: #606266;
                font-weight: 500;
              }

              .param-item {
                color: #303133;
                font-family: 'Fira Code', Consolas, monospace;
              }
            }
          }
        }
      }
    }
  }

  .rule-summary-content {
    .complete-sql {
      .sql-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        font-weight: 500;

        .sql-actions {
          display: flex;
          gap: 8px;
        }
      }

      .sql-content {
        background: #2d3748;
        border-radius: 6px;
        padding: 20px;
        overflow-x: auto;

        code.sql {
          color: #e2e8f0;
          font-family: 'Fira Code', Consolas, monospace;
          line-height: 1.6;
          white-space: pre;
        }
      }
    }

    .execution-stats {
      .stat-item {
        text-align: center;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 16px;

        .stat-label {
          color: #606266;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
        }
      }
    }

    .rule-document {
      .document-header {
        margin-bottom: 16px;
        text-align: right;
      }

      .document-content {
        background: #fafafa;
        border: 1px solid #e4e7ed;
        border-radius: 6px;
        padding: 20px;
        min-height: 400px;

        :deep(h2) {
          color: #303133;
          border-bottom: 2px solid #409eff;
          padding-bottom: 8px;
        }

        :deep(h3) {
          color: #606266;
          margin-top: 20px;
        }

        :deep(code) {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Fira Code', Consolas, monospace;
        }

        :deep(ol) {
          padding-left: 20px;

          li {
            margin-bottom: 12px;
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

// 响应式调整
@media (max-width: 768px) {
  .expression-preview-dialog {
    .preview-container {
      .condition-group-preview .group-header {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }

      .execution-stats .stat-item {
        margin-bottom: 8px;
      }
    }
  }
}
</style>
