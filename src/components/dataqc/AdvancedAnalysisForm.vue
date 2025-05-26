<template>
  <div class="advanced-analysis-form">
    <!-- 分析类型选择 -->
    <div class="analysis-type-section">
      <h3 class="section-title">
        <Icon icon="ep:data-analysis" />
        选择分析类型
      </h3>
      <el-radio-group v-model="analysisForm.type" class="analysis-type-group">
        <el-radio-button value="correlation">相关性分析</el-radio-button>
        <el-radio-button value="prediction">趋势预测</el-radio-button>
        <el-radio-button value="anomaly">异常检测</el-radio-button>
        <el-radio-button value="optimization">优化建议</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 分析参数配置 -->
    <div class="analysis-params-section">
      <h3 class="section-title">
        <Icon icon="ep:setting" />
        分析参数配置
      </h3>

      <el-form :model="analysisForm" :rules="formRules" ref="formRef" label-width="120px">
        <!-- 基础参数 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分析时间范围" prop="dateRange">
              <el-date-picker
                v-model="analysisForm.dateRange"
                type="daterange"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYYMMDD"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分析维度" prop="dimensions">
              <el-select v-model="analysisForm.dimensions" multiple placeholder="选择分析维度" class="w-full">
                <el-option label="时间维度" value="time" />
                <el-option label="科室维度" value="department" />
                <el-option label="药品维度" value="drug" />
                <el-option label="医生维度" value="doctor" />
                <el-option label="患者维度" value="patient" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 相关性分析参数 -->
        <template v-if="analysisForm.type === 'correlation'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="变量X" prop="variableX">
                <el-select v-model="analysisForm.variableX" placeholder="选择X变量" class="w-full">
                  <el-option label="用药频次" value="frequency" />
                  <el-option label="用药金额" value="amount" />
                  <el-option label="患者数量" value="patients" />
                  <el-option label="处方数量" value="prescriptions" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="变量Y" prop="variableY">
                <el-select v-model="analysisForm.variableY" placeholder="选择Y变量" class="w-full">
                  <el-option label="用药频次" value="frequency" />
                  <el-option label="用药金额" value="amount" />
                  <el-option label="患者数量" value="patients" />
                  <el-option label="处方数量" value="prescriptions" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 趋势预测参数 -->
        <template v-if="analysisForm.type === 'prediction'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="预测目标" prop="predictionTarget">
                <el-select v-model="analysisForm.predictionTarget" placeholder="选择预测目标" class="w-full">
                  <el-option label="用药需求量" value="demand" />
                  <el-option label="费用增长" value="cost_growth" />
                  <el-option label="库存需求" value="inventory" />
                  <el-option label="基药使用率" value="base_drug_rate" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预测周期" prop="predictionPeriod">
                <el-select v-model="analysisForm.predictionPeriod" placeholder="选择预测周期" class="w-full">
                  <el-option label="1个月" value="1m" />
                  <el-option label="3个月" value="3m" />
                  <el-option label="6个月" value="6m" />
                  <el-option label="1年" value="1y" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 异常检测参数 -->
        <template v-if="analysisForm.type === 'anomaly'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="检测算法" prop="anomalyAlgorithm">
                <el-select v-model="analysisForm.anomalyAlgorithm" placeholder="选择检测算法" class="w-full">
                  <el-option label="统计方法" value="statistical" />
                  <el-option label="机器学习" value="ml" />
                  <el-option label="时序分析" value="time_series" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="敏感度" prop="sensitivity">
                <el-slider v-model="analysisForm.sensitivity" :min="1" :max="10" show-tooltip />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 优化建议参数 -->
        <template v-if="analysisForm.type === 'optimization'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="优化目标" prop="optimizationGoal">
                <el-checkbox-group v-model="analysisForm.optimizationGoal">
                  <el-checkbox value="cost">成本降低</el-checkbox>
                  <el-checkbox value="efficiency">效率提升</el-checkbox>
                  <el-checkbox value="compliance">合规改善</el-checkbox>
                  <el-checkbox value="quality">质量提高</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="约束条件" prop="constraints">
                <el-input v-model="analysisForm.constraints" type="textarea" :rows="3" placeholder="输入约束条件" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 高级选项 -->
        <el-collapse v-model="activeCollapse" class="advanced-options">
          <el-collapse-item title="高级选项" name="advanced">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="置信水平">
                  <el-select v-model="analysisForm.confidenceLevel" class="w-full">
                    <el-option label="90%" value="0.90" />
                    <el-option label="95%" value="0.95" />
                    <el-option label="99%" value="0.99" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="样本大小">
                  <el-input-number v-model="analysisForm.sampleSize" :min="100" :max="10000" class="w-full" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="排除条件">
              <el-input v-model="analysisForm.exclusions" type="textarea" :rows="2" placeholder="输入需要排除的条件" />
            </el-form-item>
          </el-collapse-item>
        </el-collapse>
      </el-form>
    </div>

    <!-- 分析进度显示 -->
    <div class="analysis-progress" v-if="analyzing">
      <el-card>
        <div class="progress-content">
          <el-progress :percentage="analysisProgress" :status="progressStatus" />
          <p class="progress-text">{{ progressText }}</p>
        </div>
      </el-card>
    </div>

    <!-- 操作按钮 -->
    <div class="form-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="startAnalysis" :loading="analyzing">
        {{ analyzing ? '分析中...' : '开始分析' }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormRules } from 'element-plus'

