<template>
  <div class="quality-rules-container">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <div class="page-title">医院质控规则管理</div>
      <div class="page-actions">
        <button class="btn btn-outline" @click="importRules">
          <i>📥</i> 导入规则
        </button>
        <button class="btn btn-outline" @click="exportRules">
          <i>📤</i> 导出规则
        </button>
        <button class="btn btn-primary" @click="openModal('add')">
          <i>➕</i> 新增规则
        </button>
      </div>
    </div>

    <!-- 规则分类 -->
    <div class="rule-categories">
      <div 
        v-for="category in ruleCategories" 
        :key="category.key"
        class="category-item"
        :class="{ active: activeCategory === category.key }"
        @click="switchCategory(category.key)"
      >
        {{ category.name }}
      </div>
    </div>

    <!-- 规则列表 -->
    <div class="card">
      <div class="rule-list-header">
        <div class="list-title">
          {{ getCategoryName(activeCategory) }} ({{ filteredRules.length }})
        </div>
        <div class="list-filter">
          <div class="filter-item">
            <select v-model="statusFilter" @change="applyFilters">
              <option value="all">所有状态</option>
              <option value="enabled">已启用</option>
              <option value="disabled">已禁用</option>
            </select>
          </div>
          <div class="filter-item">
            <select v-model="severityFilter" @change="applyFilters">
              <option value="all">所有严重程度</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
          <div class="filter-item">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="搜索规则..." 
                v-model="searchTerm"
                @input="applyFilters"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 规则项目列表 -->
      <div class="rule-list rule-list-transition" :class="{ 'fade-out': isLoading }">
        <div 
          v-for="rule in paginatedRules" 
          :key="rule.id"
          class="rule-item"
        >
          <div class="rule-content">
            <div class="rule-name">{{ rule.code }}: {{ rule.name }}</div>
            <div class="rule-description">{{ rule.description }}</div>
            <div class="rule-meta">
              <div class="meta-item">
                <i>🔖</i> {{ getCategoryName(rule.category) }}
              </div>
              <div class="meta-item">
                <i>🔍</i> 严重程度：{{ getSeverityText(rule.severity) }}
              </div>
              <div class="meta-item">
                <i>⏱</i> 更新时间：{{ rule.updateTime }}
              </div>
              <div class="meta-item">
                <i>👤</i> 更新人：{{ rule.updateUser }}
              </div>
            </div>
          </div>
          <div class="rule-actions">
            <div class="rule-status">
              <label class="switch">
                <input 
                  type="checkbox" 
                  :checked="rule.enabled"
                  @change="toggleRuleStatus(rule)"
                />
                <span class="switch-slider"></span>
              </label>
              <span 
                class="status-text"
                :class="rule.enabled ? 'status-enabled' : 'status-disabled'"
              >
                {{ rule.enabled ? '已启用' : '已禁用' }}
              </span>
            </div>
            <button class="btn-icon" title="编辑" @click="openModal('edit', rule)">✏️</button>
            <button class="btn-icon" title="查看详情" @click="openDetailsModal(rule)">👁️</button>
            <div class="dropdown">
              <button class="btn-icon">⋮</button>
              <div class="dropdown-menu">
                <div class="dropdown-item" @click="copyRule(rule)">复制规则</div>
                <div class="dropdown-item" @click="exportRule(rule)">导出规则</div>
                <div class="dropdown-item text-danger" @click="deleteRule(rule)">删除规则</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="card-footer">
        <div class="pagination">
          <div class="page-item">
            <a class="page-link" @click="changePage(currentPage - 1)" :class="{ disabled: currentPage === 1 }">
              上一页
            </a>
          </div>
          <div 
            v-for="page in visiblePages" 
            :key="page"
            class="page-item"
            :class="{ active: currentPage === page }"
          >
            <a class="page-link" @click="changePage(page)">{{ page }}</a>
          </div>
          <div class="page-item">
            <a class="page-link" @click="changePage(currentPage + 1)" :class="{ disabled: currentPage === totalPages }">
              下一页
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 规则编辑模态框 -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">{{ modalMode === 'add' ? '新增规则' : '编辑规则' }}</div>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveRule">
            <div class="form-grid">
              <div class="form-group">
                <label for="ruleCode">规则编号</label>
                <input 
                  type="text" 
                  id="ruleCode" 
                  class="form-control" 
                  v-model="currentRule.code"
                  :readonly="modalMode === 'edit'"
                  placeholder="系统自动生成"
                />
                <div class="form-hint">系统会自动分配编号，双击可手动修改</div>
              </div>
              <div class="form-group">
                <label for="ruleCategory">规则分类</label>
                <select id="ruleCategory" class="form-control" v-model="currentRule.category">
                  <option value="">请选择分类</option>
                  <option value="pre">事前质控规则</option>
                  <option value="during">事中质控规则</option>
                  <option value="post">事后质控规则</option>
                </select>
              </div>
              <div class="form-group full-width">
                <label for="ruleName">规则名称</label>
                <input 
                  type="text" 
                  id="ruleName" 
                  class="form-control" 
                  v-model="currentRule.name"
                  placeholder="请输入规则名称"
                />
              </div>
              <div class="form-group full-width">
                <label for="ruleDesc">规则描述</label>
                <textarea 
                  id="ruleDesc" 
                  class="form-control" 
                  v-model="currentRule.description"
                  placeholder="请描述规则的作用和判断依据"
                ></textarea>
              </div>
              <div class="form-group">
                <label for="ruleSeverity">严重程度</label>
                <select id="ruleSeverity" class="form-control" v-model="currentRule.severity">
                  <option value="">请选择严重程度</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div class="form-group">
                <label for="ruleStatus">规则状态</label>
                <select id="ruleStatus" class="form-control" v-model="currentRule.enabled">
                  <option :value="true">启用</option>
                  <option :value="false">禁用</option>
                </select>
              </div>
              <div class="form-group full-width">
                <label for="ruleTags">规则标签</label>
                <input 
                  type="text" 
                  id="ruleTags" 
                  class="form-control" 
                  v-model="currentRule.tags"
                  placeholder="输入标签，用逗号分隔"
                />
                <div class="form-hint">例如：药品使用,监测标准,数据质量</div>
              </div>
              <div class="form-group full-width">
                <label for="ruleLogic">规则逻辑</label>
                <div class="code-editor" contenteditable="true" v-html="currentRule.logic"></div>
                <div class="form-hint">使用JavaScript编写规则逻辑，系统将自动执行该逻辑进行质控。</div>
              </div>
              <div class="form-group full-width">
                <label>AI辅助修正建议</label>
                <select class="form-control mb-2" v-model="currentRule.aiEnabled">
                  <option :value="true">启用</option>
                  <option :value="false">禁用</option>
                </select>
                <textarea 
                  class="form-control" 
                  v-model="currentRule.aiSuggestion"
                  placeholder="当规则验证不通过时，AI将提供的修正建议内容模板"
                ></textarea>
                <div class="form-hint">可使用{field}、{value}等变量引用病例字段</div>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveRule">保存</button>
        </div>
      </div>
    </div>

    <!-- 规则详情模态框 -->
    <div v-if="showDetailsModal" class="modal-backdrop" @click.self="closeDetailsModal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">{{ selectedRule?.code }} 规则详情</div>
          <button class="modal-close" @click="closeDetailsModal">×</button>
        </div>
        <div class="modal-body">
          <div class="details-section">
            <div class="details-header">基本信息</div>
            <div class="details-grid">
              <div class="details-label">规则编号</div>
              <div class="details-value">{{ selectedRule?.code }}</div>
              
              <div class="details-label">规则名称</div>
              <div class="details-value">{{ selectedRule?.name }}</div>
              
              <div class="details-label">规则分类</div>
              <div class="details-value">{{ getCategoryName(selectedRule?.category) }}</div>
              
              <div class="details-label">严重程度</div>
              <div class="details-value">{{ getSeverityText(selectedRule?.severity) }}</div>
              
              <div class="details-label">规则状态</div>
              <div class="details-value">{{ selectedRule?.enabled ? '已启用' : '已禁用' }}</div>
              
              <div class="details-label">创建时间</div>
              <div class="details-value">{{ selectedRule?.createTime }}</div>
              
              <div class="details-label">最后更新</div>
              <div class="details-value">{{ selectedRule?.updateTime }}</div>
              
              <div class="details-label">更新人</div>
              <div class="details-value">{{ selectedRule?.updateUser }}</div>
            </div>
          </div>
          
          <div class="details-section">
            <div class="details-header">规则描述</div>
            <div class="details-content">{{ selectedRule?.description }}</div>
          </div>
          
          <div class="details-section">
            <div class="details-header">触发统计</div>
            <div class="details-content">
              <div class="details-grid">
                <div class="details-label">总触发次数</div>
                <div class="details-value">{{ selectedRule?.statistics?.totalTriggers }}次</div>
                
                <div class="details-label">过去30天触发</div>
                <div class="details-value">{{ selectedRule?.statistics?.monthlyTriggers }}次</div>
                
                <div class="details-label">未处理问题</div>
                <div class="details-value">{{ selectedRule?.statistics?.pendingIssues }}个</div>
                
                <div class="details-label">有效率</div>
                <div class="details-value">{{ selectedRule?.statistics?.effectiveRate }}%</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeDetailsModal">关闭</button>
          <button class="btn btn-primary" @click="openModal('edit', selectedRule)">编辑规则</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, reactive } from 'vue'

