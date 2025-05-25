<template>
  <div class="audit-settings-container">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <div class="page-title">质控审核设置</div>
      <div class="page-actions">
        <button class="btn btn-outline" @click="resetToDefault">
          <i>🔄</i> 恢复默认
        </button>
        <button class="btn btn-outline" @click="exportSettings">
          <i>📤</i> 导出配置
        </button>
        <button class="btn btn-primary" @click="saveAllSettings">
          <i>💾</i> 保存所有设置
        </button>
      </div>
    </div>

    <!-- 设置分类导航 -->
    <div class="settings-categories">
      <div 
        v-for="category in settingsCategories" 
        :key="category.key"
        class="category-item"
        :class="{ active: activeCategory === category.key }"
        @click="switchCategory(category.key)"
      >
        <i>{{ category.icon }}</i>
        <span>{{ category.name }}</span>
      </div>
    </div>

    <!-- 设置内容区域 -->
    <div class="settings-main">
      <!-- 自动审核设置 -->
      <div v-show="activeCategory === 'auto'" class="settings-section">
        <div class="card">
          <div class="card-header">
            <div class="card-title">自动审核配置</div>
            <div class="card-actions">
              <span class="status-indicator" :class="autoAuditSettings.enabled ? 'active' : 'inactive'">
                {{ autoAuditSettings.enabled ? '已启用' : '已禁用' }}
              </span>
            </div>
          </div>
          <div class="card-body">
            <div class="settings-grid">
              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">启用自动审核</label>
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      v-model="autoAuditSettings.enabled"
                      @change="onAutoAuditToggle"
                    />
                    <span class="switch-slider"></span>
                  </label>
                </div>
                <div class="setting-description">
                  系统自动对新增病例进行质控审核，提高审核效率和准确性
                </div>
              </div>

              <div class="setting-item" :class="{ disabled: !autoAuditSettings.enabled }">
                <div class="setting-header">
                  <label class="setting-label">自动审核频率</label>
                </div>
                <div class="setting-control">
                  <select 
                    class="form-control" 
                    v-model="autoAuditSettings.frequency"
                    :disabled="!autoAuditSettings.enabled"
                  >
                    <option value="realtime">实时审核</option>
                    <option value="hourly">每小时审核</option>
                    <option value="daily">每天审核</option>
                    <option value="manual">手动触发</option>
                  </select>
                </div>
                <div class="setting-description">
                  设置系统执行自动审核的时间间隔
                </div>
              </div>

              <div class="setting-item" :class="{ disabled: !autoAuditSettings.enabled }">
                <div class="setting-header">
                  <label class="setting-label">审核优先级规则</label>
                </div>
                <div class="setting-control">
                  <select 
                    class="form-control" 
                    v-model="autoAuditSettings.priority"
                    :disabled="!autoAuditSettings.enabled"
                  >
                    <option value="admission">按入院顺序</option>
                    <option value="discharge">按出院顺序</option>
                    <option value="department">重点科室优先</option>
                    <option value="disease">重点病种优先</option>
                    <option value="urgency">紧急程度优先</option>
                  </select>
                </div>
                <div class="setting-description">
                  确定系统自动审核病例的优先顺序
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">启用AI辅助审核</label>
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      v-model="autoAuditSettings.aiAssisted"
                      @change="onAIAssistedToggle"
                    />
                    <span class="switch-slider"></span>
                  </label>
                </div>
                <div class="setting-description">
                  使用人工智能技术辅助审核决策和问题识别，提高审核精准度
                </div>
              </div>

              <div class="setting-item" :class="{ disabled: !autoAuditSettings.aiAssisted }">
                <div class="setting-header">
                  <label class="setting-label">AI自动修正权限</label>
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      v-model="autoAuditSettings.aiAutoCorrect"
                      :disabled="!autoAuditSettings.aiAssisted"
                    />
                    <span class="switch-slider"></span>
                  </label>
                </div>
                <div class="setting-description">
                  对于明确的问题，允许AI系统直接进行修正，无需人工干预
                </div>
              </div>

              <div class="setting-item" :class="{ disabled: !autoAuditSettings.aiAssisted }">
                <div class="setting-header">
                  <label class="setting-label">AI置信度阈值</label>
                </div>
                <div class="setting-control">
                  <div class="slider-container">
                    <input 
                      type="range" 
                      class="slider" 
                      min="50" 
                      max="100" 
                      v-model="autoAuditSettings.aiConfidenceThreshold"
                      :disabled="!autoAuditSettings.aiAssisted"
                    />
                    <div class="slider-value">{{ autoAuditSettings.aiConfidenceThreshold }}%</div>
                  </div>
                </div>
                <div class="setting-description">
                  AI判断置信度低于此阈值的问题将转由人工审核
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" @click="saveAutoAuditSettings">
              保存自动审核设置
            </button>
          </div>
        </div>
      </div>

      <!-- 审核流程设置 -->
      <div v-show="activeCategory === 'workflow'" class="settings-section">
        <div class="card">
          <div class="card-header">
            <div class="card-title">审核流程配置</div>
            <div class="card-actions">
              <button class="btn btn-sm btn-outline" @click="previewWorkflow">
                <i>👁️</i> 预览流程
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="settings-grid">
              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">审核流程类型</label>
                </div>
                <div class="setting-control">
                  <div class="radio-group">
                    <label class="radio-item">
                      <input 
                        type="radio" 
                        value="single" 
                        v-model="workflowSettings.type"
                        @change="onWorkflowTypeChange"
                      />
                      <span class="radio-label">单人审核</span>
                      <span class="radio-description">一名质控人员完成全部审核</span>
                    </label>
                    <label class="radio-item">
                      <input 
                        type="radio" 
                        value="double" 
                        v-model="workflowSettings.type"
                        @change="onWorkflowTypeChange"
                      />
                      <span class="radio-label">双人审核</span>
                      <span class="radio-description">两名质控人员交叉审核</span>
                    </label>
                    <label class="radio-item">
                      <input 
                        type="radio" 
                        value="triple" 
                        v-model="workflowSettings.type"
                        @change="onWorkflowTypeChange"
                      />
                      <span class="radio-label">三级审核</span>
                      <span class="radio-description">初审、复审、终审三级流程</span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">问题处理时限</label>
                </div>
                <div class="setting-control">
                  <div class="input-group">
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model="workflowSettings.timeLimit"
                      min="1" 
                      max="168"
                    />
                    <span class="input-group-text">小时</span>
                  </div>
                </div>
                <div class="setting-description">
                  超过时限未处理的问题将自动升级提醒相关负责人
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">启用审核退回</label>
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      v-model="workflowSettings.allowReturn"
                    />
                    <span class="switch-slider"></span>
                  </label>
                </div>
                <div class="setting-description">
                  允许质控人员将有问题的病例退回给医师进行修改
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">启用自动分配</label>
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      v-model="workflowSettings.autoAssign"
                      @change="onAutoAssignToggle"
                    />
                    <span class="switch-slider"></span>
                  </label>
                </div>
                <div class="setting-description">
                  系统根据工作负载自动分配审核任务给质控人员
                </div>
              </div>

              <div class="setting-item" :class="{ disabled: !workflowSettings.autoAssign }">
                <div class="setting-header">
                  <label class="setting-label">分配策略</label>
                </div>
                <div class="setting-control">
                  <select 
                    class="form-control" 
                    v-model="workflowSettings.assignStrategy"
                    :disabled="!workflowSettings.autoAssign"
                  >
                    <option value="round-robin">轮询分配</option>
                    <option value="workload">负载均衡</option>
                    <option value="expertise">专业匹配</option>
                    <option value="random">随机分配</option>
                  </select>
                </div>
                <div class="setting-description">
                  选择系统自动分配任务的策略算法
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">启用质控评分</label>
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      v-model="workflowSettings.enableScoring"
                      @change="onScoringToggle"
                    />
                    <span class="switch-slider"></span>
                  </label>
                </div>
                <div class="setting-description">
                  对每份病例进行质量评分，生成质控统计报告
                </div>
              </div>

              <div class="setting-item" :class="{ disabled: !workflowSettings.enableScoring }">
                <div class="setting-header">
                  <label class="setting-label">评分标准</label>
                </div>
                <div class="setting-control">
                  <select 
                    class="form-control" 
                    v-model="workflowSettings.scoringStandard"
                    :disabled="!workflowSettings.enableScoring"
                  >
                    <option value="national">国家标准</option>
                    <option value="provincial">省级标准</option>
                    <option value="hospital">医院标准</option>
                    <option value="custom">自定义标准</option>
                  </select>
                </div>
                <div class="setting-description">
                  选择质控评分使用的标准体系
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" @click="saveWorkflowSettings">
              保存流程设置
            </button>
          </div>
        </div>
      </div>

      <!-- 通知设置 -->
      <div v-show="activeCategory === 'notification'" class="settings-section">
        <div class="card">
          <div class="card-header">
            <div class="card-title">审核通知配置</div>
          </div>
          <div class="card-body">
            <div class="settings-grid">
              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">问题发现通知</label>
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      v-model="notificationSettings.issueFound"
                    />
                    <span class="switch-slider"></span>
                  </label>
                </div>
                <div class="setting-description">
                  新的质控问题被发现时立即通知相关医师和质控人员
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">处理时限提醒</label>
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      v-model="notificationSettings.deadlineReminder"
                    />
                    <span class="switch-slider"></span>
                  </label>
                </div>
                <div class="setting-description">
                  问题接近处理时限时发送提醒通知
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">任务分配通知</label>
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      v-model="notificationSettings.taskAssignment"
                    />
                    <span class="switch-slider"></span>
                  </label>
                </div>
                <div class="setting-description">
                  新任务分配时通知相关质控人员
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">审核完成通知</label>
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      v-model="notificationSettings.auditComplete"
                    />
                    <span class="switch-slider"></span>
                  </label>
                </div>
                <div class="setting-description">
                  审核完成时通知病案管理人员和科室负责人
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">通知方式</label>
                </div>
                <div class="setting-control">
                  <div class="checkbox-group">
                    <label class="checkbox-item">
                      <input 
                        type="checkbox" 
                        v-model="notificationSettings.methods.system"
                      />
                      <span class="checkbox-label">系统通知</span>
                    </label>
                    <label class="checkbox-item">
                      <input 
                        type="checkbox" 
                        v-model="notificationSettings.methods.email"
                      />
                      <span class="checkbox-label">邮件通知</span>
                    </label>
                    <label class="checkbox-item">
                      <input 
                        type="checkbox" 
                        v-model="notificationSettings.methods.sms"
                      />
                      <span class="checkbox-label">短信通知</span>
                    </label>
                    <label class="checkbox-item">
                      <input 
                        type="checkbox" 
                        v-model="notificationSettings.methods.oa"
                      />
                      <span class="checkbox-label">OA系统</span>
                    </label>
                  </div>
                </div>
                <div class="setting-description">
                  选择接收通知的方式，可以多选
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" @click="saveNotificationSettings">
              保存通知设置
            </button>
          </div>
        </div>
      </div>

      <!-- 高级设置 -->
      <div v-show="activeCategory === 'advanced'" class="settings-section">
        <div class="card">
          <div class="card-header">
            <div class="card-title">高级审核配置</div>
            <div class="card-actions">
              <button class="btn btn-sm btn-outline text-warning" @click="showAdvancedWarning">
                <i>⚠️</i> 高级设置
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="settings-grid">
              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">并发审核数量</label>
                </div>
                <div class="setting-control">
                  <div class="input-group">
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model="advancedSettings.concurrentAudits"
                      min="1" 
                      max="20"
                    />
                    <span class="input-group-text">个</span>
                  </div>
                </div>
                <div class="setting-description">
                  系统同时处理的审核任务数量，影响系统性能
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">审核超时时间</label>
                </div>
                <div class="setting-control">
                  <div class="input-group">
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model="advancedSettings.auditTimeout"
                      min="30" 
                      max="300"
                    />
                    <span class="input-group-text">秒</span>
                  </div>
                </div>
                <div class="setting-description">
                  单个病例审核的最大耗时，超时将跳过该病例
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">启用调试模式</label>
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      v-model="advancedSettings.debugMode"
                    />
                    <span class="switch-slider"></span>
                  </label>
                </div>
                <div class="setting-description">
                  启用详细日志记录，用于问题诊断和系统优化
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-header">
                  <label class="setting-label">数据缓存策略</label>
                </div>
                <div class="setting-control">
                  <select class="form-control" v-model="advancedSettings.cacheStrategy">
                    <option value="aggressive">积极缓存</option>
                    <option value="moderate">适度缓存</option>
                    <option value="conservative">保守缓存</option>
                    <option value="disabled">禁用缓存</option>
                  </select>
                </div>
                <div class="setting-description">
                  调整系统数据缓存策略，平衡性能和数据实时性
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-warning" @click="saveAdvancedSettings">
              保存高级设置
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置预览弹窗 -->
    <div v-if="showPreviewModal" class="modal-backdrop" @click.self="closePreviewModal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">审核流程预览</div>
          <button class="modal-close" @click="closePreviewModal">×</button>
        </div>
        <div class="modal-body">
          <div class="workflow-preview">
            <div class="workflow-step" v-for="(step, index) in workflowSteps" :key="index">
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-content">
                <div class="step-title">{{ step.title }}</div>
                <div class="step-description">{{ step.description }}</div>
              </div>
              <div v-if="index < workflowSteps.length - 1" class="step-arrow">→</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closePreviewModal">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, reactive } from 'vue'

