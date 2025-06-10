<template>
  <el-dialog
    v-model="dialogVisible"
    title="原始数据查看"
    width="1000px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="original-data-container">
      <!-- 记录基本信息 -->
      <el-card class="info-card" shadow="never" v-if="originalRecord">
        <template #header>
          <div class="card-header">
            <el-icon><DataBoard /></el-icon>
            <span>记录信息</span>
            <div class="header-actions">
              <el-tag :type="getRecordStatusType(originalRecord.status)" size="small">
                {{ getRecordStatusText(originalRecord.status) }}
              </el-tag>
            </div>
          </div>
        </template>

        <el-descriptions :column="3" border>
          <el-descriptions-item label="记录ID">
            <span class="record-id">{{ originalRecord.id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="所属表">
            {{ getDictLabel(DICT_TYPE.DRUG_QC_TABLE_TYPE, tableType) }}
          </el-descriptions-item>
          <el-descriptions-item label="数据来源">
            {{ originalRecord.dataSource || '批量导入' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(originalRecord.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDateTime(originalRecord.updateTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="版本号">
            {{ originalRecord.version || 1 }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 数据内容展示 -->
      <el-card class="data-card" shadow="never" v-if="originalRecord">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>数据内容</span>
            <div class="header-actions">
              <el-button size="small" @click="refreshData" :loading="loading">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
              <el-button size="small" @click="copyData">
                <el-icon><CopyDocument /></el-icon>
                复制数据
              </el-button>
            </div>
          </div>
        </template>

        <!-- 表格视图 -->
        <div class="data-view-tabs">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <!-- 表格视图 -->
            <el-tab-pane label="表格视图" name="table">
              <div class="table-view">
                <el-table :data="[originalRecord]" border stripe>
                  <el-table-column
                    v-for="field in displayFields"
                    :key="field.key"
                    :prop="field.key"
                    :label="field.label"
                    :width="field.width"
                    show-overflow-tooltip
                  >
                    <template #default="{ row }">
                      <div
                        class="field-cell"
                        :class="{ 'is-highlighted': field.key === highlightField }"
                      >
                        <span
                          class="field-value"
                          :class="getFieldValueClass(field.key, row[field.key])"
                        >
                          {{ formatFieldValue(field.key, row[field.key]) }}
                        </span>
                        <div class="field-info" v-if="field.key === highlightField">
                          <el-icon><Warning /></el-icon>
                          <span class="info-text">此字段存在质控异常</span>
                        </div>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <!-- JSON视图 -->
            <el-tab-pane label="JSON视图" name="json">
              <div class="json-view">
                <JsonViewer :data="originalRecord" />
              </div>
            </el-tab-pane>

            <!-- 字段详情视图 -->
            <el-tab-pane label="字段详情" name="fields">
              <div class="fields-view">
                <div class="fields-grid">
                  <div
                    v-for="field in displayFields"
                    :key="field.key"
                    class="field-item"
                    :class="{ 'is-highlighted': field.key === highlightField }"
                  >
                    <div class="field-header">
                      <span class="field-label">{{ field.label }}</span>
                      <span class="field-type">({{ field.type }})</span>
                      <el-icon v-if="field.key === highlightField" class="warning-icon">
                        <Warning />
                      </el-icon>
                    </div>
                    <div class="field-content">
                      <div
                        class="field-value"
                        :class="getFieldValueClass(field.key, originalRecord[field.key])"
                      >
                        {{ formatFieldValue(field.key, originalRecord[field.key]) }}
                      </div>
                      <div class="field-description" v-if="field.description">
                        {{ field.description }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-card>

      <!-- 相关信息 -->
      <el-card class="related-card" shadow="never" v-if="relatedInfo">
        <template #header>
          <div class="card-header">
            <el-icon><Connection /></el-icon>
            <span>相关信息</span>
          </div>
        </template>

        <div class="related-content">
          <!-- 质控历史 -->
          <div class="related-section">
            <h4 class="section-title">质控历史</h4>
            <div class="qc-history">
              <el-timeline>
                <el-timeline-item
                  v-for="(item, index) in relatedInfo.qcHistory"
                  :key="index"
                  :timestamp="formatDateTime(item.checkTime)"
                  :type="item.result === 'passed' ? 'success' : 'danger'"
                >
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="rule-name">{{ item.ruleName }}</span>
                      <el-tag :type="item.result === 'passed' ? 'success' : 'danger'" size="small">
                        {{ item.result === 'passed' ? '通过' : '失败' }}
                      </el-tag>
                    </div>
                    <div class="timeline-detail" v-if="item.detail">
                      {{ item.detail }}
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </div>

          <!-- 修改历史 -->
          <div class="related-section" v-if="relatedInfo.changeHistory?.length">
            <h4 class="section-title">修改历史</h4>
            <div class="change-history">
              <el-table :data="relatedInfo.changeHistory" size="small" border max-height="200">
                <el-table-column prop="fieldName" label="修改字段" width="120" />
                <el-table-column prop="oldValue" label="原值" width="150" show-overflow-tooltip />
                <el-table-column prop="newValue" label="新值" width="150" show-overflow-tooltip />
                <el-table-column prop="operator" label="操作人" width="100" />
                <el-table-column prop="changeTime" label="修改时间" min-width="150" />
              </el-table>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button @click="editRecord" type="warning" v-if="canEdit">
          <el-icon><Edit /></el-icon>
          编辑记录
        </el-button>
        <el-button @click="exportRecord" type="primary">
          <el-icon><Download /></el-icon>
          导出记录
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {
  DataBoard,
  Document,
  Refresh,
  CopyDocument,
  Warning,
  Connection,
  Edit,
  Download
} from '@element-plus/icons-vue'
import { getDictLabel, DICT_TYPE } from '@/utils/dict'
import JsonViewer from '../../rule/components/JsonViewer.vue'

/**
 * 这个组件的设计理念是"透明化数据检查"。
 *
 * 想象一下，当质控系统发现某个数据有问题时，就像医生发现病人有异常指标一样，
 * 我们需要查看原始的检查报告来确认问题所在。这个组件就是那份"原始检查报告"，
 * 它让用户能够：
 *
 * 1. 完整查看原始数据 - 就像看到完整的化验单
 * 2. 理解数据结构 - 知道每个字段的含义和类型
 * 3. 追踪历史变化 - 了解数据是如何演变的
 * 4. 发现问题根源 - 通过对比找到异常的真正原因
 *
 * 这种透明化的设计让数据质控从"黑盒"变成"白盒"，
 * 用户不再只是被动接受"数据有问题"的结论，
 * 而是能够主动理解、验证和解决问题。
 */

interface Props {
  recordId?: number // 要查看的记录ID
  tableType?: number // 记录所属的表类型
  highlightField?: string // 需要高亮显示的字段（通常是出现质控异常的字段）
}

const props = defineProps<Props>()
const emit = defineEmits<{
  editRecord: [recordId: number, tableType: number]
}>()

// ========================= 响应式数据 =========================

const dialogVisible = defineModel<boolean>({ default: false })
const loading = ref(false)
const activeTab = ref('table')

/** 原始记录数据 - 这是用户要查看的核心数据 */
const originalRecord = ref<any>(null)

/** 相关信息 - 包括质控历史、修改历史等上下文数据 */
const relatedInfo = ref<any>(null)

// ========================= 计算属性 =========================

/**
 * 显示字段配置
 * 这个计算属性根据不同的表类型返回相应的字段定义，
 * 它不仅定义了要显示哪些字段，还包含了每个字段的展示方式和说明
 */
const displayFields = computed(() => {
  if (!props.tableType) return []

  // 根据表类型返回不同的字段配置
  // 这种设计让组件能够适应不同类型的数据表
  return getFieldsForTableType(props.tableType)
})

/**
 * 是否可以编辑记录
 * 这个计算属性决定是否显示编辑按钮，
 * 在实际项目中，这里会根据用户权限和记录状态来判断
 */
const canEdit = computed(() => {
  return (
    originalRecord.value &&
    originalRecord.value.status !== 'locked' &&
    originalRecord.value.status !== 'deleted'
  )
})

// ========================= 监听器 =========================

/**
 * 监听弹窗开关
 * 当弹窗打开时，自动加载对应的原始数据
 * 这样确保用户每次打开都能看到最新的数据状态
 */
watch(dialogVisible, (visible) => {
  if (visible && props.recordId && props.tableType) {
    loadOriginalData()
  }
})

// ========================= 核心数据加载方法 =========================

/**
 * 加载原始数据
 * 这是组件的核心方法，负责获取并展示原始记录的完整信息
 */
const loadOriginalData = async () => {
  if (!props.recordId || !props.tableType) return

  loading.value = true
  try {
    // 并行加载记录数据和相关信息，提高加载效率
    await Promise.all([loadRecordData(), loadRelatedInfo()])
  } catch (error) {
    ElMessage.error('加载原始数据失败')
    console.error('加载原始数据失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 加载记录数据
 * 这个方法从数据库中获取指定记录的完整信息
 */
const loadRecordData = async () => {
  // 模拟API调用 - 在实际项目中这里会调用真实的后端接口
  await new Promise((resolve) => setTimeout(resolve, 600))

  // 根据表类型生成相应的模拟数据
  originalRecord.value = generateMockRecordData(props.tableType!, props.recordId!)
}

/**
 * 加载相关信息
 * 这个方法获取与记录相关的质控历史、修改历史等上下文数据
 */
const loadRelatedInfo = async () => {
  await new Promise((resolve) => setTimeout(resolve, 400))

  relatedInfo.value = {
    qcHistory: [
      {
        ruleName: '必填字段验证',
        result: 'failed',
        checkTime: '2024-06-10 14:30:25',
        detail: '药品名称字段为空'
      },
      {
        ruleName: '数据格式检查',
        result: 'passed',
        checkTime: '2024-06-10 14:25:15',
        detail: '字段格式符合要求'
      }
    ],
    changeHistory: [
      {
        fieldName: 'productName',
        oldValue: '阿司匹林',
        newValue: '阿司匹林片',
        operator: '张三',
        changeTime: '2024-06-09 16:20:30'
      }
    ]
  }
}

/**
 * 根据表类型生成模拟记录数据
 * 这个方法为不同类型的表生成相应的示例数据，用于演示组件功能
 */
function generateMockRecordData(tableType: number, recordId: number): any {
  const baseData = {
    id: recordId,
    createTime: '2024-06-10 10:30:25',
    updateTime: '2024-06-10 14:30:25',
    version: 1,
    status: 'active',
    dataSource: '批量导入-药品目录-20240610.xlsx'
  }

  // 根据不同的表类型返回不同的数据结构
  // 这种设计模式让组件能够适应多种数据表的展示需求
  switch (tableType) {
    case 2: // 药品目录表
      return {
        ...baseData,
        ypid: '123456789012',
        drugName: props.highlightField === 'drugName' ? '' : '阿司匹林片', // 如果高亮字段是drugName，则显示为空（模拟异常）
        productName: '拜阿司匹林',
        specification: '100mg*30片',
        dosageForm: '片剂',
        manufacturer: '拜耳医药有限公司',
        approvalNumber: '国药准字H20000123',
        price: 15.6,
        unit: '盒'
      }

    case 5: // 使用情况表
      return {
        ...baseData,
        ypid: '123456789012',
        hospitalCode: 'H001',
        usageDate: '2024-06-10',
        quantity: 100,
        amount: 1560.0,
        packageQty: 10,
        dosageQty: 1000,
        conversionFactor: 100
      }

    default:
      return baseData
  }
}

/**
 * 根据表类型获取字段配置
 * 这个方法定义了每种表类型应该显示哪些字段，以及每个字段的展示属性
 */
function getFieldsForTableType(tableType: number) {
  // 为不同的表类型提供专门的字段配置
  // 这种配置化的方式让组件具有很好的可扩展性
  const fieldConfigs: Record<number, any[]> = {
    2: [
      // 药品目录表字段配置
      { key: 'id', label: '记录ID', type: 'bigint', width: 100 },
      {
        key: 'ypid',
        label: 'YPID编码',
        type: 'string',
        width: 150,
        description: '国家药管平台药品编码'
      },
      {
        key: 'drugName',
        label: '药品名称',
        type: 'string',
        width: 150,
        description: '药品通用名称'
      },
      {
        key: 'productName',
        label: '产品名称',
        type: 'string',
        width: 150,
        description: '药品商品名称'
      },
      { key: 'specification', label: '规格', type: 'string', width: 120 },
      { key: 'dosageForm', label: '剂型', type: 'string', width: 100 },
      { key: 'manufacturer', label: '生产厂家', type: 'string', width: 200 },
      { key: 'approvalNumber', label: '批准文号', type: 'string', width: 150 },
      { key: 'price', label: '价格', type: 'decimal', width: 100 },
      { key: 'unit', label: '单位', type: 'string', width: 80 }
    ],
    5: [
      // 使用情况表字段配置
      { key: 'id', label: '记录ID', type: 'bigint', width: 100 },
      { key: 'ypid', label: 'YPID编码', type: 'string', width: 150 },
      { key: 'hospitalCode', label: '医院编码', type: 'string', width: 120 },
      { key: 'usageDate', label: '使用日期', type: 'date', width: 120 },
      { key: 'quantity', label: '使用数量', type: 'integer', width: 100 },
      { key: 'amount', label: '使用金额', type: 'decimal', width: 120 },
      { key: 'packageQty', label: '包装数量', type: 'integer', width: 100 },
      { key: 'dosageQty', label: '制剂数量', type: 'integer', width: 100 },
      { key: 'conversionFactor', label: '转换系数', type: 'decimal', width: 100 }
    ]
  }

  return fieldConfigs[tableType] || []
}

// ========================= 业务操作方法 =========================

/**
 * 刷新数据
 * 重新加载原始数据，确保显示的是最新状态
 */
const refreshData = () => {
  loadOriginalData()
}

/**
 * 复制数据
 * 将记录数据复制到剪贴板，方便用户在其他地方使用
 */
const copyData = async () => {
  try {
    const dataText = JSON.stringify(originalRecord.value, null, 2)
    await navigator.clipboard.writeText(dataText)
    ElMessage.success('记录数据已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制数据失败')
  }
}

/**
 * 编辑记录
 * 跳转到记录编辑界面，让用户可以修改数据
 */
const editRecord = () => {
  if (originalRecord.value) {
    emit('editRecord', originalRecord.value.id, props.tableType!)
    dialogVisible.value = false
  }
}

/**
 * 导出记录
 * 将记录数据导出为文件，便于离线分析和存档
 */
const exportRecord = async () => {
  try {
    ElMessage.success('记录导出已开始')
    // 在实际项目中，这里应该调用导出API
  } catch (error) {
    ElMessage.error('导出记录失败')
  }
}

/**
 * 标签页切换处理
 * 当用户切换不同的数据视图时执行相应的逻辑
 */
const handleTabChange = (tabName: string) => {
  // 这里可以添加切换标签页时的特殊逻辑
  // 比如延迟加载某些视图的数据
}

// ========================= 格式化和样式方法 =========================

/**
 * 格式化日期时间显示
 * 将ISO格式的日期转换为用户友好的显示格式
 */
const formatDateTime = (dateTime: string): string => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString()
}

/**
 * 格式化字段值显示
 * 根据字段类型和值的特点进行适当的格式化处理
 */
const formatFieldValue = (fieldKey: string, value: any): string => {
  if (value === null || value === undefined) {
    return '(空值)'
  }
  if (value === '') {
    return '(空字符串)'
  }

  // 根据字段类型进行特殊格式化
  const field = displayFields.value.find((f) => f.key === fieldKey)
  if (field) {
    switch (field.type) {
      case 'decimal':
        return typeof value === 'number' ? value.toFixed(2) : String(value)
      case 'date':
        return value ? new Date(value).toLocaleDateString() : String(value)
      case 'datetime':
        return value ? new Date(value).toLocaleString() : String(value)
      default:
        return String(value)
    }
  }

  return String(value)
}

/**
 * 获取字段值的样式类
 * 为不同状态的字段值返回相应的CSS类，实现视觉上的区分
 */
const getFieldValueClass = (fieldKey: string, value: any): string => {
  const classes = []

  // 如果是高亮字段，添加特殊样式
  if (fieldKey === props.highlightField) {
    classes.push('is-highlight')
  }

  // 根据值的状态添加相应样式
  if (value === null || value === undefined || value === '') {
    classes.push('is-empty')
  }

  return classes.join(' ')
}

/**
 * 获取记录状态类型
 * 为不同的记录状态返回相应的标签样式
 */
const getRecordStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    locked: 'warning',
    deleted: 'danger'
  }
  return typeMap[status] || 'info'
}

/**
 * 获取记录状态文本
 * 将英文状态码转换为中文显示文本
 */
const getRecordStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    active: '正常',
    inactive: '停用',
    locked: '锁定',
    deleted: '已删除'
  }
  return textMap[status] || '未知'
}
</script>

<style lang="scss" scoped>
.original-data-container {
  max-height: 70vh;
  overflow-y: auto;
}

.info-card,
.data-card,
.related-card {
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

.record-id {
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  background-color: #f0f9ff;
  padding: 2px 6px;
  border-radius: 3px;
  color: #1890ff;
}

/* 数据视图样式 */
.data-view-tabs {
  .table-view {
    .field-cell {
      position: relative;

      &.is-highlighted {
        background-color: #fff7e6;
        border: 1px solid #ffa940;
        border-radius: 4px;
        padding: 4px;
      }

      .field-value {
        &.is-highlight {
          color: #fa8c16;
          font-weight: 600;
        }

        &.is-empty {
          color: #f5222d;
          font-style: italic;
        }
      }

      .field-info {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 4px;
        font-size: 12px;
        color: #fa8c16;

        .info-text {
          font-weight: 500;
        }
      }
    }
  }

  .json-view {
    background-color: #fafbfc;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    padding: 16px;
  }

  .fields-view {
    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;

      .field-item {
        background-color: #fafbfc;
        border: 1px solid #e4e7ed;
        border-radius: 6px;
        padding: 12px;
        transition: all 0.3s ease;

        &.is-highlighted {
          background-color: #fff7e6;
          border-color: #ffa940;
          box-shadow: 0 2px 8px rgba(255, 169, 64, 0.2);
        }

        .field-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .field-label {
            font-weight: 600;
            color: #303133;
          }

          .field-type {
            font-size: 12px;
            color: #909399;
          }

          .warning-icon {
            color: #fa8c16;
            margin-left: auto;
          }
        }

        .field-content {
          .field-value {
            font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
            padding: 6px 8px;
            background-color: #f5f7fa;
            border-radius: 4px;
            border: 1px solid #dcdfe6;
            display: block;
            margin-bottom: 8px;

            &.is-highlight {
              background-color: #fff2e8;
              border-color: #ffb58a;
              color: #d4380d;
            }

            &.is-empty {
              background-color: #fff1f0;
              border-color: #ffaaa5;
              color: #cf1322;
            }
          }

          .field-description {
            font-size: 12px;
            color: #606266;
            line-height: 1.4;
          }
        }
      }
    }
  }
}

/* 相关信息样式 */
.related-content {
  .related-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      margin-bottom: 12px;
      color: #303133;
      font-size: 16px;
      border-bottom: 2px solid #e4e7ed;
      padding-bottom: 8px;
    }
  }

  .qc-history {
    .timeline-content {
      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;

        .rule-name {
          font-weight: 500;
          color: #303133;
        }
      }

      .timeline-detail {
        color: #606266;
        font-size: 14px;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .original-data-container {
    max-height: 60vh;
  }

  .fields-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;

    .header-actions {
      margin-left: 0;
      width: 100%;
      justify-content: flex-end;
    }
  }
}

/* 表格和描述列表样式优化 */
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

/* 标签页样式 */
:deep(.el-tabs__header) {
  margin-bottom: 16px;
}

:deep(.el-tabs__nav-wrap) {
  background-color: #f5f7fa;
  border-radius: 6px;
  padding: 4px;
}
</style>