defineOptions({ name: 'AdvancedAnalysisForm' })

// ========== Props 和 Emits ==========

const emit = defineEmits<{
  'analysis-complete': [result: any]
}>()

// ========== 响应式数据 ==========

const formRef = ref()
const analyzing = ref(false)
const analysisProgress = ref(0)
const progressStatus = ref<'success' | 'exception' | undefined>(undefined)
const progressText = ref('')
const activeCollapse = ref([])

// 分析表单数据
const analysisForm = reactive({
  type: 'correlation',
  dateRange: [] as string[],
  dimensions: [] as string[],
  variableX: '',
  variableY: '',
  predictionTarget: '',
  predictionPeriod: '',
  anomalyAlgorithm: '',
  sensitivity: 5,
  optimizationGoal: [] as string[],
  constraints: '',
  confidenceLevel: '0.95',
  sampleSize: 1000,
  exclusions: ''
})

// ========== 表单验证规则 ==========

const formRules = reactive<FormRules>({
  dateRange: [
    { required: true, message: '请选择分析时间范围', trigger: 'change' }
  ],
  dimensions: [
    { required: true, message: '请选择至少一个分析维度', trigger: 'change' }
  ],
  variableX: [
    { required: true, message: '请选择X变量', trigger: 'change' }
  ],
  variableY: [
    { required: true, message: '请选择Y变量', trigger: 'change' }
  ],
  predictionTarget: [
    { required: true, message: '请选择预测目标', trigger: 'change' }
  ],
  predictionPeriod: [
    { required: true, message: '请选择预测周期', trigger: 'change' }
  ],
  anomalyAlgorithm: [
    { required: true, message: '请选择检测算法', trigger: 'change' }
  ],
  optimizationGoal: [
    { required: true, message: '请选择至少一个优化目标', trigger: 'change' }
  ]
})

// ========== 方法 ==========

/**
 * 开始分析
 */
const startAnalysis = async () => {
  if (!formRef.value) return

  const valid = await formRef.value.validate()
  if (!valid) return

  analyzing.value = true
  analysisProgress.value = 0
  progressStatus.value = undefined

  try {
    // 模拟分析过程
    await simulateAnalysis()

    // 生成分析结果
    const result = generateAnalysisResult()

    progressStatus.value = 'success'
    progressText.value = '分析完成！'

    ElMessage.success('高级分析完成')
    emit('analysis-complete', result)

  } catch (error) {
    progressStatus.value = 'exception'
    progressText.value = '分析失败'
    ElMessage.error('分析过程中出现错误')
  } finally {
    analyzing.value = false
  }
}

/**
 * 模拟分析过程
 */
const simulateAnalysis = (): Promise<void> => {
  return new Promise((resolve) => {
    const steps = [
      { progress: 20, text: '数据预处理中...' },
      { progress: 40, text: '特征提取中...' },
      { progress: 60, text: '模型训练中...' },
      { progress: 80, text: '结果计算中...' },
      { progress: 100, text: '生成报告中...' }
    ]

    let currentStep = 0
    const timer = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep]
        analysisProgress.value = step.progress
        progressText.value = step.text
        currentStep++
      } else {
        clearInterval(timer)
        resolve()
      }
    }, 1000)
  })
}