// 类型定义
interface SettingsCategory {
  key: 'auto' | 'workflow' | 'notification' | 'advanced'
  name: string
  icon: string
}

interface AutoAuditSettings {
  enabled: boolean
  frequency: string
  priority: string
  aiAssisted: boolean
  aiAutoCorrect: boolean
  aiConfidenceThreshold: number
}

interface WorkflowSettings {
  type: string
  timeLimit: number
  allowReturn: boolean
  autoAssign: boolean
  assignStrategy: string
  enableScoring: boolean
  scoringStandard: string
}

interface NotificationSettings {
  issueFound: boolean
  deadlineReminder: boolean
  taskAssignment: boolean
  auditComplete: boolean
  methods: {
    system: boolean
    email: boolean
    sms: boolean
    oa: boolean
  }
}

interface AdvancedSettings {
  concurrentAudits: number
  auditTimeout: number
  debugMode: boolean
  cacheStrategy: string
}

interface WorkflowStep {
  title: string
  description: string
}

// 响应式数据
const activeCategory = ref<'auto' | 'workflow' | 'notification' | 'advanced'>('auto')
const showPreviewModal = ref(false)

// 设置分类
const settingsCategories: SettingsCategory[] = [
  { key: 'auto', name: '自动审核', icon: '🤖' },
  { key: 'workflow', name: '审核流程', icon: '🔄' },
  { key: 'notification', name: '通知设置', icon: '🔔' },
  { key: 'advanced', name: '高级设置', icon: '⚙️' }
]

