<!-- 优化版任务详情页面 -->
<template>
  <div class="task-detail-page">
    <!-- 页面头部 -->
    <PageHeader
      :title="pageTitle"
      :content="pageDescription"
      :tag="statusTag"
      :tag-type="statusTagType"
      :meta="metaInfo"
      show-back-button
      back-button-text="返回任务列表"
      :actions="headerActions"
      :tabs="tabList"
      :default-tab="activeTab"
      @back-click="handleBackClick"
      @action-click="handleHeaderAction"
      @tab-change="handleTabChange"
    />

    <!-- 主要内容区域 -->
    <div class="detail-content" v-loading="loading">
      <!-- 任务概览面板 -->
      <div v-show="activeTab === 'overview'" class="tab-content">
        <div v-if="taskDetail">
          <!-- 顶部信息区域：左侧基本信息，右侧进度监控 -->
          <div class="overview-grid">
            <!-- 基本信息卡片 -->
            <el-card class="info-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon class="header-icon">
                    <InfoFilled />
                  </el-icon>
                  <span class="header-title">基本信息</span>
                </div>
              </template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="任务编号">
                  <el-tag type="primary" size="small">{{ taskDetail.taskNo || '未知' }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="任务名称">
                  {{ taskDetail.taskName || '未知' }}
                </el-descriptions-item>
                <el-descriptions-item label="文件路径">
                  <el-tooltip :content="taskDetail.filePath" placement="top">
                    <span class="text-ellipsis">{{ taskDetail.filePath || '未知' }}</span>
                  </el-tooltip>
                </el-descriptions-item>
                <el-descriptions-item label="文件大小">
                  {{ formatFileSize(taskDetail.fileSize || 0) }}
                </el-descriptions-item>
                <el-descriptions-item label="数据源">
                  {{ getDataSourceText(taskDetail.dataSource) || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="执行模式">
                  {{ getExecuteModeText(taskDetail.executeMode) }}
                </el-descriptions-item>
                <el-descriptions-item label="创建人">
                  {{ taskDetail.creator || '未知' }}
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">
                  {{ formatTime(taskDetail.createTime) }}
                </el-descriptions-item>
                <el-descriptions-item label="任务描述" v-if="taskDetail.description">
                  {{ taskDetail.description }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 进度监控卡片 -->
            <el-card class="progress-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon class="header-icon">
                    <TrendCharts />
                  </el-icon>
                  <span class="header-title">进度监控</span>
                  <el-button
                    link
                    size="small"
                    @click="refreshProgress"
                    :loading="refreshing"
                    class="refresh-btn"
                  >
                    <el-icon>
                      <Refresh />
                    </el-icon>
                    刷新
                  </el-button>
                </div>
              </template>

              <!-- 阶段进度指示器 -->
              <div class="stage-progress-section">
                <div class="stage-indicators">
                  <div
                    v-for="(stage, index) in processStages"
                    :key="stage.name"
                    class="stage-item"
                    :class="getStageClass(stage.status)"
                  >
                    <div class="stage-icon">
                      <el-icon>
                        <component :is="getStageIcon(stage.name)" />
                      </el-icon>
                    </div>
                    <div class="stage-content">
                      <div class="stage-title">{{ stage.name }}</div>
                      <div class="stage-status">
                        {{
                          stage.message ||
                          getStageStatusText(stage.status)
                        }}
                      </div>
                      <div class="stage-time" v-if="stage.endTime">
                        {{ formatTime(stage.endTime) }}
                      </div>
                      <div class="stage-duration" v-if="stage.duration">
                        耗时: {{ formatDurationFromMs(stage.duration) }}
                      </div>
                    </div>
                    <!-- 连接线 -->
                    <div
                      v-if="index < processStages.length - 1"
                      class="stage-connector"
                      :class="getConnectorClass(stage.status)"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- 整体进度条 -->
              <div class="overall-progress-section">
                <div class="progress-header">
                  <span class="progress-label">整体进度</span>
                  <span class="progress-value">{{ taskDetail.progressPercent || 0 }}%</span>
                </div>
                <el-progress
                  :percentage="taskDetail.progressPercent || 0"
                  :stroke-width="12"
                  :status="getProgressStatus(taskDetail.status)"
                />
                <div class="progress-message" v-if="taskDetail.message">
                  {{ taskDetail.message }}
                </div>
              </div>

              <!-- 时间信息 -->
              <div class="time-info-section">
                <div class="time-grid">
                  <div class="time-item" v-if="taskDetail.startTime">
                    <div class="time-label">开始时间</div>
                    <div class="time-value">{{ formatTime(taskDetail.startTime) }}</div>
                  </div>
                  <div class="time-item" v-if="taskDetail.endTime">
                    <div class="time-label">结束时间</div>
                    <div class="time-value">{{ formatTime(taskDetail.endTime) }}</div>
                  </div>
                  <div class="time-item" v-if="taskDetail.durationMs">
                    <div class="time-label">处理耗时</div>
                    <div class="time-value">{{ formatDurationFromMs(taskDetail.durationMs) }}</div>
                  </div>
                  <div class="time-item" v-if="taskDetail.avgRecordTime">
                    <div class="time-label">平均记录时间</div>
                    <div class="time-value">{{ taskDetail.avgRecordTime }}ms</div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 统计信息网格 - 优化版 -->
          <div class="statistics-grid">
            <!-- 文件统计卡片 -->
            <el-card class="stat-card" shadow="hover">
              <div class="stat-header">
                <span class="stat-title">文件统计</span>
                <el-tag
                  :type="
                    fileSuccessRate === 100
                      ? 'success'
                      : fileSuccessRate >= 80
                        ? 'primary'
                        : 'danger'
                  "
                  size="small"
                >
                  {{ fileSuccessRate }}%
                </el-tag>
              </div>
              <div class="stat-content">
                <div class="stat-row">
                  <span class="stat-label">总文件数</span>
                  <span class="stat-value">{{ taskDetail.totalFiles || 0 }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">成功文件</span>
                  <span class="stat-value success">{{ taskDetail.successFiles || 0 }}</span>
                </div>
                <div class="stat-row" v-if="taskDetail.warningFiles && taskDetail.warningFiles > 0">
                  <span class="stat-label">警告文件</span>
                  <span class="stat-value warning">{{ taskDetail.warningFiles }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">失败文件</span>
                  <span class="stat-value danger">
                    {{ (taskDetail.totalFiles || 0) - (taskDetail.successFiles || 0) }}
                  </span>
                </div>
                <div class="stat-progress">
                  <el-progress
                    :percentage="fileSuccessRate"
                    :stroke-width="6"
                    :show-text="false"
                    :status="
                      fileSuccessRate === 100
                        ? 'success'
                        : fileSuccessRate >= 80
                          ? undefined
                          : 'exception'
                    "
                  />
                </div>
              </div>
            </el-card>

            <!-- 记录统计卡片 -->
            <el-card class="stat-card" shadow="hover">
              <div class="stat-header">
                <span class="stat-title">记录统计</span>
                <el-tag
                  :type="
                    recordSuccessRate >= 95
                      ? 'success'
                      : recordSuccessRate >= 80
                        ? 'primary'
                        : 'danger'
                  "
                  size="small"
                >
                  {{ recordSuccessRate }}%
                </el-tag>
              </div>
              <div class="stat-content">
                <div class="stat-row">
                  <span class="stat-label">总记录数</span>
                  <span class="stat-value">{{ formatNumber(taskDetail.totalRecords || 0) }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">成功记录</span>
                  <span class="stat-value success">{{
                    formatNumber(taskDetail.successRecords || 0)
                  }}</span>
                </div>
                <div
                  class="stat-row"
                  v-if="taskDetail.warningRecords && taskDetail.warningRecords > 0"
                >
                  <span class="stat-label">警告记录</span>
                  <span class="stat-value warning">{{
                    formatNumber(taskDetail.warningRecords)
                  }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">失败记录</span>
                  <span class="stat-value danger">
                    {{
                      formatNumber(
                        (taskDetail.totalRecords || 0) - (taskDetail.successRecords || 0)
                      )
                    }}
                  </span>
                </div>
                <div
                  class="stat-row"
                  v-if="taskDetail.anomalyRecords && taskDetail.anomalyRecords > 0"
                >
                  <span class="stat-label">异常记录</span>
                  <span class="stat-value info">{{ formatNumber(taskDetail.anomalyRecords) }}</span>
                </div>
                <div class="stat-progress">
                  <el-progress
                    :percentage="recordSuccessRate"
                    :stroke-width="6"
                    :show-text="false"
                    :status="
                      recordSuccessRate >= 95
                        ? 'success'
                        : recordSuccessRate >= 80
                          ? undefined
                          : 'exception'
                    "
                  />
                </div>
              </div>
            </el-card>

            <!-- 规则统计卡片 -->
            <el-card
              class="stat-card"
              shadow="hover"
              v-if="taskDetail.totalRules && taskDetail.totalRules > 0"
            >
              <div class="stat-header">
                <span class="stat-title">规则检查</span>
                <el-tag
                  :type="
                    rulePassRate >= 90 ? 'success' : rulePassRate >= 70 ? 'primary' : 'warning'
                  "
                  size="small"
                >
                  {{ rulePassRate }}%
                </el-tag>
              </div>
              <div class="stat-content">
                <div class="stat-row">
                  <span class="stat-label">总规则数</span>
                  <span class="stat-value">{{ taskDetail.totalRules || 0 }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">已执行规则</span>
                  <span class="stat-value primary">{{ taskDetail.executedRules || 0 }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">通过规则</span>
                  <span class="stat-value success">{{ taskDetail.passedRules || 0 }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">失败规则</span>
                  <span class="stat-value danger">{{ taskDetail.failedRules || 0 }}</span>
                </div>
                <div class="stat-progress">
                  <el-progress
                    :percentage="rulePassRate"
                    :stroke-width="6"
                    :show-text="false"
                    :status="
                      rulePassRate >= 90 ? 'success' : rulePassRate >= 70 ? undefined : 'warning'
                    "
                  />
                </div>
              </div>
            </el-card>

            <!-- 性能指标卡片 -->
            <el-card class="stat-card" shadow="hover">
              <div class="stat-header">
                <span class="stat-title">性能指标</span>
              </div>
              <div class="stat-content">
                <div class="stat-row">
                  <span class="stat-label">处理速度</span>
                  <span class="stat-value">{{ getProcessingSpeed(taskDetail) }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">总耗时</span>
                  <span class="stat-value">
                    {{ formatDurationFromMs(taskDetail.durationMs || 0) || '计算中...' }}
                  </span>
                </div>
                <div class="stat-row" v-if="taskDetail.avgRecordTime">
                  <span class="stat-label">平均记录时间</span>
                  <span class="stat-value">{{ taskDetail.avgRecordTime }}ms</span>
                </div>
                <div class="stat-row" v-if="taskDetail.totalRecords">
                  <span class="stat-label">吞吐量</span>
                  <span class="stat-value">{{ getThroughput(taskDetail) }}</span>
                </div>
              </div>
            </el-card>

            <!-- 质量评分卡片 -->
            <el-card class="stat-card quality-card" shadow="hover" v-if="taskDetail.qualityScore">
              <div class="stat-header">
                <span class="stat-title">质量评分</span>
                <el-tag :type="getQualityGradeType(taskDetail.qualityScore)" size="small">
                  {{ getQualityDescription(taskDetail.qualityScore) }}
                </el-tag>
              </div>
              <div class="stat-content">
                <div class="quality-score-display">
                  <div class="score-circle">
                    <div class="score-value" :class="getQualityScoreClass(taskDetail.qualityScore)">
                      {{ taskDetail.qualityScore || 0 }}
                    </div>
                    <div class="score-label">总体评分</div>
                  </div>
                </div>
                <!-- 评分明细 -->
                <div class="score-breakdown" v-if="taskDetail.scoreDetail">
                  <div
                    class="breakdown-item"
                    v-for="(score, dimension) in getScoreBreakdown(taskDetail.scoreDetail)"
                    :key="dimension"
                  >
                    <span class="breakdown-label">{{ dimension }}</span>
                    <span class="breakdown-value">{{ score }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 数据未加载时显示加载状态 -->
        <div v-else class="loading-placeholder">
          <el-skeleton :rows="5" animated />
        </div>
      </div>

      <!-- 分表详情面板 -->
      <div v-show="activeTab === 'tables'" class="tab-content">
        <el-card class="tables-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon">
                <List />
              </el-icon>
              <span class="header-title">分表处理详情</span>
            </div>
          </template>

          <div v-if="qcResultDetails && qcResultDetails.length > 0" class="table-details-list">
            <div
              v-for="detail in qcResultDetails"
              :key="detail.tableType"
              class="table-detail-card"
            >
              <!-- 表头信息 -->
              <div class="table-header">
                <div class="table-info">
                  <span class="table-name">{{ detail.tableName }}</span>
                  <span class="table-file">{{ `${detail.tableType}.xlsx` }}</span>
                </div>
                <el-tag :type="getQcTableStatusTagType(detail)" size="small">
                  {{ getQcTableStatusText(detail) }}
                </el-tag>
              </div>

              <!-- 质控进度 -->
              <div class="table-progress-section">
                <div class="progress-info">
                  <span>质控通过率</span>
                  <span class="progress-percent">{{ (detail.passRate || 0).toFixed(1) }}%</span>
                </div>
                <el-progress
                  :percentage="detail.passRate || 0"
                  :stroke-width="8"
                  :show-text="false"
                  :status="getQcProgressStatus(detail)"
                />
              </div>

              <!-- 统计数据 -->
              <div class="table-stats">
                <div class="stats-group">
                  <div class="stat-item">
                    <span class="stat-label">检查记录</span>
                    <span class="stat-value">{{ formatNumber(detail.checkedRecords || 0) }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">执行规则</span>
                    <span class="stat-value">{{ detail.totalRules || 0 }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">通过规则</span>
                    <span class="stat-value success">{{ detail.passedRules || 0 }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">失败规则</span>
                    <span class="stat-value danger">{{ detail.failedRules || 0 }}</span>
                  </div>
                </div>

                <el-divider />

                <div class="stats-group">
                  <div class="stat-item">
                    <span class="stat-label">正常记录</span>
                    <span class="stat-value success">
                      {{ formatNumber((detail.checkedRecords || 0) - (detail.errorRecords || 0)) }}
                    </span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">错误记录</span>
                    <span class="stat-value danger">{{
                      formatNumber(detail.errorRecords || 0)
                    }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">警告记录</span>
                    <span class="stat-value warning">{{
                      formatNumber(detail.warningRecords || 0)
                    }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">异常记录</span>
                    <span class="stat-value info">{{
                      formatNumber(detail.anomalyRecords || 0)
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- 规则详情 -->
              <div v-if="detail.ruleDetails && detail.ruleDetails.length > 0" class="rule-details">
                <div class="rule-header">
                  <span class="rule-title">质控规则详情</span>
                  <el-button
                    link
                    type="primary"
                    size="small"
                    @click="toggleRuleDetails(detail.tableType)"
                  >
                    {{ expandedRules.has(detail.tableType) ? '收起' : '展开' }}
                    <el-icon class="el-icon--right">
                      <ArrowUp v-if="expandedRules.has(detail.tableType)" />
                      <ArrowDown v-else />
                    </el-icon>
                  </el-button>
                </div>

                <el-collapse-transition>
                  <div v-if="expandedRules.has(detail.tableType)" class="rule-list">
                    <div v-for="rule in detail.ruleDetails" :key="rule.id" class="rule-item">
                      <div class="rule-info">
                        <span class="rule-name">{{ rule.ruleName }}</span>
                        <el-tag :type="getRuleStatusTagType(rule.checkStatus)" size="small">
                          {{ getRuleStatusText(rule.checkStatus) }}
                        </el-tag>
                      </div>
                      <div class="rule-stats">
                        <span>检查: {{ formatNumber(rule.checkedCount) }}</span>
                        <span v-if="rule.errorCount" class="error"
                          >错误: {{ formatNumber(rule.errorCount) }}</span
                        >
                        <span v-if="rule.warningCount" class="warning"
                          >警告: {{ formatNumber(rule.warningCount) }}</span
                        >
                      </div>
                      <div v-if="rule.fixSuggestion" class="rule-message info">
                        <el-icon>
                          <InfoFilled />
                        </el-icon>
                        {{ rule.fixSuggestion }}
                      </div>
                    </div>
                  </div>
                </el-collapse-transition>
              </div>
            </div>
          </div>

          <div
            v-else-if="taskDetail && (!qcResultDetails || qcResultDetails.length === 0)"
            class="empty-state"
          >
            <el-empty :image-size="80" description="暂无分表数据" />
          </div>

          <div v-else class="loading-placeholder">
            <el-skeleton :rows="3" animated />
          </div>
        </el-card>
      </div>

      <!-- 日志查看面板 -->
      <div v-show="activeTab === 'logs'" class="tab-content">
        <TaskLogViewer
          v-if="taskId && taskId > 0"
          :task-id="taskId"
          @export-logs="handleExportLogs"
        />
        <div v-else class="loading-placeholder">
          <el-skeleton :rows="5" animated />
        </div>
      </div>

      <!-- 质量报告面板 - 优化版 -->
      <div v-show="activeTab === 'quality'" class="tab-content">
        <div v-if="taskDetail" class="quality-report">
          <!-- 质量概览 -->
          <el-card class="quality-overview-card" shadow="never">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon">
                  <Medal />
                </el-icon>
                <span class="header-title">质量概览</span>
              </div>
            </template>

            <div class="quality-overview">
              <div class="score-display">
                <div class="main-score">
                  <div class="score-number" :class="getQualityScoreClass(taskDetail.qualityScore)">
                    {{ taskDetail.qualityScore || 0 }}
                  </div>
                  <div class="score-text">质量评分</div>
                </div>
                <el-tag :type="getQualityGradeType(taskDetail.qualityScore)" size="large">
                  {{ getQualityDescription(taskDetail.qualityScore) }}
                </el-tag>
              </div>

              <!-- 评分维度 -->
              <div class="score-dimensions" v-if="taskDetail.scoreDetail">
                <div
                  class="dimension-item"
                  v-for="(score, dimension) in getScoreBreakdown(taskDetail.scoreDetail)"
                  :key="dimension"
                >
                  <div class="dimension-header">
                    <span class="dimension-name">{{ dimension }}</span>
                    <span class="dimension-score">{{ score }}分</span>
                  </div>
                  <el-progress
                    :percentage="parseFloat(score)"
                    :stroke-width="8"
                    :show-text="false"
                    :status="
                      parseFloat(score) >= 90
                        ? 'success'
                        : parseFloat(score) >= 70
                          ? undefined
                          : 'exception'
                    "
                  />
                </div>
              </div>
            </div>
          </el-card>

          <!-- 数据质量统计 -->
          <el-card class="quality-stats-card" shadow="never">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon">
                  <DataAnalysis />
                </el-icon>
                <span class="header-title">数据质量统计</span>
              </div>
            </template>

            <div class="quality-stats-grid">
              <div class="quality-stat-item success">
                <div class="stat-icon">
                  <el-icon>
                    <CircleCheckFilled />
                  </el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ formatNumber(taskDetail.successRecords || 0) }}</div>
                  <div class="stat-label">成功记录</div>
                  <div class="stat-percent">
                    占总记录
                    {{
                      (
                        ((taskDetail.successRecords || 0) /
                          Math.max(taskDetail.totalRecords || 1, 1)) *
                        100
                      ).toFixed(1)
                    }}%
                  </div>
                </div>
              </div>

              <div
                class="quality-stat-item warning"
                v-if="taskDetail.warningRecords && taskDetail.warningRecords > 0"
              >
                <div class="stat-icon">
                  <el-icon>
                    <WarningFilled />
                  </el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ formatNumber(taskDetail.warningRecords) }}</div>
                  <div class="stat-label">警告记录</div>
                  <div class="stat-percent">需要关注的数据质量问题</div>
                </div>
              </div>

              <div
                class="quality-stat-item error"
                v-if="taskDetail.anomalyRecords && taskDetail.anomalyRecords > 0"
              >
                <div class="stat-icon">
                  <el-icon>
                    <CircleCloseFilled />
                  </el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ formatNumber(taskDetail.anomalyRecords) }}</div>
                  <div class="stat-label">异常记录</div>
                  <div class="stat-percent">严重的数据质量问题</div>
                </div>
              </div>

              <div
                class="quality-stat-item info"
                v-if="taskDetail.totalRules && taskDetail.totalRules > 0"
              >
                <div class="stat-icon">
                  <el-icon>
                    <Checked />
                  </el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number"
                    >{{ taskDetail.passedRules || 0 }}/{{ taskDetail.totalRules || 0 }}
                  </div>
                  <div class="stat-label">质控规则</div>
                  <div class="stat-percent">规则通过率 {{ rulePassRate }}%</div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 质量建议 -->
          <el-card class="quality-suggestions-card" shadow="never">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon">
                  <InfoFilled />
                </el-icon>
                <span class="header-title">质量建议</span>
              </div>
            </template>

            <div class="quality-suggestions">
              <el-alert
                v-if="getQualityScore(taskDetail) < 70"
                title="数据质量较低"
                type="error"
                :closable="false"
                show-icon
              >
                建议重新检查源数据格式和完整性，考虑数据清洗后重新导入
              </el-alert>

              <el-alert
                v-else-if="getQualityScore(taskDetail) < 85"
                title="数据质量一般"
                type="warning"
                :closable="false"
                show-icon
              >
                存在一些质量问题，建议查看详细的错误信息并进行相应处理
              </el-alert>

              <el-alert
                v-if="(taskDetail.totalRecords || 0) > (taskDetail.successRecords || 0)"
                title="存在失败记录"
                type="info"
                :closable="false"
                show-icon
              >
                <template #default>
                  可下载错误文件进行数据修正
                  <el-button
                    v-if="taskDetail.hasErrorFile"
                    type="primary"
                    link
                    size="small"
                    @click="downloadErrorFile"
                  >
                    下载错误文件
                  </el-button>
                </template>
              </el-alert>

              <el-alert
                v-if="getQualityScore(taskDetail) >= 90"
                title="数据质量优秀"
                type="success"
                :closable="false"
                show-icon
              >
                数据质量良好，可以进入下一步数据处理流程
              </el-alert>

              <el-alert
                v-if="taskDetail.totalRules && taskDetail.failedRules && taskDetail.failedRules > 0"
                title="质控规则检查"
                type="warning"
                :closable="false"
                show-icon
              >
                有 {{ taskDetail.failedRules }} 条规则检查失败，建议查看分表详情了解具体问题
              </el-alert>
            </div>
          </el-card>
        </div>

        <div v-else class="loading-placeholder">
          <el-skeleton :rows="4" animated />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  InfoFilled,
  TrendCharts,
  Folder,
  DataBoard,
  Stopwatch,
  Medal,
  List,
  Document,
  Refresh,
  Download as DownloadIcon,
  RefreshRight,
  Close,
  User,
  Clock,
  DocumentCopy,
  WarningFilled,
  CircleCheckFilled,
  CircleCloseFilled,
  Box,
  Upload,
  CircleCheck,
  Checked,
  DocumentChecked,
  Setting,
  DataAnalysis,
  Files,
  Monitor,
  Timer,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader/index.vue'
import TaskLogViewer from './components/TaskLogViewer.vue'
import {
  DrugBatchImportApi,
  type ImportTaskDetailVO,
  type QcResultDetailVO,
  TASK_STATUS
} from '@/api/drug/task'
import { DICT_TYPE, getDictLabel, getDictColorType } from '@/utils/dict'

/** 页面组件名称 */
defineOptions({ name: 'DrugImportTaskDetail' })

// ========================= 类型定义 =========================

interface HeaderAction {
  key: string
  text: string
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  icon: any
}

interface TabItem {
  key: string
  label: string
  icon: any
  badge?: number
}

// ========================= 路由和基础数据 =========================

const route = useRoute()
const router = useRouter()
const taskId = computed(() => Number(route.params.id))

const loading = ref(false)
const refreshing = ref(false)
const taskDetail = ref<ImportTaskDetailVO | null>(null)
const qcResultDetails = ref<QcResultDetailVO[]>([])
const activeTab = ref('overview')
const expandedRules = ref(new Set<string>())

let refreshTimer: NodeJS.Timeout | null = null
const isComponentMounted = ref(false)

// ========================= 计算属性 =========================

/** 解析处理阶段数据 */
const processStages = computed(() => {
  if (!taskDetail.value?.qcStages) {
    return [
      { name: '文件解析', status: 0 },
      { name: '基础验证', status: 0 },
      { name: '前置质控', status: 0 },
      { name: '数据导入', status: 0 }
    ]
  }

  try {
    const stages =
      typeof taskDetail.value.qcStages === 'string'
        ? JSON.parse(taskDetail.value.qcStages)
        : taskDetail.value.qcStages
    return Array.isArray(stages) ? stages : []
  } catch (error) {
    console.error('解析qc_stages失败:', error)
    return []
  }
})

const pageTitle = computed(() => {
  return taskDetail.value?.taskName || '任务详情'
})

const pageDescription = computed(() => {
  return `任务编号: ${taskDetail.value?.taskNo || '未知'} | 文件: ${taskDetail.value?.fileName || taskDetail.value?.filePath || '未知'}`
})

const statusTag = computed(() => {
  if (!taskDetail.value?.status) {
    return loading.value ? '加载中...' : '未知状态'
  }
  const label = getDictLabel(DICT_TYPE.DRUG_TASK_STATUS, taskDetail.value.status.toString())
  return label || '未知状态'
})

const statusTagType = computed(() => {
  if (!taskDetail.value?.status) {
    return loading.value ? 'warning' : 'info'
  }
  const type = getDictColorType(DICT_TYPE.DRUG_TASK_STATUS, taskDetail.value.status.toString())
  return type || 'info'
})

const metaInfo = computed(() => {
  if (!taskDetail.value) return []

  return [
    {
      label: '创建人',
      value: taskDetail.value.creator || '未知',
      icon: User
    },
    {
      label: '创建时间',
      value: formatTime(taskDetail.value.createTime) || '未知',
      icon: Clock
    },
    {
      label: '文件大小',
      value: formatFileSize(taskDetail.value.fileSize || 0),
      icon: DocumentCopy
    }
  ]
})

const headerActions = computed((): HeaderAction[] => {
  const actions: HeaderAction[] = []

/*  if (
    taskDetail.value?.status &&
    (taskDetail.value.status === TASK_STATUS.FAILED ||
      taskDetail.value.status === TASK_STATUS.PARTIAL_SUCCESS)
  ) {
    actions.push({
      key: 'retry',
      text: '重试任务',
      type: 'warning',
      icon: RefreshRight
    })
  }*/

  if (
    taskDetail.value?.status &&
    [
      TASK_STATUS.PENDING,
      TASK_STATUS.PARSING,
      TASK_STATUS.QC_PRE_CHECKING,
      TASK_STATUS.IMPORTING,
      TASK_STATUS.QC_POST_CHECKING
    ].includes(taskDetail.value.status)
  ) {
    actions.push({
      key: 'cancel',
      text: '取消任务',
      type: 'danger',
      icon: Close
    })
  }

  if (taskDetail.value?.status === TASK_STATUS.COMPLETED) {
    actions.push({
      key: 'download',
      text: '下载报告',
      type: 'primary',
      icon: DownloadIcon
    })
  }

  return actions
})

const tabList = computed((): TabItem[] => {
  return [
    { key: 'overview', label: '任务概览', icon: DataBoard },
    { key: 'tables', label: '分表详情', icon: List },
    { key: 'logs', label: '执行日志', icon: Document },
    { key: 'quality', label: '质量报告', icon: Medal }
  ]
})

const isTaskRunning = computed(() => {
  const status = taskDetail.value?.status
  return (
    status === TASK_STATUS.PARSING ||
    status === TASK_STATUS.QC_PRE_CHECKING ||
    status === TASK_STATUS.IMPORTING ||
    status === TASK_STATUS.QC_POST_CHECKING
  )
})

const fileSuccessRate = computed(() => {
  if (!taskDetail.value?.totalFiles || taskDetail.value.totalFiles === 0) return 0
  return Math.round((taskDetail.value.successFiles / taskDetail.value.totalFiles) * 100)
})

const recordSuccessRate = computed(() => {
  if (!taskDetail.value?.totalRecords || taskDetail.value.totalRecords === 0) return 0
  return Math.round((taskDetail.value.successRecords / taskDetail.value.totalRecords) * 100)
})

const rulePassRate = computed(() => {
  if (!taskDetail.value?.totalRules || taskDetail.value.totalRules === 0) return 0
  return Math.round((taskDetail.value.passedRules / taskDetail.value.totalRules) * 100)
})

// ========================= 监听器 =========================

watch(
  () => taskId.value,
  (newTaskId) => {
    if (newTaskId && isComponentMounted.value) {
      console.log('Task ID changed, loading task detail:', newTaskId)
      loadTaskDetail()
    }
  }
)

watch(isTaskRunning, (isRunning) => {
  if (isComponentMounted.value) {
    if (isRunning) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }
})

// ========================= 核心方法 =========================

const initComponent = async () => {
  await nextTick()
  isComponentMounted.value = true

  console.log('Initializing component with taskId:', taskId.value)

  if (taskId.value) {
    await loadTaskDetail()
    if (isTaskRunning.value) {
      startAutoRefresh()
    }
  } else {
    ElMessage.error('任务ID无效')
    router.push('/monitoring/drug-import/task')
  }
}

const loadTaskDetail = async () => {
  if (!taskId.value || !isComponentMounted.value) {
    console.warn('Cannot load task detail: invalid taskId or component not mounted')
    return
  }

  console.log('Loading task detail for taskId:', taskId.value)
  loading.value = true

  try {
    const [taskDetailResponse, qcDetailsResponse] = await Promise.all([
      DrugBatchImportApi.getTaskDetail(taskId.value),
      DrugBatchImportApi.getQcResultDetails(taskId.value).catch((err) => {
        console.warn('Failed to load QC details, will continue without it:', err)
        return []
      })
    ])

    console.log('Task detail loaded successfully:', taskDetailResponse)
    console.log('QC details loaded:', qcDetailsResponse)

    taskDetail.value = taskDetailResponse
    qcResultDetails.value = qcDetailsResponse || []
  } catch (error) {
    console.error('Failed to load task detail:', error)
    ElMessage.error('获取任务详情失败')
  } finally {
    loading.value = false
  }
}

const refreshProgress = async () => {
  if (!isComponentMounted.value) return

  refreshing.value = true
  try {
    await loadTaskDetail()
    ElMessage.success('进度信息已更新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

const startAutoRefresh = () => {
  if (refreshTimer || !isComponentMounted.value) return

  refreshTimer = setInterval(() => {
    if (isComponentMounted.value && !loading.value) {
      loadTaskDetail()
    }
  }, 10000)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const cleanup = () => {
  isComponentMounted.value = false
  stopAutoRefresh()
}

// ========================= 事件处理方法 =========================

const handleBackClick = () => {
  cleanup()
  router.push('/monitoring/drug-import/task')
}

const handleHeaderAction = async (action: HeaderAction) => {
  if (!isComponentMounted.value) return

  switch (action.key) {
    case 'retry':
      await handleRetryTask()
      break
    case 'cancel':
      await handleCancelTask()
      break
    case 'download':
      await handleDownloadReport()
      break
  }
}

const handleTabChange = (tabKey: string) => {
  console.log('Tab changed to:', tabKey)
  activeTab.value = tabKey
}

const handleRetryTask = async () => {
  try {
    await ElMessageBox.confirm('确认重试整个任务？', '确认重试', {
      type: 'warning'
    })

    const result = await DrugBatchImportApi.retryImportTask({
      taskId: taskId.value,
      retryType: 'ALL'
    })

    ElNotification({
      type: 'success',
      title: '重试任务已启动',
      message: `批次编号: ${result.retryBatchNo}`,
      duration: 3000
    })

    await loadTaskDetail()
    if (isTaskRunning.value) {
      startAutoRefresh()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('重试任务失败')
    }
  }
}

const handleCancelTask = async () => {
  try {
    await ElMessageBox.confirm('确认取消任务？取消后将无法恢复。', '确认取消', {
      type: 'warning'
    })

    await DrugBatchImportApi.cancelTask(taskId.value)
    ElMessage.success('任务已取消')
    await loadTaskDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('取消任务失败')
    }
  }
}

const handleDownloadReport = async () => {
  try {
    ElMessage.success('报告下载已开始')
    // TODO: 实现报告下载逻辑
  } catch (error) {
    ElMessage.error('下载报告失败')
  }
}

const handleExportLogs = () => {
  ElMessage.success('日志导出功能开发中')
}

const downloadErrorFile = async () => {
  try {
    ElMessage.success('错误文件下载已开始')
    // TODO: 实现错误文件下载逻辑
  } catch (error) {
    ElMessage.error('下载错误文件失败')
  }
}

// ========================= 质控详情相关方法 =========================

const toggleRuleDetails = (tableType: string) => {
  if (expandedRules.value.has(tableType)) {
    expandedRules.value.delete(tableType)
  } else {
    expandedRules.value.add(tableType)
  }
}

const getQcTableStatusColor = (detail: QcResultDetailVO) => {
  if (detail.failedRules > 0) return '#F56C6C'
  if (detail.warningRules > 0) return '#E6A23C'
  if (detail.passedRules > 0) return '#67C23A'
  return '#909399'
}

const getQcTableStatusTagType = (detail: QcResultDetailVO) => {
  if (detail.failedRules > 0) return 'danger'
  if (detail.warningRules > 0) return 'warning'
  if (detail.passedRules > 0) return 'success'
  return 'info'
}

const getQcTableStatusText = (detail: QcResultDetailVO) => {
  if (detail.failedRules > 0) return '检查失败'
  if (detail.warningRules > 0) return '检查警告'
  if (detail.passedRules > 0) return '检查通过'
  return '未检查'
}

const getQcProgressStatus = (detail: QcResultDetailVO) => {
  if (detail.failedRules > 0) return 'exception'
  if (detail.passedRules === detail.totalRules && detail.totalRules > 0) return 'success'
  return undefined
}

const getRuleStatusTagType = (status: number) => {
  switch (status) {
    case 0:
      return 'success'
    case 1:
      return 'danger'
    case 2:
      return 'warning'
    case 3:
      return 'danger'
    case 4:
      return 'info'
    case 5:
      return 'danger'
    default:
      return 'info'
  }
}

const getRuleStatusText = (status: number) => {
  switch (status) {
    case 0:
      return '通过'
    case 1:
      return '失败'
    case 2:
      return '警告'
    case 3:
      return '异常'
    case 4:
      return '跳过'
    case 5:
      return '中断'
    default:
      return '未知'
  }
}

// ========================= 工具方法 =========================

const getStageClass = (status: number) => {
  switch (status) {
    case 0:
      return 'stage-pending'
    case 1:
      return 'stage-processing'
    case 2:
      return 'stage-completed'
    case 3:
      return 'stage-error'
    default:
      return 'stage-pending'
  }
}

const getStageIcon = (stageName: string) => {
  const iconMap = {
    文件解析: Files,
    基础验证: DocumentChecked,
    前置质控: Checked,
    数据导入: Upload,
    后置质控: Monitor
  }
  return iconMap[stageName] || Document
}

const getConnectorClass = (status: number) => {
  return status >= 2 ? 'connector-completed' : 'connector-pending'
}

const getStageStatusText = (status: number) => {
  switch (status) {
    case 0:
      return '待执行'
    case 1:
      return '执行中'
    case 2:
      return '已完成'
    case 3:
      return '执行失败'
    default:
      return '未知状态'
  }
}

const getProgressStatus = (status: number | undefined) => {
  if (status === TASK_STATUS.COMPLETED) return 'success'
  if (status === TASK_STATUS.FAILED) return 'exception'
  if (status === TASK_STATUS.CANCELLED) return 'warning'
  return undefined
}

const getDataSourceText = (dataSource: string | undefined) => {
  if (!dataSource) return '未知'
  return getDictLabel(DICT_TYPE.DRUG_DATA_SOURCE, dataSource) || dataSource
}

const getExecuteModeText = (mode: number | undefined) => {
  if (!mode) return '未知模式'
  const modeMap = {
    1: '仅前置质控',
    2: '仅后置质控',
    3: '全部执行'
  }
  return modeMap[mode] || '未知模式'
}

const getProcessingSpeed = (task: any) => {
  if (!task?.startTime || !task?.totalRecords || !task?.durationMs) return '-'

  const recordsPerSecond = task.successRecords / (task.durationMs / 1000)
  if (recordsPerSecond < 1) {
    return `${(recordsPerSecond * 60).toFixed(1)}条/分钟`
  }
  return `${recordsPerSecond.toFixed(1)}条/秒`
}

const getThroughput = (task: any) => {
  if (!task?.totalRecords || !task?.durationMs || task.durationMs === 0) return '-'

  const recordsPerSecond = task.totalRecords / (task.durationMs / 1000)
  if (recordsPerSecond < 1) {
    return `${(recordsPerSecond * 60).toFixed(1)}条/分钟`
  }
  return `${recordsPerSecond.toFixed(1)}条/秒`
}

const getQualityGradeType = (score: number | undefined) => {
  if (!score) return 'info'
  if (score >= 90) return 'success'
  if (score >= 70) return 'primary'
  if (score >= 50) return 'warning'
  return 'danger'
}

const getQualityDescription = (score: number | undefined) => {
  if (!score) return '未知'
  if (score >= 95) return '优秀'
  if (score >= 85) return '良好'
  if (score >= 70) return '一般'
  if (score >= 50) return '较差'
  return '很差'
}

const getQualityScore = (task: any) => {
  return task?.qualityScore || 0
}

const getQualityScoreClass = (score: number | undefined) => {
  if (!score) return ''
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'average'
  return 'poor'
}

const getScoreBreakdown = (scoreDetail: any) => {
  if (!scoreDetail) return {}

  let parsedDetail = scoreDetail

  if (typeof scoreDetail === 'string') {
    try {
      parsedDetail = JSON.parse(scoreDetail)
    } catch {
      return {}
    }
  }

  const dimensionMap = {
    file: '文件质量',
    record: '记录质量',
    rule: '规则检查'
  }

  const breakdown = {}
  Object.keys(parsedDetail).forEach((key) => {
    const displayName = dimensionMap[key] || key
    const value = parsedDetail[key]
    breakdown[displayName] = typeof value === 'number' ? value.toFixed(2) : value
  })

  return breakdown
}

const formatDurationFromMs = (durationMs: number | undefined) => {
  if (!durationMs || durationMs === 0) return null

  const seconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
}

// ========================= 格式化工具方法 =========================

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatNumber = (num: number) => {
  if (!num) return '0'
  return num.toLocaleString()
}

const formatTime = (time: string | undefined) => {
  if (!time) return ''
  try {
    return new Date(time).toLocaleString()
  } catch {
    return time
  }
}

// ========================= 生命周期处理 =========================

onMounted(() => {
  console.log('Component mounted')
  initComponent()
})

onUnmounted(() => {
  console.log('Component unmounting')
  cleanup()
})

// 页面可见性变化处理
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAutoRefresh()
  } else if (isComponentMounted.value && isTaskRunning.value) {
    startAutoRefresh()
  }
})
</script>

<style scoped>
/* 基础布局 */
.task-detail-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 50px);
}

.detail-content {
  margin-top: 20px;
}

.tab-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 概览网格布局 */
.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 20px;
  margin-bottom: 20px;
}

/* 卡片样式 */
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.header-icon {
  font-size: 18px;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.refresh-btn {
  position: absolute;
  right: 0;
}

/* 文本省略 */
.text-ellipsis {
  display: inline-block;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 阶段进度样式 */
.stage-progress-section {
  margin-bottom: 24px;
}

.stage-indicators {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  padding: 20px 0;
}

.stage-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.stage-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  border: 2px solid;
}

.stage-content {
  text-align: center;
  width: 100%;
}

.stage-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  font-size: 14px;
}

.stage-status {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stage-time {
  font-size: 11px;
  color: #c0c4cc;
}

.stage-duration {
  font-size: 11px;
  color: #67c23a;
}

.stage-connector {
  position: absolute;
  top: 20px;
  left: 60%;
  right: -40%;
  height: 2px;
  background: #e4e7ed;
  transition: all 0.3s ease;
}

/* 阶段状态样式 */
.stage-pending .stage-icon {
  background: #f0f2f5;
  color: #c0c4cc;
  border-color: #e4e7ed;
}

.stage-processing .stage-icon {
  background: #ecf5ff;
  color: #409eff;
  border-color: #409eff;
  animation: pulse 2s infinite;
}

.stage-completed .stage-icon {
  background: #f0f9ff;
  color: #67c23a;
  border-color: #67c23a;
}

.stage-error .stage-icon {
  background: #fef0f0;
  color: #f56c6c;
  border-color: #f56c6c;
}

.connector-completed {
  background: #67c23a !important;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

/* 进度条样式 */
.overall-progress-section {
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.progress-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.progress-message {
  text-align: center;
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
}

/* 时间信息 */
.time-info-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.time-item {
  text-align: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.time-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.time-value {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

/* 统计卡片网格 */
.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

.stat-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.stat-label {
  color: #606266;
}

.stat-value {
  font-weight: 600;
  color: #303133;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.danger {
  color: #f56c6c;
}

.stat-value.info {
  color: #909399;
}

.stat-value.primary {
  color: #409eff;
}

.stat-progress {
  margin-top: 8px;
}

/* 质量评分显示 */
.quality-card .stat-content {
  align-items: center;
}

.quality-score-display {
  text-align: center;
  width: 100%;
}

.score-circle {
  margin-bottom: 12px;
}

.score-value {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.score-value.excellent {
  color: #67c23a;
}

.score-value.good {
  color: #409eff;
}

.score-value.average {
  color: #e6a23c;
}

.score-value.poor {
  color: #f56c6c;
}

.score-label {
  font-size: 12px;
  color: #909399;
}

.score-breakdown {
  width: 100%;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.breakdown-label {
  color: #606266;
}

.breakdown-value {
  font-weight: 600;
  color: #303133;
}

/* 分表详情样式 */
.table-details-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-detail-card {
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.table-detail-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.table-file {
  font-size: 12px;
  color: #909399;
}

.table-progress-section {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.progress-percent {
  font-weight: 600;
  color: #303133;
}

.table-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stats-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.stats-group .stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: white;
  border-radius: 4px;
  font-size: 13px;
}

/* 规则详情 */
.rule-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.rule-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-item {
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.rule-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rule-name {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
}

.rule-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #606266;
}

.rule-stats .error {
  color: #f56c6c;
}

.rule-stats .warning {
  color: #e6a23c;
}

.rule-message {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
}

.rule-message.error {
  background: #fef0f0;
  color: #f56c6c;
}

.rule-message.info {
  background: #f4f4f5;
  color: #606266;
}

/* 质量报告样式 */
.quality-report {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.quality-overview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.main-score {
  text-align: center;
}

.score-number {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 8px;
}

.score-text {
  font-size: 14px;
  color: #606266;
}

.score-dimensions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.dimension-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.dimension-name {
  color: #606266;
}

.dimension-score {
  font-weight: 600;
  color: #303133;
}

/* 质量统计网格 */
.quality-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.quality-stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.quality-stat-item .stat-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.quality-stat-item.success .stat-icon {
  color: #67c23a;
}

.quality-stat-item.warning .stat-icon {
  color: #e6a23c;
}

.quality-stat-item.error .stat-icon {
  color: #f56c6c;
}

.quality-stat-item.info .stat-icon {
  color: #409eff;
}

.quality-stat-item .stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quality-stat-item .stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.quality-stat-item .stat-label {
  font-size: 14px;
  color: #606266;
}

.quality-stat-item .stat-percent {
  font-size: 12px;
  color: #909399;
}

/* 质量建议 */
.quality-suggestions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 空状态 */
.empty-state,
.loading-placeholder {
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Element Plus 覆盖样式 */
:deep(.el-card) {
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  background-color: #fafafa;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
  color: #606266;
  background-color: #fafafa;
}

:deep(.el-descriptions__content) {
  color: #303133;
}

:deep(.el-progress__text) {
  font-size: 13px !important;
}

:deep(.el-tag) {
  border-radius: 4px;
}

:deep(.el-divider--horizontal) {
  margin: 12px 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .statistics-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .task-detail-page {
    padding: 12px;
  }

  .statistics-grid {
    grid-template-columns: 1fr;
  }

  .stats-group {
    grid-template-columns: repeat(2, 1fr);
  }

  .quality-stats-grid {
    grid-template-columns: 1fr;
  }

  .stage-indicators {
    flex-direction: column;
    gap: 16px;
  }

  .stage-connector {
    display: none;
  }
}
</style>
