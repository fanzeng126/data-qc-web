<template>
  <el-dialog
    v-model="dialogVisible"
    title="手动触发质控"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="manual-trigger-container">
      <!-- 触发配置 -->
      <el-card class="config-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Setting /></el-icon>
            <span>质控配置</span>
          </div>
        </template>

        <el-form :model="triggerForm" :rules="formRules" ref="formRef" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="质控类型" prop="qcType">
                <el-radio-group v-model="triggerForm.qcType" @change="handleQcTypeChange">
                  <el-radio :label="1">前置质控</el-radio>
                  <el-radio :label="2">后置质控</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="适用表" prop="tableType">
                <el-select
                  v-model="triggerForm.tableType"
                  placeholder="请选择适用表"
                  clearable
                  @change="handleTableTypeChange"
                >
                  <el-option label="全部表" :value="null" />
                  <el-option
                    v-for="dict in tableTypeOptions"
                    :key="dict.value"
                    :label="dict.label"
                    :value="parseInt(dict.value)"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="选择规则" prop="selectedRules">
            <div class="rules-selection">
              <div class="selection-header">
                <el-checkbox
                  v-model="selectAll"
                  @change="handleSelectAll"
                  :indeterminate="isIndeterminate"
                >
                  全选 ({{ selectedRulesCount }}/{{ availableRules.length }})
                </el-checkbox>
                <el-input
                  v-model="ruleSearchText"
                  placeholder="搜索规则"
                  style="width: 200px"
                  clearable
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>

              <div class="rules-list">
                <el-checkbox-group v-model="triggerForm.selectedRules">
                  <div v-for="rule in filteredRules" :key="rule.id" class="rule-item">
                    <el-checkbox :label="rule.id" class="rule-checkbox">
                      <div class="rule-content">
                        <div class="rule-header">
                          <span class="rule-name">{{ rule.ruleName }}</span>
                          <el-tag :type="rule.errorLevel === 1 ? 'danger' : 'warning'" size="small">
                            {{ rule.errorLevel === 1 ? '错误' : '警告' }}
                          </el-tag>
                        </div>
                        <div class="rule-info">
                          <span class="rule-code">{{ rule.ruleCode }}</span>
                          <span class="rule-category">{{ rule.ruleCategory }}</span>
                        </div>
                      </div>
                    </el-checkbox>
                  </div>
                </el-checkbox-group>
              </div>
            </div>
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="执行优先级" prop="priority">
                <el-radio-group v-model="triggerForm.priority">
                  <el-radio label="high">高优先级</el-radio>
                  <el-radio label="normal">普通</el-radio>
                  <el-radio label="low">低优先级</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="通知方式" prop="notificationMethods">
                <el-checkbox-group v-model="triggerForm.notificationMethods">
                  <el-checkbox label="email">邮件通知</el-checkbox>
                  <el-checkbox label="sms">短信通知</el-checkbox>
                  <el-checkbox label="system">系统消息</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="执行说明" prop="description">
            <el-input
              v-model="triggerForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入本次质控的说明信息（可选）"
            />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 预计执行信息 -->
      <el-card class="estimate-card" shadow="never" v-if="executionEstimate">
        <template #header>
          <div class="card-header">
            <el-icon><DataAnalysis /></el-icon>
            <span>预计执行信息</span>
          </div>
        </template>

        <el-descriptions :column="3" border>
          <el-descriptions-item label="预计检查记录">
            {{ executionEstimate.estimatedRecords }}条
          </el-descriptions-item>
          <el-descriptions-item label="预计执行时间">
            {{ executionEstimate.estimatedDuration }}分钟
          </el-descriptions-item>
          <el-descriptions-item label="规则数量">
            {{ triggerForm.selectedRules.length }}个
          </el-descriptions-item>
        </el-descriptions>

        <div class="execution-tips" v-if="executionEstimate.tips.length">
          <h4>执行提示：</h4>
          <ul class="tips-list">
            <li v-for="tip in executionEstimate.tips" :key="tip">{{ tip }}</li>
          </ul>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button @click="previewExecution" :loading="previewing">
          <el-icon><View /></el-icon>
          预览执行
        </el-button>
        <el-button
          type="primary"
          @click="triggerExecution"
          :loading="triggering"
          :disabled="!canTrigger"
        >
          <el-icon><VideoPlay /></el-icon>
          开始执行
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, Search, DataAnalysis, View, VideoPlay } from '@element-plus/icons-vue'
import { getDictOptions, DICT_TYPE } from '@/utils/dict'

const emit = defineEmits<{
  success: [executionId: number]
}>()

// ========================= 响应式数据 =========================