// 自动审核设置
const autoAuditSettings = reactive<AutoAuditSettings>({
  enabled: true,
  frequency: 'hourly',
  priority: 'discharge',
  aiAssisted: true,
  aiAutoCorrect: false,
  aiConfidenceThreshold: 85
})

// 审核流程设置
const workflowSettings = reactive<WorkflowSettings>({
  type: 'double',
  timeLimit: 24,
  allowReturn: true,
  autoAssign: true,
  assignStrategy: 'workload',
  enableScoring: true,
  scoringStandard: 'national'
})

// 通知设置
const notificationSettings = reactive<NotificationSettings>({
  issueFound: true,
  deadlineReminder: true,
  taskAssignment: true,
  auditComplete: true,
  methods: {
    system: true,
    email: true,
    sms: false,
    oa: true
  }
})

// 高级设置
const advancedSettings = reactive<AdvancedSettings>({
  concurrentAudits: 5,
  auditTimeout: 120,
  debugMode: false,
  cacheStrategy: 'moderate'
})

// 计算属性
const workflowSteps = computed<WorkflowStep[]>(() => {
  const baseSteps: WorkflowStep[] = [
    { title: '病例提交', description: '医师完成病例录入并提交' },
    { title: '自动预审', description: '系统执行基础规则检查' }
  ]

  if (workflowSettings.type === 'single') {
    baseSteps.push(
      { title: '质控审核', description: '质控人员执行全面审核' },
      { title: '问题处理', description: '发现问题进行处理和修正' },
      { title: '审核完成', description: '质控流程结束' }
    )
  } else if (workflowSettings.type === 'double') {
    baseSteps.push(
      { title: '初步审核', description: '第一位质控人员进行初审' },
      { title: '交叉审核', description: '第二位质控人员进行复审' },
      { title: '问题确认', description: '确认和处理发现的问题' },
      { title: '审核完成', description: '双人审核流程结束' }
    )
  } else if (workflowSettings.type === 'triple') {
    baseSteps.push(
      { title: '初级审核', description: '初级质控员进行基础审核' },
      { title: '中级审核', description: '中级质控员进行深度审核' },
      { title: '高级审核', description: '高级质控员进行终审' },
      { title: '问题处理', description: '处理各级审核发现的问题' },
      { title: '审核完成', description: '三级审核流程结束' }
    )
  }

  return baseSteps
})

