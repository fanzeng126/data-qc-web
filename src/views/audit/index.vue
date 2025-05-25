<template>
  <div class="audit-page">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <div class="page-title">病案质控审核</div>
    </div>
    
    <!-- 审核区域 -->
    <div class="audit-container">
      <!-- 左侧病案列表 -->
      <div class="audit-sidebar">
        <div class="sidebar-title">
          <span>待审核病例 ({{ patientList.length }})</span>
          <div class="dropdown">
            <button class="btn-icon">⋮</button>
            <div class="dropdown-menu">
              <div class="dropdown-item">按科室筛选</div>
              <div class="dropdown-item">按日期排序</div>
              <div class="dropdown-item">仅显示有问题的</div>
            </div>
          </div>
        </div>
        
        <div class="list-tools">
          <div class="list-filter">
            <select v-model="selectedDepartment">
              <option value="">全部科室</option>
              <option value="内科">内科</option>
              <option value="外科">外科</option>
              <option value="妇产科">妇产科</option>
            </select>
          </div>
          <div class="list-search">
            <i>🔍</i>
            <input type="text" v-model="searchKeyword" placeholder="搜索..."/>
          </div>
        </div>
        
        <div class="patient-list">
          <div 
            v-for="patient in filteredPatientList" 
            :key="patient.id"
            :class="['patient-item', { active: selectedPatient?.id === patient.id }]"
            @click="selectPatient(patient)"
          >
            <div class="patient-name">{{ patient.name }}</div>
            <div class="patient-info">
              <span>{{ patient.age }}岁 {{ patient.gender }}</span>
              <span>{{ patient.department }}</span>
            </div>
            <div class="patient-info">
              <span>住院号: {{ patient.admissionNo }}</span>
              <span>住院天数: {{ patient.hospitalDays }}</span>
            </div>
            <div class="patient-status">
              <span :class="['status-tag', `tag-${patient.status}`]">{{ getStatusText(patient.status) }}</span>
              <span>{{ patient.date }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧审核内容 -->
      <div class="audit-content" v-if="selectedPatient">
        <!-- 病人信息头部 -->
        <div class="content-header">
          <div class="patient-header">
            <div class="patient-avatar">{{ selectedPatient.name.charAt(0) }}</div>
            <div class="patient-details">
              <div class="detail-name">{{ selectedPatient.name }}</div>
              <div class="detail-meta">{{ selectedPatient.age }}岁 {{ selectedPatient.gender }} | {{ selectedPatient.department }} | 主诊医师: {{ selectedPatient.doctor }} | 住院号: {{ selectedPatient.admissionNo }}</div>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-sm btn-outline" @click="openMedicalDetailsModal">病历详情</button>
            <button class="btn btn-sm btn-outline">打印</button>
            <div class="dropdown ml-2">
              <button class="btn-icon">⋮</button>
              <div class="dropdown-menu">
                <div class="dropdown-item">查看完整病历</div>
                <div class="dropdown-item">导出PDF</div>
                <div class="dropdown-item">查看审核历史</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 内容标签页 -->
        <div class="audit-tab-bar">
          <div 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['audit-tab', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </div>
        </div>
        
        <!-- 标签页内容 -->
        <div class="tab-content">
          <!-- 病案首页内容 -->
          <div v-if="activeTab === 'record'" class="tab-pane">
            <div class="record-section">
              <div class="section-title">
                <span>基本信息</span>
                <span class="section-action" @click="showMoreInfo('basicInfo')">查看更多</span>
              </div>
              <div class="record-grid">
                <div class="record-item">
                  <div class="item-label">入院日期</div>
                  <div class="item-value">{{ selectedPatient.admissionDate }}</div>
                </div>
                <div class="record-item">
                  <div class="item-label">出院日期</div>
                  <div class="item-value">{{ selectedPatient.dischargeDate }}</div>
                </div>
                <div class="record-item">
                  <div class="item-label">住院天数</div>
                  <div class="item-value">{{ selectedPatient.hospitalDays }}天</div>
                </div>
                <div class="record-item">
                  <div class="item-label">科室</div>
                  <div class="item-value">{{ selectedPatient.department }}</div>
                </div>
                <div class="record-item">
                  <div class="item-label">入院途径</div>
                  <div class="item-value">{{ selectedPatient.admissionRoute }}</div>
                </div>
                <div class="record-item">
                  <div class="item-label">医保类型</div>
                  <div class="item-value">{{ selectedPatient.insuranceType }}</div>
                </div>
              </div>
            </div>
            
            <div class="record-section">
              <div class="section-title">
                <span>诊断信息</span>
                <span class="section-action" @click="openEditDiagnosisModal">编辑</span>
              </div>
              <table class="diagnosis-table">
                <thead>
                  <tr>
                    <th width="15%">类型</th>
                    <th width="40%">诊断名称</th>
                    <th width="15%">ICD编码</th>
                    <th width="15%">入院病情</th>
                    <th width="15%">治疗结果</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="diagnosis in diagnosisList" :key="diagnosis.id">
                    <td>
                      <span v-if="diagnosis.hasError" class="error-highlight">{{ diagnosis.type }}</span>
                      <span v-else>{{ diagnosis.type }}</span>
                    </td>
                    <td>
                      <span v-if="diagnosis.highlighted" class="highlighted">{{ diagnosis.name }}</span>
                      <span v-else>{{ diagnosis.name }}</span>
                    </td>
                    <td>{{ diagnosis.icdCode }}</td>
                    <td>{{ diagnosis.condition }}</td>
                    <td>{{ diagnosis.result }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="record-section">
              <div class="section-title">
                <span>手术及操作信息</span>
                <span class="section-action" @click="openEditOperationModal">编辑</span>
              </div>
              <table class="diagnosis-table">
                <thead>
                  <tr>
                    <th width="15%">序号</th>
                    <th width="40%">手术及操作名称</th>
                    <th width="15%">ICD编码</th>
                    <th width="15%">手术日期</th>
                    <th width="15%">术者</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="operation in operationList" :key="operation.id">
                    <td>{{ operation.sequence }}</td>
                    <td>{{ operation.name }}</td>
                    <td>{{ operation.icdCode }}</td>
                    <td>{{ operation.date }}</td>
                    <td>{{ operation.surgeon }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="record-section">
              <div class="section-title">
                <span>费用信息</span>
                <span class="section-action" @click="showCostDetails">查看明细</span>
              </div>
              <div class="record-grid">
                <div class="record-item">
                  <div class="item-label">总费用</div>
                  <div class="item-value">{{ selectedPatient.totalCost }}元</div>
                </div>
                <div class="record-item" v-for="cost in costList" :key="cost.type">
                  <div class="item-label">{{ cost.label }}</div>
                  <div class="item-value">{{ cost.amount }}元</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 审核结果 -->
          <div v-if="activeTab === 'result'" class="tab-pane">
            <div class="audit-result">
              <div class="result-header">
                <div :class="['result-icon', auditResult.type]">{{ auditResult.icon }}</div>
                <div class="result-title">{{ auditResult.title }}</div>
              </div>
              <div class="result-summary">{{ auditResult.summary }}</div>
              <div class="issues-list">
                <div v-for="issue in issuesList" :key="issue.id" :class="['issue-item', issue.level]">
                  <div class="issue-title">
                    <i :class="issue.level">{{ issue.icon }}</i> {{ issue.title }}
                  </div>
                  <div class="issue-description">{{ issue.description }}</div>
                  <div class="issue-details">{{ issue.details }}</div>
                  <div class="issue-actions">
                    <button class="btn btn-sm btn-outline" @click="ignoreIssue(issue.id)">忽略</button>
                    <button class="btn btn-sm btn-primary" @click="correctIssue(issue.id)">修正</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- AI分析建议 -->
          <div v-if="activeTab === 'ai'" class="tab-pane">
            <div class="ai-suggestion" v-for="suggestion in aiSuggestions" :key="suggestion.id">
              <div class="ai-header">
                <div class="ai-icon">AI</div>
                <div class="ai-title">{{ suggestion.title }}</div>
              </div>
              <div class="ai-content" v-html="suggestion.content"></div>
            </div>
            
            <div class="record-section">
              <div class="section-title">
                <span>相似病例参考</span>
              </div>
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>住院号</th>
                      <th>主要诊断</th>
                      <th>手术操作</th>
                      <th>住院天数</th>
                      <th>总费用</th>
                      <th>DRG分组</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="similarCase in similarCases" :key="similarCase.id">
                      <td>{{ similarCase.admissionNo }}</td>
                      <td>{{ similarCase.mainDiagnosis }}</td>
                      <td>{{ similarCase.operation }}</td>
                      <td>{{ similarCase.hospitalDays }}天</td>
                      <td>{{ similarCase.totalCost }}元</td>
                      <td>{{ similarCase.drgGroup }}</td>
                      <td><a href="#" @click.prevent="viewSimilarCaseDetails(similarCase.admissionNo)">查看详细</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <!-- 审核历史 -->
          <div v-if="activeTab === 'history'" class="tab-pane">
            <div class="audit-history">
              <div v-for="historyItem in auditHistory" :key="historyItem.id" class="history-item">
                <div :class="['history-icon', historyItem.type]">{{ historyItem.icon }}</div>
                <div class="history-content">
                  <div class="history-title">{{ historyItem.title }}</div>
                  <div class="history-description">{{ historyItem.description }}</div>
                  <div class="history-meta">
                    <span>{{ historyItem.operator }}</span>
                    <span>{{ historyItem.time }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 底部操作区域 -->
        <div class="audit-actions">
          <button class="btn btn-warning mr-2" @click="returnForModification">退回修改</button>
          <button class="btn btn-success" @click="approveAudit">审核通过</button>
        </div>
      </div>
    </div>
    
    <!-- 所有模态框组件 -->
    <!-- 病历详情模态框 -->
    <div v-if="modals.medicalDetails" class="modal-backdrop" @click="closeMedicalDetailsModal">
      <div class="modal-container modal-lg" @click.stop>
        <div class="modal-header">
          <div class="modal-title">病历详情 - {{ selectedPatient?.name }} (住院号: {{ selectedPatient?.admissionNo }})</div>
          <button class="modal-close" @click="closeMedicalDetailsModal">×</button>
        </div>
        <div class="modal-body">
          <div class="medical-details-section">
            <div class="details-header">患者基本信息</div>
            <div class="details-content">
              <div class="visit-info">
                <div class="info-item">
                  <div class="info-label">姓名</div>
                  <div class="info-value">{{ selectedPatient?.name }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">性别</div>
                  <div class="info-value">{{ selectedPatient?.gender }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">年龄</div>
                  <div class="info-value">{{ selectedPatient?.age }}岁</div>
                </div>
                <div class="info-item">
                  <div class="info-label">身份证号</div>
                  <div class="info-value">610******1234</div>
                </div>
                <div class="info-item">
                  <div class="info-label">联系方式</div>
                  <div class="info-value">138****5678</div>
                </div>
                <div class="info-item">
                  <div class="info-label">住址</div>
                  <div class="info-value">陕西省西安市...</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="medical-details-section">
            <div class="details-header">住院信息</div>
            <div class="details-content">
              <div class="visit-info">
                <div class="info-item">
                  <div class="info-label">住院号</div>
                  <div class="info-value">{{ selectedPatient?.admissionNo }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">入院时间</div>
                  <div class="info-value">{{ selectedPatient?.admissionDate }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">出院时间</div>
                  <div class="info-value">{{ selectedPatient?.dischargeDate }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">住院天数</div>
                  <div class="info-value">{{ selectedPatient?.hospitalDays }}天</div>
                </div>
                <div class="info-item">
                  <div class="info-label">科室</div>
                  <div class="info-value">{{ selectedPatient?.department }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">病区</div>
                  <div class="info-value">{{ selectedPatient?.department }}一病区</div>
                </div>
                <div class="info-item">
                  <div class="info-label">床号</div>
                  <div class="info-value">15床</div>
                </div>
                <div class="info-item">
                  <div class="info-label">主诊医师</div>
                  <div class="info-value">{{ selectedPatient?.doctor }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="medical-details-section">
            <div class="details-header">入院记录摘要</div>
            <div class="details-content">
              <p>患者，{{ selectedPatient?.gender }}，{{ selectedPatient?.age }}岁。因"突发胸痛2小时"于{{ selectedPatient?.admissionDate }}急诊入院。患者无明显诱因出现剧烈胸痛，位于胸骨后，呈压迫感，放射至左上臂，伴有出汗、恶心等症状。有高血压病史3年，服用缬沙坦控制，血压控制一般。无糖尿病史。</p>
              <p>入院查体：BP 160/95mmHg，HR 92次/分，神志清，双肺呼吸音清，未闻及啰音。心律齐，未闻及明显杂音。</p>
              <p>辅助检查：心电图示V1-V4导联ST段抬高；肌钙蛋白I 5.6ng/ml（正常参考值＜0.04ng/ml）；冠状动脉造影示前降支近段90%狭窄。</p>
            </div>
          </div>
          
          <div class="medical-details-section">
            <div class="details-header">医嘱记录</div>
            <div class="details-content">
              <div class="tab-section">
                <div 
                  v-for="orderTab in orderTabs" 
                  :key="orderTab.id"
                  :class="['tab-item', { active: activeOrderTab === orderTab.id }]"
                  @click="activeOrderTab = orderTab.id"
                >
                  {{ orderTab.label }}
                </div>
              </div>
              
              <!-- 用药医嘱内容 -->
              <div v-if="activeOrderTab === 'medication'" class="tab-panel active">
                <table class="diagnosis-table">
                  <thead>
                    <tr>
                      <th>医嘱时间</th>
                      <th>医嘱内容</th>
                      <th>剂量</th>
                      <th>用法</th>
                      <th>执行时间</th>
                      <th>开具医生</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="medication in medicationOrders" :key="medication.id">
                      <td>{{ medication.orderTime }}</td>
                      <td>{{ medication.name }}</td>
                      <td>{{ medication.dosage }}</td>
                      <td>{{ medication.usage }}</td>
                      <td>{{ medication.executeTime }}</td>
                      <td>{{ medication.doctor }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- 检查医嘱内容 -->
              <div v-if="activeOrderTab === 'examination'" class="tab-panel active">
                <div class="medical-timeline">
                  <div v-for="exam in examinationOrders" :key="exam.id" class="medical-timeline-item">
                    <div class="medical-date">{{ exam.date }}</div>
                    <div class="medical-item-list">
                      <div v-for="item in exam.items" :key="item.id" class="medical-item">
                        <div class="medical-item-name">{{ item.name }}</div>
                        <div class="medical-item-details">
                          <div class="medical-item-detail">
                            <span class="medical-item-label">类型:</span>
                            <span>{{ item.type }}</span>
                          </div>
                          <div class="medical-item-detail">
                            <span class="medical-item-label">时间:</span>
                            <span>{{ item.time }}</span>
                          </div>
                          <div class="medical-item-detail">
                            <span class="medical-item-label">医生:</span>
                            <span>{{ item.doctor }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 处置医嘱内容 -->
              <div v-if="activeOrderTab === 'treatment'" class="tab-panel active">
                <div class="medical-timeline">
                  <div v-for="treatment in treatmentOrders" :key="treatment.id" class="medical-timeline-item">
                    <div class="medical-date">{{ treatment.date }}</div>
                    <div class="medical-item-list">
                      <div v-for="item in treatment.items" :key="item.id" class="medical-item">
                        <div class="medical-item-name">{{ item.name }}</div>
                        <div class="medical-item-details">
                          <div class="medical-item-detail">
                            <span class="medical-item-label">内容:</span>
                            <span>{{ item.content }}</span>
                          </div>
                          <div class="medical-item-detail">
                            <span class="medical-item-label">时间:</span>
                            <span>{{ item.time }}</span>
                          </div>
                          <div class="medical-item-detail">
                            <span class="medical-item-label">医生:</span>
                            <span>{{ item.doctor }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeMedicalDetailsModal">关闭</button>
          <button class="btn btn-primary">导出病历</button>
        </div>
      </div>
    </div>

    <!-- 基本信息查看更多模态框 -->
    <div v-if="modals.moreInfo" class="modal-backdrop" @click="closeMoreInfoModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-title">基本信息详情</div>
          <button class="modal-close" @click="closeMoreInfoModal">×</button>
        </div>
        <div class="modal-body">
          <div class="record-grid">
            <div class="record-item">
              <div class="item-label">入院日期</div>
              <div class="item-value">{{ selectedPatient?.admissionDate }}</div>
            </div>
            <div class="record-item">
              <div class="item-label">出院日期</div>
              <div class="item-value">{{ selectedPatient?.dischargeDate }}</div>
            </div>
            <div class="record-item">
              <div class="item-label">住院天数</div>
              <div class="item-value">{{ selectedPatient?.hospitalDays }}天</div>
            </div>
            <div class="record-item">
              <div class="item-label">科室</div>
              <div class="item-value">{{ selectedPatient?.department }}</div>
            </div>
            <div class="record-item">
              <div class="item-label">病区</div>
              <div class="item-value">{{ selectedPatient?.department }}一病区</div>
            </div>
            <div class="record-item">
              <div class="item-label">床号</div>
              <div class="item-value">15床</div>
            </div>
            <div class="record-item">
              <div class="item-label">主诊医师</div>
              <div class="item-value">{{ selectedPatient?.doctor }}</div>
            </div>
            <div class="record-item">
              <div class="item-label">责任护士</div>
              <div class="item-value">李护士</div>
            </div>
            <div class="record-item">
              <div class="item-label">入院途径</div>
              <div class="item-value">{{ selectedPatient?.admissionRoute }}</div>
            </div>
            <div class="record-item">
              <div class="item-label">转科情况</div>
              <div class="item-value">无</div>
            </div>
            <div class="record-item">
              <div class="item-label">医保类型</div>
              <div class="item-value">{{ selectedPatient?.insuranceType }}</div>
            </div>
            <div class="record-item">
              <div class="item-label">医保号</div>
              <div class="item-value">6101********2345</div>
            </div>
            <div class="record-item">
              <div class="item-label">入院方式</div>
              <div class="item-value">步行</div>
            </div>
            <div class="record-item">
              <div class="item-label">出院方式</div>
              <div class="item-value">步行</div>
            </div>
            <div class="record-item">
              <div class="item-label">病历完成日期</div>
              <div class="item-value">{{ selectedPatient?.dischargeDate }}</div>
            </div>
            <div class="record-item">
              <div class="item-label">病历质量等级</div>
              <div class="item-value">B级</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeMoreInfoModal">关闭</button>
        </div>
      </div>
    </div>

    <!-- 诊断编辑模态框 -->
    <div v-if="modals.editDiagnosis" class="modal-backdrop" @click="closeEditDiagnosisModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-title">编辑诊断信息</div>
          <button class="modal-close" @click="closeEditDiagnosisModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveDiagnosis">
            <div class="form-group">
              <label>主要诊断</label>
              <select v-model="editData.mainDiagnosis" class="form-control">
                <option value="hypertension">高血压 (I10.X01)</option>
                <option value="ami">急性心肌梗死（前壁）(I21.001)</option>
                <option value="diabetes">2型糖尿病 (E11.901)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>诊断列表</label>
              <table class="diagnosis-table">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>诊断名称</th>
                    <th>ICD编码</th>
                    <th>入院病情</th>
                    <th>治疗结果</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(diagnosis, index) in editData.diagnosisList" :key="index">
                    <td>{{ diagnosis.type }}</td>
                    <td>
                      <input type="text" v-model="diagnosis.name" class="form-control"/>
                    </td>
                    <td>
                      <input type="text" v-model="diagnosis.icdCode" class="form-control"/>
                    </td>
                    <td>
                      <select v-model="diagnosis.condition" class="form-control">
                        <option>一般</option>
                        <option>危重</option>
                        <option>较重</option>
                      </select>
                    </td>
                    <td>
                      <select v-model="diagnosis.result" class="form-control">
                        <option>好转</option>
                        <option>治愈</option>
                        <option>未愈</option>
                        <option>死亡</option>
                      </select>
                    </td>
                    <td>
                      <button type="button" class="btn-icon" @click="moveDiagnosisUp(index)">⏶</button>
                      <button type="button" class="btn-icon" @click="moveDiagnosisDown(index)">⏷</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <button type="button" class="btn btn-sm btn-outline mt-2" @click="addDiagnosis">添加诊断</button>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeEditDiagnosisModal">取消</button>
          <button class="btn btn-primary" @click="saveDiagnosis">保存</button>
        </div>
      </div>
    </div>

    <!-- 手术编辑模态框 -->
    <div v-if="modals.editOperation" class="modal-backdrop" @click="closeEditOperationModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-title">编辑手术信息</div>
          <button class="modal-close" @click="closeEditOperationModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveOperation">
            <div class="form-group">
              <label>手术列表</label>
              <table class="diagnosis-table">
                <thead>
                  <tr>
                    <th>手术名称</th>
                    <th>手术时间</th>
                    <th>手术医生</th>
                    <th>手术结果</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(operation, index) in editData.operationList" :key="index">
                    <td>
                      <input type="text" v-model="operation.name" class="form-control"/>
                    </td>
                    <td>
                      <input type="text" v-model="operation.date" class="form-control"/>
                    </td>
                    <td>
                      <input type="text" v-model="operation.surgeon" class="form-control"/>
                    </td>
                    <td>
                      <select v-model="operation.result" class="form-control">
                        <option>成功</option>
                        <option>失败</option>
                      </select>
                    </td>
                    <td>
                      <button type="button" class="btn-icon" @click="moveOperationUp(index)">⏶</button>
                      <button type="button" class="btn-icon" @click="moveOperationDown(index)">⏷</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <button type="button" class="btn btn-sm btn-outline mt-2" @click="addOperation">添加手术</button>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeEditOperationModal">取消</button>
          <button class="btn btn-primary" @click="saveOperation">保存</button>
        </div>
      </div>
    </div>

    <!-- 费用明细模态框 -->
    <div v-if="modals.costDetails" class="modal-backdrop" @click="closeCostDetailsModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-title">费用明细</div>
          <button class="modal-close" @click="closeCostDetailsModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group mb-3">
            <label>总费用：{{ selectedPatient?.totalCost }}元</label>
          </div>
          
          <div class="details-content">
            <table class="cost-details">
              <thead>
                <tr>
                  <th>费用类别</th>
                  <th>金额（元）</th>
                  <th>百分比</th>
                  <th>医保范围内</th>
                  <th>自费</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cost in costDetailsList" :key="cost.type">
                  <td>{{ cost.category }}</td>
                  <td>{{ cost.amount }}</td>
                  <td>{{ cost.percentage }}</td>
                  <td>{{ cost.insurance }}</td>
                  <td>{{ cost.selfPay }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>合计</strong></td>
                  <td><strong>{{ selectedPatient?.totalCost }}</strong></td>
                  <td>100%</td>
                  <td><strong>22,854.25</strong></td>
                  <td><strong>1,002.25</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeCostDetailsModal">关闭</button>
          <button class="btn btn-primary">导出费用明细</button>
        </div>
      </div>
    </div>

    <!-- 相似病例详情模态框 -->
    <div v-if="modals.similarCase" class="modal-backdrop" @click="closeSimilarCaseModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-title">相似病例详情 - {{ currentSimilarCase?.admissionNo }}</div>
          <button class="modal-close" @click="closeSimilarCaseModal">×</button>
        </div>
        <div class="modal-body">
          <div class="similar-case-details">
            <div class="case-header">基本信息</div>
            <div class="case-content">
              <div class="visit-info">
                <div class="info-item">
                  <div class="info-label">住院号</div>
                  <div class="info-value">{{ currentSimilarCase?.admissionNo }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">科室</div>
                  <div class="info-value">心内科</div>
                </div>
                <div class="info-item">
                  <div class="info-label">入院日期</div>
                  <div class="info-value">2025-03-15</div>
                </div>
                <div class="info-item">
                  <div class="info-label">出院日期</div>
                  <div class="info-value">2025-03-22</div>
                </div>
                <div class="info-item">
                  <div class="info-label">住院天数</div>
                  <div class="info-value">{{ currentSimilarCase?.hospitalDays }}天</div>
                </div>
                <div class="info-item">
                  <div class="info-label">主诊医师</div>
                  <div class="info-value">王医生</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="similar-case-details">
            <div class="case-header">诊断信息</div>
            <div class="case-content">
              <table class="diagnosis-table">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>诊断名称</th>
                    <th>ICD编码</th>
                    <th>入院病情</th>
                    <th>治疗结果</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>主要诊断</td>
                    <td>{{ currentSimilarCase?.mainDiagnosis }}</td>
                    <td>I21.001</td>
                    <td>危重</td>
                    <td>好转</td>
                  </tr>
                  <tr>
                    <td>其他诊断</td>
                    <td>高血压</td>
                    <td>I10.X07</td>
                    <td>一般</td>
                    <td>好转</td>
                  </tr>
                  <tr>
                    <td>其他诊断</td>
                    <td>高脂血症</td>
                    <td>E78.509</td>
                    <td>一般</td>
                    <td>好转</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="similar-case-details">
            <div class="case-header">手术及操作信息</div>
            <div class="case-content">
              <table class="diagnosis-table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>手术及操作名称</th>
                    <th>ICD编码</th>
                    <th>手术日期</th>
                    <th>术者</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>{{ currentSimilarCase?.operation }}</td>
                    <td>36.06</td>
                    <td>2025-03-16</td>
                    <td>王医生</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="similar-case-details">
            <div class="case-header">DRG信息</div>
            <div class="case-content">
              <div class="visit-info">
                <div class="info-item">
                  <div class="info-label">DRG分组</div>
                  <div class="info-value">{{ currentSimilarCase?.drgGroup }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">DRG名称</div>
                  <div class="info-value">急性心肌梗死</div>
                </div>
                <div class="info-item">
                  <div class="info-label">权重</div>
                  <div class="info-value">2.35</div>
                </div>
                <div class="info-item">
                  <div class="info-label">医保支付标准</div>
                  <div class="info-value">22,500.00元</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeSimilarCaseModal">关闭</button>
          <button class="btn btn-primary" @click="applyFromSimilarCase">应用参考</button>
        </div>
      </div>
    </div>

    <!-- AI分析详情模态框 -->
    <div v-if="modals.analysisDetail" class="modal-backdrop" @click="closeAnalysisDetailModal">
      <div class="modal-container modal-lg" @click.stop>
        <div class="modal-header">
          <div class="modal-title">AI分析详情 - {{ currentAnalysisCase }}</div>
          <button class="modal-close" @click="closeAnalysisDetailModal">×</button>
        </div>
        <div class="modal-body">
          <div class="analysis-header">
            <div class="analysis-icon">AI</div>
            <div class="analysis-title">主要诊断选择分析</div>
          </div>
          
          <div class="analysis-detail-section">
            <div class="analysis-subtitle">问题描述</div>
            <div class="analysis-content">
              <p>当前病例中主要诊断为"高血压"（I10.X01），但根据患者的临床表现和资源消耗情况，"急性心肌梗死（前壁）"（I21.001）更适合作为主要诊断。</p>
            </div>
          </div>
          
          <div class="analysis-detail-section">
            <div class="analysis-subtitle">主诊断对比分析</div>
            <div class="analysis-content">
              <table class="comparison-table">
                <thead>
                  <tr>
                    <th>评估指标</th>
                    <th>当前主诊断：高血压</th>
                    <th>建议主诊断：急性心肌梗死</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>入院主因</td>
                    <td class="current">不符合（患者因急性胸痛入院）</td>
                    <td class="suggested">符合（急性胸痛是心肌梗死典型症状）</td>
                  </tr>
                  <tr>
                    <td>资源消耗</td>
                    <td class="current">低（未针对高血压进行特殊治疗）</td>
                    <td class="suggested">高（行冠脉造影及支架置入术）</td>
                  </tr>
                  <tr>
                    <td>疾病严重程度</td>
                    <td class="current">一般</td>
                    <td class="suggested">危重</td>
                  </tr>
                  <tr>
                    <td>干预措施针对性</td>
                    <td class="current">低（主要措施非针对高血压）</td>
                    <td class="suggested">高（抗血小板、支架置入等直接针对心梗）</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="analysis-detail-section">
            <div class="analysis-subtitle">建议修改方案</div>
            <div class="analysis-content">
              <p>1. 调整主要诊断顺序：</p>
              <div class="code-correction">
<span class="deleted-code">- 主要诊断：高血压 (I10.X01)</span>
<span class="deleted-code">- 其他诊断：急性心肌梗死（前壁）(I21.001)</span>
<span class="added-code">+ 主要诊断：急性心肌梗死（前壁）(I21.001)</span>
<span class="added-code">+ 其他诊断：高血压 (I10.X07)</span>
              </div>
              
              <p>2. 建议同时优化高血压的编码：</p>
              <div class="code-correction">
<span class="deleted-code">- 高血压 (I10.X01)</span>
<span class="added-code">+ 原发性高血压伴心脏病 (I10.X07)</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeAnalysisDetailModal">关闭</button>
          <button class="btn btn-primary" @click="applyAnalysisRecommendation">应用修改建议</button>
        </div>
      </div>
    </div>

    <!-- 问题修正模态框 -->
    <div v-if="modals.correctIssue" class="modal-backdrop" @click="closeCorrectIssueModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-title">修正问题 - {{ currentIssue?.title }}</div>
          <button class="modal-close" @click="closeCorrectIssueModal">×</button>
        </div>
        <div class="modal-body">
          <div class="issue-details mb-3">
            {{ currentIssue?.description }}
          </div>
          
          <form @submit.prevent="confirmCorrection">
            <div v-if="currentIssue?.id === 1" class="form-group">
              <label>调整主要诊断</label>
              <select v-model="correctionData.correctedDiagnosis" class="form-control">
                <option value="hypertension">高血压 (I10.X01)</option>
                <option value="ami" selected>急性心肌梗死（前壁）(I21.001)</option>
                <option value="diabetes">2型糖尿病 (E11.901)</option>
              </select>
              <div class="form-hint">系统推荐将"急性心肌梗死（前壁）"设为主要诊断</div>
            </div>
            
            <div v-if="currentIssue?.id === 2" class="form-group">
              <label>调整诊断编码</label>
              <div class="record-grid">
                <div class="record-item">
                  <label>诊断名称</label>
                  <input type="text" class="form-control" value="高血压" readonly/>
                </div>
                <div class="record-item">
                  <label>当前编码</label>
                  <input type="text" class="form-control" value="I10.X01" readonly/>
                </div>
                <div class="record-item">
                  <label>建议编码</label>
                  <select v-model="correctionData.suggestedCode" class="form-control">
                    <option>请选择编码</option>
                    <option value="I10.X07" selected>I10.X07（原发性高血压伴心脏病）</option>
                    <option value="I10.X02">I10.X02（原发性高血压1级）</option>
                    <option value="I10.X03">I10.X03（原发性高血压2级）</option>
                  </select>
                </div>
              </div>
              <div class="form-hint">系统推荐使用"I10.X07（原发性高血压伴心脏病）"以更精确反映患者情况</div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeCorrectIssueModal">取消</button>
          <button class="btn btn-primary" @click="confirmCorrection">确认修正</button>
        </div>
      </div>
    </div>

    <!-- 忽略问题确认模态框 -->
    <div v-if="modals.ignoreIssue" class="modal-backdrop" @click="closeIgnoreIssueModal">
      <div class="modal-container modal-sm" @click.stop>
        <div class="modal-header">
          <div class="modal-title">忽略问题</div>
          <button class="modal-close" @click="closeIgnoreIssueModal">×</button>
        </div>
        <div class="modal-body">
          <p>您确定要忽略此问题吗？</p>
          <p>{{ currentIssue?.description }}</p>
          <div class="form-group">
            <label>忽略原因</label>
            <select v-model="ignoreData.reason" class="form-control">
              <option value="">请选择忽略原因</option>
              <option value="clinical">临床医学判断</option>
              <option value="special">特殊病例处理</option>
              <option value="rule">规则不适用</option>
              <option value="other">其他原因</option>
            </select>
          </div>
          <div class="form-group">
            <label>备注说明</label>
            <textarea v-model="ignoreData.comment" class="form-control" placeholder="请输入忽略此问题的详细原因..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeIgnoreIssueModal">取消</button>
          <button class="btn btn-primary" @click="confirmIgnore">确认忽略</button>
        </div>
      </div>
    </div>

    <!-- 审核通过确认模态框 -->
    <div v-if="modals.approveAudit" class="modal-backdrop" @click="closeApproveAuditModal">
      <div class="modal-container modal-sm" @click.stop>
        <div class="modal-header">
          <div class="modal-title">审核通过确认</div>
          <button class="modal-close" @click="closeApproveAuditModal">×</button>
        </div>
        <div class="modal-body">
          <div class="alert alert-warning" v-if="hasUnresolvedIssues">
            <strong>注意！</strong> 当前病例仍有未解决的质控问题。
          </div>
          <p>您确定要将此病例标记为审核通过吗？</p>
          <div class="form-group">
            <label>审核意见</label>
            <textarea v-model="approvalData.comment" class="form-control" placeholder="请输入审核意见..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeApproveAuditModal">取消</button>
          <button class="btn btn-primary" @click="confirmApproveAudit">确认通过</button>
        </div>
      </div>
    </div>

    <!-- 退回修改模态框 -->
    <div v-if="modals.returnModification" class="modal-backdrop" @click="closeReturnForModificationModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-title">退回修改</div>
          <button class="modal-close" @click="closeReturnForModificationModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>退回部门</label>
            <select v-model="returnData.department" class="form-control">
              <option value="cardiology">{{ selectedPatient?.department }}</option>
              <option value="medical_record">病案科</option>
              <option value="doctor">主治医师：{{ selectedPatient?.doctor }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>退回原因</label>
            <select v-model="returnData.reason" class="form-control">
              <option value="">请选择退回原因</option>
              <option value="diagnosis">诊断信息不准确</option>
              <option value="operation">手术信息不完整</option>
              <option value="coding">编码不规范</option>
              <option value="cost">费用信息有误</option>
              <option value="other">其他原因</option>
            </select>
          </div>
          <div class="form-group">
            <label>退回说明</label>
            <textarea v-model="returnData.description" class="form-control" rows="4" placeholder="请详细说明需要修改的内容...">1. 主要诊断选择错误，建议将"急性心肌梗死（前壁）"设为主要诊断。
2. 高血压编码不精确，建议使用I10.X07（原发性高血压伴心脏病）。</textarea>
          </div>
          <div class="form-group">
            <label>期望完成时间</label>
            <input type="date" v-model="returnData.expectedDate" class="form-control" value="2025-05-22"/>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeReturnForModificationModal">取消</button>
          <button class="btn btn-primary" @click="confirmReturnForModification">确认退回</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from 'vue'

// 定义数据类型
interface Patient {
  id: number
  name: string
  age: number
  gender: string
  department: string
  admissionNo: string
  hospitalDays: number
  status: 'waiting' | 'in-progress' | 'completed' | 'error'
  date: string
  doctor: string
  admissionDate: string
  dischargeDate: string
  admissionRoute: string
  insuranceType: string
  totalCost: string
}

interface Diagnosis {
  id: number
  type: string
  name: string
  icdCode: string
  condition: string
  result: string
  hasError?: boolean
  highlighted?: boolean
}

interface Operation {
  id: number
  sequence: number
  name: string
  icdCode: string
  date: string
  surgeon: string
}

interface Cost {
  type: string
  label: string
  amount: string
}

interface Issue {
  id: number
  title: string
  description: string
  details: string
  level: 'error' | 'warning'
  icon: string
}

interface AISuggestion {
  id: number
  title: string
  content: string
}

interface SimilarCase {
  id: number
  admissionNo: string
  mainDiagnosis: string
  operation: string
  hospitalDays: number
  totalCost: string
  drgGroup: string
}

interface HistoryItem {
  id: number
  title: string
  description: string
  operator: string
  time: string
  type: 'error' | 'warning' | 'success' | 'info'
  icon: string
}

interface MedicationOrder {
  id: number
  orderTime: string
  name: string
  dosage: string
  usage: string
  executeTime: string
  doctor: string
}

interface ExaminationOrder {
  id: number
  date: string
  items: Array<{
    id: number
    name: string
    type: string
    time: string
    doctor: string
  }>
}

interface TreatmentOrder {
  id: number
  date: string
  items: Array<{
    id: number
    name: string
    content: string
    time: string
    doctor: string
  }>
}

// 响应式数据
const selectedDepartment = ref<string>('')
const searchKeyword = ref<string>('')
const selectedPatient = ref<Patient | null>(null)
const activeTab = ref<string>('record')
const activeOrderTab = ref<string>('medication')

// 模态框状态
const modals = reactive({
  medicalDetails: false,
  editDiagnosis: false,
  editOperation: false,
  costDetails: false,
  similarCase: false,
  analysisDetail: false,
  correctIssue: false,
  ignoreIssue: false,
  approveAudit: false,
  returnModification: false,
  moreInfo: false
})

// 标签页配置
const tabs = ref([
  { id: 'record', label: '病案首页' },
  { id: 'result', label: '审核结果' },
  { id: 'ai', label: 'AI分析建议' },
  { id: 'history', label: '审核历史' }
])

const orderTabs = ref([
  { id: 'medication', label: '用药医嘱' },
  { id: 'examination', label: '检查医嘱' },
  { id: 'treatment', label: '处置医嘱' }
])

// 模拟数据
const patientList = ref<Patient[]>([
  {
    id: 1,
    name: '张某某',
    age: 35,
    gender: '男',
    department: '心内科',
    admissionNo: '202505120042',
    hospitalDays: 8,
    status: 'error',
    date: '2025-05-18',
    doctor: '陈医生',
    admissionDate: '2025-05-10 14:25',
    dischargeDate: '2025-05-18 10:30',
    admissionRoute: '急诊',
    insuranceType: '城镇职工医保',
    totalCost: '23,856.50'
  },
  {
    id: 2,
    name: '李某某',
    age: 42,
    gender: '女',
    department: '神经内科',
    admissionNo: '202505120043',
    hospitalDays: 5,
    status: 'waiting',
    date: '2025-05-18',
    doctor: '王医生',
    admissionDate: '2025-05-13 09:15',
    dischargeDate: '2025-05-18 16:20',
    admissionRoute: '门诊',
    insuranceType: '城镇居民医保',
    totalCost: '15,432.80'
  },
  {
    id: 3,
    name: '王某某',
    age: 67,
    gender: '男',
    department: '呼吸内科',
    admissionNo: '202505120044',
    hospitalDays: 12,
    status: 'waiting',
    date: '2025-05-18',
    doctor: '赵医生',
    admissionDate: '2025-05-06 11:30',
    dischargeDate: '2025-05-18 14:45',
    admissionRoute: '急诊',
    insuranceType: '新农合',
    totalCost: '18,756.25'
  }
])

const diagnosisList = ref<Diagnosis[]>([
  {
    id: 1,
    type: '主要诊断',
    name: '高血压',
    icdCode: 'I10.X01',
    condition: '一般',
    result: '好转',
    hasError: true,
    highlighted: true
  },
  {
    id: 2,
    type: '其他诊断',
    name: '急性心肌梗死（前壁）',
    icdCode: 'I21.001',
    condition: '危重',
    result: '好转'
  },
  {
    id: 3,
    type: '其他诊断',
    name: '2型糖尿病',
    icdCode: 'E11.901',
    condition: '一般',
    result: '好转'
  }
])

const operationList = ref<Operation[]>([
  {
    id: 1,
    sequence: 1,
    name: '冠状动脉支架置入术',
    icdCode: '36.06',
    date: '2025-05-11',
    surgeon: '王医生'
  }
])

const costList = ref<Cost[]>([
  { type: 'drug', label: '药品费', amount: '8,432.25' },
  { type: 'surgery', label: '手术费', amount: '6,500.00' },
  { type: 'examination', label: '检查费', amount: '4,235.80' },
  { type: 'bed', label: '床位费', amount: '1,600.00' },
  { type: 'other', label: '其他费用', amount: '3,088.45' }
])

const auditResult = ref({
  type: 'error',
  icon: '!',
  title: '发现2项质控问题',
  summary: '系统自动审核发现该病例存在2项质控问题，需要修正后才能通过审核。'
})

const issuesList = ref<Issue[]>([
  {
    id: 1,
    title: '主要诊断选择错误',
    description: '当前主要诊断为"高血压"，但病例中存在"急性心肌梗死"，根据主要诊断选择规则，急性心肌梗死应为本次住院的主要诊断。',
    details: '参考规则：R001 - 主要诊断应为导致本次住院的主要原因，通常为耗费医疗资源最多的疾病。本例中患者因急性胸痛入院，急诊入院，且行冠状动脉支架置入术，主要诊断应为急性心肌梗死。',
    level: 'error',
    icon: '⚠️'
  },
  {
    id: 2,
    title: '诊断编码需优化',
    description: '高血压编码使用的是I10.X01，建议根据患者具体情况选择更精确的编码。',
    details: '参考规则：R008 - 编码应尽可能精确，对于高血压疾病应明确是原发性还是继发性，以及是否伴有心脏并发症。',
    level: 'warning',
    icon: '⚠️'
  }
])

const aiSuggestions = ref<AISuggestion[]>([
  {
    id: 1,
    title: 'AI质控分析建议',
    content: `
      <p>根据患者的临床资料分析，本例患者因急性胸痛通过急诊入院，经检查确诊为急性心肌梗死（前壁），并接受了冠状动脉支架置入术治疗。虽然患者有高血压病史，但本次住院的主要原因及医疗资源消耗主要与急性心肌梗死相关。</p>
      <p>建议修改：</p>
      <p>1. 将"急性心肌梗死（前壁）"设为主要诊断，"高血压"调整为其他诊断</p>
      <p>2. 高血压编码建议使用I10.X07（原发性高血压伴心脏病），以反映高血压与心脏疾病的关联</p>
      <p>3. 确认手术编码36.06是否为最新版本的ICD-9-CM-3编码，如使用国内编码系统可能需要调整</p>
      <p>调整这些问题将提高病案首页数据质量，更准确反映患者的实际临床情况，并可能影响DRG/DIP分组结果和医保支付。</p>
    `
  },
  {
    id: 2,
    title: 'DRG/DIP分组分析',
    content: `
      <p>当前诊断编码下的DRG分组结果：F23（高血压）</p>
      <p>修改主要诊断后的预期DRG分组：F06（急性心肌梗死）</p>
      <p>分组变化将导致权重和支付标准的变化，修正后更符合实际医疗服务内容和资源消耗。</p>
    `
  }
])

const similarCases = ref<SimilarCase[]>([
  {
    id: 1,
    admissionNo: '202503150023',
    mainDiagnosis: '急性心肌梗死（前壁）',
    operation: '冠状动脉支架置入术',
    hospitalDays: 7,
    totalCost: '25,632.50',
    drgGroup: 'F06'
  },
  {
    id: 2,
    admissionNo: '202504020015',
    mainDiagnosis: '急性心肌梗死（下壁）',
    operation: '冠状动脉支架置入术',
    hospitalDays: 9,
    totalCost: '27,845.30',
    drgGroup: 'F06'
  }
])

const auditHistory = ref<HistoryItem[]>([
  {
    id: 1,
    title: '质控系统自动检测发现2项问题',
    description: '主要诊断选择错误、诊断编码需优化',
    operator: 'AI质控系统',
    time: '2025-05-18 15:30',
    type: 'error',
    icon: '!'
  },
  {
    id: 2,
    title: '质控专员审核',
    description: '正在进行人工确认...',
    operator: '李质控',
    time: '2025-05-19 09:15',
    type: 'info',
    icon: '👁️'
  }
])

const medicationOrders = ref<MedicationOrder[]>([
  {
    id: 1,
    orderTime: '2025-05-10 15:00',
    name: '阿司匹林',
    dosage: '300mg',
    usage: '口服，立即',
    executeTime: '2025-05-10 15:10',
    doctor: '陈医生'
  },
  {
    id: 2,
    orderTime: '2025-05-10 15:00',
    name: '氯吡格雷',
    dosage: '300mg',
    usage: '口服，立即',
    executeTime: '2025-05-10 15:10',
    doctor: '陈医生'
  },
  {
    id: 3,
    orderTime: '2025-05-11 10:00',
    name: '阿托伐他汀',
    dosage: '40mg',
    usage: '口服，每晚1次',
    executeTime: '2025-05-11 21:00',
    doctor: '陈医生'
  }
])

const examinationOrders = ref<ExaminationOrder[]>([
  {
    id: 1,
    date: '2025-05-10（入院当天）',
    items: [
      {
        id: 1,
        name: '心电图检查',
        type: '常规12导联',
        time: '2025-05-10 14:40',
        doctor: '陈医生'
      },
      {
        id: 2,
        name: '心肌酶谱、肌钙蛋白I检测',
        type: '血清学检测',
        time: '2025-05-10 14:50',
        doctor: '陈医生'
      },
      {
        id: 3,
        name: '冠状动脉造影',
        type: '介入检查',
        time: '2025-05-10 16:40',
        doctor: '王医生'
      }
    ]
  },
  {
    id: 2,
    date: '2025-05-11',
    items: [
      {
        id: 4,
        name: '心脏超声检查',
        type: '彩色多普勒超声',
        time: '2025-05-11 14:00',
        doctor: '赵医生'
      }
    ]
  }
])

const treatmentOrders = ref<TreatmentOrder[]>([
  {
    id: 1,
    date: '2025-05-10（入院当天）',
    items: [
      {
        id: 1,
        name: '入院常规',
        content: '建立静脉通路，监测生命体征，吸氧治疗',
        time: '2025-05-10 14:30',
        doctor: '陈医生'
      }
    ]
  },
  {
    id: 2,
    date: '2025-05-11',
    items: [
      {
        id: 2,
        name: '冠状动脉支架置入术',
        content: '介入手术',
        time: '2025-05-11 08:30',
        doctor: '王医生'
      },
      {
        id: 3,
        name: '术后特殊处理',
        content: '穿刺点加压包扎，床上制动6小时，密切观察生命体征',
        time: '2025-05-11 10:30',
        doctor: '王医生'
      }
    ]
  }
])

// 计算属性
const filteredPatientList = computed(() => {
  let filtered = patientList.value

  if (selectedDepartment.value) {
    filtered = filtered.filter(patient => patient.department.includes(selectedDepartment.value))
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(patient => 
      patient.name.toLowerCase().includes(keyword) ||
      patient.admissionNo.includes(keyword) ||
      patient.department.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 方法
const selectPatient = (patient: Patient) => {
  selectedPatient.value = patient
}

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'waiting': '待审核',
    'in-progress': '审核中',
    'completed': '已通过',
    'error': '存在问题'
  }
  return statusMap[status] || status
}

// 当前操作相关的数据
const currentIssue = ref<Issue | null>(null)
const currentSimilarCase = ref<SimilarCase | null>(null)
const currentAnalysisCase = ref<string>('')
const hasUnresolvedIssues = ref<boolean>(true)

// 编辑相关的数据
const editData = reactive({
  mainDiagnosis: 'hypertension',
  diagnosisList: [
    {
      type: '主要诊断',
      name: '高血压',
      icdCode: 'I10.X01',
      condition: '一般',
      result: '好转'
    },
    {
      type: '其他诊断',
      name: '急性心肌梗死（前壁）',
      icdCode: 'I21.001',
      condition: '危重',
      result: '好转'
    },
    {
      type: '其他诊断',
      name: '2型糖尿病',
      icdCode: 'E11.901',
      condition: '一般',
      result: '好转'
    }
  ],
  operationList: [
    {
      name: '冠状动脉支架置入术',
      date: '2025-05-11 08:30',
      surgeon: '王医生',
      result: '成功'
    }
  ]
})

// 修正和忽略相关的数据
const correctionData = reactive({
  correctedDiagnosis: 'ami',
  suggestedCode: 'I10.X07'
})

const ignoreData = reactive({
  reason: '',
  comment: ''
})

const approvalData = reactive({
  comment: ''
})

const returnData = reactive({
  department: 'cardiology',
  reason: '',
  description: '1. 主要诊断选择错误，建议将"急性心肌梗死（前壁）"设为主要诊断。\n2. 高血压编码不精确，建议使用I10.X07（原发性高血压伴心脏病）。',
  expectedDate: '2025-05-22'
})

// 费用明细数据
const costDetailsList = ref([
  {
    type: 'drug',
    category: '药品费',
    amount: '8,432.25',
    percentage: '35.3%',
    insurance: '7,980.00',
    selfPay: '452.25'
  },
  {
    type: 'surgery',
    category: '手术费',
    amount: '6,500.00',
    percentage: '27.2%',
    insurance: '6,500.00',
    selfPay: '0.00'
  },
  {
    type: 'examination',
    category: '检查费',
    amount: '4,235.80',
    percentage: '17.8%',
    insurance: '4,235.80',
    selfPay: '0.00'
  },
  {
    type: 'bed',
    category: '床位费',
    amount: '1,600.00',
    percentage: '6.7%',
    insurance: '1,200.00',
    selfPay: '400.00'
  },
  {
    type: 'nursing',
    category: '护理费',
    amount: '1,200.00',
    percentage: '5.0%',
    insurance: '1,200.00',
    selfPay: '0.00'
  },
  {
    type: 'treatment',
    category: '治疗费',
    amount: '1,088.45',
    percentage: '4.6%',
    insurance: '1,088.45',
    selfPay: '0.00'
  },
  {
    type: 'material',
    category: '材料费',
    amount: '800.00',
    percentage: '3.4%',
    insurance: '650.00',
    selfPay: '150.00'
  }
])

// 模态框操作方法
const openMedicalDetailsModal = () => {
  modals.medicalDetails = true
}

const closeMedicalDetailsModal = () => {
  modals.medicalDetails = false
}

const openEditDiagnosisModal = () => {
  modals.editDiagnosis = true
}

const closeEditDiagnosisModal = () => {
  modals.editDiagnosis = false
}

const openEditOperationModal = () => {
  modals.editOperation = true
}

const closeEditOperationModal = () => {
  modals.editOperation = false
}

const showCostDetails = () => {
  modals.costDetails = true
}

const closeCostDetailsModal = () => {
  modals.costDetails = false
}

const showMoreInfo = (section: string) => {
  if (section === 'basicInfo') {
    modals.moreInfo = true
  }
}

const closeMoreInfoModal = () => {
  modals.moreInfo = false
}

const viewAnalysisDetail = (caseId: string) => {
  currentAnalysisCase.value = caseId
  modals.analysisDetail = true
}

const closeAnalysisDetailModal = () => {
  modals.analysisDetail = false
}

const viewSimilarCaseDetails = (caseId: string) => {
  const similarCase = similarCases.value.find(c => c.admissionNo === caseId)
  if (similarCase) {
    currentSimilarCase.value = similarCase
    modals.similarCase = true
  }
}

const closeSimilarCaseModal = () => {
  modals.similarCase = false
  currentSimilarCase.value = null
}

const correctIssue = (issueId: number) => {
  const issue = issuesList.value.find(i => i.id === issueId)
  if (issue) {
    currentIssue.value = issue
    modals.correctIssue = true
  }
}

const closeCorrectIssueModal = () => {
  modals.correctIssue = false
  currentIssue.value = null
}

const ignoreIssue = (issueId: number) => {
  const issue = issuesList.value.find(i => i.id === issueId)
  if (issue) {
    currentIssue.value = issue
    modals.ignoreIssue = true
  }
}

const closeIgnoreIssueModal = () => {
  modals.ignoreIssue = false
  currentIssue.value = null
  ignoreData.reason = ''
  ignoreData.comment = ''
}

const approveAudit = () => {
  modals.approveAudit = true
}

const closeApproveAuditModal = () => {
  modals.approveAudit = false
}

const returnForModification = () => {
  modals.returnModification = true
}

const closeReturnForModificationModal = () => {
  modals.returnModification = false
}

// 编辑操作方法
const addDiagnosis = () => {
  editData.diagnosisList.push({
    type: '其他诊断',
    name: '',
    icdCode: '',
    condition: '一般',
    result: '好转'
  })
}

const moveDiagnosisUp = (index: number) => {
  if (index > 0) {
    const temp = editData.diagnosisList[index]
    editData.diagnosisList[index] = editData.diagnosisList[index - 1]
    editData.diagnosisList[index - 1] = temp
  }
}

const moveDiagnosisDown = (index: number) => {
  if (index < editData.diagnosisList.length - 1) {
    const temp = editData.diagnosisList[index]
    editData.diagnosisList[index] = editData.diagnosisList[index + 1]
    editData.diagnosisList[index + 1] = temp
  }
}

const addOperation = () => {
  editData.operationList.push({
    name: '',
    date: '',
    surgeon: '',
    result: '成功'
  })
}

const moveOperationUp = (index: number) => {
  if (index > 0) {
    const temp = editData.operationList[index]
    editData.operationList[index] = editData.operationList[index - 1]
    editData.operationList[index - 1] = temp
  }
}

const moveOperationDown = (index: number) => {
  if (index < editData.operationList.length - 1) {
    const temp = editData.operationList[index]
    editData.operationList[index] = editData.operationList[index + 1]
    editData.operationList[index + 1] = temp
  }
}

// 保存操作方法
const saveDiagnosis = () => {
  // 实现保存诊断的逻辑
  alert('诊断信息已保存')
  closeEditDiagnosisModal()
}

const saveOperation = () => {
  // 实现保存手术信息的逻辑
  alert('手术信息已保存')
  closeEditOperationModal()
}

// 确认操作方法
const confirmCorrection = () => {
  // 实现确认修正的逻辑
  alert('问题修正已完成')
  closeCorrectIssueModal()
}

const confirmIgnore = () => {
  if (!ignoreData.reason) {
    alert('请选择忽略原因')
    return
  }
  // 实现确认忽略的逻辑
  alert('问题已标记为忽略')
  closeIgnoreIssueModal()
}

const confirmApproveAudit = () => {
  // 实现确认审核通过的逻辑
  alert('病例已标记为审核通过')
  closeApproveAuditModal()
}

const confirmReturnForModification = () => {
  if (!returnData.reason) {
    alert('请选择退回原因')
    return
  }
  // 实现确认退回修改的逻辑
  alert('病例已退回修改')
  closeReturnForModificationModal()
}

const applyFromSimilarCase = () => {
  // 实现应用相似病例参考的逻辑
  alert('已应用相似病例参考')
  closeSimilarCaseModal()
}

const applyAnalysisRecommendation = () => {
  // 实现应用AI分析建议的逻辑
  alert('已应用AI分析建议')
  closeAnalysisDetailModal()
}

// 初始化
onMounted(() => {
  // 默认选择第一个患者
  if (patientList.value.length > 0) {
    selectedPatient.value = patientList.value[0]
  }
})
</script>

<style scoped>


@keyframes fadeIn {
  from { opacity: 0; }

  to { opacity: 1; }
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(20px); }

  to { opacity: 1; transform: translateY(0); }
}

/* 响应式布局优化 */
@media (width <= 992px) {
  .audit-container {
    flex-direction: column;
    height: auto;
  }
  
  .audit-sidebar {
    width: 100%;
    max-height: 300px;
  }
}

@media (width <= 768px) {
  .page-header {
    padding: 12px 16px;
  }
  
  .audit-container {
    padding: 12px;
    gap: 12px;
  }
  
  .record-grid {
    grid-template-columns: 1fr;
  }
  
  .visit-info {
    grid-template-columns: 1fr;
  }
  
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .patient-header {
    width: 100%;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

.audit-page {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  font-family: "Microsoft YaHei", "Segoe UI", sans-serif;
  color: #212121;
  background-color: #F5F7FA;
  flex-direction: column;
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

/* 页面标题栏 */
.page-header {
  padding: 16px;
  background-color: white;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
  flex-shrink: 0;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: #212121;
}

.audit-container {
  display: flex;
  gap: 16px;
  height: calc(100vh - 82px);
  padding: 16px;
  flex: 1;
  overflow: hidden;
}

.audit-sidebar {
  display: flex;
  width: 280px;
  overflow: hidden;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-title {
  display: flex;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid #E0E0E0;
  justify-content: space-between;
  align-items: center;
}

.patient-list {
  overflow-y: auto;
  flex-grow: 1;
}

.patient-item {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #E0E0E0;
  transition: background-color 0.3s;
}

.patient-item:hover {
  background-color: #F5F7FA;
}

.patient-item.active {
  background-color: #BBDEFB;
  border-left: 3px solid #1976D2;
}

.patient-name {
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
}

.patient-info {
  display: flex;
  margin-bottom: 6px;
  font-size: 12px;
  color: #757575;
  justify-content: space-between;
}

.patient-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-tag {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 12px;
}

.tag-waiting {
  color: #757575;
  background-color: #E0E0E0;
}

.tag-in-progress {
  color: #E65100;
  background-color: #FFE0B2;
}

.tag-completed {
  color: #2E7D32;
  background-color: #C8E6C9;
}

.tag-error {
  color: #D32F2F;
  background-color: #FFCDD2;
}

.audit-content {
  display: flex;
  overflow: hidden;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
  flex: 1;
  flex-direction: column;
}

.content-header {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #E0E0E0;
  justify-content: space-between;
  align-items: center;
}

.patient-header {
  display: flex;
  align-items: center;
}

.patient-avatar {
  display: flex;
  width: 36px;
  height: 36px;
  margin-right: 12px;
  font-size: 14px;
  font-weight: bold;
  color: white;
  background-color: #1976D2;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
}

.patient-details {
  display: flex;
  flex-direction: column;
}

.detail-name {
  margin-bottom: 2px;
  font-size: 16px;
  font-weight: bold;
}

.detail-meta {
  font-size: 12px;
  color: #757575;
}

.tab-content {
  padding: 0;
  overflow-y: auto;
  flex-grow: 1;
}

/* 病案首页数据样式 */
.record-section {
  padding: 16px;
  border-bottom: 1px solid #E0E0E0;
}

.section-title {
  display: flex;
  padding-bottom: 8px;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #212121;
  border-bottom: 1px solid #E0E0E0;
  justify-content: space-between;
  align-items: center;
}

.section-action {
  font-size: 12px;
  font-weight: normal;
  color: #1976D2;
  cursor: pointer;
}

.record-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.record-item {
  display: flex;
  flex-direction: column;
}

.item-label {
  margin-bottom: 4px;
  font-size: 12px;
  color: #757575;
}

.item-value {
  font-size: 13px;
  font-weight: 500;
  color: #212121;
}

.highlighted {
  padding: 2px 4px;
  background-color: #FFECB3;
  border-radius: 2px;
}

.full-width {
  grid-column: 1 / -1;
}

.diagnosis-table {
  width: 100%;
  margin-bottom: 0;
  font-size: 13px;
  border-collapse: collapse;
}

.diagnosis-table th,
.diagnosis-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #E0E0E0;
}

.diagnosis-table th {
  font-size: 12px;
  font-weight: 600;
  color: #757575;
  background-color: #F5F7FA;
}

.error-highlight {
  position: relative;
  padding-right: 20px;
}

.error-highlight::after {
  position: absolute;
  right: 0;
  font-size: 12px;
  color: #F44336;
  content: "⚠️";
}

/* 审核结果样式 */
.audit-result {
  padding: 16px;
  margin: 16px;
  background-color: #F5F7FA;
  border-radius: 6px;
}

.result-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.result-icon {
  display: flex;
  width: 36px;
  height: 36px;
  margin-right: 12px;
  font-size: 18px;
  color: white;
  background-color: #F44336;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
}

.result-icon.success {
  background-color: #4CAF50;
}

.result-icon.warning {
  background-color: #FF9800;
}

.result-title {
  font-size: 15px;
  font-weight: bold;
}

.result-summary {
  margin-bottom: 12px;
  font-size: 13px;
}

.issues-list {
  margin-top: 12px;
}

.issue-item {
  padding: 12px;
  margin-bottom: 8px;
  background-color: white;
  border-left: 3px solid #F44336;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 5%);
}

.issue-item.warning {
  border-left-color: #FF9800;
}

.issue-title {
  display: flex;
  margin-bottom: 5px;
  font-size: 13px;
  font-weight: 600;
  align-items: center;
}

.issue-title i {
  margin-right: 8px;
  font-size: 14px;
  color: #F44336;
}

.issue-title i.warning {
  color: #FF9800;
}

.issue-description {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.4;
  color: #757575;
}

.issue-details {
  padding: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  background-color: #F5F7FA;
  border-radius: 4px;
}

.issue-actions {
  display: flex;
  justify-content: flex-end;
}

/* AI分析建议样式 */
.ai-suggestion {
  padding: 16px;
  margin: 16px;
  background-color: #E8F5E9;
  border-left: 3px solid #4CAF50;
  border-radius: 6px;
}

.ai-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.ai-icon {
  display: flex;
  width: 32px;
  height: 32px;
  margin-right: 12px;
  font-size: 14px;
  color: white;
  background-color: #4CAF50;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
}

.ai-title {
  font-size: 15px;
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

/* 审核操作区域 */
.audit-actions {
  display: flex;
  padding: 12px 16px;
  background-color: #F5F7FA;
  border-top: 1px solid #E0E0E0;
  justify-content: flex-end;
}

/* 筛选和排序工具 */
.list-tools {
  display: flex;
  padding: 8px 12px;
  background-color: #F5F7FA;
  border-bottom: 1px solid #E0E0E0;
  justify-content: space-between;
  align-items: center;
}

.list-filter select {
  padding: 4px 8px;
  margin-right: 6px;
  font-size: 12px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
}

.list-search {
  position: relative;
  display: flex;
  align-items: center;
}

.list-search input {
  width: 120px;
  padding: 4px 8px 4px 26px;
  font-size: 12px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
}

.list-search i {
  position: absolute;
  left: 8px;
  font-size: 12px;
  color: #9E9E9E;
}

.audit-tab-bar {
  display: flex;
  background-color: #F5F7FA;
  border-bottom: 1px solid #E0E0E0;
}

.audit-tab {
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.audit-tab.active {
  color: #1976D2;
  border-bottom-color: #1976D2;
}

.audit-tab:hover {
  background-color: rgb(0 0 0 / 3%);
}

/* 增加审核历史区域 */
.audit-history {
  padding: 16px;
}

.history-item {
  display: flex;
  margin-bottom: 16px;
  font-size: 13px;
}

.history-icon {
  display: flex;
  width: 28px;
  height: 28px;
  margin-right: 10px;
  font-size: 12px;
  background-color: #E0E0E0;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.history-icon.success {
  color: #2E7D32;
  background-color: #C8E6C9;
}

.history-icon.warning {
  color: #E65100;
  background-color: #FFE0B2;
}

.history-icon.error {
  color: #D32F2F;
  background-color: #FFCDD2;
}

.history-content {
  flex: 1;
}

.history-title {
  margin-bottom: 4px;
  font-weight: 500;
}

.history-meta {
  display: flex;
  font-size: 12px;
  color: #9E9E9E;
  justify-content: space-between;
}

/* 更优雅的滚动条 */
.patient-list::-webkit-scrollbar,
.tab-content::-webkit-scrollbar {
  width: 4px;
}

.patient-list::-webkit-scrollbar-thumb,
.tab-content::-webkit-scrollbar-thumb {
  background-color: #BDBDBD;
  border-radius: 4px;
}

.patient-list::-webkit-scrollbar-track,
.tab-content::-webkit-scrollbar-track {
  background-color: #F5F7FA;
}

/* 病历详情和查看明细模态框样式 - 优化样式 */
.medical-details-section {
  margin-bottom: 20px;
  overflow: hidden;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
}

.details-header {
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  background-color: #F5F7FA;
  border-bottom: 1px solid #E0E0E0;
}

.details-content {
  padding: 16px;
  font-size: 13px;
  line-height: 1.5;
  background-color: #fff;
}

.visit-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  padding: 8px;
  background-color: #F5F7FA;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-direction: column;
}

.info-item:hover {
  background-color: #E3F2FD;
  box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
}

.info-label {
  margin-bottom: 4px;
  font-size: 12px;
  color: #757575;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
}

.timeline {
  padding-left: 20px;
  margin-top: 20px;
  border-left: 2px solid #1976D2;
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-item::before {
  position: absolute;
  top: 0;
  left: -25px;
  width: 12px;
  height: 12px;
  background-color: #1976D2;
  border: 2px solid #fff;
  border-radius: 50%;
  content: "";
  box-shadow: 0 0 0 2px #1976D2;
}

.timeline-date {
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #1976D2;
}

.timeline-title {
  margin-bottom: 4px;
  font-weight: 600;
}

.timeline-desc {
  padding: 8px;
  font-size: 13px;
  color: #616161;
  background-color: #F5F7FA;
  border-radius: 4px;
}

.tab-section {
  display: flex;
  overflow-x: auto;
  background-color: #F5F7FA;
  border-bottom: 1px solid #E0E0E0;
}

.tab-item {
  padding: 10px 16px;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab-item.active {
  font-weight: 500;
  color: #1976D2;
  background-color: rgb(25 118 210 / 5%);
  border-bottom-color: #1976D2;
}

.tab-item:hover:not(.active) {
  background-color: rgb(0 0 0 / 3%);
  border-bottom-color: #E0E0E0;
}

.tab-panel {
  display: none;
}

.tab-panel.active {
  display: block;
}

.cost-details {
  width: 100%;
  border-collapse: collapse;
}

.cost-details th, .cost-details td {
  padding: 8px 12px;
  font-size: 13px;
  text-align: left;
  border-bottom: 1px solid #E0E0E0;
}

.cost-details th {
  font-weight: 600;
  color: #757575;
  background-color: #F5F7FA;
}

.similar-case-details {
  margin-top: 16px;
  overflow: hidden;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
}

.case-header {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  background-color: #F5F7FA;
  border-bottom: 1px solid #E0E0E0;
}

.case-content {
  padding: 16px;
  background-color: #fff;
}

/* 重新设计弹窗样式 */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  background-color: rgb(0 0 0 / 50%);
  animation: fadeIn 0.2s ease;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

.modal-container {
  display: flex;
  width: 600px;
  max-width: 90%;
  max-height: 90vh;
  overflow: hidden;
  background-color: white;
  border: 1px solid rgb(0 0 0 / 10%);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgb(0 0 0 / 15%);
  animation: modalSlideIn 0.3s ease;
  flex-direction: column;
}

.modal-lg {
  width: 800px;
  max-width: 90%;
}

.modal-sm {
  width: 400px;
  max-width: 90%;
}

.modal-header {
  display: flex;
  padding: 16px;
  background-color: #F5F7FA;
  border-bottom: 1px solid #E0E0E0;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #212121;
}

.modal-close {
  display: flex;
  width: 32px;
  height: 32px;
  font-size: 20px;
  color: #757575;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 50%;
  transition: all 0.2s;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #212121;
  background-color: rgb(0 0 0 / 10%);
}

.modal-body {
  max-height: calc(90vh - 120px);
  padding: 16px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  padding: 12px 16px;
  background-color: #F5F7FA;
  border-top: 1px solid #E0E0E0;
  justify-content: flex-end;
  gap: 8px;
}

/* AI分析详情模态框样式 */
.analysis-detail-section {
  margin-bottom: 20px;
}

.analysis-header {
  display: flex;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid #E0E0E0;
  align-items: center;
}

.analysis-icon {
  display: flex;
  width: 40px;
  height: 40px;
  margin-right: 16px;
  font-size: 16px;
  color: white;
  background-color: #4CAF50;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
}

.analysis-title {
  font-size: 18px;
  font-weight: 600;
  color: #212121;
}

.analysis-content {
  padding: 16px;
  margin-bottom: 16px;
  background-color: #F5F7FA;
  border-radius: 8px;
}

.analysis-subtitle {
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1976D2;
}

.comparison-table {
  width: 100%;
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid #E0E0E0;
  border-collapse: collapse;
  border-radius: 4px;
}

.comparison-table th,
.comparison-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #E0E0E0;
}

.comparison-table th {
  font-weight: 600;
  background-color: #F5F7FA;
}

.comparison-table td.current {
  background-color: #FFECB3;
}

.comparison-table td.suggested {
  background-color: #C8E6C9;
}

.code-correction {
  padding: 12px;
  margin-bottom: 16px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  background-color: #F5F7FA;
  border-radius: 4px;
}

.deleted-code {
  text-decoration: line-through;
  background-color: #FFCDD2;
}

.added-code {
  background-color: #C8E6C9;
}

.medical-orders-content {
  display: none;
}

.medical-orders-content.active {
  display: block;
}

.medical-timeline {
  position: relative;
  padding-left: 20px;
}

.medical-timeline-item {
  position: relative;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #E0E0E0;
}

.medical-timeline-item:last-child {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: none;
}

.medical-timeline-item::before {
  position: absolute;
  top: 0;
  left: -20px;
  width: 2px;
  height: 100%;
  background-color: #E0E0E0;
  content: "";
}

.medical-timeline-item::after {
  position: absolute;
  top: 0;
  left: -24px;
  width: 10px;
  height: 10px;
  background-color: #1976D2;
  border: 2px solid #fff;
  border-radius: 50%;
  content: "";
}

.medical-date {
  margin-bottom: 8px;
  font-weight: 600;
  color: #1976D2;
}

.medical-item-list {
  padding: 12px;
  background-color: #F5F7FA;
  border-radius: 4px;
}

.medical-item {
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px dashed #E0E0E0;
}

.medical-item:last-child {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: none;
}

.medical-item-name {
  margin-bottom: 4px;
  font-weight: 500;
}

.medical-item-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #757575;
}

.medical-item-detail {
  display: flex;
  align-items: center;
}

.medical-item-label {
  margin-right: 4px;
  font-weight: 500;
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  transition: all 0.2s;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  color: white;
  background-color: #1976D2;
  border: 1px solid #1976D2;
}

.btn-primary:hover {
  background-color: #1565C0;
  border-color: #1565C0;
}

.btn-success {
  color: white;
  background-color: #4CAF50;
  border: 1px solid #4CAF50;
}

.btn-success:hover {
  background-color: #43A047;
  border-color: #43A047;
}

.btn-warning {
  color: white;
  background-color: #FF9800;
  border: 1px solid #FF9800;
}

.btn-warning:hover {
  background-color: #F57C00;
  border-color: #F57C00;
}

.btn-outline {
  color: #1976D2;
  background-color: white;
  border: 1px solid #1976D2;
}

.btn-outline:hover {
  background-color: #E3F2FD;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-icon {
  padding: 4px;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: rgb(0 0 0 / 10%);
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

/* 表格样式 */
.table-container {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 10px 12px;
  font-size: 13px;
  text-align: left;
  border-bottom: 1px solid #E0E0E0;
}

.table th {
  font-weight: 600;
  color: #757575;
  white-space: nowrap;
  background-color: #F5F7FA;
}

.table tr:last-child td {
  border-bottom: none;
}

.table tr:hover td {
  background-color: #F5F7FA;
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

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #757575;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

/* 警告提示样式 */
.alert {
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid transparent;
  border-radius: 4px;
}

.alert-warning {
  color: #856404;
  background-color: #FFF3CD;
  border-color: #FFEAA7;
}

.alert strong {
  font-weight: 600;
}

/* 工具类 */
.mr-2 {
  margin-right: 8px;
}

.ml-2 {
  margin-left: 8px;
}

.mt-2 {
  margin-top: 8px;
}

.mb-3 {
  margin-bottom: 16px;
}

/* 审核页面特定样式 */

</style>