const dialogVisible = defineModel<boolean>({ default: false })
const loading = ref(false)
const triggering = ref(false)
const previewing = ref(false)
const formRef = ref()

/** 触发表单数据 */
const triggerForm = reactive({
  qcType: 1, // 1-前置质控 2-后置质控
  tableType: null, // 适用表类型
  selectedRules: [] as number[], // 选中的规则ID
  priority: 'normal', // 执行优先级
  notificationMethods: ['system'], // 通知方式
  description: '' // 执行说明
})

/** 表单验证规则 */
const formRules = {
  qcType: [{ required: true, message: '请选择质控类型', trigger: 'change' }],
  selectedRules: [
    {
      required: true,
      message: '请至少选择一个质控规则',
      trigger: 'change',
      validator: (rule: any, value: any[], callback: Function) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少选择一个质控规则'))
        } else {
          callback()
        }
      }
    }
  ]
}

/** 可用规则列表 */
const availableRules = ref<any[]>([])

/** 规则搜索文本 */
const ruleSearchText = ref('')

/** 全选状态 */
const selectAll = ref(false)

/** 执行预估信息 */
const executionEstimate = ref<any>(null)

// ========================= 字典数据 =========================

const tableTypeOptions = getDictOptions(DICT_TYPE.DRUG_QC_TABLE_TYPE)

// ========================= 计算属性 =========================

/** 筛选后的规则列表 */
const filteredRules = computed(() => {
  if (!ruleSearchText.value) return availableRules.value

  const searchText = ruleSearchText.value.toLowerCase()
  return availableRules.value.filter(
    (rule) =>
      rule.ruleName.toLowerCase().includes(searchText) ||
      rule.ruleCode.toLowerCase().includes(searchText)
  )
})

/** 已选规则数量 */
const selectedRulesCount = computed(() => triggerForm.selectedRules.length)

/** 是否为不确定状态（部分选中） */
const isIndeterminate = computed(() => {
  const count = selectedRulesCount.value
  return count > 0 && count < availableRules.value.length
})

/** 是否可以触发执行 */
const canTrigger = computed(() => {
  return triggerForm.selectedRules.length > 0
})

// ========================= 监听器 =========================

watch(dialogVisible, (visible) => {
  if (visible) {
    loadAvailableRules()
    resetForm()
  }
})

watch(
  () => triggerForm.selectedRules,
  (newRules) => {
    updateExecutionEstimate()
    updateSelectAllState()
  },
  { deep: true }
)

// ========================= 核心方法 =========================

/** 加载可用规则 */
const loadAvailableRules = async () => {
  loading.value = true
  try {
    // 模拟API调用 - 在实际项目中这里应该调用真实的API
    await new Promise((resolve) => setTimeout(resolve, 500))

    availableRules.value = generateMockRules()
  } catch (error) {
    ElMessage.error('加载规则列表失败')
  } finally {
    loading.value = false
  }
}

/** 生成模拟规则数据 */
function generateMockRules() {
  const ruleCategories = ['字段验证', '数值检查', '逻辑验证', '业务规则']
  const rules = []

  for (let i = 1; i <= 15; i++) {
    rules.push({
      id: i,
      ruleCode: `${triggerForm.qcType === 1 ? 'PRE' : 'POST'}_QC_${String(i).padStart(3, '0')}`,
      ruleName: `质控规则${i}`,
      ruleCategory: ruleCategories[Math.floor(Math.random() * ruleCategories.length)],
      errorLevel: Math.random() > 0.7 ? 1 : 2, // 30%概率为错误级别
      enabled: true,
      ruleType: triggerForm.qcType
    })
  }

  return rules
}

/** 质控类型变化处理 */
const handleQcTypeChange = () => {
  // 重新加载对应类型的规则
  triggerForm.selectedRules = []
  loadAvailableRules()
}

/** 表类型变化处理 */
const handleTableTypeChange = () => {
  // 根据表类型筛选规则
  triggerForm.selectedRules = []
  updateExecutionEstimate()
}

/** 全选处理 */
const handleSelectAll = (value: boolean) => {
  if (value) {
    triggerForm.selectedRules = availableRules.value.map((rule) => rule.id)
  } else {
    triggerForm.selectedRules = []
  }
}

/** 更新全选状态 */
const updateSelectAllState = () => {
  const count = selectedRulesCount.value
  const total = availableRules.value.length
  selectAll.value = count > 0 && count === total
}