// 方法
const switchCategory = (category: 'auto' | 'workflow' | 'notification' | 'advanced') => {
  activeCategory.value = category
}

const onAutoAuditToggle = () => {
  if (!autoAuditSettings.enabled) {
    autoAuditSettings.aiAssisted = false
    autoAuditSettings.aiAutoCorrect = false
  }
}

const onAIAssistedToggle = () => {
  if (!autoAuditSettings.aiAssisted) {
    autoAuditSettings.aiAutoCorrect = false
  }
}

const onWorkflowTypeChange = () => {
  // 根据审核类型调整默认时限
  switch (workflowSettings.type) {
    case 'single':
      workflowSettings.timeLimit = 24
      break
    case 'double':
      workflowSettings.timeLimit = 48
      break
    case 'triple':
      workflowSettings.timeLimit = 72
      break
  }
}

const onAutoAssignToggle = () => {
  if (!workflowSettings.autoAssign) {
    workflowSettings.assignStrategy = 'manual'
  } else {
    workflowSettings.assignStrategy = 'workload'
  }
}

const onScoringToggle = () => {
  if (!workflowSettings.enableScoring) {
    workflowSettings.scoringStandard = 'national'
  }
}

const previewWorkflow = () => {
  showPreviewModal.value = true
}

const closePreviewModal = () => {
  showPreviewModal.value = false
}

