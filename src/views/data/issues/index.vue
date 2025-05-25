<template>
  <div class="issues-page">
    <!-- 页面内容 -->
    <div class="page-content">
      <!-- 页面标题栏 -->
      <div class="page-header">
        <div class="page-title">质控问题管理</div>
        <div class="page-actions">
          <div class="date-filter">
            <div class="filter-group">
              <select v-model="selectedYear" class="year-select">
                <option value="2025">2025年</option>
                <option value="2024">2024年</option>
                <option value="2023">2023年</option>
              </select>
              <select v-model="selectedMonth" class="month-select">
                <option value="all">全部月份</option>
                <option v-for="month in 12" :key="month" :value="month">{{ month }}月</option>
              </select>
            </div>
          </div>
          <button class="btn btn-outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            导入数据
          </button>

        </div>
      </div>
      
      <!-- 问题统计卡片 -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-title">未处理问题</div>
          <div class="summary-value text-danger">{{ summaryData.unprocessed }}</div>
          <div class="summary-trend text-danger">↑ 5.3% 较上月</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">处理中问题</div>
          <div class="summary-value text-warning">{{ summaryData.processing }}</div>
          <div class="summary-trend text-warning">↑ 2.1% 较上月</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">已处理问题</div>
          <div class="summary-value text-success">{{ summaryData.processed }}</div>
          <div class="summary-trend text-success">↑ 12.5% 较上月</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">问题处理率</div>
          <div class="summary-value text-info">{{ summaryData.processRate }}%</div>
          <div class="summary-trend text-success">↑ 2.1% 较上月</div>
        </div>
      </div>
      
      <!-- 快速筛选 -->
      <div class="quick-filters">
        <div 
          v-for="filter in quickFilters" 
          :key="filter.key"
          class="quick-filter" 
          :class="{ active: activeQuickFilter === filter.key }"
          @click="handleQuickFilter(filter.key)"
        >
          {{ filter.label }}
        </div>
      </div>
      
      <!-- 高级筛选 -->
      <div class="filter-bar">
        <div class="filter-item">
          <label>科室</label>
          <select v-model="filters.department">
            <option value="">全部科室</option>
            <option value="internal">内科</option>
            <option value="surgery">外科</option>
            <option value="gynecology">妇产科</option>
            <option value="pediatrics">儿科</option>
          </select>
        </div>
        <div class="filter-item">
          <label>状态</label>
          <select v-model="filters.status">
            <option value="">全部状态</option>
            <option value="unprocessed">未处理</option>
            <option value="processing">处理中</option>
            <option value="processed">已处理</option>
            <option value="ignored">已忽略</option>
          </select>
        </div>
        <div class="filter-item">
          <label>规则</label>
          <select v-model="filters.rule">
            <option value="">全部规则</option>
            <option value="R001">R001: 主要诊断选择验证</option>
            <option value="R002">R002: 手术编码一致性检查</option>
            <option value="R003">R003: 费用逻辑矛盾检测</option>
          </select>
        </div>
        <div class="filter-item">
          <label>时间</label>
          <select v-model="filters.timeRange">
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="lastMonth">上个月</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input v-model="searchQuery" type="text" placeholder="搜索问题..."/>
        </div>
        
        <div class="view-toggle">
          <button 
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button 
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 6H3.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 12H3.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 18H3.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- 切换视图/标签页 -->
      <div class="tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab-item" 
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </div>
      </div>
      
      <!-- 问题列表容器 -->
      <div class="tab-content active">
        <div class="issue-grid" :class="{ 'issue-list-view': viewMode === 'list' }">
          <!-- 问题卡片 -->
          <div 
            v-for="issue in filteredIssues" 
            :key="issue.id"
            class="card issue-card" 
            :data-status="issue.status" 
            :data-priority="issue.priority" 
            :data-type="issue.type"
          >
            <div class="card-body">
              <div class="issue-header">
                <div class="issue-left">
                  <div class="issue-icon" :class="getIssueIconClass(issue.priority)">
                    {{ getIssueIcon(issue.priority) }}
                  </div>
                  <div class="issue-content">
                    <div class="issue-title">{{ issue.title }}</div>
                    <div class="issue-meta">
                      <div class="meta-item">
                        <i>👤</i> {{ issue.patient }}
                      </div>
                      <div class="meta-item">
                        <i>🏥</i> {{ issue.department }}
                      </div>
                      <div class="meta-item">
                        <i>🕒</i> {{ issue.date }}
                      </div>
                    </div>
                    <div class="issue-description">{{ issue.description }}</div>
                    <div class="issue-tags">
                      <span v-for="tag in issue.tags" :key="tag" class="issue-tag">{{ tag }}</span>
                    </div>
                  </div>
                </div>
                <div class="issue-status">
                  <div class="status-badge large" :class="getStatusClass(issue.status)">
                    {{ getStatusText(issue.status) }}
                  </div>
                  <div class="status-text">{{ issue.statusText }}</div>
                </div>
              </div>
              <div class="issue-actions">
                <button 
                  v-if="issue.status === 'unprocessed'" 
                  class="btn btn-sm btn-outline"
                  @click="openIgnoreModal(issue)"
                >
                  忽略
                </button>
                <button 
                  class="btn btn-sm btn-outline"
                  @click="openDetailModal(issue)"
                >
                  查看详情
                </button>
                <button 
                  v-if="issue.status === 'unprocessed'" 
                  class="btn btn-sm btn-primary"
                  @click="openProcessModal(issue)"
                >
                  处理
                </button>
                <button 
                  v-if="issue.status === 'processing'" 
                  class="btn btn-sm btn-primary"
                  @click="openTakeoverModal(issue)"
                >
                  接管处理
                </button>
                <button 
                  v-if="issue.status === 'processed'" 
                  class="btn btn-sm btn-outline"
                  @click="openFeedbackModal(issue)"
                >
                  反馈问题
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <div class="pagination-info">
          显示 {{ pagination.start }}-{{ pagination.end }} 条，共 {{ pagination.total }} 条记录
        </div>
        <div class="pagination">
          <div class="page-item">
            <a class="page-link" href="#" @click.prevent="changePage(pagination.current - 1)">上一页</a>
          </div>
          <div 
            v-for="page in paginationPages" 
            :key="page"
            class="page-item" 
            :class="{ active: page === pagination.current }"
          >
            <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
          </div>
          <div class="page-item">
            <a class="page-link" href="#" @click.prevent="changePage(pagination.current + 1)">下一页</a>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 问题详情模态框 -->
    <div v-if="modals.detail" class="modal-backdrop" @click="closeModal('detail')">
      <div class="modal-container" style="width: 800px; max-width: 95%;" @click.stop>
        <div class="modal-header">
          <div class="modal-title">问题详情</div>
          <button class="modal-close" @click="closeModal('detail')">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <div class="detail-title">问题基本信息</div>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">问题类型</div>
                <div class="detail-value">{{ selectedIssue?.title }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">问题规则</div>
                <div class="detail-value">{{ selectedIssue?.rule }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">严重程度</div>
                <div class="detail-value" :class="getPriorityClass(selectedIssue?.priority)">
                  {{ getPriorityText(selectedIssue?.priority) }}
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">当前状态</div>
                <div class="detail-value">
                  <span class="status-badge" :class="getStatusClass(selectedIssue?.status)">
                    {{ getStatusText(selectedIssue?.status) }}
                  </span>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">发现时间</div>
                <div class="detail-value">{{ selectedIssue?.discoveryTime }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">负责人</div>
                <div class="detail-value">{{ selectedIssue?.assignee || '未分配' }}</div>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <div class="detail-title">病案信息</div>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">患者姓名</div>
                <div class="detail-value">{{ selectedIssue?.patient }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">病案号</div>
                <div class="detail-value">{{ selectedIssue?.caseNumber }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">科室</div>
                <div class="detail-value">{{ selectedIssue?.department }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">入院日期</div>
                <div class="detail-value">{{ selectedIssue?.admissionDate }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">出院日期</div>
                <div class="detail-value">{{ selectedIssue?.dischargeDate }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">主治医师</div>
                <div class="detail-value">{{ selectedIssue?.doctor }}</div>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <div class="detail-title">问题详情</div>
            <div class="issue-item error mb-3">
              <div class="issue-title">
                <i>⚠️</i> {{ selectedIssue?.title }}
              </div>
              <div class="issue-description">{{ selectedIssue?.description }}</div>
              <div class="issue-details">{{ selectedIssue?.ruleDescription }}</div>
            </div>
            
            <div class="ai-suggestion">
              <div class="ai-header">
                <div class="ai-icon">AI</div>
                <div class="ai-title">AI质控分析建议</div>
              </div>
              <div class="ai-content">
                <p>{{ selectedIssue?.aiSuggestion }}</p>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <div class="detail-title">处理历史</div>
            <div class="timeline">
              <div v-for="history in selectedIssue?.history" :key="history.id" class="timeline-item">
                <div class="timeline-content">
                  <div class="timeline-title">{{ history.title }}</div>
                  <div class="timeline-time">{{ history.time }}</div>
                  <div class="timeline-description">{{ history.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal('detail')">关闭</button>
          <button 
            v-if="selectedIssue?.status === 'unprocessed'"
            class="btn btn-outline" 
            @click="openMarkProcessingModal"
          >
            标记为处理中
          </button>
          <button 
            v-if="selectedIssue?.status === 'unprocessed'"
            class="btn btn-primary" 
            @click="openProcessModalFromDetail"
          >
            处理问题
          </button>
        </div>
      </div>
    </div>
    
    <!-- 处理问题模态框 -->
    <div v-if="modals.process" class="modal-backdrop" @click="closeModal('process')">
      <div class="modal-container" style="width: 700px; max-width: 95%;" @click.stop>
        <div class="modal-header">
          <div class="modal-title">处理问题</div>
          <button class="modal-close" @click="closeModal('process')">×</button>
        </div>
        <div class="modal-body">
          <div class="progress-stepper">
            <div 
              v-for="step in processSteps" 
              :key="step.number"
              class="step" 
              :class="{ active: processCurrentStep === step.number, completed: processCurrentStep > step.number }"
            >
              <div class="step-circle">{{ step.number }}</div>
              <div class="step-label">{{ step.label }}</div>
            </div>
          </div>
          
          <!-- 步骤1: 问题分析 -->
          <div v-if="processCurrentStep === 1" class="step-content active">
            <div class="detail-section">
              <div class="detail-title">问题描述</div>
              <div class="issue-item error mb-3">
                <div class="issue-title">
                  <i>⚠️</i> {{ selectedIssue?.title }}
                </div>
                <div class="issue-description">{{ selectedIssue?.description }}</div>
              </div>
            </div>
            
            <div class="detail-section">
              <div class="detail-title">相关规则</div>
              <div class="rule-reference">{{ selectedIssue?.ruleDescription }}</div>
            </div>
            
            <div class="ai-suggestion">
              <div class="ai-header">
                <div class="ai-icon">AI</div>
                <div class="ai-title">AI质控分析建议</div>
              </div>
              <div class="ai-content">
                <p>{{ selectedIssue?.aiSuggestion }}</p>
              </div>
            </div>
            
            <div class="form-group">
              <label>问题分析备注：</label>
              <textarea v-model="processForm.analysisNote" placeholder="请输入您对该问题的分析和看法..."></textarea>
            </div>
            
            <div class="action-confirm-footer">
              <button class="btn btn-outline" @click="closeModal('process')">取消</button>
              <button class="btn btn-primary" @click="nextProcessStep">下一步</button>
            </div>
          </div>
          
          <!-- 步骤2: 修改方案 -->
          <div v-if="processCurrentStep === 2" class="step-content active">
            <div class="detail-section">
              <div class="detail-title">修改方案</div>
              <div class="form-group">
                <label>当前诊断：</label>
                <div class="current-value">主要诊断：高血压</div>
                <div class="current-value">其他诊断：1. 急性心肌梗死（前壁） 2. 高脂血症</div>
              </div>
              <div class="form-group">
                <label>修改为：</label>
                <div class="form-control-wrapper">
                  <div class="form-control-item">
                    <label>主要诊断：</label>
                    <select v-model="processForm.mainDiagnosis">
                      <option>急性心肌梗死（前壁）</option>
                      <option>高血压</option>
                      <option>高脂血症</option>
                    </select>
                  </div>
                  <div class="form-control-item">
                    <label>其他诊断：</label>
                    <div class="multi-select">
                      <div class="select-item">
                        <input type="checkbox" id="diag1" v-model="processForm.otherDiagnosis" value="高血压"/> 
                        <label for="diag1">高血压</label>
                      </div>
                      <div class="select-item">
                        <input type="checkbox" id="diag2" v-model="processForm.otherDiagnosis" value="高脂血症"/> 
                        <label for="diag2">高脂血症</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label>修改原因：</label>
                <textarea v-model="processForm.modifyReason" placeholder="请输入修改原因...">根据患者因急性胸痛急诊入院，且行冠状动脉支架置入术，主要诊断应为急性心肌梗死。</textarea>
              </div>
            </div>
            
            <div class="action-confirm-footer">
              <button class="btn btn-outline" @click="prevProcessStep">上一步</button>
              <button class="btn btn-primary" @click="nextProcessStep">下一步</button>
            </div>
          </div>
          
          <!-- 步骤3: 确认处理 -->
          <div v-if="processCurrentStep === 3" class="step-content active">
            <div class="detail-section">
              <div class="detail-title">确认处理信息</div>
              <div class="confirm-summary">
                <p><strong>问题：</strong> {{ selectedIssue?.title }}</p>
                <p><strong>修改前：</strong> 主要诊断为"高血压"</p>
                <p><strong>修改后：</strong> 主要诊断为"{{ processForm.mainDiagnosis }}"</p>
                <p><strong>处理原因：</strong> {{ processForm.modifyReason }}</p>
              </div>
              
              <div class="form-group">
                <label>是否通知相关人员：</label>
                <div class="checkbox-group">
                  <label>
                    <input type="checkbox" v-model="processForm.notifyOriginal"/> 通知原始录入人员
                  </label>
                  <label>
                    <input type="checkbox" v-model="processForm.notifyQuality"/> 通知科室质控员
                  </label>
                  <label>
                    <input type="checkbox" v-model="processForm.notifyDirector"/> 通知科室主任
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                <label>处理完成备注：</label>
                <textarea v-model="processForm.completionNote" placeholder="可选填写处理完成的备注信息..."></textarea>
              </div>
            </div>
            
            <div class="action-confirm-footer">
              <button class="btn btn-outline" @click="prevProcessStep">上一步</button>
              <button class="btn btn-primary" @click="completeProcess">确认完成处理</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 其他模态框... -->
    <!-- 标记为处理中模态框 -->
    <div v-if="modals.markProcessing" class="modal-backdrop" @click="closeModal('markProcessing')">
      <div class="modal-container" style="width: 500px; max-width: 95%;" @click.stop>
        <div class="modal-header">
          <div class="modal-title">标记为处理中</div>
          <button class="modal-close" @click="closeModal('markProcessing')">×</button>
        </div>
        <div class="modal-body">
          <p>您将把问题"{{ selectedIssue?.title }}"标记为处理中状态。</p>
          
          <div class="form-group">
            <label>预计处理完成时间：</label>
            <input type="datetime-local" v-model="markProcessingForm.expectedTime" class="form-control"/>
          </div>
          
          <div class="form-group">
            <label>处理备注：</label>
            <textarea v-model="markProcessingForm.note" placeholder="请输入处理计划或备注信息..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal('markProcessing')">取消</button>
          <button class="btn btn-primary" @click="confirmMarkProcessing">确认标记</button>
        </div>
      </div>
    </div>
    
    <!-- 忽略问题模态框 -->
    <div v-if="modals.ignore" class="modal-backdrop" @click="closeModal('ignore')">
      <div class="modal-container" style="width: 500px; max-width: 95%;" @click.stop>
        <div class="modal-header">
          <div class="modal-title">忽略问题</div>
          <button class="modal-close" @click="closeModal('ignore')">×</button>
        </div>
        <div class="modal-body">
          <p>您确定要忽略问题"{{ selectedIssue?.title }}"吗？</p>
          <p class="text-warning">忽略后，该问题将不再提示，但会保留在系统记录中。</p>
          
          <div class="form-group">
            <label>忽略原因：</label>
            <select v-model="ignoreForm.reason" class="form-control">
              <option>规则判断错误</option>
              <option>特殊情况例外</option>
              <option>已在其他系统处理</option>
              <option>非本科室职责范围</option>
              <option>其他原因</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>详细说明：</label>
            <textarea v-model="ignoreForm.description" placeholder="请输入详细的忽略原因..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal('ignore')">取消</button>
          <button class="btn btn-warning" @click="confirmIgnore">确认忽略</button>
        </div>
      </div>
    </div>
    
    <!-- 接管处理模态框 -->
    <div v-if="modals.takeover" class="modal-backdrop" @click="closeModal('takeover')">
      <div class="modal-container" style="width: 500px; max-width: 95%;" @click.stop>
        <div class="modal-header">
          <div class="modal-title">接管处理</div>
          <button class="modal-close" @click="closeModal('takeover')">×</button>
        </div>
        <div class="modal-body">
          <p>您确定要接管问题"{{ selectedIssue?.title }}"的处理吗？</p>
          <p>当前处理人：{{ selectedIssue?.processor }}</p>
          
          <div class="form-group">
            <label>接管原因：</label>
            <select v-model="takeoverForm.reason" class="form-control">
              <option>原处理人请假</option>
              <option>需要更高权限处理</option>
              <option>处理期限临近</option>
              <option>原处理人请求协助</option>
              <option>其他原因</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>备注说明：</label>
            <textarea v-model="takeoverForm.note" placeholder="请输入接管处理的原因说明..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal('takeover')">取消</button>
          <button class="btn btn-primary" @click="confirmTakeover">确认接管</button>
        </div>
      </div>
    </div>
    
    <!-- 反馈问题模态框 -->
    <div v-if="modals.feedback" class="modal-backdrop" @click="closeModal('feedback')">
      <div class="modal-container" style="width: 500px; max-width: 95%;" @click.stop>
        <div class="modal-header">
          <div class="modal-title">反馈问题</div>
          <button class="modal-close" @click="closeModal('feedback')">×</button>
        </div>
        <div class="modal-body">
          <p>您正在对问题"{{ selectedIssue?.title }}"的处理结果提供反馈。</p>
          
          <div class="form-group">
            <label>反馈类型：</label>
            <select v-model="feedbackForm.type" class="form-control">
              <option>处理结果不正确</option>
              <option>问题仍然存在</option>
              <option>处理方式不合适</option>
              <option>规则需要调整</option>
              <option>其他反馈</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>详细说明：</label>
            <textarea v-model="feedbackForm.description" placeholder="请详细描述您的反馈内容..."></textarea>
          </div>
          
          <div class="form-group">
            <label>处理建议：</label>
            <textarea v-model="feedbackForm.suggestion" placeholder="请提供您的处理建议..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal('feedback')">取消</button>
          <button class="btn btn-primary" @click="confirmFeedback">提交反馈</button>
        </div>
      </div>
    </div>
    
    <!-- 提示框 -->
    <div v-if="toast.show" class="toast" :class="toast.type">{{ toast.message }}</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'

// 类型定义
interface Issue {
  id: string
  title: string
  description: string
  patient: string
  department: string
  date: string
  status: 'unprocessed' | 'processing' | 'processed' | 'ignored'
  priority: 'high' | 'medium' | 'low'
  type: 'diagnosis' | 'coding' | 'logic' | 'completeness'
  tags: string[]
  statusText: string
  rule?: string
  ruleDescription?: string
  aiSuggestion?: string
  discoveryTime?: string
  assignee?: string
  caseNumber?: string
  admissionDate?: string
  dischargeDate?: string
  doctor?: string
  processor?: string
  history?: Array<{
    id: string
    title: string
    time: string
    description: string
  }>
}

interface QuickFilter {
  key: string
  label: string
}

interface Tab {
  key: string
  label: string
}

interface ProcessStep {
  number: number
  label: string
}

interface Filters {
  department: string
  status: string
  rule: string
  timeRange: string
}

interface SummaryData {
  unprocessed: number
  processing: number
  processed: number
  processRate: number
}

interface ProcessForm {
  analysisNote: string
  mainDiagnosis: string
  otherDiagnosis: string[]
  modifyReason: string
  notifyOriginal: boolean
  notifyQuality: boolean
  notifyDirector: boolean
  completionNote: string
}

interface MarkProcessingForm {
  expectedTime: string
  note: string
}

interface IgnoreForm {
  reason: string
  description: string
}

interface TakeoverForm {
  reason: string
  note: string
}

interface FeedbackForm {
  type: string
  description: string
  suggestion: string
}

interface Toast {
  show: boolean
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface Pagination {
  current: number
  total: number
  pageSize: number
  start: number
  end: number
}

// 响应式数据
const selectedYear = ref('2025')
const selectedMonth = ref('5')
const activeQuickFilter = ref('all')
const activeTab = ref('all-issues')
const viewMode = ref<'grid' | 'list'>('grid')
const searchQuery = ref('')

const filters = reactive<Filters>({
  department: '',
  status: '',
  rule: '',
  timeRange: 'week'
})

const summaryData = reactive<SummaryData>({
  unprocessed: 62,
  processing: 25,
  processed: 145,
  processRate: 86.8
})

const pagination = reactive<Pagination>({
  current: 1,
  total: 62,
  pageSize: 6,
  start: 1,
  end: 6
})

const modals = reactive({
  detail: false,
  process: false,
  markProcessing: false,
  ignore: false,
  takeover: false,
  feedback: false
})

const selectedIssue = ref<Issue | null>(null)
const processCurrentStep = ref(1)

const processForm = reactive<ProcessForm>({
  analysisNote: '',
  mainDiagnosis: '急性心肌梗死（前壁）',
  otherDiagnosis: ['高血压', '高脂血症'],
  modifyReason: '根据患者因急性胸痛急诊入院，且行冠状动脉支架置入术，主要诊断应为急性心肌梗死。',
  notifyOriginal: true,
  notifyQuality: true,
  notifyDirector: false,
  completionNote: ''
})

const markProcessingForm = reactive<MarkProcessingForm>({
  expectedTime: '',
  note: ''
})

const ignoreForm = reactive<IgnoreForm>({
  reason: '规则判断错误',
  description: ''
})

const takeoverForm = reactive<TakeoverForm>({
  reason: '原处理人请假',
  note: ''
})

const feedbackForm = reactive<FeedbackForm>({
  type: '处理结果不正确',
  description: '',
  suggestion: ''
})

const toast = reactive<Toast>({
  show: false,
  message: '',
  type: 'info'
})

// 静态数据
const quickFilters: QuickFilter[] = [
  { key: 'all', label: '全部问题' },
  { key: 'unprocessed', label: '未处理' },
  { key: 'processing', label: '处理中' },
  { key: 'processed', label: '已处理' },
  { key: 'high-priority', label: '高优先级' },
  { key: 'diagnosis', label: '诊断类问题' },
  { key: 'coding', label: '编码类问题' },
  { key: 'logic', label: '数据逻辑类问题' },
  { key: 'my-issues', label: '我负责的' }
]

const tabs: Tab[] = [
  { key: 'all-issues', label: '全部问题' },
  { key: 'my-processing', label: '我处理的' },
  { key: 'recent-processed', label: '最近处理' }
]

const processSteps: ProcessStep[] = [
  { number: 1, label: '问题分析' },
  { number: 2, label: '修改方案' },
  { number: 3, label: '确认处理' }
]

const issues = ref<Issue[]>([
  {
    id: '1',
    title: '主要诊断选择错误',
    description: '当前主要诊断为"高血压"，但病例中存在"急性心肌梗死"，根据主要诊断选择规则，急性心肌梗死应为本次住院的主要诊断。',
    patient: '张某某',
    department: '心内科',
    date: '2025-05-18',
    status: 'unprocessed',
    priority: 'high',
    type: 'diagnosis',
    tags: ['R001', '诊断规范', '高优先级'],
    statusText: '发现于 09:23',
    rule: 'R001: 主要诊断选择验证',
    ruleDescription: 'R001 - 主要诊断应为导致本次住院的主要原因，通常为耗费医疗资源最多的疾病。本例中患者因急性胸痛入院，急诊入院，且行冠状动脉支架置入术，主要诊断应为急性心肌梗死。',
    aiSuggestion: '根据患者的临床资料分析，本例患者因急性胸痛通过急诊入院，经检查确诊为急性心肌梗死（前壁），并接受了冠状动脉支架置入术治疗。虽然患者有高血压病史，但本次住院的主要原因及医疗资源消耗主要与急性心肌梗死相关。建议修改：将"急性心肌梗死（前壁）"设为主要诊断，"高血压"调整为其他诊断',
    discoveryTime: '2025-05-18 09:23',
    caseNumber: '202505120042',
    admissionDate: '2025-05-10',
    dischargeDate: '2025-05-18',
    doctor: '陈医生',
    history: [
      {
        id: '1',
        title: '问题发现',
        time: '2025-05-18 09:23',
        description: '系统自动检测发现主要诊断选择错误问题'
      },
      {
        id: '2',
        title: '查看问题',
        time: '2025-05-19 10:15',
        description: '管理员查看了问题详情'
      }
    ]
  },
  {
    id: '2',
    title: '手术编码错误',
    description: '手术编码与手术名称不匹配，当前编码为36.06，但根据手术描述应使用36.07编码。',
    patient: '李某某',
    department: '神经外科',
    date: '2025-05-18',
    status: 'processing',
    priority: 'medium',
    type: 'coding',
    tags: ['R002', '编码规范', '中优先级'],
    statusText: '处理人: 王质控',
    processor: '王质控',
    rule: 'R002: 手术编码一致性检查',
    ruleDescription: 'R002 - 手术编码应与手术名称、手术描述保持一致，确保编码的准确性和规范性。',
    aiSuggestion: '根据手术描述内容分析，建议将编码从36.06调整为36.07，以确保编码与手术内容的一致性。',
    discoveryTime: '2025-05-18 10:30',
    assignee: '王质控',
    caseNumber: '202505120043',
    admissionDate: '2025-05-15',
    dischargeDate: '2025-05-19',
    doctor: '李医生',
    history: [
      {
        id: '1',
        title: '问题发现',
        time: '2025-05-18 10:30',
        description: '系统检测到手术编码不匹配问题'
      },
      {
        id: '2',
        title: '开始处理',
        time: '2025-05-18 14:20',
        description: '王质控开始处理该问题'
      }
    ]
  },
  {
    id: '3',
    title: '诊断名称不完整',
    description: '糖尿病诊断缺少分型信息，未注明是1型还是2型糖尿病。',
    patient: '王某某',
    department: '骨科',
    date: '2025-05-18',
    status: 'processed',
    priority: 'low',
    type: 'diagnosis',
    tags: ['R004', '诊断规范', '低优先级'],
    statusText: '处理时间: 11:45',
    rule: 'R004: 诊断完整性检查',
    ruleDescription: 'R004 - 诊断信息应完整准确，包含必要的分型、分期等详细信息。',
    aiSuggestion: '建议根据患者的检查结果和临床表现，明确糖尿病的具体分型，完善诊断信息。',
    discoveryTime: '2025-05-18 08:15',
    assignee: '张质控',
    caseNumber: '202505120044',
    admissionDate: '2025-05-12',
    dischargeDate: '2025-05-18',
    doctor: '王医生',
    history: [
      {
        id: '1',
        title: '问题发现',
        time: '2025-05-18 08:15',
        description: '检测到诊断信息不完整'
      },
      {
        id: '2',
        title: '问题处理',
        time: '2025-05-18 11:45',
        description: '张质控已完成诊断信息补充'
      }
    ]
  },
  {
    id: '4',
    title: '费用逻辑矛盾',
    description: '费用合计与各分项费用之和不一致，相差325.50元。',
    patient: '赵某某',
    department: '肿瘤科',
    date: '2025-05-18',
    status: 'unprocessed',
    priority: 'medium',
    type: 'logic',
    tags: ['R003', '数据逻辑', '中优先级'],
    statusText: '发现于 13:12',
    rule: 'R003: 费用逻辑矛盾检测',
    ruleDescription: 'R003 - 费用数据应保持逻辑一致性，总费用应等于各分项费用之和。',
    aiSuggestion: '建议检查费用明细，核实各项费用计算是否正确，确保费用数据的准确性。',
    discoveryTime: '2025-05-18 13:12',
    assignee: '未分配',
    caseNumber: '202505120045',
    admissionDate: '2025-05-14',
    dischargeDate: '2025-05-18',
    doctor: '赵医生',
    history: [
      {
        id: '1',
        title: '问题发现',
        time: '2025-05-18 13:12',
        description: '检测到费用数据逻辑矛盾'
      }
    ]
  },
  {
    id: '5',
    title: '关键信息缺失',
    description: '缺少出院诊断信息，病案首页未完整填写出院诊断和医嘱。',
    patient: '刘某某',
    department: '妇产科',
    date: '2025-05-18',
    status: 'unprocessed',
    priority: 'high',
    type: 'completeness',
    tags: ['R010', '数据完整性', '高优先级'],
    statusText: '发现于 14:05',
    rule: 'R010: 关键信息完整性检查',
    ruleDescription: 'R010 - 病案首页必须包含完整的诊断信息和医嘱信息，确保数据的完整性。',
    aiSuggestion: '建议联系主治医师补充完整的出院诊断和医嘱信息，确保病案数据的完整性。',
    discoveryTime: '2025-05-18 14:05',
    assignee: '未分配',
    caseNumber: '202505120046',
    admissionDate: '2025-05-16',
    dischargeDate: '2025-05-18',
    doctor: '刘医生',
    history: [
      {
        id: '1',
        title: '问题发现',
        time: '2025-05-18 14:05',
        description: '检测到关键信息缺失'
      }
    ]
  },
  {
    id: '6',
    title: '日期逻辑关系错误',
    description: '入院日期晚于首次手术日期，时间记录存在逻辑矛盾。',
    patient: '周某某',
    department: '心胸外科',
    date: '2025-05-18',
    status: 'processing',
    priority: 'medium',
    type: 'logic',
    tags: ['R005', '数据逻辑', '中优先级'],
    statusText: '处理人: 李质控',
    processor: '李质控',
    rule: 'R005: 日期逻辑关系检查',
    ruleDescription: 'R005 - 各类日期应符合逻辑关系，入院日期应早于或等于手术日期。',
    aiSuggestion: '建议核实入院日期和手术日期的准确性，确保时间记录的逻辑正确性。',
    discoveryTime: '2025-05-18 15:20',
    assignee: '李质控',
    caseNumber: '202505120047',
    admissionDate: '2025-05-17',
    dischargeDate: '2025-05-19',
    doctor: '周医生',
    history: [
      {
        id: '1',
        title: '问题发现',
        time: '2025-05-18 15:20',
        description: '检测到日期逻辑错误'
      },
      {
        id: '2',
        title: '开始处理',
        time: '2025-05-18 16:30',
        description: '李质控开始处理该问题'
      }
    ]
  },
  {
    id: '7',
    title: '手术数据与诊断不符',
    description: '患者诊断为"慢性阑尾炎"，但手术记录为"胆囊切除术"，存在明显矛盾。',
    patient: '陈某某',
    department: '普通外科',
    date: '2025-05-17',
    status: 'processing',
    priority: 'high',
    type: 'logic',
    tags: ['R008', '数据逻辑', '高优先级'],
    statusText: '我正在处理',
    processor: '当前用户',
    rule: 'R008: 手术与诊断一致性检查',
    ruleDescription: 'R008 - 手术记录应与诊断信息保持一致，确保医疗行为的逻辑性。',
    aiSuggestion: '建议核实患者的实际诊断和手术情况，确保诊断与手术记录的一致性，可能需要修正诊断或手术记录。',
    discoveryTime: '2025-05-17 16:45',
    assignee: '当前用户',
    caseNumber: '202505170035',
    admissionDate: '2025-05-15',
    dischargeDate: '2025-05-17',
    doctor: '陈医生',
    history: [
      {
        id: '1',
        title: '问题发现',
        time: '2025-05-17 16:45',
        description: '检测到手术与诊断不符问题'
      },
      {
        id: '2',
        title: '开始处理',
        time: '2025-05-18 09:15',
        description: '当前用户开始处理该问题'
      }
    ]
  },
  {
    id: '8',
    title: 'ICD编码不规范',
    description: '"小儿肺炎"使用的ICD编码为J18.901，但根据2022版ICD-10编码规则应使用J18.900。',
    patient: '杨某某',
    department: '儿科',
    date: '2025-05-16',
    status: 'processing',
    priority: 'medium',
    type: 'coding',
    tags: ['R003', '编码规范', '中优先级'],
    statusText: '我正在处理',
    processor: '当前用户',
    rule: 'R003: ICD编码规范性检查',
    ruleDescription: 'R003 - ICD编码应严格按照最新版本的编码标准执行，确保编码的准确性和规范性。',
    aiSuggestion: '建议根据2022版ICD-10编码标准，将小儿肺炎的编码从J18.901调整为J18.900，符合最新编码规范。',
    discoveryTime: '2025-05-16 14:30',
    assignee: '当前用户',
    caseNumber: '202505160028',
    admissionDate: '2025-05-14',
    dischargeDate: '2025-05-16',
    doctor: '杨医生',
    history: [
      {
        id: '1',
        title: '问题发现',
        time: '2025-05-16 14:30',
        description: '检测到ICD编码不规范问题'
      },
      {
        id: '2',
        title: '开始处理',
        time: '2025-05-17 10:00',
        description: '当前用户开始处理该问题'
      }
    ]
  },
  {
    id: '9',
    title: '诊断编码缺失',
    description: '"急性心肌梗死"诊断缺少相应的ICD-10编码。',
    patient: '郑某某',
    department: '心血管内科',
    date: '2025-05-15',
    status: 'processed',
    priority: 'high',
    type: 'diagnosis',
    tags: ['R001', '编码完整性', '高优先级'],
    statusText: '处理时间: 2025-05-18 16:30',
    rule: 'R001: 诊断编码完整性检查',
    ruleDescription: 'R001 - 所有诊断都必须有对应的ICD-10编码，确保诊断信息的完整性。',
    aiSuggestion: '建议为"急性心肌梗死"诊断添加相应的ICD-10编码，如I21.9（急性心肌梗死，未特指）。',
    discoveryTime: '2025-05-15 11:20',
    assignee: '张质控',
    caseNumber: '202505150021',
    admissionDate: '2025-05-13',
    dischargeDate: '2025-05-15',
    doctor: '郑医生',
    history: [
      {
        id: '1',
        title: '问题发现',
        time: '2025-05-15 11:20',
        description: '检测到诊断编码缺失'
      },
      {
        id: '2',
        title: '问题处理',
        time: '2025-05-18 16:30',
        description: '张质控已完成编码补充'
      }
    ]
  },
  {
    id: '10',
    title: '费用数据错误',
    description: '病案首页药品费用填写错误，与实际收费明细不符。',
    patient: '孙某某',
    department: '内分泌科',
    date: '2025-05-14',
    status: 'processed',
    priority: 'low',
    type: 'logic',
    tags: ['R006', '费用数据', '低优先级'],
    statusText: '处理时间: 2025-05-17 10:25',
    rule: 'R006: 费用数据准确性检查',
    ruleDescription: 'R006 - 病案首页的费用数据应与实际收费明细保持一致，确保数据的准确性。',
    aiSuggestion: '建议核对药品费用明细，确保病案首页费用与实际收费的一致性，必要时进行费用调整。',
    discoveryTime: '2025-05-14 09:45',
    assignee: '王质控',
    caseNumber: '202505140015',
    admissionDate: '2025-05-12',
    dischargeDate: '2025-05-14',
    doctor: '孙医生',
    history: [
      {
        id: '1',
        title: '问题发现',
        time: '2025-05-14 09:45',
        description: '检测到费用数据错误'
      },
      {
        id: '2',
        title: '问题处理',
        time: '2025-05-17 10:25',
        description: '王质控已完成费用数据修正'
      }
    ]
  }
])

// 计算属性
const allFilteredIssues = computed(() => {
  let filtered = [...issues.value]

  // 快速筛选
  if (activeQuickFilter.value !== 'all') {
    switch (activeQuickFilter.value) {
      case 'unprocessed':
        filtered = filtered.filter(issue => issue.status === 'unprocessed')
        break
      case 'processing':
        filtered = filtered.filter(issue => issue.status === 'processing')
        break
      case 'processed':
        filtered = filtered.filter(issue => issue.status === 'processed')
        break
      case 'high-priority':
        filtered = filtered.filter(issue => issue.priority === 'high')
        break
      case 'diagnosis':
        filtered = filtered.filter(issue => issue.type === 'diagnosis')
        break
      case 'coding':
        filtered = filtered.filter(issue => issue.type === 'coding')
        break
      case 'logic':
        filtered = filtered.filter(issue => issue.type === 'logic')
        break
      case 'my-issues':
        // 模拟用户负责的问题
        filtered = filtered.filter(issue => issue.status === 'processing')
        break
    }
  }

  // 高级筛选
  if (filters.department) {
    const departmentMap: Record<string, string> = {
      'internal': '内科',
      'surgery': '外科',
      'gynecology': '妇产科',
      'pediatrics': '儿科'
    }
    const departmentName = departmentMap[filters.department]
    if (departmentName) {
      filtered = filtered.filter(issue => issue.department.includes(departmentName))
    }
  }
  
  if (filters.status) {
    filtered = filtered.filter(issue => issue.status === filters.status)
  }
  
  if (filters.rule) {
    filtered = filtered.filter(issue => issue.tags.some(tag => tag.includes(filters.rule)))
  }

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(issue => 
      issue.title.toLowerCase().includes(query) ||
      issue.description.toLowerCase().includes(query) ||
      issue.patient.toLowerCase().includes(query) ||
      issue.department.toLowerCase().includes(query)
    )
  }

  // 标签页筛选
  if (activeTab.value === 'my-processing') {
    filtered = filtered.filter(issue => issue.status === 'processing')
  } else if (activeTab.value === 'recent-processed') {
    filtered = filtered.filter(issue => issue.status === 'processed')
  }

  return filtered
})

const filteredIssues = computed(() => {
  const filtered = allFilteredIssues.value
  const start = (pagination.current - 1) * pagination.pageSize
  const end = Math.min(start + pagination.pageSize, filtered.length)
  
  return filtered.slice(start, end)
})

const paginationPages = computed(() => {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize)
  const pages = []
  const startPage = Math.max(1, pagination.current - 2)
  const endPage = Math.min(totalPages, startPage + 4)
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  return pages
})

// 方法
const handleQuickFilter = (filterKey: string) => {
  activeQuickFilter.value = filterKey
}

const openDetailModal = (issue: Issue) => {
  selectedIssue.value = issue
  modals.detail = true
}

const openProcessModal = (issue: Issue) => {
  selectedIssue.value = issue
  processCurrentStep.value = 1
  // 重置表单数据
  processForm.analysisNote = ''
  processForm.mainDiagnosis = '急性心肌梗死（前壁）'
  processForm.otherDiagnosis = ['高血压', '高脂血症']
  processForm.modifyReason = '根据患者因急性胸痛急诊入院，且行冠状动脉支架置入术，主要诊断应为急性心肌梗死。'
  processForm.notifyOriginal = true
  processForm.notifyQuality = true
  processForm.notifyDirector = false
  processForm.completionNote = ''
  modals.process = true
}

const openIgnoreModal = (issue: Issue) => {
  selectedIssue.value = issue
  // 重置表单数据
  ignoreForm.reason = '规则判断错误'
  ignoreForm.description = ''
  modals.ignore = true
}

const openTakeoverModal = (issue: Issue) => {
  selectedIssue.value = issue
  // 重置表单数据
  takeoverForm.reason = '原处理人请假'
  takeoverForm.note = ''
  modals.takeover = true
}

const openFeedbackModal = (issue: Issue) => {
  selectedIssue.value = issue
  // 重置表单数据
  feedbackForm.type = '处理结果不正确'
  feedbackForm.description = ''
  feedbackForm.suggestion = ''
  modals.feedback = true
}

const openMarkProcessingModal = () => {
  modals.detail = false
  // 重置表单数据
  markProcessingForm.expectedTime = ''
  markProcessingForm.note = ''
  modals.markProcessing = true
}

const openProcessModalFromDetail = () => {
  modals.detail = false
  processCurrentStep.value = 1
  // 重置表单数据
  processForm.analysisNote = ''
  processForm.mainDiagnosis = '急性心肌梗死（前壁）'
  processForm.otherDiagnosis = ['高血压', '高脂血症']
  processForm.modifyReason = '根据患者因急性胸痛急诊入院，且行冠状动脉支架置入术，主要诊断应为急性心肌梗死。'
  processForm.notifyOriginal = true
  processForm.notifyQuality = true
  processForm.notifyDirector = false
  processForm.completionNote = ''
  modals.process = true
}

const closeModal = (modalName: keyof typeof modals) => {
  modals[modalName] = false
  if (modalName === 'process') {
    processCurrentStep.value = 1
  }
}

const nextProcessStep = () => {
  if (processCurrentStep.value < 3) {
    processCurrentStep.value++
  }
}

const prevProcessStep = () => {
  if (processCurrentStep.value > 1) {
    processCurrentStep.value--
  }
}

const completeProcess = () => {
  closeModal('process')
  showToast('问题处理已完成！', 'success')
  updateIssueStatus('processed')
}

const confirmMarkProcessing = () => {
  if (!markProcessingForm.expectedTime) {
    showToast('请选择预计处理完成时间', 'warning')
    return
  }
  closeModal('markProcessing')
  showToast('问题已标记为处理中状态！', 'success')
  updateIssueStatus('processing')
}

const confirmIgnore = () => {
  if (!ignoreForm.description.trim()) {
    showToast('请输入详细的忽略原因', 'warning')
    return
  }
  closeModal('ignore')
  showToast('问题已成功忽略！', 'success')
  updateIssueStatus('ignored')
}

const confirmTakeover = () => {
  if (!takeoverForm.note.trim()) {
    showToast('请输入接管处理的原因说明', 'warning')
    return
  }
  closeModal('takeover')
  showToast('问题处理已成功接管！', 'success')
  updateIssueStatus('processing')
}

const confirmFeedback = () => {
  if (!feedbackForm.description.trim()) {
    showToast('请输入详细的反馈内容', 'warning')
    return
  }
  closeModal('feedback')
  showToast('反馈已成功提交！', 'success')
}

const updateIssueStatus = (status: Issue['status']) => {
  if (selectedIssue.value) {
    const index = issues.value.findIndex(issue => issue.id === selectedIssue.value!.id)
    if (index !== -1) {
      issues.value[index].status = status
      // 更新状态文本
      switch (status) {
        case 'processing':
          issues.value[index].statusText = '我正在处理'
          issues.value[index].processor = '当前用户'
          break
        case 'processed':
          const now = new Date()
          issues.value[index].statusText = `处理时间: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
          break
        case 'ignored':
          issues.value[index].statusText = '已忽略'
          break
      }
      
      // 更新统计数据
      updateSummaryData()
    }
  }
}

const updateSummaryData = () => {
  const unprocessed = issues.value.filter(issue => issue.status === 'unprocessed').length
  const processing = issues.value.filter(issue => issue.status === 'processing').length
  const processed = issues.value.filter(issue => issue.status === 'processed').length
  const total = unprocessed + processing + processed
  
  summaryData.unprocessed = unprocessed
  summaryData.processing = processing
  summaryData.processed = processed
  summaryData.processRate = total > 0 ? Math.round((processed / total) * 100 * 10) / 10 : 0
}

const changePage = (page: number) => {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize)
  if (page >= 1 && page <= totalPages) {
    pagination.current = page
  }
}

const showToast = (message: string, type: Toast['type'] = 'info') => {
  toast.message = message
  toast.type = type
  toast.show = true
  
  setTimeout(() => {
    toast.show = false
  }, 3000)
}

const getIssueIconClass = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'error'
    case 'medium':
      return 'warning'
    case 'low':
      return 'info'
    default:
      return 'info'
  }
}

const getIssueIcon = (priority: string) => {
  switch (priority) {
    case 'high':
      return '⚠️'
    case 'medium':
      return '⚠️'
    case 'low':
      return 'ℹ️'
    default:
      return 'ℹ️'
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'unprocessed':
      return 'status-danger'
    case 'processing':
      return 'status-warning'
    case 'processed':
      return 'status-success'
    case 'ignored':
      return 'status-info'
    default:
      return 'status-info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'unprocessed':
      return '未处理'
    case 'processing':
      return '处理中'
    case 'processed':
      return '已处理'
    case 'ignored':
      return '已忽略'
    default:
      return '未知'
  }
}

const getPriorityClass = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'text-danger'
    case 'medium':
      return 'text-warning'
    case 'low':
      return 'text-info'
    default:
      return 'text-info'
  }
}

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high':
      return '高'
    case 'medium':
      return '中'
    case 'low':
      return '低'
    default:
      return '未知'
  }
}

// 监听筛选条件变化，重置分页
const resetPagination = () => {
  pagination.current = 1
}

// 更新分页信息
const updatePaginationInfo = () => {
  const total = allFilteredIssues.value.length
  pagination.total = total
  
  const start = (pagination.current - 1) * pagination.pageSize
  const end = Math.min(start + pagination.pageSize, total)
  pagination.start = total > 0 ? start + 1 : 0
  pagination.end = end
}

// 生命周期
onMounted(() => {
  // 初始化页面数据
  updateSummaryData()
  updatePaginationInfo()
  console.log('问题管理页面已加载')
})

// 监听筛选条件变化
watch([activeQuickFilter, filters, searchQuery, activeTab], () => {
  resetPagination()
  updatePaginationInfo()
})

// 监听分页变化
watch(() => pagination.current, () => {
  updatePaginationInfo()
})

// 监听问题数据变化
watch(issues, () => {
  updateSummaryData()
  updatePaginationInfo()
}, { deep: true })

// 导出方法供模板使用
defineExpose({
  handleQuickFilter,
  openDetailModal,
  openProcessModal,
  openIgnoreModal,
  openTakeoverModal,
  openFeedbackModal,
  closeModal,
  nextProcessStep,
  prevProcessStep,
  completeProcess,
  confirmMarkProcessing,
  confirmIgnore,
  confirmTakeover,
  confirmFeedback,
  changePage,
  getIssueIconClass,
  getIssueIcon,
  getStatusClass,
  getStatusText,
  getPriorityClass,
  getPriorityText
})
</script>


<style scoped>


@keyframes fadeIn {
  from { opacity: 0; }

  to { opacity: 1; }
}

/* 响应式设计 */
@media (width <= 992px) {
  .issue-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  .summary-cards {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (width <= 768px) {
  .page-content {
    padding: 12px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .page-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-item {
    margin-bottom: 8px;
  }
  
  .search-box {
    max-width: 100%;
  }
  
  .issue-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-cards {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .modal-container {
    width: 95%;
    max-width: 95%;
  }
  
  .pagination-container {
    flex-direction: column;
    gap: 12px;
  }
}

@media (width <= 480px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .quick-filters {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .quick-filter {
    margin-right: 0;
  }
}

* {
  padding: 0;
  margin: 0;
  font-family: "Microsoft YaHei", "Segoe UI", sans-serif;
  box-sizing: border-box;
}

/* 页面容器 */
.issues-page {
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  color: #212121;
  background-color: #F5F7FA;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 页面内容样式 */
.page-content {
  width: 100%;
  max-width: 100%;
  padding: 16px;
}

/* 页面标题栏 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: #212121;
}

.page-actions {
  display: flex;
  align-items: center;
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

.btn svg {
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

.btn-success {
  color: white;
  background-color: #4CAF50;
}

.btn-success:hover {
  background-color: #2E7D32;
}

.btn-warning {
  color: white;
  background-color: #FF9800;
}

.btn-warning:hover {
  background-color: #E65100;
}

.btn-danger {
  color: white;
  background-color: #F44336;
}

.btn-danger:hover {
  background-color: #D32F2F;
}

.btn-outline {
  color: #1976D2;
  background-color: white;
  border: 1px solid #1976D2;
}

.btn-outline:hover {
  background-color: #F5F7FA;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

/* 卡片样式 */
.card {
  margin-bottom: 16px;
  overflow: hidden;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
}

.card-header {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #E0E0E0;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #212121;
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

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
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
  transition: border-color 0.3s;
}

.form-control:focus {
  border-color: #1976D2;
  outline: none;
  box-shadow: 0 0 0 2px rgb(25 118 210 / 10%);
}

/* 标签和徽章 */
.badge {
  display: inline-block;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 12px;
}

.badge-success {
  color: #2E7D32;
  background-color: #C8E6C9;
}

.badge-warning {
  color: #E65100;
  background-color: #FFE0B2;
}

.badge-danger {
  color: #D32F2F;
  background-color: #FFCDD2;
}

.badge-info {
  color: #0D47A1;
  background-color: #BBDEFB;
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
  width: 600px;
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
  gap: 8px;
}

/* 问题管理特定样式 */
.filter-bar {
  display: flex;
  padding: 12px 16px;
  margin-bottom: 16px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-item label {
  margin-right: 8px;
  font-size: 13px;
  color: #757575;
}

.filter-item select,
.filter-item input {
  padding: 6px 10px;
  font-size: 13px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
}

.filter-item select {
  min-width: 120px;
}

.search-box {
  position: relative;
  max-width: 300px;
  flex-grow: 1;
}

.search-box input {
  width: 100%;
  height: 36px;
  padding-left: 30px;
  background-color: #F5F7FA;
  border: 1px solid #E0E0E0;
  border-radius: 18px;
  transition: all 0.3s;
}

.search-box input:focus {
  background-color: #fff;
  border-color: #1976D2;
  outline: none;
  box-shadow: 0 0 0 2px rgb(25 118 210 / 20%);
}

.search-box .search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  color: #9E9E9E;
  transform: translateY(-50%);
}

.issue-card {
  margin-bottom: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.issue-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgb(0 0 0 / 8%);
}

.issue-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.issue-left {
  display: flex;
  align-items: flex-start;
  flex: 1;
}

.issue-icon {
  display: flex;
  width: 32px;
  height: 32px;
  margin-right: 12px;
  font-size: 14px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.issue-icon.error {
  color: #D32F2F;
  background-color: #FFCDD2;
}

.issue-icon.warning {
  color: #E65100;
  background-color: #FFE0B2;
}

.issue-icon.info {
  color: #0D47A1;
  background-color: #BBDEFB;
}

.issue-content {
  flex: 1;
}

.issue-title {
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #212121;
}

.issue-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #757575;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-item i {
  margin-right: 5px;
  font-size: 12px;
}

.issue-description {
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: #212121;
}

.issue-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.issue-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  color: #757575;
  background-color: #E0E0E0;
  border-radius: 12px;
}

.issue-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.issue-status {
  width: 110px;
  text-align: center;
}

.status-badge.large {
  display: inline-block;
  padding: 5px 10px;
  margin-bottom: 4px;
  font-size: 12px;
}

.status-text {
  font-size: 11px;
  color: #9E9E9E;
}

.issue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.quick-filters {
  display: flex;
  padding-bottom: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.quick-filter {
  padding: 6px 12px;
  margin-right: 8px;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  background-color: white;
  border: 1px solid #E0E0E0;
  border-radius: 16px;
  transition: all 0.2s;
}

.quick-filter.active {
  color: white;
  background-color: #1976D2;
  border-color: #1976D2;
}

.quick-filter:hover {
  background-color: #F5F7FA;
}

.quick-filter.active:hover {
  background-color: #0D47A1;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card {
  display: flex;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
  flex-direction: column;
}

.summary-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgb(0 0 0 / 12%);
}

.summary-value {
  margin: 10px 0;
  font-size: 28px;
  font-weight: bold;
}

.summary-title {
  margin-bottom: 8px;
  font-size: 14px;
  color: #757575;
}

.summary-trend {
  margin-top: auto;
  font-size: 12px;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.pagination-info {
  font-size: 12px;
  color: #757575;
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

.detail-section {
  margin-bottom: 16px;
}

.detail-title {
  padding-bottom: 6px;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid #E0E0E0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  margin-bottom: 4px;
  font-size: 12px;
  color: #757575;
}

.detail-value {
  font-size: 13px;
  font-weight: 500;
}

.timeline {
  position: relative;
  margin-top: 16px;
  margin-left: 20px;
}

.timeline::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background-color: #E0E0E0;
  content: '';
}

.timeline-item {
  position: relative;
  padding-left: 25px;
  margin-bottom: 16px;
}

.timeline-item::before {
  position: absolute;
  top: 5px;
  left: -5px;
  z-index: 1;
  width: 12px;
  height: 12px;
  background-color: #1976D2;
  border-radius: 50%;
  content: '';
}

.timeline-content {
  padding: 12px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
}

.timeline-title {
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
}

.timeline-time {
  margin-bottom: 6px;
  font-size: 11px;
  color: #9E9E9E;
}

.timeline-description {
  font-size: 12px;
  color: #757575;
}

.tabs {
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid #E0E0E0;
}

.tab-item {
  position: relative;
  padding: 10px 16px;
  font-size: 14px;
  color: #757575;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-item.active {
  font-weight: 500;
  color: #1976D2;
}

.tab-item.active::after {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #1976D2;
  content: '';
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
}

/* 列表展示和网格展示的切换按钮 */
.view-toggle {
  display: flex;
  margin-left: auto;
}

.view-toggle button {
  padding: 6px 8px;
  cursor: pointer;
  background-color: white;
  border: 1px solid #E0E0E0;
}

.view-toggle button:first-child {
  border-radius: 4px 0 0 4px;
}

.view-toggle button:last-child {
  border-radius: 0 4px 4px 0;
}

.view-toggle button.active {
  color: white;
  background-color: #1976D2;
  border-color: #1976D2;
}

/* 列表视图样式 */
.issue-list-view .issue-grid {
  display: block;
}

.issue-list-view .issue-card {
  margin-bottom: 8px;
}

.issue-list-view .issue-card .card-body {
  padding: 12px 16px;
}

.issue-list-view .issue-header {
  align-items: center;
  margin-bottom: 0;
}

.issue-list-view .issue-left {
  align-items: center;
}

.issue-list-view .issue-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
  font-size: 12px;
}

.issue-list-view .issue-content {
  flex: 1;
  min-width: 0;
}

.issue-list-view .issue-title {
  margin-bottom: 4px;
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.issue-list-view .issue-meta {
  margin-bottom: 0;
  gap: 16px;
}

.issue-list-view .issue-description {
  display: none;
}

.issue-list-view .issue-tags {
  display: none;
}

.issue-list-view .issue-status {
  width: 100px;
  text-align: center;
  flex-shrink: 0;
}

.issue-list-view .issue-status .status-badge {
  padding: 3px 6px;
  font-size: 11px;
}

.issue-list-view .issue-status .status-text {
  margin-top: 2px;
  font-size: 10px;
}

.issue-list-view .issue-actions {
  margin-left: 12px;
  flex-shrink: 0;
}

/* 日期筛选样式 */
.date-filter {
  display: flex;
  margin-right: 12px;
}

.filter-group {
  display: flex;
  gap: 8px;
}

.filter-group select {
  min-width: 100px;
  padding: 6px 10px;
  font-size: 13px;
  background-color: white;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
}

/* 处理问题模态框样式优化 */
.progress-stepper {
  display: flex;
  padding: 0 10px;
  margin-bottom: 20px;
  justify-content: space-between;
}

.step {
  position: relative;
  text-align: center;
  flex: 1;
}

.step::before {
  position: absolute;
  top: 15px;
  left: 0;
  z-index: 1;
  width: 100%;
  height: 2px;
  background-color: #E0E0E0;
  content: '';
}

.step:first-child::before {
  left: 50%;
  width: 50%;
}

.step:last-child::before {
  width: 50%;
}

.step-circle {
  position: relative;
  z-index: 2;
  display: flex;
  width: 32px;
  height: 32px;
  margin: 0 auto 10px;
  font-size: 14px;
  color: #757575;
  background-color: #E0E0E0;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
}

.step.active .step-circle {
  color: white;
  background-color: #1976D2;
  box-shadow: 0 2px 4px rgb(25 118 210 / 30%);
}

.step.completed .step-circle {
  color: white;
  background-color: #43A047;
}

.step-label {
  font-size: 13px;
  font-weight: 500;
  color: #757575;
}

.step-content {
  display: none;
  padding: 20px;
  margin-bottom: 20px;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.step-content.active {
  display: block;
  animation: fadeIn 0.3s ease;
}

.action-confirm-footer {
  display: flex;
  padding-top: 15px;
  margin-top: 20px;
  border-top: 1px solid #E0E0E0;
  justify-content: flex-end;
  gap: 10px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #424242;
}

.form-group textarea,
.form-group select,
.form-group input[type="text"],
.form-group input[type="datetime-local"] {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  background-color: white;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  transition: border 0.2s ease;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.form-group textarea:focus,
.form-group select:focus,
.form-group input:focus {
  border-color: #1976D2;
  outline: none;
  box-shadow: 0 0 0 2px rgb(25 118 210 / 10%);
}

.current-value {
  padding: 10px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #424242;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.form-control-wrapper {
  padding: 15px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
}

.form-control-item {
  margin-bottom: 15px;
}

.form-control-item:last-child {
  margin-bottom: 0;
}

.multi-select {
  margin-top: 8px;
}

.select-item {
  display: flex;
  margin-bottom: 8px;
  align-items: center;
}

.select-item input[type="checkbox"] {
  margin-right: 8px;
}

.confirm-summary {
  padding: 15px;
  margin-bottom: 20px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
}

.confirm-summary p {
  margin-bottom: 10px;
  line-height: 1.5;
}

.confirm-summary p:last-child {
  margin-bottom: 0;
}

.checkbox-group {
  margin: 10px 0;
}

.checkbox-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: normal;
}

.rule-reference {
  padding: 12px 15px;
  margin-bottom: 15px;
  font-size: 13px;
  line-height: 1.5;
  background-color: #E8F4FD;
  border-left: 3px solid #1976D2;
  border-radius: 4px;
}

.ai-suggestion {
  padding: 15px;
  margin-bottom: 20px;
  background-color: #F5F7FA;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
}

.ai-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.ai-icon {
  display: flex;
  width: 24px;
  height: 24px;
  margin-right: 8px;
  font-size: 12px;
  color: white;
  background-color: #4CAF50;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
}

.ai-title {
  font-size: 14px;
  font-weight: bold;
  color: #2E7D32;
}

.ai-content {
  font-size: 13px;
  line-height: 1.5;
  color: #212121;
}

.ai-content p {
  margin-bottom: 8px;
}

.ai-content p:last-child {
  margin-bottom: 0;
}

/* 状态样式 */
.status-badge {
  display: inline-block;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
}

.status-success {
  color: #2E7D32;
  background-color: #C8E6C9;
}

.status-warning {
  color: #E65100;
  background-color: #FFE0B2;
}

.status-danger {
  color: #D32F2F;
  background-color: #FFCDD2;
}

.status-info {
  color: #0D47A1;
  background-color: #BBDEFB;
}

/* 辅助类 */
.text-success { color: #4CAF50; }

.text-warning { color: #FF9800; }

.text-danger { color: #F44336; }

.text-info { color: #2196F3; }

.text-muted { color: #757575; }

.text-center { text-align: center; }

.text-right { text-align: right; }

.text-bold { font-weight: bold; }

.mt-1 { margin-top: 4px; }

.mt-2 { margin-top: 8px; }

.mt-3 { margin-top: 16px; }

.mb-1 { margin-bottom: 4px; }

.mb-2 { margin-bottom: 8px; }

.mb-3 { margin-bottom: 16px; }

.ml-1 { margin-left: 4px; }

.ml-2 { margin-left: 8px; }

.ml-3 { margin-left: 16px; }

.mr-1 { margin-right: 4px; }

.mr-2 { margin-right: 8px; }

.mr-3 { margin-right: 16px; }

/* 问题样式 */
.issue-item {
  padding: 12px;
  margin-bottom: 8px;
  background-color: white;
  border-left: 3px solid #F44336;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
}

.issue-item.warning {
  border-left-color: #FF9800;
}

.issue-item .issue-title {
  display: flex;
  margin-bottom: 5px;
  font-size: 14px;
  font-weight: 500;
  align-items: center;
}

.issue-item .issue-title i {
  margin-right: 8px;
  color: #F44336;
}

.issue-item .issue-title i.warning {
  color: #FF9800;
}

.issue-item .issue-description {
  margin-bottom: 8px;
  font-size: 13px;
  color: #757575;
}

.issue-details {
  padding: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  background-color: #F5F7FA;
  border-radius: 4px;
}

/* 提示框 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  padding: 12px 16px;
  font-size: 14px;
  color: white;
  border-radius: 6px;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.toast.show {
  transform: translateX(0);
}

.toast.success {
  background-color: #4CAF50;
}

.toast.error {
  background-color: #F44336;
}

.toast.warning {
  background-color: #FF9800;
}

.toast.info {
  background-color: #2196F3;
}

/* 全局样式重置 */
</style>