/** 更新执行预估 */
const updateExecutionEstimate = () => {
  if (triggerForm.selectedRules.length === 0) {
    executionEstimate.value = null
    return
  }

  // 基于选中规则数量和类型计算预估信息
  const baseRecords = 1000 // 基础记录数
  const ruleCount = triggerForm.selectedRules.length
  const estimatedRecords = Math.floor(baseRecords * (1 + ruleCount * 0.1))
  const estimatedDuration = Math.ceil(ruleCount * 0.5 + 2) // 每个规则约0.5分钟

  const tips = []

  if (ruleCount > 10) {
    tips.push('规则数量较多，建议分批执行以提高效率')
  }

  if (triggerForm.qcType === 2) {
    tips.push('后置质控需要更多时间进行数据分析，请耐心等待')
  }

  if (triggerForm.priority === 'low') {
    tips.push('低优先级任务可能需要排队等待，执行时间会相应延长')
  }

  executionEstimate.value = {
    estimatedRecords,
    estimatedDuration,
    tips
  }
}

// ========================= 业务操作方法 =========================

/** 预览执行 */
const previewExecution = async () => {
  if (!(await validateForm())) return

  previewing.value = true
  try {
    // 模拟生成预览信息
    await new Promise((resolve) => setTimeout(resolve, 800))

    const selectedRuleNames = availableRules.value
      .filter((rule) => triggerForm.selectedRules.includes(rule.id))
      .map((rule) => rule.ruleName)
      .join('、')

    const previewInfo = `
将执行以下质控配置：
• 质控类型：${triggerForm.qcType === 1 ? '前置质控' : '后置质控'}
• 规则数量：${triggerForm.selectedRules.length}个
• 预计记录：${executionEstimate.value?.estimatedRecords}条
• 预计时间：${executionEstimate.value?.estimatedDuration}分钟
• 执行规则：${selectedRuleNames}
    `

    ElMessageBox.alert(previewInfo, '执行预览', {
      confirmButtonText: '知道了',
      type: 'info'
    })
  } catch (error) {
    ElMessage.error('生成预览失败')
  } finally {
    previewing.value = false
  }
}

/** 触发执行 */
const triggerExecution = async () => {
  if (!(await validateForm())) return

  try {
    await ElMessageBox.confirm(
      `确认执行${triggerForm.selectedRules.length}个质控规则？执行过程中请勿关闭页面。`,
      '确认执行',
      {
        type: 'warning',
        confirmButtonText: '确认执行',
        cancelButtonText: '取消'
      }
    )

    triggering.value = true

    // 模拟API调用启动质控任务
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 模拟返回执行ID
    const executionId = Math.floor(Math.random() * 9999) + 1000

    ElMessage.success('质控任务已成功启动')
    emit('success', executionId)
    dialogVisible.value = false
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('启动质控任务失败')
    }
  } finally {
    triggering.value = false
  }
}

/** 表单验证 */
const validateForm = async (): Promise<boolean> => {
  try {
    await formRef.value?.validate()
    return true
  } catch (error) {
    return false
  }
}

/** 重置表单 */
const resetForm = () => {
  Object.assign(triggerForm, {
    qcType: 1,
    tableType: null,
    selectedRules: [],
    priority: 'normal',
    notificationMethods: ['system'],
    description: ''
  })

  selectAll.value = false
  ruleSearchText.value = ''
  executionEstimate.value = null
}
</script>

<style lang="scss" scoped>
.manual-trigger-container {
  max-height: 70vh;
  overflow-y: auto;
}

.config-card,
.estimate-card {
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
}

.rules-selection {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;

  .selection-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #ebeef5;
  }

  .rules-list {
    max-height: 300px;
    overflow-y: auto;
    padding: 8px;

    .rule-item {
      margin-bottom: 8px;
      border: 1px solid #ebeef5;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        border-color: #c6e2ff;
        background-color: #f0f9ff;
      }

      .rule-checkbox {
        width: 100%;
        margin: 0;
        padding: 12px;

        :deep(.el-checkbox__label) {
          width: 100%;
        }
      }

      .rule-content {
        width: 100%;

        .rule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;

          .rule-name {
            font-weight: 500;
            color: #303133;
          }
        }

        .rule-info {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #909399;

          .rule-code {
            font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
          }
        }
      }
    }
  }
}

.execution-tips {
  margin-top: 16px;
  background-color: #f0f9ff;
  border: 1px solid #c6e2ff;
  border-radius: 6px;
  padding: 12px;

  h4 {
    margin: 0 0 8px 0;
    color: #409eff;
    font-size: 14px;
  }

  .tips-list {
    margin: 0;
    padding-left: 20px;

    li {
      color: #606266;
      margin-bottom: 4px;
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
  .manual-trigger-container {
    max-height: 60vh;
  }

  .selection-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .rule-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* 滚动条样式 */
.rules-list::-webkit-scrollbar {
  width: 6px;
}

.rules-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.rules-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;

  &:hover {
    background: #a8a8a8;
  }
}
</style>
