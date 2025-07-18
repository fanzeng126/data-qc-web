<template>
  <el-dialog
    v-model="dialogVisible"
    title="版本对比"
    width="90%"
    :before-close="handleClose"
    destroy-on-close
    class="version-compare-dialog"
  >
    <div class="compare-container">
      <!-- 版本选择器 -->
      <div class="version-selector">
        <div class="selector-item">
          <div class="selector-header">
            <Icon icon="ep:folder-opened" class="header-icon" />
            <span>当前版本</span>
          </div>
          <div class="version-info">
            <div class="version-detail">
              <span class="version-number">v{{ currentVersion.version }}</span>
              <el-tag type="success" size="small">当前</el-tag>
            </div>
            <div class="version-meta">
              <span>{{ currentVersion.author }}</span>
              <span>{{ formatDate(currentVersion.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div class="vs-divider">
          <Icon icon="ep:right" class="vs-icon" />
          <span class="vs-text">VS</span>
        </div>

        <div class="selector-item">
          <div class="selector-header">
            <Icon icon="ep:clock" class="header-icon" />
            <span>对比版本</span>
          </div>
          <div class="version-info">
            <el-select v-model="selectedCompareVersion" placeholder="选择要对比的版本">
              <el-option
                v-for="ver in availableVersions"
                :key="ver.id"
                :label="`v${ver.version} - ${ver.author}`"
                :value="ver.id"
              >
                <div class="version-option">
                  <span class="option-version">v{{ ver.version }}</span>
                  <span class="option-author">{{ ver.author }}</span>
                  <span class="option-date">{{ formatDate(ver.createdAt) }}</span>
                </div>
              </el-option>
            </el-select>
          </div>
        </div>
      </div>

      <!-- 对比内容 -->
      <div v-if="compareVersion" class="compare-content">
        <el-tabs v-model="activeCompareTab" type="border-card">
          <!-- 基本信息对比 -->
          <el-tab-pane label="基本信息" name="basic">
            <div class="basic-compare">
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="compare-section">
                    <div class="section-title">当前版本 (v{{ currentVersion.version }})</div>
                    <el-descriptions :column="1" border>
                      <el-descriptions-item label="模板名称">
                        {{ template.name }}
                      </el-descriptions-item>
                      <el-descriptions-item label="模板分类">
                        <el-tag :type="getCategoryType(template.category)" size="small">
                          {{ getCategoryName(template.category) }}
                        </el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item label="模板描述">
                        {{ template.description }}
                      </el-descriptions-item>
                      <el-descriptions-item label="标签">
                        <div class="tags-display">
                          <el-tag
                            v-for="tag in template.tags"
                            :key="tag"
                            size="small"
                            class="tag-item"
                          >
                            {{ tag }}
                          </el-tag>
                        </div>
                      </el-descriptions-item>
                      <el-descriptions-item label="修改时间">
                        {{ formatDate(currentVersion.createdAt) }}
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="compare-section">
                    <div class="section-title">对比版本 (v{{ compareVersion.version }})</div>
                    <el-descriptions :column="1" border>
                      <el-descriptions-item label="模板名称">
                        <span :class="{ 'diff-text': compareVersion.name !== template.name }">
                          {{ compareVersion.name || template.name }}
                        </span>
                      </el-descriptions-item>
                      <el-descriptions-item label="模板分类">
                        <el-tag
                          :type="getCategoryType(compareVersion.category || template.category)"
                          size="small"
                          :class="{ 'diff-item': compareVersion.category !== template.category }"
                        >
                          {{ getCategoryName(compareVersion.category || template.category) }}
                        </el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item label="模板描述">
                        <span
                          :class="{
                            'diff-text': compareVersion.description !== template.description
                          }"
                        >
                          {{ compareVersion.description || template.description }}
                        </span>
                      </el-descriptions-item>
                      <el-descriptions-item label="标签">
                        <div class="tags-display">
                          <el-tag
                            v-for="tag in compareVersion.tags || template.tags"
                            :key="tag"
                            size="small"
                            class="tag-item"
                            :class="{ 'diff-item': !template.tags?.includes(tag) }"
                          >
                            {{ tag }}
                          </el-tag>
                        </div>
                      </el-descriptions-item>
                      <el-descriptions-item label="修改时间">
                        {{ formatDate(compareVersion.createdAt) }}
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <!-- 表达式对比 -->
          <el-tab-pane label="表达式对比" name="expression">
            <div class="expression-compare">
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="compare-section">
                    <div class="section-title">当前版本表达式</div>
                    <div class="expression-content">
                      <div class="expression-text">
                        <code>{{ getCurrentExpressionText() }}</code>
                      </div>
                      <div class="expression-stats">
                        <div class="stats-title">组件统计：</div>
                        <div class="stats-tags">
                          <el-tag
                            v-for="(count, type) in currentExpressionStats"
                            :key="type"
                            size="small"
                            :type="getComponentStatsType(type)"
                          >
                            {{ getComponentTypeName(type) }}: {{ count }}
                          </el-tag>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="compare-section">
                    <div class="section-title">对比版本表达式</div>
                    <div class="expression-content">
                      <div class="expression-text">
                        <code :class="{ 'diff-code': isExpressionDifferent }">
                          {{ getCompareExpressionText() }}
                        </code>
                      </div>
                      <div class="expression-stats">
                        <div class="stats-title">组件统计：</div>
                        <div class="stats-tags">
                          <el-tag
                            v-for="(count, type) in compareExpressionStats"
                            :key="type"
                            size="small"
                            :type="getComponentStatsType(type)"
                            :class="{ 'diff-item': currentExpressionStats[type] !== count }"
                          >
                            {{ getComponentTypeName(type) }}: {{ count }}
                          </el-tag>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <!-- 变更历史 -->
          <el-tab-pane label="变更历史" name="changes">
            <div class="changes-compare">
              <div class="changes-header">
                <span
                  >从 v{{ compareVersion.version }} 到 v{{ currentVersion.version }} 的变更</span
                >
                <el-tag :type="getChangeCountType()" size="small">
                  {{ getTotalChangesCount() }} 处变更
                </el-tag>
              </div>

              <div class="changes-list">
                <div v-for="change in computedChanges" :key="change.id" class="change-item">
                  <div class="change-header">
                    <el-tag :type="getChangeType(change.type)" size="small" class="change-type">
                      {{ getChangeTypeName(change.type) }}
                    </el-tag>
                    <span class="change-title">{{ change.title }}</span>
                  </div>
                  <div class="change-description">{{ change.description }}</div>
                  <div v-if="change.details" class="change-details">
                    <div class="details-toggle">
                      <el-button
                        size="small"
                        text
                        @click="change.showDetails = !change.showDetails"
                      >
                        <Icon :icon="change.showDetails ? 'ep:arrow-up' : 'ep:arrow-down'" />
                        {{ change.showDetails ? '收起' : '展开' }}详情
                      </el-button>
                    </div>
                    <div v-if="change.showDetails" class="details-content">
                      <div class="detail-item" v-for="detail in change.details" :key="detail.field">
                        <span class="detail-field">{{ detail.field }}:</span>
                        <div class="detail-diff">
                          <div class="old-value">
                            <span class="value-label">旧值:</span>
                            <code>{{ detail.oldValue }}</code>
                          </div>
                          <Icon icon="ep:right" class="arrow-icon" />
                          <div class="new-value">
                            <span class="value-label">新值:</span>
                            <code>{{ detail.newValue }}</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 代码差异 -->
          <el-tab-pane label="代码差异" name="diff">
            <div class="code-diff">
              <div class="diff-header">
                <span>JSON结构差异对比</span>
                <div class="diff-actions">
                  <el-button size="small" @click="copyCurrentJSON">
                    <Icon icon="ep:document-copy" class="mr-5px" />
                    复制当前版本
                  </el-button>
                  <el-button size="small" @click="copyCompareJSON">
                    <Icon icon="ep:document-copy" class="mr-5px" />
                    复制对比版本
                  </el-button>
                </div>
              </div>

              <div class="diff-content">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <div class="diff-section">
                      <div class="diff-section-title">
                        当前版本 (v{{ currentVersion.version }})
                      </div>
                      <div class="code-content">
                        <pre><code>{{ formatJSON(template) }}</code></pre>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="diff-section">
                      <div class="diff-section-title">
                        对比版本 (v{{ compareVersion.version }})
                      </div>
                      <div class="code-content">
                        <pre><code>{{ formatJSON(getCompareVersionData()) }}</code></pre>
                      </div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div v-else class="empty-compare">
        <Icon icon="ep:select" class="empty-icon" />
        <p>请选择要对比的版本</p>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button v-if="compareVersion" @click="exportCompareReport">
            <Icon icon="ep:download" class="mr-5px" />
            导出对比报告
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">关闭</el-button>
          <el-button v-if="compareVersion" type="primary" @click="handleRevertToVersion">
            <Icon icon="ep:refresh-left" class="mr-5px" />
            恢复到此版本
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Props {
  modelValue: boolean
  template: any
  version: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'revert', version: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 对话框状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 数据状态
const activeCompareTab = ref('basic')
const selectedCompareVersion = ref(props.version?.id)

// 当前版本数据
const currentVersion = computed(() => ({
  id: 'current',
  version: props.template?.version || '1.0.0',
  author: props.template?.author || '当前用户',
  createdAt: props.template?.updatedAt || new Date(),
  ...props.template
}))

// 可用版本列表
const availableVersions = ref([
  {
    id: 'v1.2.0',
    version: '1.2.0',
    author: '张三',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    description: '优化表达式性能，增加新的验证规则'
  },
  {
    id: 'v1.1.0',
    version: '1.1.0',
    author: '李四',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    description: '修复已知问题，增加错误处理'
  },
  {
    id: 'v1.0.0',
    version: '1.0.0',
    author: '王五',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    description: '初始版本'
  }
])

// 对比版本数据
const compareVersion = computed(() => {
  if (!selectedCompareVersion.value) return null
  return availableVersions.value.find((v) => v.id === selectedCompareVersion.value)
})

// 表达式统计
const currentExpressionStats = computed(() => {
  if (!props.template?.expression?.components) return {}

  const stats: Record<string, number> = {}
  props.template.expression.components.forEach((comp: any) => {
    stats[comp.type] = (stats[comp.type] || 0) + 1
  })
  return stats
})

const compareExpressionStats = computed(() => {
  // 模拟对比版本的表达式组件统计
  return {
    field: (currentExpressionStats.value.field || 0) - 1,
    function: currentExpressionStats.value.function || 0,
    operator: (currentExpressionStats.value.operator || 0) + 1,
    constant: currentExpressionStats.value.constant || 0
  }
})

// 表达式差异检查
const isExpressionDifferent = computed(() => {
  const currentText = getCurrentExpressionText()
  const compareText = getCompareExpressionText()
  return currentText !== compareText
})

// 计算的变更列表
const computedChanges = computed(() => {
  if (!compareVersion.value) return []

  const changes = []

  // 模拟变更记录
  changes.push({
    id: 1,
    type: 'modify',
    title: '表达式结构调整',
    description: '优化了表达式的组件结构，提升了执行效率',
    showDetails: false,
    details: [
      {
        field: '函数调用',
        oldValue: 'COUNT(drug_name)',
        newValue: 'COUNT_NON_NULL(drug_name)'
      },
      {
        field: '操作符',
        oldValue: '>',
        newValue: '>='
      }
    ]
  })

  if (compareVersion.value.version !== currentVersion.value.version) {
    changes.push({
      id: 2,
      type: 'add',
      title: '新增验证规则',
      description: '添加了新的字段验证逻辑',
      showDetails: false,
      details: [
        {
          field: '新增组件',
          oldValue: '无',
          newValue: 'IS_VALID_YPID(ypid)'
        }
      ]
    })
  }

  return changes
})

// 监听选择的对比版本
watch(selectedCompareVersion, (newVal) => {
  if (newVal && props.modelValue) {
    loadCompareVersionData(newVal)
  }
})

// 加载对比版本数据
const loadCompareVersionData = async (versionId: string) => {
  // 模拟加载版本数据
  console.log('Loading version data for:', versionId)
}

// 工具方法
const formatDate = (date: string | Date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const getCategoryType = (category: string) => {
  const types: Record<string, string> = {
    drug_qc: 'primary',
    data_validation: 'success',
    business_rule: 'warning',
    statistics: 'info',
    custom: ''
  }
  return types[category] || ''
}

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    drug_qc: '药品质控',
    data_validation: '数据验证',
    business_rule: '业务规则',
    statistics: '统计分析',
    custom: '自定义'
  }
  return names[category] || category
}

const getComponentStatsType = (type: string) => {
  const types: Record<string, string> = {
    field: 'primary',
    function: 'warning',
    operator: 'success',
    constant: 'info',
    group: 'danger'
  }
  return types[type] || ''
}

const getComponentTypeName = (type: string) => {
  const names: Record<string, string> = {
    field: '字段',
    function: '函数',
    operator: '操作符',
    constant: '常量',
    group: '分组'
  }
  return names[type] || type
}

const getChangeType = (type: string) => {
  const types: Record<string, string> = {
    add: 'success',
    modify: 'warning',
    delete: 'danger',
    fix: 'info'
  }
  return types[type] || ''
}

const getChangeTypeName = (type: string) => {
  const names: Record<string, string> = {
    add: '新增',
    modify: '修改',
    delete: '删除',
    fix: '修复'
  }
  return names[type] || type
}

const getChangeCountType = () => {
  const count = getTotalChangesCount()
  if (count === 0) return 'info'
  if (count <= 3) return 'success'
  if (count <= 6) return 'warning'
  return 'danger'
}

const getTotalChangesCount = () => {
  return computedChanges.value.length
}

const getCurrentExpressionText = () => {
  return props.template?.expression?.text || '无表达式内容'
}

const getCompareExpressionText = () => {
  // 模拟对比版本的表达式文本
  const currentText = getCurrentExpressionText()
  if (compareVersion.value?.version === '1.1.0') {
    return currentText.replace('COUNT', 'COUNT_NON_NULL')
  }
  return currentText + ' AND IS_VALID(data)'
}

const getCompareVersionData = () => {
  // 模拟对比版本的完整数据
  const baseData = { ...props.template }

  if (compareVersion.value?.version === '1.1.0') {
    baseData.expression = {
      ...baseData.expression,
      text: getCompareExpressionText()
    }
  }

  return baseData
}

const formatJSON = (data: any) => {
  return JSON.stringify(data, null, 2)
}

// 操作方法
const copyCurrentJSON = async () => {
  try {
    await navigator.clipboard.writeText(formatJSON(props.template))
    ElMessage.success('当前版本JSON已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const copyCompareJSON = async () => {
  try {
    await navigator.clipboard.writeText(formatJSON(getCompareVersionData()))
    ElMessage.success('对比版本JSON已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const exportCompareReport = () => {
  const report = {
    compareInfo: {
      currentVersion: currentVersion.value,
      compareVersion: compareVersion.value,
      compareDate: new Date().toISOString()
    },
    basicDiff: {
      name: props.template.name !== compareVersion.value?.name,
      category: props.template.category !== compareVersion.value?.category,
      description: props.template.description !== compareVersion.value?.description
    },
    expressionDiff: {
      isDifferent: isExpressionDifferent.value,
      currentStats: currentExpressionStats.value,
      compareStats: compareExpressionStats.value
    },
    changes: computedChanges.value
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `template_compare_v${compareVersion.value?.version}_vs_v${currentVersion.value.version}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('对比报告已导出')
}

const handleRevertToVersion = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复到版本 v${compareVersion.value?.version} 吗？这将覆盖当前版本的所有内容。`,
      '确认恢复版本',
      {
        confirmButtonText: '确定恢复',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    emit('revert', compareVersion.value)
    ElMessage.success(`已恢复到版本 v${compareVersion.value?.version}`)
    handleClose()
  } catch {
    // 用户取消
  }
}

// 事件处理
const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style lang="scss" scoped>
.version-compare-dialog {
  .compare-container {
    max-height: 75vh;
    overflow-y: auto;

    .version-selector {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;

      .selector-item {
        flex: 1;

        .selector-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-weight: 500;

          .header-icon {
            color: #409eff;
          }
        }

        .version-info {
          .version-detail {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;

            .version-number {
              font-size: 16px;
              font-weight: 600;
              color: #409eff;
            }
          }

          .version-meta {
            display: flex;
            gap: 12px;
            font-size: 12px;
            color: #909399;
          }
        }
      }

      .vs-divider {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        color: #606266;

        .vs-icon {
          font-size: 20px;
        }

        .vs-text {
          font-weight: 600;
          font-size: 14px;
        }
      }
    }

    .compare-content {
      .basic-compare {
        .compare-section {
          .section-title {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 16px;
            color: #303133;
            border-bottom: 2px solid #409eff;
            padding-bottom: 8px;
          }

          .tags-display {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;

            .tag-item {
              margin: 0;
            }
          }
        }

        .diff-text {
          background: #fff2e6;
          color: #e6a23c;
          padding: 2px 4px;
          border-radius: 4px;
        }

        .diff-item {
          background: #fff2e6;
          border: 1px solid #e6a23c;
        }
      }

      .expression-compare {
        .compare-section {
          .section-title {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 16px;
            color: #303133;
            border-bottom: 2px solid #67c23a;
            padding-bottom: 8px;
          }

          .expression-content {
            .expression-text {
              background: #f5f5f5;
              padding: 12px;
              border-radius: 6px;
              margin-bottom: 16px;

              code {
                font-family: 'Fira Code', Consolas, monospace;
                line-height: 1.5;

                &.diff-code {
                  background: #fff2e6;
                  color: #e6a23c;
                }
              }
            }

            .expression-stats {
              .stats-title {
                font-weight: 500;
                margin-bottom: 8px;
                color: #606266;
              }

              .stats-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;

                .diff-item {
                  background: #fff2e6;
                  border: 1px solid #e6a23c;
                }
              }
            }
          }
        }
      }

      .changes-compare {
        .changes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e4e7ed;
          font-weight: 500;
        }

        .changes-list {
          .change-item {
            border: 1px solid #e4e7ed;
            border-radius: 6px;
            margin-bottom: 12px;
            overflow: hidden;

            .change-header {
              padding: 12px 16px;
              background: #f8f9fa;
              border-bottom: 1px solid #e4e7ed;
              display: flex;
              align-items: center;
              gap: 8px;

              .change-type {
                flex-shrink: 0;
              }

              .change-title {
                font-weight: 500;
              }
            }

            .change-description {
              padding: 12px 16px;
              color: #606266;
            }

            .change-details {
              border-top: 1px solid #e4e7ed;

              .details-toggle {
                padding: 8px 16px;
                background: #fafafa;
              }

              .details-content {
                padding: 12px 16px;

                .detail-item {
                  margin-bottom: 12px;

                  .detail-field {
                    font-weight: 500;
                    color: #606266;
                    margin-bottom: 4px;
                    display: block;
                  }

                  .detail-diff {
                    display: flex;
                    align-items: center;
                    gap: 12px;

                    .old-value,
                    .new-value {
                      flex: 1;

                      .value-label {
                        font-size: 12px;
                        color: #909399;
                        display: block;
                        margin-bottom: 2px;
                      }

                      code {
                        background: #f5f5f5;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-family: 'Fira Code', Consolas, monospace;
                        display: block;
                      }
                    }

                    .old-value code {
                      background: #fef0f0;
                      color: #f56c6c;
                    }

                    .new-value code {
                      background: #f0f9ff;
                      color: #409eff;
                    }

                    .arrow-icon {
                      color: #909399;
                    }
                  }
                }
              }
            }
          }
        }
      }

      .code-diff {
        .diff-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-weight: 500;

          .diff-actions {
            display: flex;
            gap: 8px;
          }
        }

        .diff-content {
          .diff-section {
            .diff-section-title {
              font-size: 14px;
              font-weight: 500;
              margin-bottom: 8px;
              color: #606266;
            }

            .code-content {
              background: #2d3748;
              color: #e2e8f0;
              padding: 16px;
              border-radius: 6px;
              max-height: 400px;
              overflow-y: auto;

              pre code {
                font-family: 'Fira Code', Consolas, monospace;
                line-height: 1.4;
                font-size: 12px;
              }
            }
          }
        }
      }
    }

    .empty-compare {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      color: #909399;

      .empty-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .footer-left {
      flex: 1;
    }

    .footer-right {
      display: flex;
      gap: 12px;
    }
  }
}

// 版本选择器中的选项样式
.version-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  .option-version {
    font-weight: 500;
    color: #409eff;
  }

  .option-author {
    flex: 1;
    color: #606266;
  }

  .option-date {
    font-size: 12px;
    color: #909399;
  }
}

// 响应式调整
@media (max-width: 768px) {
  .version-compare-dialog {
    .compare-container {
      .version-selector {
        flex-direction: column;
        gap: 12px;

        .vs-divider {
          transform: rotate(90deg);
        }
      }

      .compare-content {
        .basic-compare,
        .expression-compare,
        .code-diff .diff-content {
          .el-row .el-col {
            margin-bottom: 20px;
          }
        }
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
