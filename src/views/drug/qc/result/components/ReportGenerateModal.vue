<template>
  <el-dialog
    v-model="dialogVisible"
    title="生成质控报告"
    width="700px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="report-generate-container">
      <!-- 报告配置表单 -->
      <el-form ref="formRef" :model="reportForm" :rules="formRules" label-width="120px">
        <!-- 基本配置 -->
        <el-card class="config-section" shadow="never">
          <template #header>
            <div class="section-header">
              <el-icon><Setting /></el-icon>
              <span>基本配置</span>
            </div>
          </template>

          <el-form-item label="报告名称" prop="reportName">
            <el-input v-model="reportForm.reportName" placeholder="请输入报告名称" clearable />
          </el-form-item>

          <el-form-item label="报告类型" prop="reportType">
            <el-radio-group v-model="reportForm.reportType">
              <el-radio value="summary">汇总报告</el-radio>
              <el-radio value="detail">详细报告</el-radio>
              <el-radio value="trend">趋势分析</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="时间范围" prop="timeRange">
            <el-date-picker
              v-model="reportForm.timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="报告描述" prop="description">
            <el-input
              v-model="reportForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入报告描述（可选）"
            />
          </el-form-item>
        </el-card>

        <!-- 数据范围筛选 -->
        <el-card class="config-section" shadow="never">
          <template #header>
            <div class="section-header">
              <el-icon><Filter /></el-icon>
              <span>数据范围</span>
            </div>
          </template>

          <el-form-item label="表类型">
            <el-checkbox-group v-model="reportForm.tableTypes">
              <el-checkbox value="2">药品目录表</el-checkbox>
              <el-checkbox value="5">使用情况表</el-checkbox>
              <el-checkbox value="7">采购记录表</el-checkbox>
              <el-checkbox value="8">库存记录表</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="结果状态">
            <el-checkbox-group v-model="reportForm.resultStatuses">
              <el-checkbox value="1">质控失败</el-checkbox>
              <el-checkbox value="2">质控警告</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="修复状态">
            <el-checkbox-group v-model="reportForm.fixStatuses">
              <el-checkbox value="fixed">已修复</el-checkbox>
              <el-checkbox value="unfixed">未修复</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="执行批次">
            <el-select
              v-model="reportForm.executionNos"
              multiple
              filterable
              placeholder="选择执行批次（空=全部）"
              style="width: 100%"
            >
              <el-option
                v-for="execution in executionOptions"
                :key="execution.value"
                :label="execution.label"
                :value="execution.value"
              />
            </el-select>
          </el-form-item>
        </el-card>

        <!-- 报告内容配置 -->
        <el-card class="config-section" shadow="never">
          <template #header>
            <div class="section-header">
              <el-icon><Document /></el-icon>
              <span>报告内容</span>
            </div>
          </template>

          <el-form-item label="包含内容">
            <el-checkbox-group v-model="reportForm.includeContents">
              <el-checkbox value="statistics">统计概览</el-checkbox>
              <el-checkbox value="charts">图表分析</el-checkbox>
              <el-checkbox value="details">异常详情</el-checkbox>
              <el-checkbox value="suggestions">修复建议</el-checkbox>
              <el-checkbox value="history">操作历史</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="图表类型" v-if="reportForm.includeContents.includes('charts')">
            <el-checkbox-group v-model="reportForm.chartTypes">
              <el-checkbox value="rule_distribution">规则分布图</el-checkbox>
              <el-checkbox value="table_distribution">表类型分布图</el-checkbox>
              <el-checkbox value="trend_chart">趋势分析图</el-checkbox>
              <el-checkbox value="fix_rate_chart">修复率统计图</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="详情层级" v-if="reportForm.includeContents.includes('details')">
            <el-radio-group v-model="reportForm.detailLevel">
              <el-radio value="summary">仅汇总信息</el-radio>
              <el-radio value="sample">包含样本数据</el-radio>
              <el-radio value="full">完整详情</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-card>

        <!-- 输出设置 -->
        <el-card class="config-section" shadow="never">
          <template #header>
            <div class="section-header">
              <el-icon><Download /></el-icon>
              <span>输出设置</span>
            </div>
          </template>

          <el-form-item label="输出格式" prop="outputFormat">
            <el-radio-group v-model="reportForm.outputFormat">
              <el-radio value="pdf">PDF文档</el-radio>
              <el-radio value="excel">Excel表格</el-radio>
              <el-radio value="word">Word文档</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="是否发送邮件">
            <el-switch v-model="reportForm.sendEmail" />
            <span class="form-help">生成后自动发送到您的邮箱</span>
          </el-form-item>

          <el-form-item label="邮件地址" v-if="reportForm.sendEmail" prop="emailAddress">
            <el-input v-model="reportForm.emailAddress" placeholder="请输入邮件地址" clearable />
          </el-form-item>
        </el-card>
      </el-form>

      <!-- 生成预览 -->
      <div class="preview-section" v-if="showPreview">
        <h4 class="preview-title">报告预览</h4>
        <div class="preview-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="预计记录数"
              >{{ previewData.recordCount }}条</el-descriptions-item
            >
            <el-descriptions-item label="预计文件大小">{{
              previewData.fileSize
            }}</el-descriptions-item>
            <el-descriptions-item label="生成时间">{{
              previewData.generateTime
            }}</el-descriptions-item>
            <el-descriptions-item label="包含图表"
              >{{ previewData.chartCount }}个</el-descriptions-item
            >
          </el-descriptions>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button @click="previewReport" :loading="previewing">
          <el-icon><View /></el-icon>
          预览报告
        </el-button>
        <el-button type="primary" @click="generateReport" :loading="generating">
          <el-icon><Document /></el-icon>
          生成报告
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Setting, Filter, Document, Download, View } from '@element-plus/icons-vue'