const showAdvancedWarning = () => {
  if (confirm('高级设置可能影响系统性能和稳定性，请谨慎修改。是否继续？')) {
    // 用户确认继续
    console.log('用户确认修改高级设置')
  }
}

// 保存设置方法
const saveAutoAuditSettings = () => {
  // 模拟保存自动审核设置
  console.log('保存自动审核设置:', autoAuditSettings)
  alert('自动审核设置保存成功！')
}

const saveWorkflowSettings = () => {
  // 模拟保存流程设置
  console.log('保存流程设置:', workflowSettings)
  alert('审核流程设置保存成功！')
}

const saveNotificationSettings = () => {
  // 模拟保存通知设置
  console.log('保存通知设置:', notificationSettings)
  alert('通知设置保存成功！')
}

const saveAdvancedSettings = () => {
  // 模拟保存高级设置
  console.log('保存高级设置:', advancedSettings)
  alert('高级设置保存成功！')
}

const saveAllSettings = () => {
  // 保存所有设置
  const allSettings = {
    autoAudit: autoAuditSettings,
    workflow: workflowSettings,
    notification: notificationSettings,
    advanced: advancedSettings
  }
  console.log('保存所有设置:', allSettings)
  alert('所有审核设置保存成功！')
}

const resetToDefault = () => {
  if (confirm('确定要恢复所有设置到默认值吗？')) {
    // 恢复默认设置
    Object.assign(autoAuditSettings, {
      enabled: true,
      frequency: 'hourly',
      priority: 'discharge',
      aiAssisted: true,
      aiAutoCorrect: false,
      aiConfidenceThreshold: 85
    })
    
    Object.assign(workflowSettings, {
      type: 'double',
      timeLimit: 24,
      allowReturn: true,
      autoAssign: true,
      assignStrategy: 'workload',
      enableScoring: true,
      scoringStandard: 'national'
    })
    
    Object.assign(notificationSettings, {
      issueFound: true,
      deadlineReminder: true,
      taskAssignment: true,
      auditComplete: true,
      methods: {
        system: true,
        email: true,
        sms: false,
        oa: true
      }
    })
    
    Object.assign(advancedSettings, {
      concurrentAudits: 5,
      auditTimeout: 120,
      debugMode: false,
      cacheStrategy: 'moderate'
    })
    
    alert('所有设置已恢复默认值！')
  }
}