// 类型定义
interface QualityRule {
  id: string
  code: string
  name: string
  description: string
  category: 'all' | 'pre' | 'during' | 'post'
  severity: 'high' | 'medium' | 'low'
  enabled: boolean
  tags: string
  logic: string
  aiEnabled: boolean
  aiSuggestion: string
  createTime: string
  updateTime: string
  updateUser: string
  statistics: {
    totalTriggers: number
    monthlyTriggers: number
    pendingIssues: number
    effectiveRate: number
  }
}

interface RuleCategory {
  key: 'all' | 'pre' | 'during' | 'post'
  name: string
}

// 响应式数据
const rules = ref<QualityRule[]>([])
const activeCategory = ref<'all' | 'pre' | 'during' | 'post'>('all')
const statusFilter = ref('all')
const severityFilter = ref('all')
const searchTerm = ref('')
const isLoading = ref(false)
const showModal = ref(false)
const showDetailsModal = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const selectedRule = ref<QualityRule | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)

// 规则分类配置
const ruleCategories: RuleCategory[] = [
  { key: 'all', name: '全部规则' },
  { key: 'pre', name: '事前质控规则' },
  { key: 'during', name: '事中质控规则' },
  { key: 'post', name: '事后质控规则' }
]

// 当前编辑的规则
const currentRule = reactive<Partial<QualityRule>>({
  id: '',
  code: '',
  name: '',
  description: '',
  category: 'pre',
  severity: 'medium',
  enabled: true,
  tags: '',
  logic: '',
  aiEnabled: true,
  aiSuggestion: '',
  createTime: '',
  updateTime: '',
  updateUser: '管理员'
})

