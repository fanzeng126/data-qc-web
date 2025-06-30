<!-- src/views/drug/governance/manual-repair/index.vue -->
<template>
  <div class="manual-repair-container">
    <!-- 页面头部 -->
    <PageHeader
      title="手动修复"
      content="人工处理无法自动修复的异常数据，确保数据准确性"
      :show-back-button="true"
      @back-click="handleBack"
    />

    <!-- 待处理列表 -->
    <el-card class="pending-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">待处理数据</span>
          <el-badge :value="pendingList.length" class="pending-badge" />
        </div>
      </template>

      <el-table
        :data="pendingList"
        stripe
        highlight-current-row
        @current-change="handleRowChange"
        style="width: 100%"
      >
        <el-table-column prop="priority" label="优先级" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getPriorityTag(row.priority)" size="small">
              {{ getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="taskNo" label="任务编号" width="150" />

        <el-table-column prop="tableName" label="数据表" width="120">
          <template #default="{ row }">
            {{ getDictLabel(DICT_TYPE.DRUG_TABLE_TYPE, row.tableType) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="hospitalName"
          label="医院名称"
          min-width="180"
          show-overflow-tooltip
        />

        <el-table-column prop="drugName" label="药品名称" min-width="150" show-overflow-tooltip />

        <el-table-column prop="anomalyType" label="异常类型" width="140">
          <template #default="{ row }">
            {{ getAnomalyTypeLabel(row.anomalyType) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="errorMessage"
          label="错误描述"
          min-width="200"
          show-overflow-tooltip
        />
      </el-table>
    </el-card>

    <!-- 修复表单 -->
    <el-card v-if="currentAnomaly" class="repair-card" shadow="never">
      <template #header>
        <span class="card-title">数据修复</span>
      </template>

      <el-row :gutter="20">
        <!-- 原始数据 -->
        <el-col :span="12">
          <div class="data-section">
            <h4 class="section-title">原始数据</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="YPID">
                {{ currentAnomaly.ypid || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="药品名称">
                {{ currentAnomaly.drugName || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="异常字段">
                {{ currentAnomaly.fieldName || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="原始值">
                <span class="error-value">{{ currentAnomaly.originalValue || '-' }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="期望值">
                <span class="expected-value">{{ currentAnomaly.expectedValue || '-' }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-col>

        <!-- 修复表单 -->
        <el-col :span="12">
          <div class="data-section">
            <h4 class="section-title">修复数据</h4>
            <el-form
              ref="repairFormRef"
              :model="repairForm"
              :rules="repairRules"
              label-width="100px"
            >
              <el-form-item label="YPID" prop="ypid">
                <el-autocomplete
                  v-model="repairForm.ypid"
                  :fetch-suggestions="searchYpid"
                  placeholder="请输入YPID或药品名称搜索"
                  @select="handleYpidSelect"
                  style="width: 100%"
                >
                  <template #default="{ item }">
                    <div class="ypid-item">
                      <div class="ypid-code">{{ item.ypid }}</div>
                      <div class="ypid-name">{{ item.drugName }} - {{ item.manufacturer }}</div>
                    </div>
                  </template>
                </el-autocomplete>
              </el-form-item>

              <el-form-item label="修复值" prop="fixedValue">
                <el-input v-model="repairForm.fixedValue" placeholder="请输入修复后的值" />
              </el-form-item>

              <el-form-item label="修复原因" prop="fixReason">
                <el-input
                  v-model="repairForm.fixReason"
                  type="textarea"
                  :rows="3"
                  placeholder="请说明修复原因"
                />
              </el-form-item>

              <el-form-item label="参考信息" prop="referenceInfo">
                <el-input
                  v-model="repairForm.referenceInfo"
                  type="textarea"
                  :rows="2"
                  placeholder="可选：填写参考资料或依据"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-col>
      </el-row>

      <!-- 参考信息 -->
      <div v-if="ypidReferences.length > 0" class="reference-section">
        <h4 class="section-title">YPID参考信息</h4>
        <el-table :data="ypidReferences" stripe size="small">
          <el-table-column prop="ypid" label="YPID" width="120" />
          <el-table-column prop="drugName" label="通用名" min-width="150" />
          <el-table-column prop="productName" label="产品名" min-width="150" />
          <el-table-column prop="specification" label="规格" width="100" />
          <el-table-column prop="manufacturer" label="生产企业" min-width="150" />
          <el-table-column prop="conversionFactor" label="转换系数" width="100" />
        </el-table>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button @click="handleSkip">跳过</el-button>
        <el-button @click="handleIgnore">忽略异常</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting"> 提交修复 </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import {
  DataGovernanceApi,
  type AnomalyDataVO,
  type YpidReferenceVO,
  type ManualFixRequestVO
} from '@/api/drug/governance'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'

defineOptions({ name: 'ManualRepairIndex' })

// ========================= 响应式数据 =========================

const route = useRoute()
const router = useRouter()

const pendingList = ref<AnomalyDataVO[]>([])
const currentAnomaly = ref<AnomalyDataVO>()
const ypidReferences = ref<YpidReferenceVO[]>([])

const repairFormRef = ref<FormInstance>()
const submitting = ref(false)

const repairForm = reactive({
  ypid: '',
  fixedValue: '',
  fixReason: '',
  referenceInfo: ''
})

const repairRules: FormRules = {
  fixedValue: [{ required: true, message: '请输入修复值', trigger: 'blur' }],
  fixReason: [
    { required: true, message: '请说明修复原因', trigger: 'blur' },
    { min: 10, message: '修复原因不少于10个字', trigger: 'blur' }
  ]
}

// ========================= 生命周期 =========================

onMounted(() => {
  loadPendingList()
})

// ========================= 方法 =========================

const loadPendingList = async () => {
  try {
    const { list } = await DataGovernanceApi.getManualFixList({
      pageNo: 1,
      pageSize: 100,
      priority: undefined,
      tableType: undefined
    })
    pendingList.value = list || []

    // 自动选中第一条
    if (pendingList.value.length > 0) {
      currentAnomaly.value = pendingList.value[0]
      loadAnomalyDetail()
    }
  } catch (error) {
    ElMessage.error('加载待处理数据失败')
  }
}

const loadAnomalyDetail = async () => {
  if (!currentAnomaly.value) return

  try {
    const detail = await DataGovernanceApi.getAnomalyDetail(currentAnomaly.value.id)
    currentAnomaly.value = detail

    // 重置表单
    Object.assign(repairForm, {
      ypid: detail.ypid || '',
      fixedValue: detail.expectedValue || '',
      fixReason: '',
      referenceInfo: ''
    })
  } catch (error) {
    ElMessage.error('加载异常详情失败')
  }
}

const handleBack = () => {
  router.back()
}

const handleRowChange = (row: AnomalyDataVO) => {
  currentAnomaly.value = row
  loadAnomalyDetail()
}

const searchYpid = async (queryString: string, cb: Function) => {
  if (!queryString) {
    cb([])
    return
  }

  try {
    const references = await DataGovernanceApi.getYpidReference(queryString)
    cb(references)
  } catch (error) {
    cb([])
  }
}

const handleYpidSelect = (item: YpidReferenceVO) => {
  repairForm.ypid = item.ypid
  ypidReferences.value = [item]
}

const handleSkip = () => {
  const currentIndex = pendingList.value.findIndex((item) => item.id === currentAnomaly.value?.id)
  if (currentIndex < pendingList.value.length - 1) {
    currentAnomaly.value = pendingList.value[currentIndex + 1]
    loadAnomalyDetail()
  } else {
    ElMessage.info('已经是最后一条数据')
  }
}

const handleIgnore = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入忽略原因', '忽略异常', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入忽略原因'
    })

    await DataGovernanceApi.ignoreAnomaly(currentAnomaly.value!.id, reason)
    ElMessage.success('已忽略该异常')

    // 从列表中移除
    const index = pendingList.value.findIndex((item) => item.id === currentAnomaly.value?.id)
    pendingList.value.splice(index, 1)

    // 选中下一条
    if (pendingList.value.length > 0) {
      currentAnomaly.value = pendingList.value[Math.min(index, pendingList.value.length - 1)]
      loadAnomalyDetail()
    } else {
      currentAnomaly.value = undefined
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleSubmit = async () => {
  const valid = await repairFormRef.value?.validate()
  if (!valid) return

  submitting.value = true
  try {
    const params: ManualFixRequestVO = {
      anomalyId: currentAnomaly.value!.id,
      fieldValues: {
        [currentAnomaly.value!.fieldName!]: repairForm.fixedValue,
        ypid: repairForm.ypid
      },
      fixReason: repairForm.fixReason,
      referenceInfo: repairForm.referenceInfo
    }

    await DataGovernanceApi.submitManualFix(params)
    ElMessage.success('修复成功')

    // 从列表中移除
    const index = pendingList.value.findIndex((item) => item.id === currentAnomaly.value?.id)
    pendingList.value.splice(index, 1)

    // 选中下一条
    if (pendingList.value.length > 0) {
      currentAnomaly.value = pendingList.value[Math.min(index, pendingList.value.length - 1)]
      loadAnomalyDetail()
    } else {
      currentAnomaly.value = undefined
      ElMessage.success('所有数据已处理完成')
    }
  } catch (error) {
    ElMessage.error('修复失败')
  } finally {
    submitting.value = false
  }
}

// ========================= 工具方法 =========================

const getPriorityLabel = (priority: number) => {
  const labels = ['低', '中', '高', '紧急']
  return labels[priority - 1] || '未知'
}

const getPriorityTag = (priority: number) => {
  const tags = ['info', 'warning', 'danger', 'danger']
  return tags[priority - 1] || 'info'
}

const getAnomalyTypeLabel = (type: string) => {
  const typeMap = {
    YPID_EMPTY: 'YPID未比对',
    YPID_ERROR: 'YPID比对错误',
    AMOUNT_ERROR: '金额异常',
    QUANTITY_ERROR: '数量异常',
    LOGIC_ERROR: '逻辑错误',
    FORMAT_ERROR: '格式错误'
  }
  return typeMap[type] || type
}
</script>

<style scoped>
.manual-repair-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.pending-card,
.repair-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.pending-badge :deep(.el-badge__content) {
  background-color: #f56c6c;
}

.data-section {
  padding: 0 20px;
}

.section-title {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.error-value {
  color: #f56c6c;
  font-weight: 500;
}

.expected-value {
  color: #67c23a;
  font-weight: 500;
}

.reference-section {
  margin-top: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.ypid-item {
  padding: 4px 0;
}

.ypid-code {
  font-weight: 600;
  color: #303133;
}

.ypid-name {
  font-size: 12px;
  color: #909399;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
