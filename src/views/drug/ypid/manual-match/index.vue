<template>
  <div class="manual-match-container">
    <!-- 页面头部 -->
    <PageHeader
      title="YPID手动匹配"
      content="人工处理无法自动匹配的药品数据，确保药品编码准确性"
      :show-back-button="true"
      @back-click="handleBack"
    />

    <el-row :gutter="20">
      <!-- 左侧待匹配列表 -->
      <el-col :span="10">
        <el-card class="pending-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">待匹配药品</span>
              <el-tag type="danger">{{ pendingList.length }}</el-tag>
            </div>
          </template>

          <div class="pending-list">
            <el-scrollbar height="600px">
              <div
                v-for="item in pendingList"
                :key="item.id"
                :class="['pending-item', { active: currentDrug?.id === item.id }]"
                @click="handleSelectDrug(item)"
              >
                <div class="item-header">
                  <span class="drug-name">{{ item.hospitalDrugName }}</span>
                  <el-tag size="small" :type="getPriorityTag(item.priority)">
                    {{ getPriorityLabel(item.priority) }}
                  </el-tag>
                </div>
                <div class="item-info">
                  <span class="info-item">规格：{{ item.specification || '-' }}</span>
                  <span class="info-item">剂型：{{ item.dosageForm || '-' }}</span>
                </div>
                <div class="item-manufacturer"> 生产企业：{{ item.manufacturer || '-' }} </div>
              </div>
            </el-scrollbar>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧匹配操作区 -->
      <el-col :span="14">
        <el-card v-if="currentDrug" class="match-card" shadow="never">
          <template #header>
            <span class="card-title">匹配操作</span>
          </template>

          <!-- 当前药品信息 -->
          <div class="current-drug-info">
            <h4 class="section-title">当前药品信息</h4>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="院内编码">
                {{ currentDrug.hospitalDrugId }}
              </el-descriptions-item>
              <el-descriptions-item label="院内名称">
                {{ currentDrug.hospitalDrugName }}
              </el-descriptions-item>
              <el-descriptions-item label="规格">
                {{ currentDrug.specification || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="剂型">
                {{ currentDrug.dosageForm || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="生产企业" :span="2">
                {{ currentDrug.manufacturer || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="批准文号">
                {{ currentDrug.approvalNumber || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="来源表">
                {{ getTableLabel(currentDrug.sourceTable) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- YPID搜索 -->
          <div class="ypid-search">
            <h4 class="section-title">YPID搜索匹配</h4>
            <el-form :model="searchForm" label-width="80px">
              <el-form-item label="搜索方式">
                <el-radio-group v-model="searchForm.searchType">
                  <el-radio value="keyword">关键词搜索</el-radio>
                  <el-radio value="ypid">YPID搜索</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item v-if="searchForm.searchType === 'keyword'" label="关键词">
                <el-input
                  v-model="searchForm.keyword"
                  placeholder="输入药品名称、生产企业等"
                  clearable
                  @keyup.enter="handleSearch"
                >
                  <template #append>
                    <el-button @click="handleSearch">
                      <el-icon><Search /></el-icon>
                    </el-button>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item v-else label="YPID">
                <el-input
                  v-model="searchForm.ypid"
                  placeholder="输入YPID编码"
                  clearable
                  @keyup.enter="handleSearch"
                >
                  <template #append>
                    <el-button @click="handleSearch">
                      <el-icon><Search /></el-icon>
                    </el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-form>
          </div>

          <!-- 匹配候选项 -->
          <div class="match-candidates">
            <h4 class="section-title">
              匹配候选项
              <span v-if="candidates.length > 0" class="candidate-count">
                ({{ candidates.length }}个结果)
              </span>
            </h4>

            <el-radio-group v-model="selectedYpid" class="candidate-list">
              <el-scrollbar height="300px">
                <div v-for="candidate in candidates" :key="candidate.ypid" class="candidate-item">
                  <el-radio :label="candidate.ypid">
                    <div class="candidate-content">
                      <div class="candidate-header">
                        <span class="ypid-code">{{ candidate.ypid }}</span>
                        <el-tag
                          v-if="candidate.confidence"
                          :type="getConfidenceTag(candidate.confidence)"
                          size="small"
                        >
                          置信度：{{ candidate.confidence }}%
                        </el-tag>
                      </div>
                      <div class="candidate-name">{{ candidate.drugName }}</div>
                      <div class="candidate-info">
                        <span>规格：{{ candidate.specification }}</span>
                        <span>剂型：{{ candidate.dosageForm }}</span>
                      </div>
                      <div class="candidate-manufacturer">
                        生产企业：{{ candidate.manufacturer }}
                      </div>
                    </div>
                  </el-radio>
                </div>
              </el-scrollbar>
            </el-radio-group>

            <el-empty
              v-if="searchPerformed && candidates.length === 0"
              description="未找到匹配的YPID"
            />
          </div>

          <!-- 匹配原因 -->
          <div class="match-reason">
            <h4 class="section-title">匹配原因</h4>
            <el-input
              v-model="matchReason"
              type="textarea"
              :rows="3"
              placeholder="请说明匹配原因或依据"
            />
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <el-button @click="handleSkip">跳过</el-button>
            <el-button @click="handleNoMatch">无法匹配</el-button>
            <el-button
              type="primary"
              :disabled="!selectedYpid || !matchReason"
              @click="handleSubmit"
              :loading="submitting"
            >
              确认匹配
            </el-button>
          </div>
        </el-card>

        <el-empty v-else description="请从左侧选择待匹配的药品" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { YpidApi, type UnmatchedDrugVO, type YpidDrugVO } from '@/api/drug/ypid'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'

defineOptions({ name: 'YpidManualMatchIndex' })

// ========================= 响应式数据 =========================

const router = useRouter()
const pendingList = ref<UnmatchedDrugVO[]>([])
const currentDrug = ref<UnmatchedDrugVO>()
const candidates = ref<YpidDrugVO[]>([])
const selectedYpid = ref('')
const matchReason = ref('')
const submitting = ref(false)
const searchPerformed = ref(false)

const searchForm = reactive({
  searchType: 'keyword',
  keyword: '',
  ypid: ''
})

// ========================= 生命周期 =========================

onMounted(() => {
  loadPendingList()
})

// ========================= 方法 =========================

const loadPendingList = async () => {
  try {
    const { list } = await YpidApi.getManualMatchList({
      pageNo: 1,
      pageSize: 100,
      priority: 'high'
    })
    pendingList.value = list || []

    // 自动选中第一个
    if (pendingList.value.length > 0) {
      handleSelectDrug(pendingList.value[0])
    }
  } catch (error) {
    console.error('加载待匹配列表失败:', error)
  }
}

const handleBack = () => {
  router.back()
}

const handleSelectDrug = async (drug: UnmatchedDrugVO) => {
  currentDrug.value = drug
  selectedYpid.value = ''
  matchReason.value = ''
  searchPerformed.value = false

  // 重置搜索表单
  searchForm.keyword = drug.hospitalDrugName
  searchForm.ypid = ''

  // 获取匹配候选项
  try {
    const result = await YpidApi.getMatchCandidates(drug.id)
    candidates.value = result.suggestions || []
  } catch (error) {
    candidates.value = []
  }
}

const handleSearch = async () => {
  searchPerformed.value = true

  try {
    if (searchForm.searchType === 'keyword') {
      candidates.value = await YpidApi.fuzzySearch(searchForm.keyword)
    } else {
      const detail = await YpidApi.getYpidDetail(searchForm.ypid)
      candidates.value = detail ? [detail] : []
    }
  } catch (error) {
    candidates.value = []
    ElMessage.error('搜索失败')
  }
}

const handleSkip = () => {
  const currentIndex = pendingList.value.findIndex((item) => item.id === currentDrug.value?.id)
  if (currentIndex < pendingList.value.length - 1) {
    handleSelectDrug(pendingList.value[currentIndex + 1])
  } else {
    ElMessage.info('已经是最后一条数据')
  }
}

const handleNoMatch = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请说明无法匹配的原因', '无法匹配', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入原因'
    })

    // 标记为无法匹配
    ElMessage.success('已标记为无法匹配')

    // 从列表中移除
    const index = pendingList.value.findIndex((item) => item.id === currentDrug.value?.id)
    pendingList.value.splice(index, 1)

    // 选中下一条
    if (pendingList.value.length > 0) {
      handleSelectDrug(pendingList.value[Math.min(index, pendingList.value.length - 1)])
    } else {
      currentDrug.value = undefined
    }
  } catch (error) {
    // 用户取消
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    await YpidApi.submitManualMatch({
      unmatchedId: currentDrug.value!.id,
      ypid: selectedYpid.value,
      matchReason: matchReason.value
    })

    ElMessage.success('匹配成功')

    // 从列表中移除
    const index = pendingList.value.findIndex((item) => item.id === currentDrug.value?.id)
    pendingList.value.splice(index, 1)

    // 选中下一条
    if (pendingList.value.length > 0) {
      handleSelectDrug(pendingList.value[Math.min(index, pendingList.value.length - 1)])
    } else {
      currentDrug.value = undefined
      ElMessage.success('所有药品已匹配完成')
    }
  } catch (error) {
    ElMessage.error('匹配失败')
  } finally {
    submitting.value = false
  }
}

// ========================= 工具方法 =========================

const getPriorityLabel = (priority: string) => {
  const priorityMap = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return priorityMap[priority] || priority
}

const getPriorityTag = (priority: string) => {
  const tagMap = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return tagMap[priority] || 'info'
}

const getTableLabel = (table: string) => {
  const tableMap = {
    catalog: '药品目录',
    inbound: '入库情况',
    outbound: '出库情况',
    usage: '使用情况'
  }
  return tableMap[table] || table
}

const getConfidenceTag = (confidence: number) => {
  if (confidence >= 90) return 'success'
  if (confidence >= 70) return 'warning'
  return 'danger'
}
</script>

<style scoped>
.manual-match-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.pending-card,
.match-card {
  border-radius: 8px;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.pending-list {
  margin: -12px;
}

.pending-item {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #ebeef5;
  transition: all 0.3s;
}

.pending-item:hover {
  background-color: #f5f7fa;
}

.pending-item.active {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.drug-name {
  font-weight: 500;
  color: #303133;
}

.item-info {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.item-manufacturer {
  font-size: 13px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-title {
  margin: 20px 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.section-title:first-child {
  margin-top: 0;
}

.candidate-count {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.candidate-list {
  width: 100%;
}

.candidate-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.candidate-item:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.candidate-content {
  width: 100%;
}

.candidate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.ypid-code {
  font-family: monospace;
  font-weight: 600;
  color: #409eff;
}

.candidate-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.candidate-info {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.candidate-manufacturer {
  font-size: 13px;
  color: #606266;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

:deep(.el-radio) {
  width: 100%;
  height: auto;
  margin: 0;
}

:deep(.el-radio__input) {
  position: absolute;
  top: 12px;
  left: 12px;
}

:deep(.el-radio__label) {
  width: 100%;
  padding-left: 30px;
}
</style>