// 计算属性
const filteredRules = computed(() => {
  let filtered = rules.value

  // 分类过滤
  if (activeCategory.value !== 'all') {
    filtered = filtered.filter(rule => rule.category === activeCategory.value)
  }

  // 状态过滤
  if (statusFilter.value !== 'all') {
    const enabled = statusFilter.value === 'enabled'
    filtered = filtered.filter(rule => rule.enabled === enabled)
  }

  // 严重程度过滤
  if (severityFilter.value !== 'all') {
    filtered = filtered.filter(rule => rule.severity === severityFilter.value)
  }

  // 搜索过滤
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(rule => 
      rule.name.toLowerCase().includes(term) ||
      rule.code.toLowerCase().includes(term) ||
      rule.description.toLowerCase().includes(term)
    )
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredRules.value.length / pageSize.value))

const paginatedRules = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRules.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...', total)
    } else if (current >= total - 3) {
      pages.push(1, '...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total)
    }
  }
  
  return pages
})

// 方法
const initializeData = () => {
  // 模拟数据 - 基于医疗卫生机构药品使用监测等标准
  rules.value = [
    {
      id: '1',
      code: 'PRE001',
      name: '药品使用监测基本数据完整性验证',
      description: '根据《医疗卫生机构药品使用监测基本数据集标准》，验证药品使用监测基本数据集的完整性，包括患者基本信息、诊断信息、用药信息等必要字段的完整性检查。',
      category: 'pre',
      severity: 'high',
      enabled: true,
      tags: '数据完整性,药品监测,基本数据集',
      logic: `function validateDrugMonitoringData(record) {
  const requiredFields = ['patientId', 'diagnosis', 'drugCode', 'drugName', 'dosage'];
  for (let field of requiredFields) {
    if (!record[field]) {
      return { valid: false, message: \`必填字段\${field}不能为空\`, severity: 'high' };
    }
  }
  return { valid: true };
}`,
      aiEnabled: true,
      aiSuggestion: '建议补充完整的{field}信息，确保符合国家药品使用监测标准要求',
      createTime: '2025-03-15',
      updateTime: '2025-04-20',
      updateUser: '管理员',
      statistics: {
        totalTriggers: 1253,
        monthlyTriggers: 127,
        pendingIssues: 18,
        effectiveRate: 92.4
      }
    },
    {
      id: '2',
      code: 'PRE002',
      name: '国家药品信息标准库编码规范性检查',
      description: '基于《2024国家药品信息标准库V11.0》，检查药品编码是否符合国家标准，验证药品名称与编码的一致性，确保药品信息标准化。',
      category: 'pre',
      severity: 'high',
      enabled: true,
      tags: '药品编码,标准库,规范性检查',
      logic: `function validateDrugCodeStandard(record) {
  const drugCode = record.drugCode;
  const drugName = record.drugName;
  if (!drugCode || !drugCode.match(/^[A-Z]\\d{8}$/)) {
    return { valid: false, message: '药品编码格式不符合国家标准', severity: 'high' };
  }
  return { valid: true };
}`,
      aiEnabled: true,
      aiSuggestion: '建议使用标准的药品编码格式，参考国家药品信息标准库V11.0',
      createTime: '2025-03-18',
      updateTime: '2025-04-18',
      updateUser: '王质控',
      statistics: {
        totalTriggers: 890,
        monthlyTriggers: 95,
        pendingIssues: 12,
        effectiveRate: 94.1
      }
    },
    {
      id: '3',
      code: 'DUR001',
      name: '实时药品相互作用监测',
      description: '在医生开具处方过程中，实时监测药品之间的相互作用，根据《全国公立医疗卫生机构药品使用监测管理标准》要求，及时提醒潜在的药物相互作用风险。',
      category: 'during',
      severity: 'high',
      enabled: true,
      tags: '药物相互作用,实时监测,用药安全',
      logic: `function checkDrugInteraction(prescriptions) {
  const interactions = getDrugInteractionDatabase();
  for (let i = 0; i < prescriptions.length; i++) {
    for (let j = i + 1; j < prescriptions.length; j++) {
      const interaction = interactions.check(prescriptions[i].drugCode, prescriptions[j].drugCode);
      if (interaction && interaction.severity === 'severe') {
        return { valid: false, message: \`严重药物相互作用：\${interaction.description}\`, severity: 'high' };
      }
    }
  }
  return { valid: true };
}`,
      aiEnabled: true,
      aiSuggestion: '检测到药物相互作用，建议调整用药方案或加强监测',
      createTime: '2025-03-20',
      updateTime: '2025-04-15',
      updateUser: '李审核',
      statistics: {
        totalTriggers: 567,
        monthlyTriggers: 78,
        pendingIssues: 5,
        effectiveRate: 96.8
      }
    },
    {
      id: '4',
      code: 'DUR002',
      name: '用药剂量合理性实时校验',
      description: '在医疗行为实施过程中，根据患者年龄、体重、肾功能等因素，实时校验药品使用剂量的合理性，防止用药过量或不足。',
      category: 'during',
      severity: 'medium',
      enabled: true,
      tags: '用药剂量,合理性校验,患者安全',
      logic: `function validateDosage(patient, prescription) {
  const standardDosage = getDosageStandard(prescription.drugCode, patient.age, patient.weight);
  const prescribedDosage = prescription.dailyDosage;
  if (prescribedDosage > standardDosage.max) {
    return { valid: false, message: '处方剂量超过安全范围', severity: 'high' };
  }
  if (prescribedDosage < standardDosage.min) {
    return { valid: false, message: '处方剂量可能不足', severity: 'medium' };
  }
  return { valid: true };
}`,
      aiEnabled: true,
      aiSuggestion: '建议根据患者{age}岁，体重{weight}kg的情况，调整剂量至{recommendedDosage}',
      createTime: '2025-03-22',
      updateTime: '2025-04-12',
      updateUser: '张医生',
      statistics: {
        totalTriggers: 1156,
        monthlyTriggers: 134,
        pendingIssues: 23,
        effectiveRate: 89.7
      }
    },
    {
      id: '5',
      code: 'POST001',
      name: '药品使用监测数据质量评估',
      description: '医疗行为完成后，对药品使用监测数据进行质量评估，识别数据异常、缺失或不合理的情况，为持续改进提供数据支撑。',
      category: 'post',
      severity: 'medium',
      enabled: true,
      tags: '数据质量,监测评估,持续改进',
      logic: `function assessDataQuality(monitoringData) {
  let qualityScore = 100;
  let issues = [];
  
  // 检查数据完整性
  const completeness = calculateCompleteness(monitoringData);
  if (completeness < 0.95) {
    qualityScore -= (0.95 - completeness) * 50;
    issues.push('数据完整性不足');
  }
  
  // 检查数据一致性
  const consistency = checkDataConsistency(monitoringData);
  if (!consistency.valid) {
    qualityScore -= 20;
    issues.push(consistency.message);
  }
  
  return {
    valid: qualityScore >= 80,
    score: qualityScore,
    issues: issues,
    severity: qualityScore < 60 ? 'high' : qualityScore < 80 ? 'medium' : 'low'
  };
}`,
      aiEnabled: true,
      aiSuggestion: '数据质量评分较低，建议重点关注{issues}问题，提升数据质量',
      createTime: '2025-03-25',
      updateTime: '2025-04-10',
      updateUser: '管理员',
      statistics: {
        totalTriggers: 789,
        monthlyTriggers: 67,
        pendingIssues: 8,
        effectiveRate: 91.2
      }
    },
    {
      id: '6',
      code: 'POST002',
      name: '药品使用趋势异常分析',
      description: '通过回顾性分析，识别药品使用趋势中的异常模式，包括用药量突增、不合理用药组合等，为医院药事管理决策提供依据。',
      category: 'post',
      severity: 'low',
      enabled: true,
      tags: '趋势分析,异常检测,药事管理',
      logic: `function analyzeDrugUsageTrend(usageData, timeRange) {
  const baseline = calculateBaseline(usageData, timeRange);
  const currentUsage = getCurrentUsage(usageData);
  
  for (let drug of currentUsage) {
    const variance = Math.abs(drug.usage - baseline[drug.code]) / baseline[drug.code];
    if (variance > 0.5) {
      return {
        valid: false,
        message: \`药品\${drug.name}使用量异常变化\${(variance * 100).toFixed(1)}%\`,
        severity: variance > 1.0 ? 'high' : 'medium'
      };
    }
  }
  
  return { valid: true };
}`,
      aiEnabled: true,
      aiSuggestion: '检测到{drugName}使用异常，建议分析原因并制定相应管理措施',
      createTime: '2025-03-28',
      updateTime: '2025-04-08',
      updateUser: '陈医保',
      statistics: {
        totalTriggers: 234,
        monthlyTriggers: 28,
        pendingIssues: 3,
        effectiveRate: 87.6
      }
    }
  ]
}