const exportSettings = () => {
  // 导出设置配置
  const settings = {
    autoAudit: autoAuditSettings,
    workflow: workflowSettings,
    notification: notificationSettings,
    advanced: advancedSettings
  }
  
  const dataStr = JSON.stringify(settings, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `audit-settings-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  alert('审核设置配置已导出！')
}

// 初始化
onMounted(() => {
  console.log('审核设置页面已加载')
})
</script>

<style scoped>


/* 响应式设计 */
@media (width <= 768px) {
  .audit-settings-container {
    padding: 8px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .page-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .settings-categories {
    overflow-x: auto;
  }
  
  .category-item {
    flex-shrink: 0;
    min-width: 120px;
  }
  
  .radio-group {
    gap: 12px;
  }
  
  .radio-item {
    padding: 8px;
  }
  
  .radio-description {
    margin-left: 20px;
  }
  
  .checkbox-group {
    flex-direction: column;
    gap: 12px;
  }
  
  .modal-container {
    width: 95%;
    margin: 20px;
  }
  
  .workflow-step {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .step-arrow {
    transform: rotate(90deg);
  }
}

@media (width <= 480px) {
  .page-title {
    font-size: 20px;
  }
  
  .btn {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .category-item {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .setting-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .input-group {
    flex-direction: column;
    gap: 8px;
  }
  
  .input-group .form-control {
    border-right: 1px solid #E0E0E0;
    border-radius: 4px;
  }
  
  .input-group-text {
    text-align: center;
    border-radius: 4px;
  }
}

.audit-settings-container {
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
  gap: 8px;
}

/* 按钮样式 */
.btn {
  display: flex;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
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

.btn-warning {
  color: white;
  background-color: #FF9800;
}

.btn-warning:hover {
  background-color: #E65100;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.text-warning {
  color: #FF9800 !important;
}

/* 设置分类导航 */
.settings-categories {
  display: flex;
  margin-bottom: 16px;
  overflow: hidden;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
}

.category-item {
  display: flex;
  padding: 12px 16px;
  font-size: 13px;
  text-align: center;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.category-item.active {
  font-weight: 500;
  color: #1976D2;
  background-color: #F5F7FA;
  border-bottom: 2px solid #1976D2;
}

.category-item:hover {
  background-color: #F5F7FA;
}

/* 设置主要内容区域 */
.settings-main {
  display: flex;
  flex-direction: column;
}

.settings-section {
  margin-bottom: 16px;
}

/* 卡片样式 */
.card {
  overflow: hidden;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
}

.card-header {
  display: flex;
  padding: 16px;
  border-bottom: 1px solid #E0E0E0;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #212121;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 12px;
}

.status-indicator.active {
  color: #2E7D32;
  background-color: #C8E6C9;
}

.status-indicator.inactive {
  color: #757575;
  background-color: #F5F5F5;
}

.card-body {
  padding: 16px;
}

.card-footer {
  display: flex;
  padding: 12px 16px;
  border-top: 1px solid #E0E0E0;
  justify-content: flex-end;
}

/* 设置项网格 */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 设置项样式 */
.setting-item {
  transition: opacity 0.3s;
}

.setting-item.disabled {
  pointer-events: none;
  opacity: 0.5;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: #212121;
}

.setting-control {
  margin-bottom: 8px;
}

.setting-description {
  font-size: 12px;
  line-height: 1.4;
  color: #757575;
}

/* 表单控件样式 */
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

.form-control:disabled {
  color: #9E9E9E;
  cursor: not-allowed;
  background-color: #F5F7FA;
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

.switch input:disabled + .switch-slider {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 滑块样式 */
.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider {
  height: 6px;
  background: #E0E0E0;
  border-radius: 3px;
  outline: none;
  appearance: none;
  flex: 1;
}

.slider::-webkit-slider-thumb {
  width: 20px;
  height: 20px;
  cursor: pointer;
  background: #1976D2;
  border-radius: 50%;
  appearance: none;
  appearance: none;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  cursor: pointer;
  background: #1976D2;
  border: none;
  border-radius: 50%;
}

.slider-value {
  min-width: 40px;
  font-size: 13px;
  font-weight: 500;
  color: #1976D2;
}

/* 单选按钮组 */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.radio-item {
  display: flex;
  padding: 12px;
  cursor: pointer;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  transition: all 0.3s;
  align-items: flex-start;
}

.radio-item:hover {
  background-color: #F5F7FA;
  border-color: #1976D2;
}

.radio-item input[type="radio"] {
  margin-top: 2px;
  margin-right: 12px;
}

.radio-item input[type="radio"]:checked + .radio-label {
  font-weight: 500;
  color: #1976D2;
}

.radio-label {
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
}

.radio-description {
  margin-left: 24px;
  font-size: 12px;
  color: #757575;
}

/* 复选框组 */
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  margin-right: 8px;
}

.checkbox-label {
  font-size: 13px;
}

/* 输入组 */
.input-group {
  display: flex;
  align-items: center;
}

.input-group .form-control {
  border-right: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.input-group-text {
  padding: 8px 12px;
  font-size: 13px;
  color: #757575;
  background-color: #F5F7FA;
  border: 1px solid #E0E0E0;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
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

/* 工作流预览样式 */
.workflow-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workflow-step {
  display: flex;
  align-items: center;
  gap: 16px;
}

.step-number {
  display: flex;
  width: 32px;
  height: 32px;
  font-size: 14px;
  font-weight: bold;
  color: white;
  background-color: #1976D2;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #212121;
}

.step-description {
  font-size: 12px;
  color: #757575;
}

.step-arrow {
  font-size: 18px;
  color: #9E9E9E;
  align-self: center;
}

/* 基础容器样式 */
</style>