/**
 * 生成分析结果
 */
const generateAnalysisResult = () => {
  const baseResult = {
    analysisType: analysisForm.type,
    parameters: { ...analysisForm },
    timestamp: new Date().toISOString(),
    confidence: parseFloat(analysisForm.confidenceLevel)
  }

  switch (analysisForm.type) {
    case 'correlation':
      return {
        ...baseResult,
        correlationCoefficient: 0.75,
        significance: 0.001,
        interpretation: '变量之间存在强正相关关系',
        recommendations: [
          '建议深入分析相关因素',
          '可以利用此相关性进行预测',
          '需要验证因果关系'
        ]
      }

    case 'prediction':
      return {
        ...baseResult,
        predictions: generatePredictionData(),
        accuracy: 0.92,
        interpretation: '预测模型表现良好，准确率达92%',
        recommendations: [
          '建议按预测结果调整采购计划',
          '定期更新模型以维持准确性',
          '关注异常波动的预警信号'
        ]
      }

    case 'anomaly':
      return {
        ...baseResult,
        anomalies: generateAnomalyData(),
        anomalyRate: 0.05,
        interpretation: '检测到5%的异常数据点',
        recommendations: [
          '重点关注检测到的异常点',
          '分析异常原因并制定应对措施',
          '建立异常监控机制'
        ]
      }

    case 'optimization':
      return {
        ...baseResult,
        optimizations: generateOptimizationData(),
        expectedImprovement: 0.15,
        interpretation: '优化方案预计可提升15%的效率',
        recommendations: [
          '优先实施高影响低难度的改进',
          '制定详细的实施计划',
          '建立效果评估机制'
        ]
      }

    default:
      return baseResult
  }
}

/**
 * 生成预测数据
 */
const generatePredictionData = () => {
  return Array.from({ length: 6 }, (_, i) => ({
    period: `未来${i + 1}个月`,
    predicted: Math.round(1000 + Math.random() * 500),
    lowerBound: Math.round(800 + Math.random() * 300),
    upperBound: Math.round(1200 + Math.random() * 700)
  }))
}

/**
 * 生成异常数据
 */
const generateAnomalyData = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    value: Math.random() * 1000,
    severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    description: `异常点${i + 1}：数值超出正常范围`
  }))
}

/**
 * 生成优化数据
 */
const generateOptimizationData = () => {
  return [
    {
      category: '采购优化',
      currentValue: 1000000,
      optimizedValue: 850000,
      improvement: 0.15,
      priority: 'high'
    },
    {
      category: '库存优化',
      currentValue: 500000,
      optimizedValue: 450000,
      improvement: 0.10,
      priority: 'medium'
    },
    {
      category: '流程优化',
      currentValue: 300000,
      optimizedValue: 270000,
      improvement: 0.10,
      priority: 'low'
    }
  ]
}

/**
 * 取消操作
 */
const handleCancel = () => {
  if (analyzing.value) {
    ElMessage.warning('分析正在进行中，无法取消')
    return
  }

  // 重置表单
  Object.assign(analysisForm, {
    type: 'correlation',
    dateRange: [],
    dimensions: [],
    variableX: '',
    variableY: '',
    predictionTarget: '',
    predictionPeriod: '',
    anomalyAlgorithm: '',
    sensitivity: 5,
    optimizationGoal: [],
    constraints: '',
    confidenceLevel: '0.95',
    sampleSize: 1000,
    exclusions: ''
  })

  formRef.value?.resetFields()
}
</script>

<style scoped>
.advanced-analysis-form {
  padding: 20px 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}

.analysis-type-section {
  margin-bottom: 24px;
}

.analysis-type-group {
  width: 100%;
}

.analysis-params-section {
  margin-bottom: 24px;
}

.advanced-options {
  margin-top: 20px;
}

.analysis-progress {
  margin: 24px 0;
}

.progress-content {
  text-align: center;
  padding: 20px;
}

.progress-text {
  margin-top: 12px;
  color: #606266;
  font-size: 14px;
}

.form-actions {
  text-align: right;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.w-full {
  width: 100%;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-collapse-item__header) {
  font-weight: 600;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-radio-button__inner) {
  padding: 8px 16px;
}
</style>