const getCategoryName = (category: string | undefined): string => {
  const categoryMap: Record<string, string> = {
    'all': '全部规则',
    'pre': '事前质控规则',
    'during': '事中质控规则',
    'post': '事后质控规则'
  }
  return categoryMap[category || 'all'] || '未知分类'
}

const getSeverityText = (severity: string | undefined): string => {
  const severityMap: Record<string, string> = {
    'high': '高',
    'medium': '中',
    'low': '低'
  }
  return severityMap[severity || 'medium'] || '中'
}

const switchCategory = (category: 'all' | 'pre' | 'during' | 'post') => {
  isLoading.value = true
  activeCategory.value = category
  currentPage.value = 1
  
  setTimeout(() => {
    isLoading.value = false
  }, 300)
}

const applyFilters = () => {
  currentPage.value = 1
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const openModal = (mode: 'add' | 'edit', rule?: QualityRule) => {
  modalMode.value = mode
  showModal.value = true
  showDetailsModal.value = false
  
  if (mode === 'add') {
    Object.assign(currentRule, {
      id: '',
      code: generateRuleCode(),
      name: '',
      description: '',
      category: 'pre',
      severity: 'medium',
      enabled: true,
      tags: '',
      logic: getDefaultRuleLogic(),
      aiEnabled: true,
      aiSuggestion: '',
      createTime: new Date().toISOString().split('T')[0],
      updateTime: new Date().toISOString().split('T')[0],
      updateUser: '管理员'
    })
  } else if (rule) {
    Object.assign(currentRule, { ...rule })
  }
}

const closeModal = () => {
  showModal.value = false
}

const saveRule = () => {
  if (!currentRule.name || !currentRule.description || !currentRule.category) {
    alert('请填写必要信息')
    return
  }
  
  if (modalMode.value === 'add') {
    const newRule: QualityRule = {
      ...currentRule as QualityRule,
      id: Date.now().toString(),
      statistics: {
        totalTriggers: 0,
        monthlyTriggers: 0,
        pendingIssues: 0,
        effectiveRate: 0
      }
    }
    rules.value.push(newRule)
  } else {
    const index = rules.value.findIndex(r => r.id === currentRule.id)
    if (index !== -1) {
      rules.value[index] = { ...rules.value[index], ...currentRule as QualityRule }
    }
  }
  
  closeModal()
  alert('规则保存成功！')
}

const openDetailsModal = (rule: QualityRule) => {
  selectedRule.value = rule
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedRule.value = null
}

const toggleRuleStatus = (rule: QualityRule) => {
  rule.enabled = !rule.enabled
  rule.updateTime = new Date().toISOString().split('T')[0]
}

const generateRuleCode = (): string => {
  const prefix = activeCategory.value === 'pre' ? 'PRE' : 
                activeCategory.value === 'during' ? 'DUR' : 'POST'
  const number = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')
  return `${prefix}${number}`
}

const getDefaultRuleLogic = (): string => {
  return `<span class="code-comment">// 示例规则逻辑（JavaScript格式）</span>
<span class="code-keyword">function</span> <span class="code-function">validateRule</span>(record) {
    <span class="code-comment">// 在此处编写您的规则逻辑</span>
    <span class="code-keyword">if</span> (!record.requiredField) {
        <span class="code-keyword">return</span> {
            valid: <span class="code-keyword">false</span>,
            message: <span class="code-string">"必填字段不能为空"</span>,
            severity: <span class="code-string">"high"</span>
        };
    }
    
    <span class="code-keyword">return</span> { valid: <span class="code-keyword">true</span> };
}`
}

// 操作方法
const importRules = () => {
  alert('导入规则功能')
}

const exportRules = () => {
  alert('导出规则功能')
}

const copyRule = (rule: QualityRule) => {
  alert(`复制规则: ${rule.name}`)
}

const exportRule = (rule: QualityRule) => {
  alert(`导出规则: ${rule.name}`)
}

const deleteRule = (rule: QualityRule) => {
  if (confirm(`确定要删除规则 "${rule.name}" 吗？`)) {
    const index = rules.value.findIndex(r => r.id === rule.id)
    if (index !== -1) {
      rules.value.splice(index, 1)
      alert('规则删除成功')
    }
  }
}

// 初始化
onMounted(() => {
  initializeData()
})
</script>

<style scoped>


/* 响应式设计 */
@media (width <= 768px) {
  .quality-rules-container {
    padding: 8px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .page-actions {
    justify-content: center;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .rule-categories {
    overflow-x: auto;
  }
  
  .category-item {
    min-width: 100px;
    padding: 12px 8px;
  }
  
  .rule-list-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .list-filter {
    justify-content: center;
  }
  
  .rule-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .rule-actions {
    justify-content: space-between;
  }
  
  .modal-container {
    width: 95%;
    margin: 20px;
  }
}

.quality-rules-container {
  min-height: 100vh;
  padding: 16px;
  font-family: "Microsoft YaHei", "Segoe UI", sans-serif;
  background-color: #F5F7FA;
}

/* 页面标题栏 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #212121;
}

.page-actions {
  display: flex;
}

/* 按钮样式 */
.btn {
  display: flex;
  padding: 8px 14px;
  margin-left: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  transition: all 0.3s;
  align-items: center;
}

.btn i {
  margin-right: 6px;
  font-size: 14px;
}

.btn-primary {
  color: white;
  background-color: #1976D2;
}

.btn-primary:hover {
  background-color: #0D47A1;
}

.btn-outline {
  color: #1976D2;
  background-color: white;
  border: 1px solid #1976D2;
}

.btn-outline:hover {
  background-color: #F5F7FA;
}

/* 规则分类样式 */
.rule-categories {
  display: flex;
  margin-bottom: 16px;
  overflow: hidden;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
}

.category-item {
  padding: 12px;
  font-size: 13px;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
  flex: 1;
}

.category-item.active {
  font-weight: 500;
  color: #1976D2;
  border-bottom: 2px solid #1976D2;
}

.category-item:hover {
  background-color: #F5F7FA;
}

/* 卡片样式 */
.card {
  margin-bottom: 16px;
  overflow: hidden;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
}

/* 规则列表头部 */
.rule-list-header {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #E0E0E0;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.list-title {
  font-size: 15px;
  font-weight: 600;
}

.list-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-item {
  margin-left: 8px;
}

.filter-item select,
.filter-item input {
  padding: 7px 10px;
  font-size: 13px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
}

/* 搜索框样式 */
.search-box {
  position: relative;
}

.search-box input {
  padding-right: 10px;
  padding-left: 32px;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  color: #9E9E9E;
  transform: translateY(-50%);
}

/* 规则列表样式 */
.rule-list {
  transition: opacity 0.3s ease-in-out;
}

.rule-list.fade-out {
  opacity: 0;
}

.rule-item {
  display: flex;
  padding: 16px;
  border-bottom: 1px solid #E0E0E0;
  transition: background-color 0.3s;
}

.rule-item:hover {
  background-color: #F5F7FA;
}

.rule-item:last-child {
  border-bottom: none;
}

.rule-content {
  flex-grow: 1;
}

.rule-name {
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 500;
  color: #212121;
}

.rule-description {
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.4;
  color: #757575;
}

.rule-meta {
  display: flex;
  font-size: 12px;
  color: #9E9E9E;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  margin-right: 16px;
  margin-bottom: 4px;
}

.meta-item i {
  margin-right: 4px;
}

/* 规则操作区域 */
.rule-actions {
  display: flex;
  align-items: center;
}

.rule-status {
  display: flex;
  align-items: center;
  margin-right: 12px;
}

.status-text {
  margin-left: 8px;
  font-size: 12px;
}

.status-enabled {
  color: #4CAF50;
}

.status-disabled {
  color: #9E9E9E;
}

/* 开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.switch input {
  width: 0;
  height: 0;
  opacity: 0;
}

.switch-slider {
  position: absolute;
  inset: 0;
  cursor: pointer;
  background-color: #E0E0E0;
  border-radius: 20px;
  transition: 0.4s;
}

.switch-slider::before {
  position: absolute;
  bottom: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background-color: white;
  border-radius: 50%;
  content: "";
  transition: 0.4s;
}

.switch input:checked + .switch-slider {
  background-color: #4CAF50;
}

.switch input:checked + .switch-slider::before {
  transform: translateX(16px);
}

/* 按钮图标样式 */
.btn-icon {
  display: flex;
  width: 32px;
  height: 32px;
  margin-left: 8px;
  color: #757575;
  cursor: pointer;
  background-color: #F5F7FA;
  border: none;
  border-radius: 4px;
  transition: background-color 0.3s;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background-color: #E0E0E0;
}

/* 下拉菜单样式 */
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 10;
  display: none;
  min-width: 120px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgb(0 0 0 / 10%);
}

.dropdown:hover .dropdown-menu {
  display: block;
}

.dropdown-item {
  padding: 8px 12px;
  font-size: 13px;
  color: #212121;
  cursor: pointer;
  transition: background-color 0.3s;
}

.dropdown-item:hover {
  background-color: #F5F7FA;
}

.dropdown-item.text-danger {
  color: #F44336;
}

/* 分页样式 */
.card-footer {
  display: flex;
  padding: 12px 16px;
  border-top: 1px solid #E0E0E0;
  justify-content: center;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-item {
  margin: 0 2px;
}

.page-link {
  display: block;
  padding: 6px 10px;
  font-size: 12px;
  color: #1976D2;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  transition: all 0.3s;
}

.page-link:hover {
  background-color: #F5F7FA;
}

.page-item.active .page-link {
  color: white;
  background-color: #1976D2;
  border-color: #1976D2;
}

.page-link.disabled {
  color: #ccc;
  cursor: not-allowed;
}

/* 模态框样式 */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  background-color: rgb(0 0 0 / 50%);
  align-items: center;
  justify-content: center;
}

.modal-container {
  width: 800px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 5px 20px rgb(0 0 0 / 20%);
}

.modal-header {
  display: flex;
  padding: 16px;
  border-bottom: 1px solid #E0E0E0;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
}

.modal-close {
  font-size: 20px;
  color: #757575;
  cursor: pointer;
  background: none;
  border: none;
}

.modal-body {
  padding: 16px;
}

.modal-footer {
  display: flex;
  padding: 12px 16px;
  border-top: 1px solid #E0E0E0;
  justify-content: flex-end;
}

/* 表单样式 */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #212121;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-control:focus {
  border-color: #1976D2;
  outline: none;
  box-shadow: 0 0 0 2px rgb(25 118 210 / 10%);
}

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #757575;
}

.mb-2 {
  margin-bottom: 8px;
}

/* 代码编辑器样式 */
.code-editor {
  min-height: 180px;
  padding: 12px;
  overflow: auto;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #333;
  background-color: #F5F7FA;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
}

.code-keyword {
  font-weight: bold;
  color: #0033B3;
}

.code-string {
  color: #008000;
}

.code-comment {
  font-style: italic;
  color: #808080;
}

.code-function {
  color: #7D26CD;
}

/* 详情模态框样式 */
.details-section {
  margin-bottom: 20px;
}

.details-header {
  padding-bottom: 5px;
  margin-bottom: 10px;
  font-weight: 600;
  border-bottom: 1px solid #E0E0E0;
}

.details-content {
  font-size: 13px;
  line-height: 1.5;
}

.details-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.details-label {
  font-size: 12px;
  color: #757575;
}

.details-value {
  font-size: 13px;
}

/* 引入原始样式并进行适配 */
</style>