/**
 * 质控报告生成组件
 *
 * 这个组件设计理念是"配置驱动，简单易用"。
 * 通过清晰的配置选项，让用户能够快速生成符合需求的质控报告。
 * 就像一个智能的报告助手，帮助用户把复杂的质控数据转化为直观的报告。
 */

const emit = defineEmits<{
  success: []
}>()

// ========================= 响应式数据 =========================

const dialogVisible = defineModel<boolean>({ default: false })
const loading = ref(false)
const generating = ref(false)
const previewing = ref(false)
const showPreview = ref(false)
const formRef = ref()

/** 报告配置表单 - 包含生成报告所需的所有配置项 */
const reportForm = reactive({
  reportName: `质控报告_${new Date().toISOString().slice(0, 10)}`,
  reportType: 'summary',
  timeRange: null as any,
  description: '',
  tableTypes: ['2', '5'], // 默认选择常用的表类型
  resultStatuses: ['1', '2'], // 默认包含所有异常状态
  fixStatuses: ['fixed', 'unfixed'], // 默认包含所有修复状态
  executionNos: [] as string[],
  includeContents: ['statistics', 'charts', 'details'], // 默认包含主要内容
  chartTypes: ['rule_distribution', 'table_distribution'],
  detailLevel: 'summary',
  outputFormat: 'pdf',
  sendEmail: false,
  emailAddress: ''
})

/** 表单验证规则 */
const formRules = {
  reportName: [
    { required: true, message: '请输入报告名称', trigger: 'blur' },
    { min: 2, max: 50, message: '报告名称长度在2-50个字符', trigger: 'blur' }
  ],
  reportType: [{ required: true, message: '请选择报告类型', trigger: 'change' }],
  timeRange: [{ required: true, message: '请选择时间范围', trigger: 'change' }],
  outputFormat: [{ required: true, message: '请选择输出格式', trigger: 'change' }],
  emailAddress: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }]
}

/** 执行批次选项 */
const executionOptions = ref<Array<{ value: string; label: string }>>([])

/** 预览数据 */
const previewData = ref({
  recordCount: 0,
  fileSize: '',
  generateTime: '',
  chartCount: 0
})

// ========================= 监听器 =========================

/**
 * 监听弹窗开关，初始化数据
 */
watch(dialogVisible, (visible) => {
  if (visible) {
    initFormData()
    loadExecutionOptions()
  } else {
    resetForm()
  }
})

// ========================= 核心方法 =========================

/**
 * 初始化表单数据
 * 设置默认的时间范围和其他配置
 */
const initFormData = () => {
  // 设置默认时间范围为最近7天
  const endTime = new Date()
  const startTime = new Date()
  startTime.setDate(startTime.getDate() - 7)

  reportForm.timeRange = [
    startTime.toISOString().slice(0, 19).replace('T', ' '),
    endTime.toISOString().slice(0, 19).replace('T', ' ')
  ]
}

/**
 * 加载执行批次选项
 * 获取系统中可用的执行批次供用户选择
 */
const loadExecutionOptions = async () => {
  try {
    // 模拟API调用 - 在实际项目中应该调用真实接口
    await new Promise((resolve) => setTimeout(resolve, 300))

    // 生成模拟的执行批次数据
    const mockExecutions = []
    for (let i = 1; i <= 10; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')

      mockExecutions.push({
        value: `EXEC_${dateStr}_${String(i).padStart(3, '0')}`,
        label: `EXEC_${dateStr}_${String(i).padStart(3, '0')} (${date.toLocaleDateString()})`
      })
    }

    executionOptions.value = mockExecutions
  } catch (error) {
    console.error('加载执行批次选项失败:', error)
  }
}

/**
 * 预览报告
 * 生成报告的预览信息，让用户了解将要生成的报告情况
 */
const previewReport = async () => {
  try {
    // 验证表单
    const valid = await formRef.value?.validate()
    if (!valid) return

    previewing.value = true

    // 模拟预览数据计算
    await new Promise((resolve) => setTimeout(resolve, 800))

    // 根据配置计算预览数据
    const baseRecordCount = 1000
    const typeMultiplier = reportForm.tableTypes.length * 0.3
    const statusMultiplier = reportForm.resultStatuses.length * 0.5
    const recordCount = Math.floor(baseRecordCount * typeMultiplier * statusMultiplier)

    previewData.value = {
      recordCount,
      fileSize: calculateFileSize(recordCount),
      generateTime: calculateGenerateTime(recordCount),
      chartCount: reportForm.chartTypes.length
    }

    showPreview.value = true
    ElMessage.success('预览生成成功')
  } catch (error) {
    ElMessage.error('生成预览失败')
  } finally {
    previewing.value = false
  }
}

/**
 * 生成报告
 * 根据用户配置生成质控报告
 */
const generateReport = async () => {
  try {
    // 验证表单
    const valid = await formRef.value?.validate()
    if (!valid) return

    generating.value = true

    // 模拟报告生成过程
    await simulateReportGeneration()

    ElNotification.success({
      title: '报告生成成功',
      message: '质控报告已生成完成，请查看下载文件',
      duration: 5000
    })

    // 如果配置了发送邮件，显示邮件发送提示
    if (reportForm.sendEmail) {
      ElMessage.success(`报告已发送至邮箱：${reportForm.emailAddress}`)
    }

    emit('success')
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('报告生成失败')
  } finally {
    generating.value = false
  }
}

/**
 * 模拟报告生成过程
 * 实际项目中这里应该调用后端接口进行报告生成
 */
const simulateReportGeneration = async () => {
  const steps = [
    '数据查询中...',
    '统计分析中...',
    '生成图表中...',
    '组织报告内容中...',
    '生成文件中...'
  ]

  for (let i = 0; i < steps.length; i++) {
    console.log(steps[i])
    await new Promise((resolve) => setTimeout(resolve, 600))
  }
}

/**
 * 重置表单
 * 清空表单数据并重置验证状态
 */
const resetForm = () => {
  showPreview.value = false
  formRef.value?.resetFields()
}

// ========================= 工具方法 =========================

/**
 * 计算预估文件大小
 * 根据记录数量和报告配置估算生成的文件大小
 */
const calculateFileSize = (recordCount: number): string => {
  let baseSize = recordCount * 0.5 // 基础大小(KB)

  // 根据包含内容调整大小
  if (reportForm.includeContents.includes('charts')) {
    baseSize += reportForm.chartTypes.length * 200 // 每个图表约200KB
  }

  if (reportForm.includeContents.includes('details')) {
    baseSize *= reportForm.detailLevel === 'full' ? 3 : reportForm.detailLevel === 'sample' ? 2 : 1
  }

  // 根据输出格式调整
  if (reportForm.outputFormat === 'pdf') {
    baseSize *= 1.5
  } else if (reportForm.outputFormat === 'word') {
    baseSize *= 1.2
  }

  if (baseSize < 1024) {
    return `${Math.round(baseSize)}KB`
  } else {
    return `${(baseSize / 1024).toFixed(1)}MB`
  }
}

/**
 * 计算预估生成时间
 * 根据数据量和复杂度估算报告生成所需时间
 */
const calculateGenerateTime = (recordCount: number): string => {
  let baseTime = Math.ceil(recordCount / 1000) // 基础时间(秒)

  // 根据报告复杂度调整时间
  if (reportForm.includeContents.includes('charts')) {
    baseTime += reportForm.chartTypes.length * 2
  }

  if (reportForm.reportType === 'detail') {
    baseTime *= 2
  } else if (reportForm.reportType === 'trend') {
    baseTime *= 1.5
  }

  if (baseTime < 60) {
    return `约${baseTime}秒`
  } else {
    return `约${Math.ceil(baseTime / 60)}分钟`
  }
}
</script>

<style lang="scss" scoped>
.report-generate-container {
  max-height: 70vh;
  overflow-y: auto;
}

.config-section {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.form-help {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.preview-section {
  margin-top: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;

  .preview-title {
    margin: 0 0 12px 0;
    color: #303133;
    font-size: 16px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 表单样式优化 */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

:deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

/* 卡片样式 */
:deep(.el-card__header) {
  background-color: #fafbfc;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-card__body) {
  padding: 20px;
}

/* 描述列表样式 */
:deep(.el-descriptions__label) {
  background-color: #fafbfc;
  font-weight: 600;
  width: 120px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .report-generate-container {
    max-height: 60vh;
  }

  :deep(.el-checkbox-group) {
    flex-direction: column;
    gap: 8px;
  }

  :deep(.el-radio-group) {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
