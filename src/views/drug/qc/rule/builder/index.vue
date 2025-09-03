<template>
  <div class="qc-rule-builder">
    <!-- 顶部头部组件 -->
    <PageHeader
      :title="isEdit ? '编辑规则' : '新建规则'"
      content="构建和配置数据质量控制规则，支持表达式构建器和自定义验证逻辑"
      tag="构建器"
      tag-type="primary"
      show-back-button
      back-button-text="返回规则列表"
      @back-click="handleBack"
      :actions="headerActions"
      @action-click="handleHeaderAction"
    />

    <!-- 规则构建器整体卡片 -->
    <el-card class="builder-card">
      <template #header>
        <div class="builder-header">
          <span class="card-header">规则构建器</span>
          <div class="header-desc">配置基本信息并构建验证表达式</div>
        </div>
      </template>

      <!-- 基本信息表单 -->
      <div class="basic-info-section">
        <div class="section-title">
          <el-icon>
            <InfoFilled />
          </el-icon>
          基本信息
        </div>
        <el-form
          ref="ruleFormRef"
          :model="ruleForm"
          :rules="ruleRules"
          label-width="120px"
          class="basic-form"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="规则编码" prop="ruleCode">
                <el-input
                  v-model="ruleForm.ruleCode"
                  placeholder="自动生成或手动输入"
                  :disabled="isEdit"
                >
                  <template #prepend>
                    <el-select
                      v-model="ruleCodePrefix"
                      style="width: 100px"
                      @change="handlePrefixChange"
                      :disabled="isEdit"
                    >
                      <el-option label="PRE_QC" value="PRE_QC" />
                      <el-option label="POST_QC" value="POST_QC" />
                    </el-select>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="规则名称" prop="ruleName">
                <el-input v-model="ruleForm.ruleName" placeholder="请输入规则名称" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="规则类型" prop="ruleType">
                <el-radio-group v-model="ruleForm.ruleType" @change="handleRuleTypeChange">
                  <el-radio :value="1">前置质控</el-radio>
                  <el-radio :value="2">后置质控</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="检查维度" prop="checkDimension">
                <el-select v-model="ruleForm.checkDimension" placeholder="请选择检查维度">
                  <el-option label="记录维度" value="RECORD" />
                  <el-option label="机构维度" value="ORGANIZATION" />
                  <el-option label="全局维度" value="GLOBAL" />
                  <el-option label="省份维度" value="PROVINCE" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="适用表" prop="tableType">
                <el-select
                  v-model="selectedTableTypes"
                  clearable
                  collapse-tags
                  collapse-tags-tooltip
                  multiple
                  placeholder="根据表达式自动识别"
                  disabled
                >
                  <el-option
                    v-for="table in detectedTables"
                    :key="table.value"
                    :label="table.label"
                    :value="table.value"
                  />
                </el-select>
                <div class="form-tip">适用表将根据表达式中使用的表自动推导</div>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="优先级" prop="priority">
                <el-input-number
                  v-model="ruleForm.priority"
                  :min="1"
                  :max="999"
                  placeholder="数字越小优先级越高"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="检查字段" prop="checkFields">
                <el-select
                  v-model="ruleForm.checkFields"
                  multiple
                  clearable
                  collapse-tags
                  collapse-tags-tooltip
                  placeholder="根据表达式自动识别"
                  disabled
                >
                  <el-option
                    v-for="field in detectedFields"
                    :key="field.value"
                    :label="field.label"
                    :value="field.value"
                  />
                </el-select>
                <div class="form-tip">根据表达式自动识别使用的字段</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否启用" prop="enabled">
                <el-switch
                  v-model="ruleForm.enabled"
                  :active-value="1"
                  :inactive-value="0"
                  active-text="启用"
                  inactive-text="禁用"
                />
                <span class="form-tip ml-2">新建规则默认启用</span>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="规则说明" prop="description">
                <el-input
                  v-model="ruleForm.description"
                  placeholder="请输入规则的详细说明"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 分隔线 -->
      <el-divider class="section-divider">
        <el-icon>
          <Setting />
        </el-icon>
      </el-divider>

      <!-- 表达式构建器部分标题 -->
      <div class="expression-section-title">
        <el-icon>
          <Tools />
        </el-icon>
        表达式构建器
      </div>

      <div class="builder-body">
        <!-- 左侧工具栏 -->
        <div class="builder-sidebar">
          <el-tabs v-model="activeTab" class="sidebar-tabs">
            <!-- 数据源面板 -->
            <el-tab-pane name="datasource">
              <template #label>
                <div class="tab-label">
                  <Icon icon="fa-solid:database" />
                  <span>数据源</span>
                </div>
              </template>
              <div class="tool-panel">
                <div class="panel-body">
                  <div class="search-row">
                    <el-input
                      v-model="dataSourceFilter"
                      placeholder="搜索表或字段"
                      clearable
                      size="small"
                      class="search-input"
                    >
                      <template #prefix>
                        <Icon icon="ep:search" />
                      </template>
                    </el-input>
                    <el-button
                      size="small"
                      text
                      @click="refreshDataSource"
                      :loading="loadingDataSource"
                      class="refresh-btn"
                    >
                      <Icon icon="ep:refresh" />
                    </el-button>
                  </div>

                  <div class="tree-container">
                    <el-tree
                      ref="dataSourceTreeRef"
                      :data="dataSourceTreeData"
                      :props="treeProps"
                      :filter-node-method="filterDataSourceNode"
                      node-key="id"
                      :default-expand-all="false"
                      :expand-on-click-node="false"
                      :draggable="false"
                      :allow-drop="() => false"
                      :allow-drag="() => false"
                    >
                      <template #default="{ node, data }">
                        <div
                          v-if="node && data"
                          class="tree-node"
                          :class="[data.type, { 'draggable-node': isDraggableNode(node) }]"
                          :draggable="isDraggableNode(node)"
                          @dragstart="handleDragStart($event, node)"
                        >
                          <Icon :icon="getNodeIcon(data)" class="node-icon" />
                          <div class="node-content">
                            <div class="node-main">
                              <span class="node-label">{{ node.label }}</span>
                              <span v-if="data.type === 'field'" class="field-type">{{
                                data.dataType || data.fieldType
                              }}</span>
                            </div>
                            <span v-if="data.tableName || data.fieldName" class="english-name">
                              {{ data.fieldName || data.tableName }}
                            </span>
                          </div>
                        </div>
                      </template>
                    </el-tree>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 函数库面板 -->
            <el-tab-pane name="functions">
              <template #label>
                <div class="tab-label">
                  <Icon icon="ep:cpu" />
                  <span>函数库</span>
                </div>
              </template>
              <div class="tool-panel">
                <div class="panel-body">
                  <div class="search-row">
                    <el-input
                      v-model="functionFilter"
                      placeholder="搜索函数"
                      clearable
                      size="small"
                      class="search-input"
                    >
                      <template #prefix>
                        <Icon icon="ep:search" />
                      </template>
                    </el-input>
                    <el-button size="small" text @click="refreshFunctions" class="refresh-btn">
                      <Icon icon="ep:refresh" />
                    </el-button>
                  </div>

                  <div class="function-container">
                    <el-collapse v-model="activeFunctionCategories" accordion>
                      <el-collapse-item
                        v-for="category in filteredFunctionCategories"
                        :key="category.name"
                        :title="category.name"
                        :name="category.name"
                      >
                        <div class="function-list">
                          <div
                            v-for="func in category.functions"
                            :key="func.id"
                            class="function-item"
                            draggable="true"
                            @dragstart="handleFunctionDragStart($event, func)"
                            @click="handleFunctionClick(func)"
                          >
                            <div class="function-header">
                              <span class="function-name">{{ func.functionName }}</span>
                              <div class="function-actions">
                                <el-tag
                                  size="small"
                                  :type="getFunctionLevelType(func.functionLevel)"
                                >
                                  {{ getFunctionLevelText(func.functionLevel) }}
                                </el-tag>
                              </div>
                            </div>
                            <div class="function-desc">{{ func.chineseName }}</div>
                            <div class="function-params" v-if="getFunctionParams(func).length > 0">
                              <div class="param-label">入参：</div>
                              <div class="param-list">
                                <span
                                  v-for="(param, index) in getFunctionParams(func)"
                                  :key="index"
                                  class="param-item"
                                >
                                  {{ param.name }}
                                  <span class="param-type">({{ param.type }})</span>
                                  <span v-if="param.required" class="param-required">*</span>
                                </span>
                              </div>
                            </div>
                            <div
                              class="function-returns"
                              v-if="getFunctionReturns(func).length > 0"
                            >
                              <div class="return-label">返回：</div>
                              <div class="return-list">
                                <span
                                  v-for="(returnItem, index) in getFunctionReturns(func)"
                                  :key="index"
                                  class="return-item"
                                >
                                  {{ returnItem.name }}
                                  <span class="return-type">({{ returnItem.type }})</span>
                                </span>
                              </div>
                            </div>
                            <div class="function-usage">{{ func.usageExample }}</div>
                          </div>
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 操作符面板 -->
            <el-tab-pane name="operators">
              <template #label>
                <div class="tab-label">
                  <Icon icon="ep:operation" />
                  <span>操作符</span>
                </div>
              </template>
              <div class="tool-panel">
                <div class="panel-body">
                  <div class="operator-container">
                    <el-collapse v-model="activeOperatorCategories">
                      <el-collapse-item
                        v-for="category in operatorCategories"
                        :key="category.name"
                        :title="category.name"
                        :name="category.name"
                      >
                        <div class="operator-list">
                          <div
                            v-for="operator in category.operators"
                            :key="operator.id"
                            class="operator-item"
                            draggable="true"
                            @dragstart="handleOperatorDragStart($event, operator)"
                            @click="handleOperatorClick(operator)"
                          >
                            <div class="operator-symbol">{{ operator.operatorSymbol }}</div>
                            <div class="operator-name">{{ operator.chineseName }}</div>
                            <div
                              v-if="
                                operator.operatorSymbol === '≈' || operator.operatorSymbol === '≉'
                              "
                              class="tolerance-hint"
                            >
                              支持误差范围
                            </div>
                          </div>
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 中间工作区 -->
        <div class="builder-main">
          <!-- 条件组构建区 -->
          <div class="condition-groups-builder">
            <div class="section-header">
              <span>条件组配置</span>
              <div class="header-actions">
                <el-tooltip
                  :content="
                    isDescendingOrder
                      ? '当前为降序排序（优先级高→优先级低）'
                      : '当前为正序排序（优先级低→优先级高）'
                  "
                  placement="top"
                >
                  <el-button
                    size="small"
                    :type="isDescendingOrder ? 'primary' : 'success'"
                    @click="toggleSortOrder"
                  >
                    <Icon
                      :icon="isDescendingOrder ? 'ep:sort-down' : 'ep:sort-up'"
                      class="mr-5px"
                    />
                    {{ isDescendingOrder ? '降序' : '正序' }}
                  </el-button>
                </el-tooltip>
                <el-button type="primary" size="small" @click="addConditionGroup">
                  <Icon icon="ep:plus" class="mr-5px" />
                  添加条件组
                </el-button>
              </div>
            </div>

            <div class="condition-groups-scroll">
              <div class="condition-groups">
                <div
                  v-for="(group, index) in conditionGroups"
                  :key="group.id"
                  class="condition-group"
                  :class="{ active: activeGroupIndex === index }"
                  @click="setActiveGroup(index)"
                  draggable="true"
                  @dragstart="handleGroupDragStart($event, index)"
                  @dragover="handleGroupDragOver($event, index)"
                  @drop="handleGroupDrop($event, index)"
                  @dragend="handleGroupDragEnd($event)"
                >
                  <div class="group-header">
                    <div class="group-title">
                      <div class="group-title-left">
                        <span class="priority-badge">{{ group.priority }}</span>
                        <span>{{ group.groupName || `条件组 ${index + 1}` }}</span>
                      </div>
                      <el-tag size="small" :type="getActionType(group.executeAction)">
                        {{ getActionText(group.executeAction) }}
                      </el-tag>
                    </div>
                    <div class="group-actions">
                      <el-button size="small" text @click.stop="duplicateGroup(index)">
                        <Icon icon="ep:document-copy" />
                      </el-button>
                      <el-button size="small" text @click.stop="removeGroup(index)">
                        <Icon icon="ep:delete" />
                      </el-button>
                    </div>
                  </div>

                  <!-- 表达式构建画布 -->
                  <div
                    class="expression-canvas"
                    @drop="handleDrop($event, group.id)"
                    @dragover="handleDragOver"
                    @dragleave="handleDragLeave"
                  >
                    <div
                      v-if="!group.expressionComponents || !group.expressionComponents.length"
                      class="empty-canvas"
                    >
                      <Icon icon="ep:mouse" class="empty-icon" />
                      <p>拖拽字段、函数或操作符到此处开始构建表达式</p>

                      <el-dropdown
                        trigger="click"
                        @command="(cmd) => addCanvasElement(group.id, cmd)"
                        class="canvas-add-menu"
                      >
                        <el-button type="primary" size="small" circle>
                          <Icon icon="ep:plus" />
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item command="number">添加数值</el-dropdown-item>
                            <el-dropdown-item command="text">添加文本</el-dropdown-item>
                            <el-dropdown-item command="boolean">添加布尔值</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>

                    <div v-else class="expression-components">
                      <div
                        v-for="(component, compIndex) in group.expressionComponents"
                        :key="`${group.id}-${compIndex}`"
                        class="expression-component"
                        :class="component.type"
                      >
                        <div class="component-content">
                          <Icon :icon="getComponentIcon(component)" class="component-icon" />

                          <div v-if="component.type === 'function'" class="function-display">
                            <span class="function-name">{{ component.value }}</span>
                            <span class="function-params-display">(</span>
                            <span
                              v-for="(param, paramIndex) in component.parameters || []"
                              :key="paramIndex"
                              class="function-param-display"
                            >
                              <span v-if="paramIndex > 0">, </span>
                              <el-popover
                                placement="top"
                                :width="200"
                                trigger="hover"
                                v-if="param.type === 'expression'"
                              >
                                <template #reference>
                                  <span class="param-value expression">{{
                                    param.expressionComponents &&
                                    param.expressionComponents.length > 0
                                      ? generateParameterExpressionText(param.expressionComponents)
                                      : param.displayValue || param.value || '表达式'
                                  }}</span>
                                </template>
                                <div
                                  >表达式:
                                  {{
                                    param.expressionComponents &&
                                    param.expressionComponents.length > 0
                                      ? generateParameterExpressionText(param.expressionComponents)
                                      : param.value || '空表达式'
                                  }}</div
                                >
                              </el-popover>
                              <span v-else class="param-value" :class="param.type">
                                {{ param.displayValue || param.value }}
                              </span>
                            </span>
                            <span class="function-params-display">)</span>
                          </div>

                          <div v-else class="literal-display">
                            <el-input-number
                              v-if="component.type === 'literal' && isNumberLiteral(component)"
                              v-model="component.numericValue"
                              size="small"
                              style="width: 120px"
                              :precision="2"
                              :step="1"
                              :controls="true"
                              @change="updateLiteralValue(component, $event)"
                              @click.stop
                            />
                            <el-input
                              v-else-if="component.type === 'literal' && isTextLiteral(component)"
                              v-model="component.textValue"
                              size="small"
                              style="width: 120px"
                              placeholder="输入文本"
                              @input="updateLiteralValue(component, $event)"
                              @click.stop
                            />
                            <el-select
                              v-else-if="
                                component.type === 'literal' && isBooleanLiteral(component)
                              "
                              v-model="component.booleanValue"
                              size="small"
                              style="width: 100px"
                              @change="updateLiteralValue(component, $event)"
                              @click.stop
                            >
                              <el-option label="true" :value="true" />
                              <el-option label="false" :value="false" />
                            </el-select>
                            <span v-else class="component-label">{{
                              getComponentDisplayText(component)
                            }}</span>
                          </div>

                          <div
                            v-if="
                              (component.value === '≈' || component.value === '≉') &&
                              component.showTolerance
                            "
                            class="tolerance-config"
                          >
                            <el-input
                              v-model="component.tolerance"
                              placeholder="±0.1"
                              size="small"
                              style="width: 80px; margin-left: 8px"
                              @click.stop
                            />
                          </div>
                        </div>

                        <div class="component-actions">
                          <el-button
                            v-if="component.type === 'function'"
                            size="small"
                            text
                            type="primary"
                            @click.stop="editComponent(group.id, compIndex)"
                          >
                            <Icon icon="ep:edit" />
                          </el-button>
                          <el-button
                            v-else-if="component.value === '≈' || component.value === '≉'"
                            size="small"
                            text
                            type="primary"
                            @click.stop="editComponent(group.id, compIndex)"
                          >
                            <Icon icon="ep:edit" />
                          </el-button>
                          <el-button
                            size="small"
                            text
                            type="danger"
                            @click.stop="removeComponent(group.id, compIndex)"
                          >
                            <Icon icon="ep:close" />
                          </el-button>
                        </div>
                      </div>

                      <el-dropdown
                        trigger="click"
                        @command="(cmd) => addCanvasElement(group.id, cmd)"
                        class="expression-add-menu"
                      >
                        <el-button size="small" text circle>
                          <Icon icon="ep:plus" />
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item command="number">添加数值</el-dropdown-item>
                            <el-dropdown-item command="text">添加文本</el-dropdown-item>
                            <el-dropdown-item command="boolean">添加布尔值</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                  </div>

                  <div
                    v-if="group.expressionComponents && group.expressionComponents.length"
                    class="expression-preview"
                  >
                    <div class="preview-header">
                      <span>表达式预览：</span>
                      <el-button size="small" text @click="compileExpression(group)">
                        <Icon icon="ep:cpu" class="mr-5px" />
                        编译SQL
                      </el-button>
                    </div>
                    <div class="preview-content">
                      <code>{{ generateExpressionText(group.expressionComponents) }}</code>
                    </div>
                    <div v-if="group.compilationResult" class="compilation-result">
                      <el-alert
                        :type="group.compilationResult.isValid ? 'success' : 'error'"
                        :title="
                          group.compilationResult.isValid ? '表达式语法正确' : '表达式语法错误'
                        "
                        :description="group.compilationResult.message"
                        show-icon
                        :closable="false"
                      />
                      <!-- 如果编译成功，显示SQL表达式 -->
                      <div
                        v-if="
                          group.compilationResult.isValid && group.compilationResult.sqlExpression
                        "
                        class="sql-expression"
                      >
                        <div class="sql-header">
                          <span>生成的SQL表达式：</span>
                          <el-button
                            size="small"
                            text
                            type="primary"
                            @click="copySqlToClipboard(group.compilationResult.sqlExpression)"
                            class="copy-sql-btn"
                            title="复制SQL表达式"
                          >
                            <Icon icon="ep:copy-document" />
                          </el-button>
                        </div>
                        <div class="sql-content">
                          <pre>{{ group.compilationResult.sqlExpression }}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧配置面板 -->
        <div class="builder-aside">
          <div v-if="activeGroup" class="config-panel">
            <div class="panel-header">
              <span>条件组配置</span>
            </div>
            <div class="panel-body">
              <el-form :model="activeGroup" label-width="80px" size="small">
                <el-form-item label="组名称">
                  <el-input v-model="activeGroup.groupName" placeholder="请输入条件组名称" />
                </el-form-item>

                <el-form-item label="优先级">
                  <el-input-number
                    v-model="activeGroup.priority"
                    :min="1"
                    :max="999"
                    controls-position="right"
                  />
                </el-form-item>

                <el-form-item label="适用表">
                  <el-select
                    v-model="activeGroupTableTypes"
                    clearable
                    collapse-tags
                    collapse-tags-tooltip
                    multiple
                    placeholder="根据表达式自动识别"
                    disabled
                  >
                    <el-option
                      v-for="table in activeGroupDetectedTables"
                      :key="table.value"
                      :label="table.label"
                      :value="table.value"
                    />
                  </el-select>
                  <div class="form-tip">适用表将根据条件组表达式中使用的表自动推导</div>
                </el-form-item>

                <el-form-item label="执行动作">
                  <el-select v-model="activeGroup.executeAction" placeholder="请选择">
                    <el-option label="记录错误，统一返回" value="RECORD_ERROR" />
                    <el-option label="直接中断，立即退回" value="INTERRUPT" />
                    <el-option label="标记异常数据" value="MARK_ANOMALY" />
                    <el-option label="警告标记" value="WARNING" />
                    <el-option label="跳过检查" value="SKIP" />
                  </el-select>
                </el-form-item>

                <el-form-item label="错误信息">
                  <el-input
                    v-model="activeGroup.errorMessageTemplate"
                    type="textarea"
                    :rows="3"
                    placeholder="支持变量模板，如：${tableName}的字段${fieldName}不能为空"
                  />
                  <div class="template-help">
                    <el-popover placement="top" :width="400" trigger="click">
                      <template #reference>
                        <el-button text size="small" class="mt-5px">
                          <Icon icon="ep:question-filled" class="mr-5px" />
                          变量说明
                        </el-button>
                      </template>
                      <div class="variable-help">
                        <div class="variable-header">
                          <strong>可用变量（点击插入）：</strong>
                          <el-tag size="small" type="info"
                            >{{ getAvailableVariables(activeGroup).length }} 个
                          </el-tag>
                        </div>
                        <div class="variable-list">
                          <!-- 维度变量 -->
                          <div v-if="getDimensionVariables().length > 0" class="variable-category">
                            <div class="category-header dimension-category">
                              <Icon icon="ep:location" class="category-icon" />
                              <span class="category-title">维度变量</span>
                              <span class="category-badge">{{
                                getDimensionVariables().length
                              }}</span>
                            </div>
                            <div
                              v-for="variable in getDimensionVariables()"
                              :key="variable.name"
                              class="variable-item"
                            >
                              <div class="variable-main">
                                <a
                                  href="#"
                                  class="variable-name"
                                  :class="`variable-${variable.type}`"
                                  @click.prevent="insertVariable(variable.name)"
                                >
                                  {{ variable.name }}
                                </a>
                                <span class="colon">:</span>
                                <a
                                  href="#"
                                  class="variable-desc clickable"
                                  @click.prevent="insertVariable(variable.name)"
                                >
                                  {{ variable.description }}
                                </a>
                              </div>
                            </div>
                          </div>

                          <!-- 表变量 -->
                          <div
                            v-if="getTableVariables(activeGroup).length > 0"
                            class="variable-category"
                          >
                            <div class="category-header table-category">
                              <Icon icon="ep:grid" class="category-icon" />
                              <span class="category-title">表</span>
                              <span class="category-badge">{{
                                getTableVariables(activeGroup).length
                              }}</span>
                            </div>
                            <div
                              v-for="variable in getTableVariables(activeGroup)"
                              :key="variable.name"
                              class="variable-item table-item"
                            >
                              <div class="variable-main">
                                <a
                                  href="#"
                                  class="variable-desc clickable table-desc"
                                  @click.prevent="insertVariable(variable.name)"
                                >
                                  {{ variable.description }}
                                </a>
                              </div>
                            </div>
                          </div>

                          <!-- 字段变量按表分类 -->
                          <div v-if="getGroupedFieldVariables(activeGroup).length > 0">
                            <div
                              v-for="tableGroup in getGroupedFieldVariables(activeGroup)"
                              :key="tableGroup.tableName"
                              class="variable-category"
                            >
                              <div class="category-header field-category">
                                <Icon icon="ep:grid" class="category-icon" />
                                <span class="category-title">{{
                                  tableGroup.tableDisplayName
                                }}</span>
                                <span class="category-badge">{{ tableGroup.fields.length }}</span>
                              </div>
                              <div
                                v-for="field in tableGroup.fields"
                                :key="field.name"
                                class="variable-item"
                              >
                                <div class="variable-main">
                                  <a
                                    href="#"
                                    class="variable-name"
                                    :class="`variable-${field.type}`"
                                    @click.prevent="insertVariable(field.name)"
                                  >
                                    {{ field.displayName }}
                                  </a>
                                  <span class="colon">:</span>
                                  <a
                                    href="#"
                                    class="variable-desc clickable"
                                    @click.prevent="insertVariable(field.name)"
                                  >
                                    {{ field.fieldDescription }}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- 函数变量按函数分类 -->
                          <div v-if="getGroupedFunctionVariables(activeGroup).length > 0">
                            <div
                              v-for="funcGroup in getGroupedFunctionVariables(activeGroup)"
                              :key="funcGroup.functionName"
                              class="variable-category"
                            >
                              <div class="category-header function-category">
                                <Icon icon="ep:cpu" class="category-icon" />
                                <span class="category-title">{{
                                  funcGroup.functionDisplayName
                                }}</span>
                                <span class="category-badge">{{ funcGroup.returns.length }}</span>
                              </div>
                              <div
                                v-for="returnVar in funcGroup.returns"
                                :key="returnVar.name"
                                class="variable-item"
                              >
                                <div class="variable-main">
                                  <a
                                    href="#"
                                    class="variable-name"
                                    :class="`variable-${returnVar.type}`"
                                    @click.prevent="insertVariable(returnVar.name)"
                                  >
                                    {{ returnVar.displayName }}
                                  </a>
                                  <span class="colon">:</span>
                                  <a
                                    href="#"
                                    class="variable-desc clickable"
                                    @click.prevent="insertVariable(returnVar.name)"
                                  >
                                    {{ returnVar.returnDescription }}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="variable-footer">
                          <el-text size="small" type="info"
                            >提示：根据当前条件组表达式和检查维度自动识别
                          </el-text>
                        </div>
                      </div>
                    </el-popover>
                  </div>
                </el-form-item>

                <el-form-item label="描述">
                  <el-input
                    v-model="activeGroup.description"
                    type="textarea"
                    :rows="2"
                    placeholder="条件组的详细描述"
                  />
                </el-form-item>
              </el-form>
            </div>
          </div>

          <div v-else class="empty-config">
            <Icon icon="ep:setting" class="empty-icon" />
            <p>请选择一个条件组进行配置</p>
          </div>
        </div>
      </div>

      <!-- 合并后的右侧抽屉 -->
      <el-drawer
        v-model="showCombinedDrawer"
        title="函数配置"
        size="75%"
        :z-index="105"
        direction="rtl"
        :destroy-on-close="true"
        modal-class="combined-drawer-modal"
        @close="closeCombinedDrawer"
      >
        <div class="combined-drawer-content">
          <!-- 左侧工具栏区域 -->
          <div class="tools-section">
            <div class="tools-header">
              <span>工具栏</span>
            </div>
            <div class="tools-content">
              <el-tabs v-model="combinedActiveTab" class="combined-tools-tabs">
                <!-- 数据源面板 -->
                <el-tab-pane name="datasource">
                  <template #label>
                    <div class="tab-label">
                      <Icon icon="fa-solid:database" />
                      <span>数据源</span>
                    </div>
                  </template>
                  <div class="tool-panel">
                    <div class="panel-body">
                      <div class="search-row">
                        <el-input
                          v-model="dataSourceFilter"
                          placeholder="搜索表或字段"
                          clearable
                          size="small"
                          class="search-input"
                        >
                          <template #prefix>
                            <Icon icon="ep:search" />
                          </template>
                        </el-input>
                        <el-button
                          size="small"
                          text
                          @click="refreshDataSource"
                          :loading="loadingDataSource"
                          class="refresh-btn"
                        >
                          <Icon icon="ep:refresh" />
                        </el-button>
                      </div>

                      <div class="tree-container">
                        <el-tree
                          ref="dataSourceTreeRef"
                          :data="dataSourceTreeData"
                          :props="treeProps"
                          :filter-node-method="filterDataSourceNode"
                          node-key="id"
                          :default-expand-all="false"
                          :expand-on-click-node="false"
                          :draggable="false"
                          :allow-drop="() => false"
                          :allow-drag="() => false"
                        >
                          <template #default="{ node, data }">
                            <div
                              v-if="node && data"
                              class="tree-node"
                              :class="[data.type, { 'draggable-node': isDraggableNode(node) }]"
                              :draggable="isDraggableNode(node)"
                              @dragstart="handleDragStart($event, node)"
                            >
                              <Icon :icon="getNodeIcon(data)" class="node-icon" />
                              <div class="node-content">
                                <div class="node-main">
                                  <span class="node-label">{{ node.label }}</span>
                                  <span v-if="data.type === 'field'" class="field-type">{{
                                    data.dataType || data.fieldType
                                  }}</span>
                                </div>
                                <span v-if="data.tableName || data.fieldName" class="english-name">
                                  {{ data.fieldName || data.tableName }}
                                </span>
                              </div>
                            </div>
                          </template>
                        </el-tree>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>

                <!-- 操作符面板 -->
                <el-tab-pane name="operators">
                  <template #label>
                    <div class="tab-label">
                      <Icon icon="ep:operation" />
                      <span>操作符</span>
                    </div>
                  </template>
                  <div class="tool-panel">
                    <div class="panel-body">
                      <div class="operator-container">
                        <el-collapse v-model="activeOperatorCategories">
                          <el-collapse-item
                            v-for="category in operatorCategories"
                            :key="category.name"
                            :title="category.name"
                            :name="category.name"
                          >
                            <div class="operator-list">
                              <div
                                v-for="operator in category.operators"
                                :key="operator.id"
                                class="operator-item"
                                draggable="true"
                                @dragstart="handleOperatorDragStart($event, operator)"
                                @click="handleOperatorClick(operator)"
                              >
                                <div class="operator-symbol">{{ operator.operatorSymbol }}</div>
                                <div class="operator-name">{{ operator.chineseName }}</div>
                                <div
                                  v-if="
                                    operator.operatorSymbol === '≈' ||
                                    operator.operatorSymbol === '≉'
                                  "
                                  class="tolerance-hint"
                                >
                                  支持误差范围
                                </div>
                              </div>
                            </div>
                          </el-collapse-item>
                        </el-collapse>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>

          <!-- 右侧函数编辑区域 -->
          <div class="function-edit-section">
            <div v-if="currentEditFunction" class="function-edit-content">
              <div class="function-info">
                <h4>{{
                  currentEditFunction.component?.config?.chineseName ||
                  currentEditFunction.component?.value
                }}</h4>
                <p class="function-desc">{{
                  currentEditFunction.component?.config?.description
                }}</p>
              </div>

              <el-divider />

              <!-- 参数配置区域 -->
              <div class="parameters-section">
                <div class="section-header">
                  <h5>参数配置</h5>
                </div>

                <div
                  v-for="(param, paramEditIndex) in currentEditFunction.component?.parameters || []"
                  :key="param.id"
                  class="parameter-item"
                >
                  <div class="param-header">
                    <span class="param-index">{{
                      `参数${paramEditIndex + 1}：${param.name}(${param.description})` ||
                      `参数 ${paramEditIndex + 1}`
                    }}</span>
                  </div>

                  <el-form-item label="参数类型">
                    <el-select v-model="param.type" @change="onParameterTypeChange(param)" disabled>
                      <el-option label="表" value="table" />
                      <el-option label="字段" value="field" />
                      <el-option label="字段数组" value="field[]" />
                      <el-option label="字符串" value="string" />
                      <el-option label="数值" value="number" />
                      <el-option label="表达式" value="expression" />
                    </el-select>
                  </el-form-item>
                  <!--函数入参参数值-->
                  <el-form-item label="参数值">
                    <!-- 表选择拖拽区域 -->
                    <div v-if="param.type === 'table'" class="single-param-drop-area">
                      <div
                        class="drop-zone"
                        @drop="handleSingleParamDrop($event, param, 'table')"
                        @dragover="handleSingleParamDragOver"
                        @dragleave="handleSingleParamDragLeave"
                      >
                        <div v-if="!param.selectedTable" class="drop-placeholder">
                          <Icon icon="ep:grid" />
                          <span>拖拽表到此处</span>
                        </div>
                        <div v-else class="selected-item">
                          <div class="item-tag">
                            <Icon icon="ep:grid" class="item-icon" />
                            <span class="item-name">{{
                              param.selectedTable.label || param.selectedTable.value
                            }}</span>
                            <el-button
                              size="small"
                              text
                              type="danger"
                              @click="clearSingleParam(param)"
                              class="remove-btn"
                            >
                              <Icon icon="ep:close" />
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 字段选择拖拽区域 -->
                    <div v-else-if="param.type === 'field'" class="single-param-drop-area">
                      <div
                        class="drop-zone"
                        @drop="handleSingleParamDrop($event, param, 'field')"
                        @dragover="handleSingleParamDragOver"
                        @dragleave="handleSingleParamDragLeave"
                      >
                        <div v-if="!param.selectedField" class="drop-placeholder">
                          <Icon icon="ep:key" />
                          <span>拖拽字段到此处</span>
                        </div>
                        <div v-else class="selected-item">
                          <div class="item-tag">
                            <Icon icon="ep:key" class="item-icon" />
                            <span class="item-name">{{
                              param.selectedField.label || param.selectedField.value
                            }}</span>
                            <el-button
                              size="small"
                              text
                              type="danger"
                              @click="clearSingleParam(param)"
                              class="remove-btn"
                            >
                              <Icon icon="ep:close" />
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 字段数组拖拽选择 -->
                    <div
                      v-else-if="param.type === 'field[]'"
                      class="field-array-drop-area full-width"
                    >
                      <div
                        class="drop-zone"
                        @drop="handleFieldArrayDrop($event, param)"
                        @dragover="handleFieldArrayDragOver"
                        @dragleave="handleFieldArrayDragLeave"
                      >
                        <div
                          v-if="!param.selectedFields || param.selectedFields.length === 0"
                          class="drop-placeholder"
                        >
                          <Icon icon="ep:mouse" />
                          <span>拖拽字段到此处（支持多选）</span>
                        </div>
                        <div v-else class="selected-fields">
                          <div
                            v-for="(field, fieldIndex) in param.selectedFields"
                            :key="fieldIndex"
                            class="field-tag"
                          >
                            <Icon icon="ep:coin" class="field-icon" />
                            <span class="field-name">{{ field.label || field.fieldName }}</span>
                            <el-button
                              size="small"
                              text
                              type="danger"
                              @click="removeFieldFromArray(param, fieldIndex)"
                              class="remove-btn"
                            >
                              <Icon icon="ep:close" />
                            </el-button>
                          </div>
                        </div>
                      </div>
                      <div class="field-count-info">
                        已选择 {{ param.selectedFields?.length || 0 }} 个字段
                        <span v-if="param.minItems" class="min-items-hint">
                          (至少需要 {{ param.minItems }} 个)
                        </span>
                      </div>
                    </div>

                    <!-- 字符串输入 -->
                    <el-input
                      v-else-if="param.type === 'string'"
                      v-model="param.value"
                      placeholder="输入字符串值"
                      @input="updateParameterDisplay(param)"
                    />

                    <!-- 数值输入 -->
                    <el-input-number
                      v-else-if="param.type === 'number'"
                      v-model="param.value"
                      placeholder="输入数值"
                      style="width: 100%"
                      :precision="2"
                      :step="1"
                      :controls="true"
                      @change="updateParameterDisplay(param)"
                    />

                    <!-- 表达式编辑 -->
                    <div v-else-if="param.type === 'expression'" class="expression-param-editor">
                      <div class="expression-canvas-area">
                        <div class="expression-header">
                          <span class="expression-label">表达式配置</span>
                          <el-button
                            size="small"
                            text
                            type="danger"
                            @click="clearParameterExpression(param)"
                            :disabled="!param.expressionComponents?.length"
                            class="clear-btn"
                          >
                            <Icon icon="ep:delete" />
                            清空
                          </el-button>
                        </div>
                        <div
                          class="expression-canvas"
                          @drop="handleParameterExpressionDrop($event, param)"
                          @dragover="handleParameterExpressionDragOver"
                          @dragleave="handleParameterExpressionDragLeave"
                        >
                          <div
                            v-if="
                              !param.expressionComponents || param.expressionComponents.length === 0
                            "
                            class="empty-canvas"
                          >
                            <Icon icon="ep:mouse" class="empty-icon" />
                            <p>拖拽字段、函数或操作符到此处开始构建表达式</p>

                            <el-dropdown
                              trigger="click"
                              @command="(cmd) => addParameterExpressionElement(param, cmd)"
                              class="canvas-add-menu"
                            >
                              <el-button type="primary" size="small" circle>
                                <Icon icon="ep:plus" />
                              </el-button>
                              <template #dropdown>
                                <el-dropdown-menu>
                                  <el-dropdown-item command="number">添加数值</el-dropdown-item>
                                  <el-dropdown-item command="text">添加文本</el-dropdown-item>
                                  <el-dropdown-item command="boolean">添加布尔值</el-dropdown-item>
                                </el-dropdown-menu>
                              </template>
                            </el-dropdown>
                          </div>

                          <!-- 表达式组件显示 -->
                          <div v-else class="expression-components">
                            <div
                              v-for="(component, compIndex) in param.expressionComponents"
                              :key="`${param.id}-${compIndex}`"
                              class="expression-component"
                              :class="component.type"
                            >
                              <div class="component-content">
                                <Icon :icon="getComponentIcon(component)" class="component-icon" />

                                <div v-if="component.type === 'function'" class="function-display">
                                  <span class="function-name">{{ component.value }}</span>
                                  <span class="function-params-display">(</span>
                                  <span
                                    v-for="(param, paramIndex) in component.parameters || []"
                                    :key="paramIndex"
                                    class="function-param-display"
                                  >
                                    <span v-if="paramIndex > 0">, </span>
                                    <el-popover
                                      placement="top"
                                      :width="200"
                                      trigger="hover"
                                      v-if="param.type === 'expression'"
                                    >
                                      <template #reference>
                                        <span class="param-value expression">{{
                                          param.expressionComponents &&
                                          param.expressionComponents.length > 0
                                            ? generateParameterExpressionText(
                                                param.expressionComponents
                                              )
                                            : param.displayValue || param.value || '表达式'
                                        }}</span>
                                      </template>
                                      <div
                                        >表达式:
                                        {{
                                          param.expressionComponents &&
                                          param.expressionComponents.length > 0
                                            ? generateParameterExpressionText(
                                                param.expressionComponents
                                              )
                                            : param.value || '空表达式'
                                        }}</div
                                      >
                                    </el-popover>
                                    <span v-else class="param-value" :class="param.type">
                                      {{ param.displayValue || param.value }}
                                    </span>
                                  </span>
                                  <span class="function-params-display">)</span>
                                </div>

                                <div v-else class="literal-display">
                                  <el-input-number
                                    v-if="
                                      component.type === 'literal' && isNumberLiteral(component)
                                    "
                                    v-model="component.numericValue"
                                    size="small"
                                    :precision="2"
                                    :step="1"
                                    :controls="true"
                                    @change="updateLiteralValue(component, $event)"
                                    @click.stop
                                  />
                                  <el-input
                                    v-else-if="
                                      component.type === 'literal' && isTextLiteral(component)
                                    "
                                    v-model="component.textValue"
                                    size="small"
                                    placeholder="输入文本"
                                    @input="updateLiteralValue(component, $event)"
                                    @click.stop
                                  />
                                  <el-select
                                    v-else-if="
                                      component.type === 'literal' && isBooleanLiteral(component)
                                    "
                                    v-model="component.booleanValue"
                                    size="small"
                                    @change="updateLiteralValue(component, $event)"
                                    @click.stop
                                  >
                                    <el-option label="true" :value="true" />
                                    <el-option label="false" :value="false" />
                                  </el-select>
                                  <span v-else class="component-label">{{
                                    getComponentDisplayText(component)
                                  }}</span>
                                </div>

                                <div
                                  v-if="
                                    (component.value === '≈' || component.value === '≉') &&
                                    component.showTolerance
                                  "
                                  class="tolerance-config"
                                >
                                  <el-input
                                    v-model="component.tolerance"
                                    placeholder="±0.1"
                                    size="small"
                                    style="width: 80px; margin-left: 8px"
                                    @click.stop
                                  />
                                </div>
                              </div>

                              <div class="component-actions">
                                <el-button
                                  v-if="component.type === 'function'"
                                  size="small"
                                  text
                                  type="primary"
                                  @click.stop="editParameterComponent(param, compIndex)"
                                >
                                  <Icon icon="ep:edit" />
                                </el-button>
                                <el-button
                                  v-else-if="component.value === '≈' || component.value === '≉'"
                                  size="small"
                                  text
                                  type="primary"
                                  @click.stop="editParameterComponent(param, compIndex)"
                                >
                                  <Icon icon="ep:edit" />
                                </el-button>
                                <el-button
                                  size="small"
                                  text
                                  type="danger"
                                  @click.stop="removeParameterExpressionComponent(param, compIndex)"
                                >
                                  <Icon icon="ep:close" />
                                </el-button>
                              </div>
                            </div>

                            <el-dropdown
                              trigger="click"
                              @command="(cmd) => addParameterExpressionElement(param, cmd)"
                              class="expression-add-menu"
                            >
                              <el-button size="small" text circle>
                                <Icon icon="ep:plus" />
                              </el-button>
                              <template #dropdown>
                                <el-dropdown-menu>
                                  <el-dropdown-item command="number">添加数值</el-dropdown-item>
                                  <el-dropdown-item command="text">添加文本</el-dropdown-item>
                                  <el-dropdown-item command="boolean">添加布尔值</el-dropdown-item>
                                </el-dropdown-menu>
                              </template>
                            </el-dropdown>
                          </div>
                        </div>
                      </div>

                      <!-- 表达式预览 -->
                      <div
                        v-if="param.expressionComponents && param.expressionComponents.length"
                        class="expression-preview"
                      >
                        <div class="preview-header">
                          <span>表达式预览：</span>
                        </div>
                        <div class="preview-content2">
                          <code>{{
                            generateParameterExpressionText(param.expressionComponents)
                          }}</code>
                        </div>
                      </div>
                    </div>

                    <!-- 默认显示 -->
                    <el-input v-else v-model="param.value" placeholder="参数值" disabled />
                  </el-form-item>
                </div>

                <div v-if="!currentEditFunction.component?.parameters?.length" class="empty-params">
                  <p>该函数无需参数</p>
                </div>
              </div>

              <el-divider />

              <!-- 返回值选择区域 -->
              <div
                class="returns-section"
                v-if="currentEditFunction.component?.returnOptions?.length > 0"
              >
                <h5>选择返回值 <span class="required-mark">*</span></h5>
                <p class="return-hint">请选择函数的返回值作为表达式结果</p>
                <el-radio-group
                  v-model="currentEditFunction.component.selectedReturn"
                  :class="{ 'required-field': !currentEditFunction.component.selectedReturn }"
                >
                  <el-radio
                    v-for="(returnItem, radioIndex) in currentEditFunction.component.returnOptions"
                    :key="radioIndex"
                    :value="returnItem.name"
                  >
                    {{ returnItem.name }} ({{ getReturnTypeDisplayName(returnItem.type) }})
                    <span v-if="returnItem.description" class="return-desc"
                      >- {{ returnItem.description }}</span
                    >
                  </el-radio>
                </el-radio-group>
              </div>
            </div>

            <div v-else class="no-function-selected">
              <Icon icon="ep:cpu" class="empty-icon" />
              <p>请选择一个函数进行配置</p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="drawer-footer">
            <el-button @click="closeCombinedDrawer">取消</el-button>
            <el-button type="primary" @click="saveFunctionEdit" :disabled="!currentEditFunction">
              保存
            </el-button>
          </div>
        </template>
      </el-drawer>

      <!-- 嵌套函数配置抽屉 -->
      <el-drawer
        v-model="showNestedDrawer"
        title="参数函数配置"
        size="80%"
        :z-index="110"
        direction="rtl"
        :destroy-on-close="true"
        modal-class="nested-drawer-modal"
        @close="closeNestedDrawer"
      >
        <div class="nested-drawer-content">
          <!-- 左侧工具栏区域 -->
          <div class="nested-tools-section">
            <div class="tools-header">
              <span>工具栏</span>
            </div>
            <div class="tools-content">
              <el-tabs v-model="nestedActiveTab" class="nested-tools-tabs">
                <!-- 数据源面板 -->
                <el-tab-pane name="datasource">
                  <template #label>
                    <div class="tab-label">
                      <Icon icon="fa-solid:database" />
                      <span>数据源</span>
                    </div>
                  </template>
                  <div class="tool-panel">
                    <div class="panel-body">
                      <div class="search-row">
                        <el-input
                          v-model="dataSourceFilter"
                          placeholder="搜索表或字段"
                          clearable
                          size="small"
                          class="search-input"
                        >
                          <template #prefix>
                            <Icon icon="ep:search" />
                          </template>
                        </el-input>
                        <el-button
                          size="small"
                          text
                          @click="refreshDataSource"
                          :loading="loadingDataSource"
                          class="refresh-btn"
                        >
                          <Icon icon="ep:refresh" />
                        </el-button>
                      </div>

                      <div class="tree-container">
                        <el-tree
                          ref="dataSourceTreeRef"
                          :data="dataSourceTreeData"
                          :props="treeProps"
                          :filter-node-method="filterDataSourceNode"
                          node-key="id"
                          :default-expand-all="false"
                          :expand-on-click-node="false"
                          :draggable="false"
                          :allow-drop="() => false"
                          :allow-drag="() => false"
                        >
                          <template #default="{ node, data }">
                            <div
                              v-if="node && data"
                              class="tree-node"
                              :class="[data.type, { 'draggable-node': isDraggableNode(node) }]"
                              :draggable="isDraggableNode(node)"
                              @dragstart="handleNestedDragStart($event, node)"
                            >
                              <Icon :icon="getNodeIcon(data)" class="node-icon" />
                              <div class="node-content">
                                <div class="node-main">
                                  <span class="node-label">{{ node.label }}</span>
                                  <span v-if="data.type === 'field'" class="field-type">{{
                                    data.dataType || data.fieldType
                                  }}</span>
                                </div>
                                <span v-if="data.tableName || data.fieldName" class="english-name">
                                  {{ data.fieldName || data.tableName }}
                                </span>
                              </div>
                            </div>
                          </template>
                        </el-tree>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>

                <!-- 操作符面板 -->
                <el-tab-pane name="operators">
                  <template #label>
                    <div class="tab-label">
                      <Icon icon="ep:operation" />
                      <span>操作符</span>
                    </div>
                  </template>
                  <div class="tool-panel">
                    <div class="panel-body">
                      <div class="operator-container">
                        <el-collapse v-model="activeOperatorCategories">
                          <el-collapse-item
                            v-for="category in operatorCategories"
                            :key="category.name"
                            :title="category.name"
                            :name="category.name"
                          >
                            <div class="operator-list">
                              <div
                                v-for="operator in category.operators"
                                :key="operator.id"
                                class="operator-item"
                                draggable="true"
                                @dragstart="handleNestedOperatorDragStart($event, operator)"
                                @click="handleOperatorClick(operator)"
                              >
                                <div class="operator-symbol">{{ operator.operatorSymbol }}</div>
                                <div class="operator-name">{{ operator.chineseName }}</div>
                                <div
                                  v-if="
                                    operator.operatorSymbol === '≈' ||
                                    operator.operatorSymbol === '≉'
                                  "
                                  class="tolerance-hint"
                                >
                                  支持误差范围
                                </div>
                              </div>
                            </div>
                          </el-collapse-item>
                        </el-collapse>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>

          <!-- 右侧函数编辑区域 -->
          <div class="nested-function-edit-section">
            <div v-if="nestedEditFunction" class="function-edit-content">
              <div v-if="nestedEditFunction" class="function-edit-content">
                <div class="function-info">
                  <h4>{{
                    nestedEditFunction.component?.config?.chineseName ||
                    nestedEditFunction.component?.value
                  }}</h4>
                  <p class="function-desc">{{
                    nestedEditFunction.component?.config?.description
                  }}</p>
                </div>

                <el-divider />

                <!-- 参数配置区域 -->
                <div class="parameters-section">
                  <div class="section-header">
                    <h5>参数配置</h5>
                  </div>

                  <div
                    v-for="(param, paramEditIndex) in nestedEditFunction.component?.parameters ||
                    []"
                    :key="param.id"
                    class="parameter-item"
                  >
                    <div class="param-header">
                      <span class="param-index">参数 {{ paramEditIndex + 1 }}</span>
                    </div>

                    <el-form-item label="参数类型">
                      <el-select
                        v-model="param.type"
                        @change="onParameterTypeChange(param)"
                        disabled
                      >
                        <el-option label="表" value="table" />
                        <el-option label="字段" value="field" />
                        <el-option label="字段数组" value="field[]" />
                        <el-option label="字符串" value="string" />
                        <el-option label="数值" value="number" />
                        <el-option label="表达式" value="expression" />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="参数值">
                      <!-- 表选择 -->
                      <div
                        v-if="param.type === 'table'"
                        class="param-drop-wrapper"
                        @drop="handleSingleParamDrop($event, param, 'table')"
                        @dragover="handleSingleParamDragOver"
                        @dragleave="handleSingleParamDragLeave"
                      >
                        <el-select
                          v-model="param.selectedTable"
                          placeholder="请选择表或拖拽到此处"
                          clearable
                          filterable
                          value-key="value"
                          @change="updateParameterDisplay(param)"
                          style="width: 100%"
                        >
                          <el-option
                            v-for="table in availableTableOptions"
                            :key="table.value"
                            :label="table.label"
                            :value="table"
                          />
                        </el-select>
                      </div>

                      <!-- 字段选择 -->
                      <div
                        v-else-if="param.type === 'field'"
                        class="param-drop-wrapper"
                        @drop="handleSingleParamDrop($event, param, 'field')"
                        @dragover="handleSingleParamDragOver"
                        @dragleave="handleSingleParamDragLeave"
                      >
                        <el-select
                          v-model="param.selectedField"
                          placeholder="请选择字段或拖拽到此处"
                          clearable
                          filterable
                          value-key="value"
                          @change="updateParameterDisplay(param)"
                          style="width: 100%"
                        >
                          <el-option
                            v-for="field in availableFieldOptions"
                            :key="field.value"
                            :label="field.label"
                            :value="field"
                          />
                        </el-select>
                      </div>

                      <!-- 字段数组拖拽选择 -->
                      <div
                        v-else-if="param.type === 'field[]'"
                        class="field-array-drop-area full-width"
                      >
                        <div
                          class="drop-zone"
                          @drop="handleFieldArrayDrop($event, param)"
                          @dragover="handleFieldArrayDragOver"
                          @dragleave="handleFieldArrayDragLeave"
                        >
                          <div
                            v-if="!param.selectedFields || param.selectedFields.length === 0"
                            class="drop-placeholder"
                          >
                            <Icon icon="ep:mouse" />
                            <span>拖拽字段到此处（支持多选）</span>
                          </div>
                          <div v-else class="selected-fields">
                            <div
                              v-for="(field, fieldIndex) in param.selectedFields"
                              :key="fieldIndex"
                              class="field-tag"
                            >
                              <Icon icon="ep:coin" class="field-icon" />
                              <span class="field-name">{{ field.label || field.fieldName }}</span>
                              <el-button
                                size="small"
                                text
                                type="danger"
                                @click="removeFieldFromArray(param, fieldIndex)"
                                class="remove-btn"
                              >
                                <Icon icon="ep:close" />
                              </el-button>
                            </div>
                          </div>
                        </div>
                        <div class="field-count-info">
                          已选择 {{ param.selectedFields?.length || 0 }} 个字段
                          <span v-if="param.minItems" class="min-items-hint">
                            (至少需要 {{ param.minItems }} 个)
                          </span>
                        </div>
                      </div>

                      <!-- 字符串输入 -->
                      <el-input
                        v-else-if="param.type === 'string'"
                        v-model="param.value"
                        placeholder="输入字符串值"
                        @input="updateParameterDisplay(param)"
                      />

                      <!-- 数值输入 -->
                      <el-input-number
                        v-else-if="param.type === 'number'"
                        v-model="param.value"
                        placeholder="输入数值"
                        style="width: 100%"
                        :precision="2"
                        :step="1"
                        :controls="true"
                        @change="updateParameterDisplay(param)"
                      />

                      <!-- 表达式编辑 -->
                      <div v-else-if="param.type === 'expression'" class="expression-param-editor">
                        <div class="expression-canvas-area">
                          <div
                            class="expression-canvas"
                            @drop="handleNestedExpressionDrop($event, param)"
                            @dragover="handleNestedExpressionDragOver"
                            @dragleave="handleNestedExpressionDragLeave"
                          >
                            <div
                              v-if="
                                !param.expressionComponents ||
                                param.expressionComponents.length === 0
                              "
                              class="empty-canvas-hint"
                            >
                              <Icon icon="ep:cpu" class="empty-icon" />
                              <p>拖拽字段、操作符到此处构建表达式</p>
                              <div class="canvas-tips">
                                <span>提示：从左侧工具栏拖拽元素到此区域</span>
                              </div>
                            </div>
                            <div v-else class="expression-components">
                              <div
                                v-for="(component, componentIndex) in param.expressionComponents"
                                :key="`${component.id}-${componentIndex}`"
                                class="expression-component-item"
                              >
                                <ExpressionComponent
                                  :component="component"
                                  :index="componentIndex"
                                  @update="
                                    (newComponent) =>
                                      updateExpressionComponent(param, componentIndex, newComponent)
                                  "
                                  @remove="removeExpressionComponent(param, componentIndex)"
                                  @insert="
                                    (newComponent) =>
                                      insertExpressionComponent(
                                        param,
                                        componentIndex + 1,
                                        newComponent
                                      )
                                  "
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="expression-actions">
                          <el-button
                            size="small"
                            @click="clearParameterExpression(param)"
                            :disabled="!param.expressionComponents?.length"
                          >
                            <Icon icon="ep:delete" />
                            清空
                          </el-button>
                          <el-button
                            size="small"
                            type="primary"
                            @click="validateParameterExpression(param)"
                            :disabled="!param.expressionComponents?.length"
                          >
                            <Icon icon="ep:select" />
                            验证
                          </el-button>
                        </div>
                      </div>

                      <!-- 默认只读显示 -->
                      <el-input
                        v-else
                        :value="param.displayValue || param.value"
                        placeholder="参数值"
                        disabled
                      />
                    </el-form-item>
                  </div>

                  <div
                    v-if="!nestedEditFunction.component?.parameters?.length"
                    class="empty-params"
                  >
                    <p>该函数无需参数</p>
                  </div>
                </div>

                <el-divider />

                <!-- 返回值选择区域 -->
                <div
                  class="returns-section"
                  v-if="nestedEditFunction.component?.returnOptions?.length > 0"
                >
                  <h5>选择返回值 <span class="required-mark">*</span></h5>
                  <p class="return-hint">请选择函数的返回值作为表达式结果</p>
                  <el-radio-group
                    v-model="nestedEditFunction.component.selectedReturn"
                    :class="{ 'required-field': !nestedEditFunction.component.selectedReturn }"
                  >
                    <el-radio
                      v-for="(returnItem, radioIndex) in nestedEditFunction.component.returnOptions"
                      :key="radioIndex"
                      :value="returnItem.name"
                    >
                      {{ returnItem.name }} ({{ getReturnTypeDisplayName(returnItem.type) }})
                      <span v-if="returnItem.description" class="return-desc"
                        >- {{ returnItem.description }}</span
                      >
                    </el-radio>
                  </el-radio-group>
                </div>
              </div>

              <div v-else class="no-function-selected">
                <Icon icon="ep:cpu" class="empty-icon" />
                <p>请选择一个函数进行配置</p>
              </div>
            </div>

            <div class="drawer-footer">
              <el-button @click="closeNestedDrawer">取消</el-button>
              <el-button
                type="primary"
                @click="saveNestedFunctionEdit"
                :disabled="!nestedEditFunction"
              >
                保存
              </el-button>
            </div>
          </div>
        </div>
      </el-drawer>

      <!-- 表达式预览对话框 -->
      <ExpressionPreviewDialog
        v-model="showPreviewDialog"
        :rule-form="ruleForm"
        :condition-groups="conditionGroups"
        @save="handlePreviewSave"
      />

      <!-- 规则测试对话框 -->
      <RuleTestDialog
        v-model="showTestDialog"
        :rule-form="ruleForm"
        :condition-groups="conditionGroups"
        :table-mapping="getTableMappingForDialog()"
        @apply="handleTestApply"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { View, Cpu, Document, Check, InfoFilled, Setting, Tools } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader/index.vue'
import ExpressionPreviewDialog from './components/ExpressionPreviewDialog.vue'
import RuleTestDialog from './components/RuleTestDialog.vue'

import {
  getDataSourceCategories,
  createQcRule,
  updateQcRule,
  getQcRule,
  getMaxRuleCode,
  getMaxRuleInfo
} from '@/api/drug/qc/rule/builder'

import {
  QcFunctionConfigApi,
  QcOperatorConfigApi,
  QcExpressionApi,
  QcBuilderTableMetadataApi
} from '@/api/drug/qc/builder'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

// 路由和基础状态
const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const saving = ref(false)

// 头部操作按钮
const headerActions = ref([
  {
    key: 'preview',
    text: '预览表达式',
    icon: markRaw(View),
    disabled: computed(() => !hasExpression.value)
  },
  {
    key: 'test',
    text: '测试规则',
    icon: markRaw(Cpu),
    disabled: computed(() => !hasExpression.value)
  },
  {
    key: 'draft',
    text: '保存草稿',
    icon: markRaw(Document),
    loading: saving.value
  },
  {
    key: 'save',
    text: '保存规则',
    type: 'primary' as const,
    icon: markRaw(Check),
    loading: saving.value
  }
])

// 编码前缀
const ruleCodePrefix = ref('PRE_QC')

// 可用表和字段选项（从数据源接口动态获取）
const availableTableOptions = ref([])
const availableFieldOptions = ref([])

const selectedTableTypes = ref<string[]>([])
const detectedFields = ref<{ value: string; label: string }[]>([])
const detectedTables = ref<{ value: string; label: string }[]>([])

// 侧边栏状态
const activeTab = ref('datasource')
const loadingDataSource = ref(false)
const dataSourceFilter = ref('')
const functionFilter = ref('')
const activeFunctionCategories = ref(['STATISTICS'])
const activeOperatorCategories = ref(['COMPARISON'])

// 组件引用
const dataSourceTreeRef = ref()
const ruleFormRef = ref()

// 规则表单
const ruleForm = reactive({
  id: null,
  ruleCode: '',
  ruleName: '',
  ruleType: 1,
  checkDimension: 'RECORD',
  checkFields: [],
  tableType: '',
  priority: 100,
  executeAction: 'RECORD_ERROR',
  enabled: 1, // 使用整数类型，1为启用，0为禁用
  description: ''
})

const ruleRules = {
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  ruleType: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  checkDimension: [{ required: true, message: '请选择检查维度', trigger: 'change' }]
}

// 条件组排序方式（true: 降序，false: 正序）
const isDescendingOrder = ref(true)

// 表和字段元数据映射
const tableMetadataMap = ref<Record<string, string>>({})
const fieldMetadataMap = ref<Record<string, string>>({})

// 条件组数据
const conditionGroups = ref([])
const activeGroupIndex = ref(-1)

const activeGroup = computed(() => {
  return activeGroupIndex.value >= 0 && conditionGroups.value[activeGroupIndex.value]
    ? conditionGroups.value[activeGroupIndex.value]
    : null
})

// 获取当前活跃条件组的实时检测表
const activeGroupDetectedTables = computed(() => {
  if (!activeGroup.value) return []
  return getDetectedTablesForGroup(activeGroup.value)
})

// 获取当前活跃条件组的实时表类型值
const activeGroupTableTypes = computed({
  get() {
    if (!activeGroup.value) return []
    // 实时从检测结果获取表类型
    const detectedTables = getDetectedTablesForGroup(activeGroup.value)
    return detectedTables.map((table) => table.value)
  },
  set(newValue) {
    if (activeGroup.value) {
      activeGroup.value.tableType = newValue
    }
  }
})

const hasExpression = computed(() => {
  return conditionGroups.value.some(
    (group) => group.expressionComponents && group.expressionComponents.length > 0
  )
})

// 数据源树数据
const dataSourceTreeData = ref([])
const treeProps = {
  children: 'children',
  label: 'label'
}

// 函数库数据
const functionCategories = ref([])
const filteredFunctionCategories = computed(() => {
  if (!functionFilter.value) return functionCategories.value

  return functionCategories.value
    .map((category) => ({
      ...category,
      functions: category.functions.filter(
        (func) =>
          func.functionName.toLowerCase().includes(functionFilter.value.toLowerCase()) ||
          func.chineseName.includes(functionFilter.value)
      )
    }))
    .filter((category) => category.functions.length > 0)
})

// 操作符数据
const operatorCategories = ref([])

// 合并抽屉状态
const showCombinedDrawer = ref(false)
const currentEditFunction = ref(null)

// 嵌套抽屉状态
const showNestedDrawer = ref(false)
const nestedEditFunction = ref(null)
const nestedActiveTab = ref('datasource')

// 合并抽屉工具栏状态
const combinedActiveTab = ref('datasource')

// 全局拖拽状态管理
const globalDragData = ref(null)
const isDragging = ref(false)

// 条件组拖拽相关状态
const draggedGroupIndex = ref(-1)

// 初始化
onMounted(async () => {
  try {
    await Promise.all([
      loadDataSource(),
      loadFunctions(),
      loadOperators(),
      loadTableAndFieldMetadata()
    ])

    if (isEdit.value) {
      await loadRuleData(route.params.id)
    } else {
      await updateRuleCode() // 使用await
      addConditionGroup()
    }

    // 初始化时检测表和字段
    detectTablesAndFields()

    const handleGlobalDragEnd = () => {
      if (isDragging.value) {
        isDragging.value = false
        globalDragData.value = null
        document.body.classList.remove('dragging')
      }
    }

    document.addEventListener('dragend', handleGlobalDragEnd)
    document.addEventListener('drop', handleGlobalDragEnd)

    onBeforeUnmount(() => {
      document.removeEventListener('dragend', handleGlobalDragEnd)
      document.removeEventListener('drop', handleGlobalDragEnd)
      document.body.classList.remove('dragging')
    })
  } catch (error) {
    console.error('初始化失败:', error)
    ElMessage.error('页面初始化失败')
  }
})

// 数据加载方法
const loadDataSource = async () => {
  try {
    loadingDataSource.value = true
    const { treeData: response } = await getDataSourceCategories()
    const treeData = processTreeData(response || [])
    dataSourceTreeData.value = treeData

    // 提取表和字段选项
    extractTableAndFieldOptions(treeData)
  } catch (error) {
    console.error('加载数据源失败:', error)
    ElMessage.error('加载数据源失败')
  } finally {
    loadingDataSource.value = false
  }
}

const processTreeData = (treeData, parentTableName = null) => {
  return treeData.map((node) => {
    const processedNode = {
      id: node.id,
      label: node.label,
      type: node.type,
      icon: node.icon,
      description: node.description,
      isActive: node.isActive,
      sortOrder: node.sortOrder,
      categoryCode: node.categoryCode,
      tableName: node.tableName || parentTableName, // 字段节点从父表节点继承表名
      fieldName: node.fieldName,
      fieldType: node.fieldType,
      dataType: node.fieldType,
      isRequired: node.fieldName ? true : undefined
    }

    if (node.children && node.children.length > 0) {
      // 如果当前节点是表，将其表名传递给子节点
      const currentTableName =
        node.type === 'table' ? node.tableName || node.tableCode : parentTableName
      processedNode.children = processTreeData(node.children, currentTableName)
    }

    return processedNode
  })
}

// 从数据源树中提取表和字段选项
const extractTableAndFieldOptions = (treeData) => {
  const tables = new Set()
  const fields = new Set()

  const traverseTree = (nodes, currentCategoryCode = null) => {
    nodes.forEach((node) => {
      // 更新当前分类代码
      const nodeCategory = node.categoryCode || currentCategoryCode

      // 排除标准库分类
      const isStandardLibrary = nodeCategory === 'STANDARD_TABLES'

      if (!isStandardLibrary) {
        if (node.type === 'table' && node.tableName) {
          tables.add(node.tableName)
        } else if (node.type === 'field' && node.tableName && node.fieldName) {
          const fieldKey = `${node.tableName}.${node.fieldName}`
          fields.add(fieldKey)
        }
      }

      if (node.children && node.children.length > 0) {
        traverseTree(node.children, nodeCategory)
      }
    })
  }

  traverseTree(treeData)

  // 更新可用选项
  availableTableOptions.value = Array.from(tables).map((tableName) => {
    const tableInfo = getTableInfo(tableName)
    return {
      value: tableName,
      label: tableInfo ? `${tableInfo.chineseName}(${tableName})` : tableName
    }
  })

  availableFieldOptions.value = Array.from(fields).map((fieldKey) => {
    const fieldInfo = getFieldInfo(fieldKey)
    return {
      value: fieldKey,
      label: fieldInfo ? `${fieldInfo.chineseName}(${fieldKey})` : fieldKey
    }
  })

  console.log('提取到的表选项:', availableTableOptions.value)
  console.log('提取到的字段选项:', availableFieldOptions.value)
}

const loadFunctions = async () => {
  try {
    const data = await QcFunctionConfigApi.getFunctionConfigs()
    const categoryMap = new Map()
    if (data && Array.isArray(data)) {
      data.forEach((func) => {
        if (!categoryMap.has(func.functionCategory)) {
          categoryMap.set(func.functionCategory, {
            name: getCategoryName(func.functionCategory),
            functions: []
          })
        }
        categoryMap.get(func.functionCategory).functions.push(func)
      })
    }
    functionCategories.value = Array.from(categoryMap.values())
  } catch (error) {
    console.error('加载函数库失败:', error)
    ElMessage.error('加载函数库失败')
  }
}

const loadOperators = async () => {
  try {
    const data = await QcOperatorConfigApi.getOperatorConfigs()
    const categoryMap = new Map()
    if (data && Array.isArray(data)) {
      data.forEach((operator) => {
        if (!categoryMap.has(operator.operatorCategory)) {
          categoryMap.set(operator.operatorCategory, {
            name: getCategoryName(operator.operatorCategory),
            operators: []
          })
        }
        categoryMap.get(operator.operatorCategory).operators.push(operator)
      })
    }

    if (!categoryMap.has('APPROXIMATION')) {
      categoryMap.set('APPROXIMATION', {
        name: '近似比较',
        operators: []
      })
    }

    const approximationCategory = categoryMap.get('APPROXIMATION')
    approximationCategory.operators.push(
      {
        id: 'approx_equal',
        operatorSymbol: '≈',
        chineseName: '近似等于',
        operatorCategory: 'APPROXIMATION',
        supportsTolerance: true
      },
      {
        id: 'not_approx_equal',
        operatorSymbol: '≉',
        chineseName: '不近似等于',
        operatorCategory: 'APPROXIMATION',
        supportsTolerance: true
      }
    )

    operatorCategories.value = Array.from(categoryMap.values())
  } catch (error) {
    console.error('加载操作符失败:', error)
    ElMessage.error('加载操作符失败')
  }
}

// 加载表和字段元数据映射
const loadTableAndFieldMetadata = async () => {
  try {
    // 1. 加载表元数据
    const tableData = await QcBuilderTableMetadataApi.getQcBuilderTablesByCategory(null)
    // 构建表名到中文名的映射
    const tableMapping: Record<string, string> = {}
    if (tableData && Array.isArray(tableData)) {
      tableData.forEach((table) => {
        if (table.tableName && table.chineseName) {
          tableMapping[table.tableName] = table.chineseName
        }
      })
    }
    tableMetadataMap.value = tableMapping

    // 2. 加载字段元数据
    const fieldMapping: Record<string, string> = {}
    // 为每个表加载字段信息
    for (const table of tableData || []) {
      try {
        const fieldsData = await QcBuilderTableMetadataApi.getQcBuilderTableFields(table.id)
        if (fieldsData && Array.isArray(fieldsData)) {
          fieldsData.forEach((field) => {
            if (field.fieldName && field.chineseName && table.tableName) {
              const key = `${table.tableName}.${field.fieldName}`
              fieldMapping[key] = field.chineseName
            }
          })
        }
      } catch (error) {
        console.warn(`加载表${table.tableName}的字段失败:`, error)
      }
    }
    fieldMetadataMap.value = fieldMapping

    console.log('表元数据映射:', tableMapping)
    console.log('字段元数据映射:', fieldMapping)
  } catch (error) {
    console.error('加载表和字段元数据失败:', error)
  }
}

const loadRuleData = async (ruleId) => {
  try {
    console.log('开始加载规则数据，规则ID:', ruleId)
    const data = await getQcRule(ruleId)
    console.log('获取到规则数据:', data)

    // 确保 ruleType 为数字类型，避免单选框回显问题
    if (data.ruleType) {
      data.ruleType = Number(data.ruleType)
    }

    Object.assign(ruleForm, data)
    console.log('规则基本信息已赋值:', ruleForm)

    if (data.conditionGroups && data.conditionGroups.length > 0) {
      console.log('开始处理条件组数据:', data.conditionGroups)
      conditionGroups.value = data.conditionGroups.map((group) => ({
        ...group,
        tableType: group.tableType
          ? typeof group.tableType === 'string'
            ? group.tableType.split(',').filter(Boolean)
            : group.tableType
          : [], // 解析自动检测的适用表字段
        expressionComponents: parseExpressionJson(group.expressionJson) || []
      }))
      activeGroupIndex.value = 0
      console.log('条件组数据处理完成:', conditionGroups.value)

      // 加载后检测表和字段
      detectTablesAndFields()
    } else {
      console.log('没有条件组数据')
    }
  } catch (error) {
    console.error('加载规则数据失败:', error)
    ElMessage.error('加载规则数据失败')
  }
}

// 条件组操作
const addConditionGroup = () => {
  const currentMaxPriority =
    conditionGroups.value.length > 0 ? Math.max(...conditionGroups.value.map((g) => g.priority)) : 0

  const newGroup = {
    id: Date.now(),
    groupName: `条件组 ${conditionGroups.value.length + 1}`,
    priority: currentMaxPriority + 1, // 优先级增长1，留出调整空间
    executeAction: 'RECORD_ERROR',
    errorMessageTemplate: '',
    description: '',
    tableType: [], // 自动检测的适用表字段，初始为空数组
    expressionComponents: [],
    compilationResult: null
  }

  if (isDescendingOrder.value) {
    // 降序：在数组顶部添加
    conditionGroups.value.unshift(newGroup)
    activeGroupIndex.value = 0
  } else {
    // 正序：在数组底部添加
    conditionGroups.value.push(newGroup)
    activeGroupIndex.value = conditionGroups.value.length - 1
  }
}

const removeGroup = (index) => {
  if (conditionGroups.value.length === 1) {
    ElMessage.warning('至少需要保留一个条件组')
    return
  }

  conditionGroups.value.splice(index, 1)
  // 不需要更新优先级，优先级不再是连续的
  if (activeGroupIndex.value >= index) {
    activeGroupIndex.value = Math.max(0, activeGroupIndex.value - 1)
  }
}

const duplicateGroup = (index) => {
  const originalGroup = conditionGroups.value[index]
  if (!originalGroup) return

  const newGroup = {
    ...originalGroup,
    id: Date.now(),
    groupName: `${originalGroup.groupName} (副本)`,
    priority: originalGroup.priority + 1, // 优先级略高一些
    tableType: originalGroup.tableType ? [...originalGroup.tableType] : [], // 复制自动检测的适用表字段
    expressionComponents: JSON.parse(JSON.stringify(originalGroup.expressionComponents || []))
  }

  if (isDescendingOrder.value) {
    // 降序：在当前组的上方插入新组
    conditionGroups.value.splice(index, 0, newGroup)
    activeGroupIndex.value = index
  } else {
    // 正序：在当前组的下方插入新组
    conditionGroups.value.splice(index + 1, 0, newGroup)
    activeGroupIndex.value = index + 1
  }
}

// 排序方式切换
const toggleSortOrder = () => {
  isDescendingOrder.value = !isDescendingOrder.value

  // 根据排序方式重新排序条件组
  conditionGroups.value.sort((a, b) => {
    if (isDescendingOrder.value) {
      return b.priority - a.priority // 降序：优先级高的在前
    } else {
      return a.priority - b.priority // 正序：优先级低的在前
    }
  })

  ElMessage.success(`已切换为${isDescendingOrder.value ? '降序' : '正序'}排序`)
}

// 条件组拖拽处理方法
const handleGroupDragStart = (event, index) => {
  draggedGroupIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', index.toString())

  // 设置拖拽数据类型为条件组，避免与其他拖拽冲突
  event.dataTransfer.setData(
    'application/condition-group',
    JSON.stringify({ type: 'condition-group', index })
  )

  // 添加拖拽样式
  const draggedElement = event.currentTarget
  draggedElement.style.opacity = '0.5'

  // 设置拖拽图像
  const dragImage = draggedElement.cloneNode(true)
  dragImage.style.opacity = '0.8'
  dragImage.style.transform = 'rotate(2deg)'
  document.body.appendChild(dragImage)
  event.dataTransfer.setDragImage(dragImage, 0, 0)

  setTimeout(() => {
    document.body.removeChild(dragImage)
  }, 100)
}

const handleGroupDragOver = (event, index) => {
  event.preventDefault()
  const draggedIndex = draggedGroupIndex.value

  if (draggedIndex !== -1 && draggedIndex !== index) {
    event.dataTransfer.dropEffect = 'move'

    // 添加视觉反馈
    const targetElement = event.currentTarget
    const rect = targetElement.getBoundingClientRect()
    const mouseY = event.clientY
    const elementY = rect.top + rect.height / 2

    // 清除之前的样式
    document.querySelectorAll('.condition-group').forEach((el) => {
      el.classList.remove('drag-over-top', 'drag-over-bottom')
    })

    // 根据鼠标位置决定显示插入的位置
    if (mouseY < elementY) {
      targetElement.classList.add('drag-over-top')
    } else {
      targetElement.classList.add('drag-over-bottom')
    }
  }
}

const handleGroupDrop = (event, targetIndex) => {
  event.preventDefault()
  event.stopPropagation()

  const draggedIndex = draggedGroupIndex.value

  // 只处理条件组的拖拽
  const conditionGroupData = event.dataTransfer.getData('application/condition-group')
  if (!conditionGroupData) return

  if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
    const rect = event.currentTarget.getBoundingClientRect()
    const mouseY = event.clientY
    const elementY = rect.top + rect.height / 2

    let newIndex = targetIndex

    // 根据鼠标位置决定插入位置
    if (mouseY >= elementY) {
      newIndex = targetIndex + 1
    }

    // 调整数组顺序
    const movedGroup = conditionGroups.value.splice(draggedIndex, 1)[0]
    const insertIndex = draggedIndex < newIndex ? newIndex - 1 : newIndex
    conditionGroups.value.splice(insertIndex, 0, movedGroup)

    // 不需要更新优先级，保持原有的优先级值

    // 更新活跃索引
    activeGroupIndex.value = insertIndex

    ElMessage.success('条件组顺序调整成功')
  }

  // 清理拖拽状态
  handleGroupDragEnd(event)
}

const handleGroupDragEnd = (event) => {
  draggedGroupIndex.value = -1

  // 清除所有视觉反馈
  document.querySelectorAll('.condition-group').forEach((el) => {
    el.classList.remove('drag-over-top', 'drag-over-bottom')
    el.style.opacity = ''
  })
}
const setActiveGroup = (index) => {
  activeGroupIndex.value = index
}
// 判断节点是否可拖拽
const isDraggableNode = (node) => {
  if (!node || !node.data) return false
  const nodeType = node.data.type
  return nodeType === 'table' || nodeType === 'field'
}

// 拖拽处理
const handleDragStart = (event, node) => {
  if (!node || !node.data) return

  if (!isDraggableNode(node)) {
    event.preventDefault()
    return
  }

  // 如果是字段节点但没有表名，尝试从父节点获取
  let nodeData = { ...node.data }
  if (nodeData.type === 'field' && !nodeData.tableName && node.parent && node.parent.data) {
    nodeData.tableName = node.parent.data.tableName || node.parent.data.tableCode
  }

  const dragData = {
    type: 'datasource',
    nodeType: nodeData.type,
    data: nodeData
  }

  event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  globalDragData.value = dragData
  isDragging.value = true
  document.body.classList.add('dragging')

  setTimeout(() => {
    isDragging.value = false
    globalDragData.value = null
    document.body.classList.remove('dragging')
  }, 3000)
}

const handleFunctionDragStart = (event, func) => {
  const dragData = {
    type: 'function',
    data: func
  }

  event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  event.dataTransfer.effectAllowed = 'copy'

  globalDragData.value = dragData
  isDragging.value = true
  document.body.classList.add('dragging')

  nextTick(() => {
    document.body.classList.add('dragging')
  })
}

const handleOperatorDragStart = (event, operator) => {
  const dragData = {
    type: 'operator',
    data: operator
  }

  event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  event.dataTransfer.effectAllowed = 'copy'

  globalDragData.value = dragData
  isDragging.value = true
  document.body.classList.add('dragging')

  nextTick(() => {
    document.body.classList.add('dragging')
  })
}

const handleDrop = (event, groupId) => {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')

  try {
    const dragDataString = event.dataTransfer.getData('application/json')

    if (!dragDataString || dragDataString.trim() === '') {
      console.warn('拖拽数据为空')
      return
    }

    const dragData = JSON.parse(dragDataString)
    const group = conditionGroups.value.find((g) => g.id === groupId)

    if (!group) {
      console.warn('未找到目标条件组')
      return
    }

    if (!group.expressionComponents) {
      group.expressionComponents = []
    }

    let component = null

    switch (dragData.type) {
      case 'datasource':
        if (dragData.nodeType === 'field') {
          // 如果没有表名，尝试从字段名中推断或使用默认值
          let tableName = dragData.data.tableName
          if (!tableName && dragData.data.fieldName) {
            // 如果字段名包含点号，提取表名部分
            if (dragData.data.fieldName.includes('.')) {
              const parts = dragData.data.fieldName.split('.')
              tableName = parts[0]
            } else {
              // 使用默认表名或根据上下文推断
              tableName = 'CATALOG_DEFAULT' // 可以根据实际情况调整
            }
          }

          const fieldKey = `${tableName}.${dragData.data.fieldName}`

          component = {
            type: 'field',
            value: fieldKey,
            label: dragData.data.label || fieldKey,
            dataType: dragData.data.dataType || dragData.data.fieldType || '',
            tableName: tableName,
            fieldName: dragData.data.fieldName
          }
        } else if (dragData.nodeType === 'table') {
          component = {
            type: 'table',
            value: dragData.data.tableName || '',
            label: dragData.data.label || '',
            tableName: dragData.data.tableName
          }
        }
        break

      case 'function':
        const functionReturnOptions = getFunctionReturns(dragData.data)
        component = {
          type: 'function',
          value: dragData.data.functionName || '',
          label: dragData.data.chineseName || dragData.data.displayName || '',
          parameters: generateParametersFromConfig(dragData.data), // 自动生成参数
          config: dragData.data,
          returnOptions: functionReturnOptions,
          selectedReturn:
            functionReturnOptions.length > 0 ? functionReturnOptions[0].name : 'result'
        }
        break

      case 'operator':
        component = {
          type: 'operator',
          value: dragData.data.operatorSymbol || '',
          label: dragData.data.chineseName || dragData.data.displayName || '',
          config: dragData.data,
          showTolerance: dragData.data.supportsTolerance || false,
          tolerance: dragData.data.supportsTolerance ? '±0.1' : undefined
        }
        break

      default:
        console.warn('未知的拖拽类型:', dragData.type)
        return
    }

    if (component && component.value) {
      group.expressionComponents.push(component)
      detectTablesAndFields() // 添加组件后检测表和字段

      // 单独更新条件组的适用表
      nextTick(() => {
        updateConditionGroupTableTypes()
      })

      console.log('成功添加组件:', component)
      ElMessage.success(`已添加${component.label || component.value}`)
    } else {
      console.warn('创建组件失败，数据不完整:', dragData)
      ElMessage.warning('拖拽失败：数据不完整')
    }
  } catch (error) {
    console.error('拖拽数据解析失败:', error)
    ElMessage.error('拖拽失败：数据解析错误')
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  event.currentTarget.classList.add('drag-over')
}

const handleDragLeave = (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove('drag-over')
  }
}

// 字段数组拖拽处理
const handleFieldArrayDrop = (event, param) => {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')

  try {
    const dragDataString = event.dataTransfer.getData('application/json')
    if (!dragDataString || dragDataString.trim() === '') {
      console.warn('拖拽数据为空')
      return
    }

    const dragData = JSON.parse(dragDataString)

    // 只处理字段拖拽
    if (dragData.type === 'datasource' && dragData.nodeType === 'field') {
      if (!param.selectedFields) {
        param.selectedFields = []
      }

      // 检查是否已存在该字段（避免重复）
      const fieldKey = `${dragData.data.tableName || 'CATALOG_DEFAULT'}.${dragData.data.fieldName}`
      const exists = param.selectedFields.some(
        (field) =>
          field.fieldKey === fieldKey ||
          (field.fieldName === dragData.data.fieldName &&
            field.tableName === dragData.data.tableName)
      )

      if (exists) {
        ElMessage.warning('该字段已存在，不能重复添加')
        return
      }

      // 添加字段到数组
      const field = {
        fieldKey: fieldKey,
        fieldName: dragData.data.fieldName,
        tableName: dragData.data.tableName || 'CATALOG_DEFAULT',
        label:
          dragData.data.label ||
          `${dragData.data.tableName || 'CATALOG_DEFAULT'}.${dragData.data.fieldName}`,
        dataType: dragData.data.dataType || dragData.data.fieldType || '',
        value: fieldKey
      }

      param.selectedFields.push(field)
      updateParameterDisplay(param)

      ElMessage.success('字段添加成功')
    } else {
      ElMessage.warning('只支持拖拽字段类型')
    }
  } catch (error) {
    console.error('字段数组拖拽失败:', error)
    ElMessage.error('拖拽失败：数据解析错误')
  }
}

const handleFieldArrayDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  event.currentTarget.classList.add('drag-over')
}

const handleFieldArrayDragLeave = (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove('drag-over')
  }
}

// 单个参数拖拽处理方法
const handleSingleParamDrop = (event, param, paramType) => {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')

  try {
    const dragDataString = event.dataTransfer.getData('application/json')
    if (!dragDataString || dragDataString.trim() === '') {
      console.warn('拖拽数据为空')
      return
    }

    const dragData = JSON.parse(dragDataString)

    // 只处理数据源拖拽
    if (dragData.type === 'datasource') {
      if (paramType === 'table' && dragData.nodeType === 'table') {
        // 处理表拖拽 - 直接使用拖拽数据创建表选项，不限制标准库表
        const tableValue = dragData.data.tableName || dragData.data.value
        const tableOption = {
          value: tableValue,
          label: dragData.data.label || tableValue,
          type: 'table'
        }
        param.selectedTable = tableOption
        param.value = tableValue
        updateParameterDisplay(param)
        ElMessage.success(`已选择表: ${tableOption.label}`)
      } else if (paramType === 'field' && dragData.nodeType === 'field') {
        // 处理字段拖拽 - 直接使用拖拽数据创建字段选项，不限制标准库字段
        let tableName = dragData.data.tableName
        if (!tableName && dragData.data.fieldName) {
          if (dragData.data.fieldName.includes('.')) {
            const parts = dragData.data.fieldName.split('.')
            tableName = parts[0]
          } else {
            tableName = 'CATALOG_DEFAULT'
          }
        }

        const fieldKey = `${tableName}.${dragData.data.fieldName}`
        const fieldOption = {
          value: fieldKey,
          label: dragData.data.label || fieldKey,
          type: 'field'
        }
        param.selectedField = fieldOption
        param.value = fieldKey
        updateParameterDisplay(param)
        ElMessage.success(`已选择字段: ${fieldOption.label}`)
      } else {
        ElMessage.warning(`请拖拽正确的${paramType === 'table' ? '表' : '字段'}类型`)
      }
    }
  } catch (error) {
    console.error('单个参数拖拽失败:', error)
    ElMessage.error('拖拽失败：数据解析错误')
  }
}

const handleSingleParamDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  event.currentTarget.classList.add('drag-over')
}

const handleSingleParamDragLeave = (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove('drag-over')
  }
}

// 清除单个参数的选中值
const clearSingleParam = (param) => {
  if (param.type === 'table') {
    param.selectedTable = null
    param.value = ''
    param.displayValue = '选择表'
  } else if (param.type === 'field') {
    param.selectedField = null
    param.value = ''
    param.displayValue = '选择字段'
  }
  updateParameterDisplay(param)
}

// 从字段数组中移除字段
const removeFieldFromArray = (param, fieldIndex) => {
  if (param.selectedFields && fieldIndex >= 0 && fieldIndex < param.selectedFields.length) {
    param.selectedFields.splice(fieldIndex, 1)
    updateParameterDisplay(param)
  }
}

// 工具方法
const getNodeIcon = (data) => {
  if (!data) return 'ep:document'
  if (data.icon) return data.icon

  switch (data.type) {
    case 'category':
      return 'fa-solid:database'
    case 'table':
      return 'ep:grid'
    case 'field':
      return 'ep:key'
    default:
      return 'ep:document'
  }
}

const getComponentIcon = (component) => {
  if (!component) return 'ep:document'

  switch (component.type) {
    case 'field':
      return 'ep:key'
    case 'table':
      return 'ep:grid'
    case 'function':
      return 'ep:cpu'
    case 'operator':
      return 'ep:operation'
    default:
      return 'ep:document'
  }
}

const getComponentDisplayText = (component) => {
  if (!component) return ''

  switch (component.type) {
    case 'function':
      return (
        component.label ||
        component.config?.chineseName ||
        component.config?.functionName ||
        component.value ||
        ''
      )
    case 'operator':
      return component.label || component.config?.chineseName || component.value || ''
    case 'field':
      return component.label || ''
    case 'table':
      return component.label || ''
    default:
      return component.label || component.value || ''
  }
}

const getFunctionLevelType = (level) => {
  const types = { RECORD_LEVEL: 'info', AGGREGATE_LEVEL: 'warning', MIXED_LEVEL: 'danger' }
  return types[level] || 'info'
}

const getFunctionLevelText = (level) => {
  const texts = {
    RECORD_LEVEL: '记录维度',
    AGGREGATE_LEVEL: '聚合维度',
    MIXED_LEVEL: '混合维度'
  }
  return texts[level] || ''
}

const getActionType = (action) => {
  const types = {
    RECORD_ERROR: 'danger',
    INTERRUPT: 'danger',
    MARK_ANOMALY: 'warning',
    WARNING: 'warning',
    SKIP: 'info'
  }
  return types[action] || ''
}

const getActionText = (action) => {
  const texts = {
    RECORD_ERROR: '记录错误',
    INTERRUPT: '直接中断',
    MARK_ANOMALY: '标记异常',
    WARNING: '警告',
    SKIP: '跳过'
  }
  return texts[action] || action
}

const getReturnTypeDisplayName = (type) => {
  const typeNames = {
    STRING: '字符串',
    NUMBER: '数值',
    BOOLEAN: '布尔值',
    DATE: '日期',
    ARRAY: '数组',
    OBJECT: '对象'
  }
  return typeNames[type] || type
}

const getCategoryName = (category) => {
  const names = {
    STATISTICS: '统计函数',
    STRING: '字符串函数',
    NULL_CHECK: '空值检查',
    NUMERIC: '数值函数',
    TIME: '时间函数',
    ANALYSIS: '分析函数',
    COMPARISON: '比较操作符',
    LOGICAL: '逻辑操作符',
    SET: '集合操作符',
    PATTERN: '模式匹配',
    ARITHMETIC: '算术操作符',
    RANGE: '范围操作符',
    APPROXIMATION: '近似比较',
    CUSTOM: '自定义函数'
  }
  return names[category] || category
}

// 其他方法
const refreshDataSource = () => loadDataSource()
const refreshFunctions = () => loadFunctions()

const filterDataSourceNode = (value, data) => {
  if (!value || !data) return true
  return (
    data.label.includes(value) ||
    (data.tableName && data.tableName.includes(value)) ||
    (data.fieldName && data.fieldName.includes(value))
  )
}

const handleFunctionClick = (func) => {
  console.log('函数点击:', func)

  // 如果函数有返回值选项，需要通过抽屉配置
  const returnOptions = getFunctionReturns(func)
  if (returnOptions.length > 0) {
    // 创建临时函数组件用于配置
    const tempComponent = {
      type: 'function',
      value: func.functionName || '',
      label: func.chineseName || func.displayName || '',
      parameters: generateParametersFromConfig(func), // 自动生成参数
      config: func,
      returnOptions: returnOptions,
      selectedReturn: returnOptions[0].name // 默认选择第一项
    }

    activeTab.value = 'datasource'
    currentEditFunction.value = {
      component: tempComponent,
      groupId: null,
      componentIndex: -1,
      isNewFunction: true
    }
    showCombinedDrawer.value = true
  }
}

// 组件编辑处理
const editComponent = (groupId, compIndex) => {
  const group = conditionGroups.value.find((g) => g.id === groupId)
  if (group && group.expressionComponents && group.expressionComponents[compIndex]) {
    const component = group.expressionComponents[compIndex]

    if (component.type === 'function') {
      // 设置默认激活tab为数据源
      activeTab.value = 'datasource'

      // 确保有返回值选项时默认选择第一项
      if (
        component.returnOptions &&
        component.returnOptions.length > 0 &&
        !component.selectedReturn
      ) {
        component.selectedReturn = component.returnOptions[0].name
      }

      currentEditFunction.value = {
        component: component,
        groupId: groupId,
        componentIndex: compIndex
      }
      showCombinedDrawer.value = true
      return
    }

    if (component.value === '≈' || component.value === '≉') {
      component.showTolerance = !component.showTolerance
      if (component.showTolerance && !component.tolerance) {
        component.tolerance = '±0.1'
      }
    }
  }
}

// 解析函数参数配置
const getFunctionParams = (func) => {
  try {
    if (!func.parameterConfig) return []

    const config =
      typeof func.parameterConfig === 'string'
        ? JSON.parse(func.parameterConfig)
        : func.parameterConfig

    return config.parameters || []
  } catch (error) {
    console.error('解析函数参数失败:', error)
    return []
  }
}

// 解析函数返回值配置
const getFunctionReturns = (func) => {
  try {
    if (!func.returnConfig) return []

    const config =
      typeof func.returnConfig === 'string' ? JSON.parse(func.returnConfig) : func.returnConfig

    // 只支持新格式 {"variables": {"result": {"type": "BOOLEAN", "description": "描述"}}}
    if (config.variables && typeof config.variables === 'object') {
      return Object.entries(config.variables).map(([key, varInfo]) => ({
        name: key,
        type: (varInfo as any).type || 'STRING',
        description: (varInfo as any).description || key
      }))
    }

    return []
  } catch (error) {
    console.error('解析函数返回值失败:', error)
    return []
  }
}

const handleOperatorClick = (operator) => {
  console.log('操作符点击:', operator)
}

// 添加画布元素
const addCanvasElement = (groupId, type) => {
  const group = conditionGroups.value.find((g) => g.id === groupId)
  if (!group) return

  if (!group.expressionComponents) {
    group.expressionComponents = []
  }

  const element = createElementByType(type)
  group.expressionComponents.push(element)

  ElMessage.success(`已添加${getParameterTypeName(type)}元素`)
}

// 根据类型创建参数
const createParameterByType = (type) => {
  const baseParam = {
    id: Date.now() + Math.random(),
    type: type
  }

  switch (type) {
    case 'table':
      return {
        ...baseParam,
        value: '',
        displayValue: '表',
        selectedTable: null
      }
    case 'field':
      return {
        ...baseParam,
        value: '',
        displayValue: '字段',
        selectedField: null
      }
    case 'field[]':
      return {
        ...baseParam,
        value: [],
        displayValue: '字段组',
        selectedFields: []
      }
    case 'string':
      return {
        ...baseParam,
        value: '',
        displayValue: '字符串'
      }
    case 'number':
      return {
        ...baseParam,
        value: 0,
        displayValue: '数值'
      }
    case 'expression':
      return {
        ...baseParam,
        value: '',
        displayValue: '表达式'
      }
    default:
      return baseParam
  }
}

// 根据类型创建画布元素
const createElementByType = (type) => {
  const baseElement = {
    id: Date.now() + Math.random()
  }

  switch (type) {
    case 'number':
      return {
        ...baseElement,
        type: 'literal',
        subType: 'number',
        value: '0',
        label: '0',
        numericValue: 0
      }
    case 'text':
      return {
        ...baseElement,
        type: 'literal',
        subType: 'text',
        value: '""',
        label: '字符串',
        textValue: ''
      }
    case 'boolean':
      return {
        ...baseElement,
        type: 'literal',
        subType: 'boolean',
        value: 'true',
        label: 'true',
        booleanValue: true
      }
    default:
      return baseElement
  }
}

// 获取参数类型名称
const getParameterTypeName = (type) => {
  const names = {
    table: '表',
    field: '字段',
    'field[]': '字段数组',
    string: '字符串',
    number: '数值',
    expression: '表达式'
  }
  return names[type] || type
}

// 根据函数配置自动生成参数
const generateParametersFromConfig = (functionConfig) => {
  const parameters = []

  try {
    const paramConfig =
      typeof functionConfig.parameterConfig === 'string'
        ? JSON.parse(functionConfig.parameterConfig)
        : functionConfig.parameterConfig

    if (paramConfig && paramConfig.parameters && Array.isArray(paramConfig.parameters)) {
      paramConfig.parameters.forEach((paramDef, index) => {
        const param = {
          id: Date.now() + Math.random() + index,
          name: paramDef.name,
          type: paramDef.type,
          required: paramDef.required || false,
          description: paramDef.description || '',
          displayValue: getDefaultDisplayValue(paramDef.type),
          value: getDefaultValue(paramDef.type)
        }

        // 处理特殊类型
        switch (paramDef.type) {
          case 'table':
            param.selectedTable = null
            break
          case 'field':
            param.selectedField = null
            break
          case 'field[]':
            param.selectedFields = []
            param.minItems = paramDef.min_items || 1
            break
        }

        parameters.push(param)
      })
    }
  } catch (error) {
    console.error('解析函数参数配置失败:', error)
  }

  return parameters
}

// 获取默认显示值
const getDefaultDisplayValue = (type) => {
  const defaults = {
    table: '表',
    field: '字段',
    'field[]': '字段组',
    string: '字符串',
    number: '0',
    expression: '表达式'
  }
  return defaults[type] || ''
}

// 获取默认值
const getDefaultValue = (type) => {
  const defaults = {
    table: '',
    field: '',
    'field[]': [],
    string: '',
    number: 0
  }
  return defaults[type] || ''
}

// 合并抽屉相关方法
const closeCombinedDrawer = () => {
  showCombinedDrawer.value = false
  currentEditFunction.value = null
  // 重置工具栏tab为默认的数据源
  activeTab.value = 'datasource'
}

// 嵌套抽屉相关方法
const closeNestedDrawer = () => {
  showNestedDrawer.value = false
  nestedEditFunction.value = null
  // 重置嵌套抽屉的tab为默认的数据源
  nestedActiveTab.value = 'datasource'
}

const addFunctionParameter = () => {
  // 参数由函数配置自动生成，不支持手动添加
  ElMessage.warning('函数参数已根据配置自动生成，无需手动添加')
}

const removeFunctionParameter = (paramIndex) => {
  // 参数由函数配置自动生成，不支持手动删除
  ElMessage.warning('函数参数由配置自动生成，不可删除')
}

const onParameterTypeChange = (param) => {
  switch (param.type) {
    case 'table':
      param.value = ''
      param.displayValue = '选择表'
      param.selectedTable = null
      break
    case 'field':
      param.value = ''
      param.displayValue = '选择字段'
      param.selectedField = null
      break
    case 'field[]':
      param.value = []
      param.displayValue = '选择字段'
      param.selectedFields = []
      break
    case 'string':
      param.value = ''
      param.displayValue = '字符串'
      break
    case 'number':
      param.value = 0
      param.displayValue = '0'
      break
    case 'expression':
      param.value = ''
      param.displayValue = '表达式'
      break
  }
}

const updateParameterDisplay = (param) => {
  switch (param.type) {
    case 'table':
      param.displayValue = param.selectedTable ? param.selectedTable.value : '选择表'
      param.value = param.selectedTable ? param.selectedTable.value : ''
      break
    case 'field':
      param.displayValue = param.selectedField ? param.selectedField.value : '选择字段'
      param.value = param.selectedField ? param.selectedField.value : ''
      break
    case 'field[]':
      if (param.selectedFields && param.selectedFields.length > 0) {
        // 显示具体的字段值，而不是"已选择N个字段"
        param.displayValue = param.selectedFields.map((f) => f.value).join(', ')
        param.value = param.selectedFields.map((f) => f.value)
      } else {
        param.displayValue = '选择字段'
        param.value = []
      }
      break
    case 'string':
      param.displayValue = param.value || '字符串'
      break
    case 'number':
      param.displayValue = String(param.value)
      break
    default:
      param.displayValue = String(param.value || '')
  }

  // 在参数更新后触发表和字段检测
  nextTick(() => {
    detectTablesAndFields()
  })
}

const saveFunctionEdit = () => {
  if (!currentEditFunction.value) return

  // 检查是否有返回值选项且未选择任何一项
  if (
    currentEditFunction.value.component.returnOptions?.length > 0 &&
    !currentEditFunction.value.component.selectedReturn
  ) {
    ElMessage.error('请选择一个返回值选项')
    return
  }

  if (currentEditFunction.value.component.parameters) {
    currentEditFunction.value.component.parameters.forEach((param) => {
      updateParameterDisplay(param)
    })
  }

  // 确保有返回值选项时至少选择了一项
  if (
    currentEditFunction.value.component.returnOptions?.length > 0 &&
    !currentEditFunction.value.component.selectedReturn
  ) {
    currentEditFunction.value.component.selectedReturn =
      currentEditFunction.value.component.returnOptions[0].name
  }

  detectTablesAndFields() // 保存函数编辑后检测表和字段(包括嵌套)

  // 同步函数参数选择的表和字段到适用表和检查字段
  syncFunctionParametersToFormData()

  ElMessage.success('函数配置已保存')
  closeCombinedDrawer()
}

const saveNestedFunctionEdit = () => {
  if (!nestedEditFunction.value) return

  // 检查是否有返回值选项且未选择任何一项
  if (
    nestedEditFunction.value.component.returnOptions?.length > 0 &&
    !nestedEditFunction.value.component.selectedReturn
  ) {
    ElMessage.error('请选择一个返回值选项')
    return
  }

  if (nestedEditFunction.value.component.parameters) {
    nestedEditFunction.value.component.parameters.forEach((param) => {
      updateParameterDisplay(param)
    })
  }

  // 确保有返回值选项时至少选择了一项
  if (
    nestedEditFunction.value.component.returnOptions?.length > 0 &&
    !nestedEditFunction.value.component.selectedReturn
  ) {
    nestedEditFunction.value.component.selectedReturn =
      nestedEditFunction.value.component.returnOptions[0].name
  }

  // 更新参数上下文的显示
  if (nestedEditFunction.value.isParameterContext && nestedEditFunction.value.parameterContext) {
    updateParameterDisplay(nestedEditFunction.value.parameterContext)
  }

  detectTablesAndFields() // 保存嵌套函数编辑后检测表和字段

  // 同步函数参数选择的表和字段到适用表和检查字段
  syncFunctionParametersToFormData()

  ElMessage.success('函数配置已保存')
  closeNestedDrawer()
}

// 同步函数参数选择的表和字段到适用表和检查字段
const syncFunctionParametersToFormData = () => {
  const additionalTables = new Set<string>()
  const additionalFields = new Set<string>()

  // 检查主抽屉中的函数参数
  if (currentEditFunction.value?.component?.parameters) {
    extractTablesAndFieldsFromParameters(
      currentEditFunction.value.component.parameters,
      additionalTables,
      additionalFields
    )
  }

  // 检查嵌套抽屉中的函数参数
  if (nestedEditFunction.value?.component?.parameters) {
    extractTablesAndFieldsFromParameters(
      nestedEditFunction.value.component.parameters,
      additionalTables,
      additionalFields
    )
  }

  // 同步到表单数据
  if (additionalTables.size > 0) {
    const existingTables = new Set(selectedTableTypes.value)
    additionalTables.forEach((table) => existingTables.add(table))
    selectedTableTypes.value = Array.from(existingTables)
  }

  if (additionalFields.size > 0) {
    const existingFields = new Set(ruleForm.checkFields)
    additionalFields.forEach((field) => existingFields.add(field))
    ruleForm.checkFields = Array.from(existingFields)
  }
}

// 从函数参数中提取表和字段
const extractTablesAndFieldsFromParameters = (
  parameters: any[],
  tables: Set<string>,
  fields: Set<string>
) => {
  parameters.forEach((param) => {
    if (param.type === 'table' && param.selectedTable?.value) {
      tables.add(param.selectedTable.value)
    } else if (param.type === 'field' && param.selectedField?.value) {
      const fieldValue = param.selectedField.value
      if (fieldValue.includes('.')) {
        const [tableName] = fieldValue.split('.')
        tables.add(tableName)
        fields.add(fieldValue)
      }
    } else if (param.type === 'field[]' && param.selectedFields?.length > 0) {
      param.selectedFields.forEach((field) => {
        if (field.value?.includes('.')) {
          const [tableName] = field.value.split('.')
          tables.add(tableName)
          fields.add(field.value)
        }
      })
    }
  })
}

// 参数拖拽相关方法
const handleParameterDrop = (event, param) => {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')

  try {
    const dragDataString = event.dataTransfer.getData('application/json')

    if (!dragDataString || dragDataString.trim() === '') {
      console.warn('拖拽数据为空')
      return
    }

    const dragData = JSON.parse(dragDataString)

    if (!param.components) {
      param.components = []
    }

    let component = null

    switch (dragData.type) {
      case 'datasource':
        if (dragData.nodeType === 'field') {
          // 如果没有表名，尝试从字段名中推断或使用默认值
          let tableName = dragData.data.tableName
          if (!tableName && dragData.data.fieldName) {
            // 如果字段名包含点号，提取表名部分
            if (dragData.data.fieldName.includes('.')) {
              const parts = dragData.data.fieldName.split('.')
              tableName = parts[0]
            } else {
              // 使用默认表名或根据上下文推断
              tableName = 'CATALOG_DEFAULT' // 可以根据实际情况调整
            }
          }

          const fieldKey = `${tableName}.${dragData.data.fieldName}`

          component = {
            type: 'field',
            value: fieldKey,
            label: dragData.data.label || fieldKey,
            dataType: dragData.data.dataType || dragData.data.fieldType || '',
            tableName: tableName,
            fieldName: dragData.data.fieldName
          }
        } else if (dragData.nodeType === 'table') {
          component = {
            type: 'table',
            value: dragData.data.tableName || '',
            label: dragData.data.label || '',
            tableName: dragData.data.tableName
          }
        }
        break

      case 'function':
        const paramFunctionReturnOptions = getFunctionReturns(dragData.data)
        component = {
          type: 'function',
          value: dragData.data.functionName || '',
          label: dragData.data.chineseName || dragData.data.displayName || '',
          parameters: generateParametersFromConfig(dragData.data), // 自动生成参数
          config: dragData.data,
          returnOptions: paramFunctionReturnOptions,
          selectedReturn:
            paramFunctionReturnOptions.length > 0 ? paramFunctionReturnOptions[0].name : 'result'
        }
        break

      case 'operator':
        component = {
          type: 'operator',
          value: dragData.data.operatorSymbol || '',
          label: dragData.data.chineseName || dragData.data.displayName || '',
          config: dragData.data,
          showTolerance: dragData.data.supportsTolerance || false,
          tolerance: dragData.data.supportsTolerance ? '±0.1' : undefined
        }
        break

      default:
        console.warn('未知的拖拽类型:', dragData.type)
        return
    }

    if (component && component.value) {
      param.components.push(component)
      updateParameterDisplay(param)
      detectTablesAndFields() // 添加组件后检测表和字段(包括嵌套)
      console.log('成功添加组件到参数:', component)
      ElMessage.success(`已添加${component.label || component.value}`)
    } else {
      console.warn('创建组件失败，数据不完整:', dragData)
      ElMessage.warning('拖拽失败：数据不完整')
    }
  } catch (error) {
    console.error('拖拽数据解析失败:', error)
    ElMessage.error('拖拽失败：数据解析错误')
  }
}

const handleParameterDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  event.currentTarget.classList.add('drag-over')
}

const handleParameterDragLeave = (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove('drag-over')
  }
}

const clearParameter = (param) => {
  param.value = ''
  param.displayValue = '表达式'
  param.nested = false
  param.nestingLevel = 0
  param.components = []
  param.compilationResult = null
}
// 处理参数表达式的拖拽放置
const handleParameterExpressionDrop = (event, param) => {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')

  try {
    const dragDataString = event.dataTransfer.getData('application/json')

    if (!dragDataString || dragDataString.trim() === '') {
      console.warn('拖拽数据为空')
      return
    }

    const dragData = JSON.parse(dragDataString)

    if (!param.expressionComponents) {
      param.expressionComponents = []
    }

    let component = null

    switch (dragData.type) {
      case 'datasource':
        if (dragData.nodeType === 'field') {
          let tableName = dragData.data.tableName
          if (!tableName && dragData.data.fieldName) {
            if (dragData.data.fieldName.includes('.')) {
              const parts = dragData.data.fieldName.split('.')
              tableName = parts[0]
            } else {
              tableName = 'CATALOG_DEFAULT'
            }
          }

          const fieldKey = `${tableName}.${dragData.data.fieldName}`

          component = {
            type: 'field',
            value: fieldKey,
            label: dragData.data.label || fieldKey,
            dataType: dragData.data.dataType || dragData.data.fieldType || '',
            tableName: tableName,
            fieldName: dragData.data.fieldName
          }
        } else if (dragData.nodeType === 'table') {
          component = {
            type: 'table',
            value: dragData.data.tableName || '',
            label: dragData.data.label || '',
            tableName: dragData.data.tableName
          }
        }
        break

      case 'function':
        const functionReturnOptions = getFunctionReturns(dragData.data)
        component = {
          type: 'function',
          value: dragData.data.functionName || '',
          label: dragData.data.chineseName || dragData.data.displayName || '',
          parameters: generateParametersFromConfig(dragData.data),
          config: dragData.data,
          returnOptions: functionReturnOptions,
          selectedReturn:
            functionReturnOptions.length > 0 ? functionReturnOptions[0].name : 'result'
        }
        break

      case 'operator':
        component = {
          type: 'operator',
          value: dragData.data.operatorSymbol || '',
          label: dragData.data.chineseName || dragData.data.displayName || '',
          config: dragData.data,
          showTolerance: dragData.data.supportsTolerance || false,
          tolerance: dragData.data.supportsTolerance ? '±0.1' : undefined
        }
        break

      default:
        console.warn('未知的拖拽类型:', dragData.type)
        return
    }

    if (component && component.value) {
      param.expressionComponents.push(component)
      updateParameterDisplay(param)
      detectTablesAndFields()

      console.log('成功添加组件到参数表达式:', component)
      ElMessage.success(`已添加${component.label || component.value}`)
    } else {
      console.warn('创建组件失败，数据不完整:', dragData)
      ElMessage.warning('拖拽失败：数据不完整')
    }
  } catch (error) {
    console.error('拖拽数据解析失败:', error)
    ElMessage.error('拖拽失败：数据解析错误')
  }
}

const handleParameterExpressionDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  event.currentTarget.classList.add('drag-over')
}

const handleParameterExpressionDragLeave = (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove('drag-over')
  }
}
// 解析嵌套表达式以便可视化显示
const parseNestedExpression = (expression) => {
  if (!expression) return []

  const parts = []
  let level = 0
  let currentPart = ''
  let inFunction = false

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i]

    if (char === '(') {
      if (currentPart.trim()) {
        parts.push({
          text: currentPart.trim(),
          level: level,
          isFunction: true,
          isField: false
        })
        currentPart = ''
      }
      parts.push({
        text: '(',
        level: level,
        isFunction: false,
        isField: false
      })
      level++
      inFunction = true
    } else if (char === ')') {
      if (currentPart.trim()) {
        parts.push({
          text: currentPart.trim(),
          level: level,
          isFunction: false,
          isField: currentPart.includes('.')
        })
        currentPart = ''
      }
      level--
      parts.push({
        text: ')',
        level: level,
        isFunction: false,
        isField: false
      })
      inFunction = false
    } else if (char === ',' || char === ' ') {
      if (currentPart.trim()) {
        parts.push({
          text: currentPart.trim(),
          level: level,
          isFunction: false,
          isField: currentPart.includes('.')
        })
        currentPart = ''
      }
      if (char === ',') {
        parts.push({
          text: ',',
          level: level,
          isFunction: false,
          isField: false
        })
      }
    } else {
      currentPart += char
    }
  }

  if (currentPart.trim()) {
    parts.push({
      text: currentPart.trim(),
      level: level,
      isFunction: !inFunction && !currentPart.includes('.'),
      isField: currentPart.includes('.')
    })
  }

  return parts.filter((part) => part.text.trim() !== '')
}

// 字面量类型判断方法
const isNumberLiteral = (component) => {
  return (
    component.subType === 'number' ||
    (component.label === '数值' && component.value !== 'true' && component.value !== 'false')
  )
}

const isTextLiteral = (component) => {
  return component.subType === 'text' || component.label === '字符串'
}

const isBooleanLiteral = (component) => {
  return (
    component.subType === 'boolean' ||
    component.label === '布尔值' ||
    component.value === 'true' ||
    component.value === 'false'
  )
}

// 更新字面量值
const updateLiteralValue = (component, value) => {
  if (component.subType === 'number') {
    component.numericValue = value
    component.value = String(value)
    component.label = String(value)
  } else if (component.subType === 'text') {
    component.textValue = value
    component.value = `"${value}"`
    component.label = value || '字符串'
  } else if (component.subType === 'boolean') {
    component.booleanValue = value
    component.value = String(value)
    component.label = String(value)
  }
}

const removeComponent = (groupId, compIndex) => {
  const group = conditionGroups.value.find((g) => g.id === groupId)
  if (group && group.expressionComponents) {
    group.expressionComponents.splice(compIndex, 1)
    detectTablesAndFields() // 删除组件后检测表和字段

    // 单独更新条件组的适用表
    nextTick(() => {
      updateConditionGroupTableTypes()
    })
  }
}

const generateExpressionText = (components) => {
  if (!components || !Array.isArray(components)) return ''

  return components
    .map((comp) => {
      if (comp.type === 'function') {
        const params = comp.parameters
          ? comp.parameters
              .map((p) => {
                // 如果参数有表达式组件，递归生成表达式文本
                if (
                  p.type === 'expression' &&
                  p.expressionComponents &&
                  p.expressionComponents.length > 0
                ) {
                  return generateExpressionText(p.expressionComponents)
                }
                return p.displayValue || p.value || p.type
              })
              .join(', ')
          : ''

        const returnSuffix =
          comp.selectedReturn && comp.selectedReturn !== 'result'
            ? `.${comp.selectedReturn}`
            : '.result'

        return `${comp.value}(${params})${returnSuffix}`
      } else if (comp.type === 'operator' && comp.tolerance) {
        return `${comp.value}(${comp.tolerance})`
      } else if (comp.type === 'literal') {
        return comp.value || comp.label || ''
      } else if (comp.type === 'field') {
        // 保持原有格式，直接返回 value 值
        return comp.value || comp.label || ''
      }
      return comp.value || comp.label || ''
    })
    .join(' ')
}

const compileExpression = async (group) => {
  try {
    const expressionJson = {
      type: 'expression',
      components: group.expressionComponents || []
    }

    const data = await QcExpressionApi.compileRuleExpression({
      expressionJson,
      checkDimension: ruleForm.checkDimension // 传递规则的检查维度
    })

    group.compilationResult = {
      isValid: data.isValid,
      message: data.isValid
        ? '表达式语法正确'
        : data.errors && data.errors.length > 0
          ? data.errors.map((err) => err.errorDescription).join('; ')
          : '编译失败',
      sqlExpression: data.sqlExpression // 保存SQL表达式
    }
  } catch (error) {
    group.compilationResult = {
      isValid: false,
      message: '编译失败: ' + error.message
    }
  }
}

const parseExpressionJson = (expressionJson) => {
  try {
    if (typeof expressionJson === 'string') {
      return JSON.parse(expressionJson).components || []
    }
    return expressionJson?.components || []
  } catch (error) {
    console.error('解析表达式JSON失败:', error)
    return []
  }
}

// 头部事件处理
const handleBack = () => {
  router.push('/drug-qc/rule')
}

const handleHeaderAction = (action: any) => {
  switch (action.key) {
    case 'preview':
      handlePreview()
      break
    case 'test':
      handleTest()
      break
    case 'draft':
      handleSaveDraft()
      break
    case 'save':
      handleSave()
      break
  }
}

// 规则类型变化处理
const handleRuleTypeChange = (value: number) => {
  ruleCodePrefix.value = value === 1 ? 'PRE_QC' : 'POST_QC'
  updateRuleCode()
}

// 编码前缀变化处理
const handlePrefixChange = (prefix: string) => {
  ruleForm.ruleType = prefix === 'PRE_QC' ? 1 : 2
  updateRuleCode()
}

// 更新规则编码
const updateRuleCode = async () => {
  if (!isEdit.value) {
    try {
      // 获取当前类型的最大编号和最大优先级
      const prefix = ruleCodePrefix.value
      const maxInfo = await getMaxRuleInfo(prefix)
      const nextNumber = String(maxInfo.maxNumber + 1).padStart(3, '0')
      ruleForm.ruleCode = `${prefix}_${nextNumber}`
      // 自动填入最大优先级 + 1
      ruleForm.priority = maxInfo.maxPriority + 1
    } catch (error) {
      console.error('生成规则编码失败:', error)
      // 降级方案：使用时间戳
      const timestamp = Date.now().toString().slice(-6)
      ruleForm.ruleCode = `${ruleCodePrefix.value}_${timestamp}`
      // 降级时仍然尝试设置合理的优先级
      ruleForm.priority = 100
    }
  }
}

// 预览和测试对话框状态
const showPreviewDialog = ref(false)
const showTestDialog = ref(false)

// 主要操作方法
const handlePreview = () => {
  showPreviewDialog.value = true
}

const handleTest = () => {
  showTestDialog.value = true
}

// 处理预览保存
const handlePreviewSave = () => {
  // 预览后确认保存逻辑
  ElMessage.success('预览确认，即将保存规则')
  // 可以在这里调用保存逻辑
}

// 处理测试应用
const handleTestApply = (testResult: any) => {
  ElMessage.success('测试通过，规则已验证')
  console.log('测试结果:', testResult)
}

// 递归分析组件，提取所有函数、表和字段
const analyzeComponentRecursively = (
  component: any,
  functionsUsed: Set<string>,
  tablesUsed: Set<string>,
  fieldsUsed: Set<string>,
  functionsWithConfig: Map<string, any>
) => {
  if (!component) return

  if (component.type === 'function') {
    functionsUsed.add(component.value)
    // 保存函数配置信息，以便后续生成返回值变量
    if (component.config) {
      functionsWithConfig.set(component.value, component.config)
    }

    // 递归分析函数参数
    if (component.parameters) {
      component.parameters.forEach((param: any) => {
        // 检查参数选择的表和字段
        if (param.type === 'table' && param.selectedTable?.value) {
          tablesUsed.add(param.selectedTable.value)
        } else if (param.type === 'field' && param.selectedField?.value) {
          const fieldValue = param.selectedField.value
          if (fieldValue.includes('.')) {
            const [tableName, fieldName] = fieldValue.split('.')
            if (tableName && fieldName) {
              tablesUsed.add(tableName)
              fieldsUsed.add(fieldValue)
            }
          }
        } else if (param.type === 'field[]' && param.selectedFields?.length > 0) {
          param.selectedFields.forEach((field: any) => {
            if (field.value?.includes('.')) {
              const [tableName, fieldName] = field.value.split('.')
              if (tableName && fieldName) {
                tablesUsed.add(tableName)
                fieldsUsed.add(field.value)
              }
            }
          })
        }

        // 检查参数的嵌套组件
        if (param.components) {
          param.components.forEach((subComp: any) => {
            analyzeComponentRecursively(
              subComp,
              functionsUsed,
              tablesUsed,
              fieldsUsed,
              functionsWithConfig
            )
          })
        }
      })
    }
  } else if (component.type === 'field') {
    // 处理字段组件，支持两种格式：
    // 1. 有单独的 tableName 和 fieldName 属性
    // 2. 只有 value 属性，格式为 "表名.字段名"
    if (component.tableName && component.fieldName) {
      tablesUsed.add(component.tableName)
      fieldsUsed.add(`${component.tableName}.${component.fieldName}`)
    } else if (component.value && component.value.includes('.')) {
      // 解析 value 格式的字段 "表名.字段名"
      const [tableName, fieldName] = component.value.split('.')
      if (tableName && fieldName) {
        tablesUsed.add(tableName)
        fieldsUsed.add(component.value)
      }
    }
  } else if (component.type === 'table') {
    // 处理表组件，支持两种格式：
    // 1. 有 tableName 属性
    // 2. 有 value 属性
    if (component.tableName) {
      tablesUsed.add(component.tableName)
    } else if (component.value) {
      tablesUsed.add(component.value)
    }
  }

  // 处理嵌套结构
  if (component.components) {
    component.components.forEach((subComp: any) => {
      analyzeComponentRecursively(
        subComp,
        functionsUsed,
        tablesUsed,
        fieldsUsed,
        functionsWithConfig
      )
    })
  }
}

// 获取可用变量列表
const getAvailableVariables = (group: any) => {
  if (!group || !group.expressionComponents || !group.expressionComponents.length) {
    return []
  }

  const variables = []
  const functionsUsed = new Set<string>()
  const tablesUsed = new Set<string>()
  const fieldsUsed = new Set<string>()
  const functionsWithConfig = new Map<string, any>()

  // 递归分析所有表达式组件
  group.expressionComponents.forEach((component: any) => {
    analyzeComponentRecursively(
      component,
      functionsUsed,
      tablesUsed,
      fieldsUsed,
      functionsWithConfig
    )
  })

  // 1. 维度变量 - 根据检查维度动态生成
  const dimensionVariables = getDimensionVariables()
  variables.push(...dimensionVariables)

  // 2. 表级别变量
  tablesUsed.forEach((tableName: string) => {
    const tableInfo = getTableInfo(tableName)
    variables.push({
      name: `\${${tableName}}`,
      type: 'table',
      description: tableInfo ? `${tableInfo.chineseName}` : tableName,
      example: `${tableName}`
    })
  })

  // 3. 字段级别变量
  fieldsUsed.forEach((fieldPath: string) => {
    const [tableName, fieldName] = fieldPath.split('.')
    const fieldInfo = getFieldInfo(fieldPath)
    const tableInfo = getTableInfo(tableName)

    let description = fieldPath
    if (fieldInfo && tableInfo) {
      description = `${tableInfo.chineseName}.${fieldInfo.chineseName}`
    } else if (fieldInfo) {
      description = fieldInfo.chineseName
    } else if (tableInfo) {
      description = `${tableInfo.chineseName}.${fieldName}`
    }

    variables.push({
      name: `\${${tableName}.${fieldName}}`,
      type: 'field',
      description: description,
      example: `${fieldPath}`
    })
  })

  // 4. 函数返回值变量
  functionsUsed.forEach((funcName: string) => {
    const functionConfig = functionsWithConfig.get(funcName)
    if (functionConfig) {
      const returnOptions = getFunctionReturns(functionConfig)

      if (returnOptions.length > 0) {
        returnOptions.forEach((returnOption: any) => {
          variables.push({
            name: `\${${funcName}.${returnOption.name}}`,
            type: 'function',
            description:
              returnOption.description ||
              `${getFunctionDisplayName(funcName)}.${returnOption.name}`,
            example: `${returnOption.name}`
          })
        })
      } else {
        variables.push({
          name: `\${${funcName}.result}`,
          type: 'function',
          description: `${getFunctionDisplayName(funcName)}.result`,
          example: 'result'
        })
      }
    } else {
      variables.push({
        name: `\${${funcName}.result}`,
        type: 'function',
        description: `${getFunctionDisplayName(funcName)}.result`,
        example: 'result'
      })
    }
  })

  return variables
}

// 获取表变量
const getTableVariables = (group: any) => {
  return getAvailableVariables(group).filter((v) => v.type === 'table')
}

// 获取字段变量
const getFieldVariables = (group: any) => {
  return getAvailableVariables(group).filter((v) => v.type === 'field')
}

// 获取函数返回值变量
const getFunctionVariables = (group: any) => {
  return getAvailableVariables(group).filter((v) => v.type === 'function')
}

// 获取按表分组的字段变量
const getGroupedFieldVariables = (group: any) => {
  const fieldVariables = getFieldVariables(group)
  const tableGroups = new Map<string, any>()

  fieldVariables.forEach((field: any) => {
    // 从变量名解析表名和字段名：${CATALOG_DEFAULT.upload_date}
    const nameMatch = field.name.match(/\$\{([^.]+)\.([^}]+)\}/)
    if (nameMatch) {
      const tableName = nameMatch[1]
      const fieldName = nameMatch[2]

      if (!tableGroups.has(tableName)) {
        const tableInfo = getTableInfo(tableName)
        tableGroups.set(tableName, {
          tableName,
          tableDisplayName: tableInfo ? tableInfo.chineseName : tableName,
          fields: []
        })
      }

      const tableGroup = tableGroups.get(tableName)
      tableGroup.fields.push({
        name: field.name,
        type: field.type,
        displayName: `\${${fieldName}}`, // 只显示字段名，不包含表名
        fieldDescription: field.description.includes('.')
          ? field.description.split('.')[1]
          : field.description
      })
    }
  })

  return Array.from(tableGroups.values())
}

// 获取按函数分组的返回值变量
const getGroupedFunctionVariables = (group: any) => {
  const functionVariables = getFunctionVariables(group)
  const functionGroups = new Map<string, any>()

  functionVariables.forEach((funcVar: any) => {
    // 从变量名解析函数名：${COUNT_BY_KEYS.record_count}
    const nameMatch = funcVar.name.match(/\$\{([^.]+)\.([^}]+)\}/)
    if (nameMatch) {
      const functionName = nameMatch[1]
      const returnName = nameMatch[2]

      if (!functionGroups.has(functionName)) {
        functionGroups.set(functionName, {
          functionName,
          functionDisplayName: getFunctionDisplayName(functionName),
          returns: []
        })
      }

      const functionGroup = functionGroups.get(functionName)
      functionGroup.returns.push({
        name: funcVar.name,
        type: funcVar.type,
        displayName: `\${${returnName}}`,
        returnDescription: funcVar.description.includes('.')
          ? funcVar.description.split('.')[1]
          : returnName
      })
    }
  })

  return Array.from(functionGroups.values())
}

// 获取维度变量
const getDimensionVariables = () => {
  const variables = []

  switch (ruleForm.checkDimension) {
    case 'ORGANIZATION':
      variables.push({
        name: '\${organization_code}',
        type: 'dimension',
        description: '机构代码',
        example: 'ORG001'
      })
      break
    case 'PROVINCE':
      variables.push({
        name: '\${domain_code}',
        type: 'dimension',
        description: '省份代码',
        example: 'DOM001'
      })
      break
    case 'RECORD':
      variables.push({
        name: '\${ypid}',
        type: 'dimension',
        description: '药品编码',
        example: 'YPID123'
      })
      break
  }

  return variables
}

// 获取函数显示名称
const getFunctionDisplayName = (funcName: string) => {
  const functionNames: Record<string, string> = {
    COUNT: '计数函数',
    SUM: '求和函数',
    AVG: '平均值函数',
    MAX: '最大值函数',
    MIN: '最小值函数',
    CONCAT: '字符串拼接函数',
    HAS_NULL_FIELDS: '空值检查函数',
    IS_VALID_DATE: '日期验证函数',
    LENGTH: '长度函数'
  }
  return functionNames[funcName] || funcName
}

// 获取表显示名称
const getTableDisplayName = (tableName: string) => {
  const tableNames: Record<string, string> = {
    CATALOG_DEFAULT: '药品目录',
    INBOUND: '药品入库',
    OUTBOUND: '药品出库',
    USAGE: '临床用药',
    HOSPITAL: '医院信息'
  }
  return tableNames[tableName] || tableName
}

// 获取字段显示名称
const getFieldDisplayName = (fieldName: string) => {
  const fieldNames: Record<string, string> = {
    report_date: '填报日期',
    organization_code: '机构代码',
    hospital_drug_code: '院内药品编码',
    drug_name: '药品名称',
    manufacturer: '生产厂家',
    specification: '规格',
    quantity: '数量',
    amount: '金额',
    unit_price: '单价'
  }
  return fieldNames[fieldName] || fieldName
}

// 获取变量类型对应的tag类型

// 插入变量到错误信息模板
const insertVariable = (variableName: string) => {
  if (!activeGroup.value) return

  const textarea = document.querySelector(
    '.el-textarea__inner[placeholder*="支持变量模板"]'
  ) as HTMLTextAreaElement
  if (textarea) {
    const cursorPos = textarea.selectionStart
    const textBefore = activeGroup.value.errorMessageTemplate?.substring(0, cursorPos) || ''
    const textAfter = activeGroup.value.errorMessageTemplate?.substring(cursorPos) || ''

    activeGroup.value.errorMessageTemplate = textBefore + variableName + textAfter

    // 设置新的光标位置
    nextTick(() => {
      const newPos = cursorPos + variableName.length
      textarea.focus()
      textarea.setSelectionRange(newPos, newPos)
    })

    // 从变量名中提取中文描述用于成功提示
    const availableVars = getAvailableVariables(activeGroup.value)
    const variable = availableVars.find((v) => v.name === variableName)
    const displayName = variable ? variable.description : variableName
    ElMessage.success(`已插入变量：${displayName}`)
  }
}

const handleSaveDraft = async () => {
  ElMessage.success('草稿保存成功')
}

const handleSave = async () => {
  try {
    await ruleFormRef.value?.validate()

    saving.value = true

    const ruleData = {
      ...ruleForm,
      enabled: Number(ruleForm.enabled), // 确保是整数类型
      tableType: selectedTableTypes.value.join(','),
      checkFields: ruleForm.checkFields, // 明确传递检查字段
      conditionGroups: conditionGroups.value.map((group) => ({
        ...group,
        tableType: Array.isArray(group.tableType)
          ? group.tableType.join(',')
          : group.tableType || '', // 保存自动检测的适用表字段
        expressionJson: {
          type: 'expression',
          components: group.expressionComponents || []
        },
        groupExpression: generateExpressionText(group.expressionComponents || [])
      }))
    }

    if (isEdit.value) {
      await updateQcRule(ruleData)
      ElMessage.success('规则更新成功')
    } else {
      await createQcRule(ruleData)
      ElMessage.success('规则创建成功')
    }

    router.push('/drug-qc/rule')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败: ' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

// 参数表达式组件管理
const addParameterElement = (param, type) => {
  if (!param.components) {
    param.components = []
  }

  const element = createElementByType(type)
  param.components.push(element)
  updateParameterDisplay(param)
  detectTablesAndFields() // 添加元素后检测表和字段(包括嵌套)

  ElMessage.success(`已添加${getParameterTypeName(type)}元素`)
}

const removeParameterComponent = (param, compIndex) => {
  if (param.components && param.components.length > compIndex) {
    param.components.splice(compIndex, 1)
    updateParameterDisplay(param)
    detectTablesAndFields() // 删除组件后检测表和字段(包括嵌套)
  }
}

/*const editParameterComponent = (param, compIndex) => {
  if (!param.components || !param.components[compIndex]) return

  const component = param.components[compIndex]

  if (component.type === 'function') {
    // 设置嵌套抽屉默认激活tab为数据源
    nestedActiveTab.value = 'datasource'

    // 确保有返回值选项时默认选择第一项
    if (
      component.returnOptions &&
      component.returnOptions.length > 0 &&
      !component.selectedReturn
    ) {
      component.selectedReturn = component.returnOptions[0].name
    }

    // 为参数中的函数组件创建嵌套编辑上下文
    nestedEditFunction.value = {
      component: component,
      isParameterContext: true,
      parameterContext: param,
      componentIndex: compIndex
    }
    showNestedDrawer.value = true
    return
  }

  if (component.value === '≈' || component.value === '≉') {
    component.showTolerance = !component.showTolerance
    if (component.showTolerance && !component.tolerance) {
      component.tolerance = '±0.1'
    }
  }
}*/

/*
const generateParameterExpressionText = (components) => {
  if (!components || !Array.isArray(components)) return ''

  return components
    .map((comp) => {
      if (comp.type === 'function') {
        const params = comp.parameters
          ? comp.parameters
              .map((p) => {
                return p.displayValue || p.value || p.type
              })
              .join(', ')
          : ''

        const returnSuffix =
          comp.selectedReturn && comp.selectedReturn !== 'result'
            ? `.${comp.selectedReturn}`
            : '.result'

        return `${comp.value}(${params})${returnSuffix}`
      } else if (comp.type === 'operator' && comp.tolerance) {
        return `${comp.value}(${comp.tolerance})`
      } else if (comp.type === 'literal') {
        return comp.value || comp.label || ''
      } else if (comp.type === 'field') {
        // 保持原有格式，直接返回 value 值
        return comp.value || comp.label || ''
      }
      return comp.value || comp.label || ''
    })
    .join(' ')
}
*/

const compileParameterExpression = async (param) => {
  try {
    const expressionJson = {
      type: 'expression',
      components: param.components || []
    }

    // 参数表达式编译时，尝试从上下文获取表名，否则使用默认值
    const tableName = 'temp_table' // 参数表达式通常不依赖具体表

    const data = await QcExpressionApi.compileRuleExpression({
      expressionJson,
      tableName: tableName,
      checkDimension: ruleForm.checkDimension // 传递规则的检查维度
    })

    param.compilationResult = {
      isValid: data.isValid,
      message: data.isValid
        ? '表达式语法正确'
        : data.errors && data.errors.length > 0
          ? data.errors.map((err) => err.errorDescription).join('; ')
          : '编译失败',
      sqlExpression: data.sqlExpression // 保存SQL表达式
    }
  } catch (error) {
    param.compilationResult = {
      isValid: false,
      message: '编译失败: ' + error.message
    }
  }
}

// 嵌套抽屉拖拽处理方法
const handleNestedDragStart = (event, node) => {
  handleDragStart(event, node)
}

const handleNestedFunctionDragStart = (event, func) => {
  handleFunctionDragStart(event, func)
}

const handleNestedOperatorDragStart = (event, operator) => {
  handleOperatorDragStart(event, operator)
}

const handleNestedParameterDrop = (event, param) => {
  handleParameterDrop(event, param)
}

// 实时检测表达式中的表和字段
const detectTablesAndFields = () => {
  const tables = new Set<string>()
  const fields = new Set<string>()

  // 递归检测组件中的表和字段
  const detectInComponent = (component, depth = 0, path = '') => {
    if (!component || depth > 2) return // 限制嵌套深度为2层

    const currentPath = path ? `${path} -> ${component.type}` : component.type

    if (component.type === 'field' && component.value) {
      // 解析字段格式: 表名.字段名
      const [tableName, fieldName] = component.value.split('.')
      if (tableName && fieldName) {
        tables.add(tableName)
        fields.add(component.value)
        console.log(`[${currentPath}] 检测到字段: ${component.value}`)
      }
    } else if (component.type === 'table' && component.value) {
      tables.add(component.value)
      console.log(`[${currentPath}] 检测到表: ${component.value}`)
    }

    // 检查函数参数中的嵌套表达式
    if (component.type === 'function' && component.parameters) {
      console.log(`[${currentPath}] 检测函数参数, 参数数量: ${component.parameters.length}`)

      component.parameters.forEach((param, paramIndex) => {
        const paramPath = `${currentPath}.param[${paramIndex}]`

        // 检查参数的components（表达式类型参数）
        if (param.components && Array.isArray(param.components)) {
          console.log(`[${paramPath}] 检测参数组件, 组件数量: ${param.components.length}`)
          param.components.forEach((subComp, subIndex) => {
            const subPath = `${paramPath}.comp[${subIndex}]`
            detectInComponent(subComp, depth + 1, subPath)
          })
        }

        // 检查参数选择的表和字段
        if (param.type === 'table' && param.selectedTable?.value) {
          tables.add(param.selectedTable.value)
          console.log(`[${paramPath}] 检测到选择的表: ${param.selectedTable.value}`)
        } else if (param.type === 'field' && param.selectedField?.value) {
          const fieldValue = param.selectedField.value
          if (fieldValue.includes('.')) {
            const [tableName, fieldName] = fieldValue.split('.')
            if (tableName && fieldName) {
              tables.add(tableName)
              fields.add(fieldValue)
              console.log(`[${paramPath}] 检测到选择的字段: ${fieldValue}`)
            }
          }
        } else if (param.type === 'field[]' && param.selectedFields?.length > 0) {
          param.selectedFields.forEach((field, fieldIdx) => {
            if (field.value?.includes('.')) {
              const [tableName, fieldName] = field.value.split('.')
              if (tableName && fieldName) {
                tables.add(tableName)
                fields.add(field.value)
                console.log(`[${paramPath}] 检测到选择的字段数组[${fieldIdx}]: ${field.value}`)
              }
            }
          })
        }

        // 检查参数本身如果也是表达式
        if (param.type === 'expression' && param.value) {
          console.log(`[${paramPath}] 检测表达式参数: ${param.value}`)
          // 如果参数值包含表.字段格式，也需要解析
          const fieldMatches = param.value.match(/([A-Z_]+)\.([a-z_]+)/g)
          if (fieldMatches) {
            fieldMatches.forEach((match) => {
              const [tableName, fieldName] = match.split('.')
              if (tableName && fieldName) {
                tables.add(tableName)
                fields.add(match)
                console.log(`[${paramPath}] 从表达式中解析到字段: ${match}`)
              }
            })
          }
        }
      })
    }
  }

  console.log('=== 开始检测表和字段 ===')

  // 遍历所有条件组的表达式组件
  conditionGroups.value.forEach((group, groupIndex) => {
    console.log(`检测条件组 ${groupIndex + 1}: ${group.groupName || '无名'}`)
    if (group.expressionComponents) {
      group.expressionComponents.forEach((component, compIndex) => {
        const path = `group[${groupIndex}].comp[${compIndex}]`
        detectInComponent(component, 0, path)
      })
    }
  })

  console.log(
    `检测完成，表: [${Array.from(tables).join(', ')}], 字段: [${Array.from(fields).join(', ')}]`
  )

  // 更新检测到的表和字段
  detectedTables.value = Array.from(tables).map((table) => {
    const tableInfo = getTableInfo(table)
    return {
      value: table,
      label: tableInfo ? `${tableInfo.chineseName}(${table})` : table
    }
  })

  detectedFields.value = Array.from(fields).map((field) => {
    const fieldInfo = getFieldInfo(field)
    return {
      value: field,
      label: fieldInfo ? `${fieldInfo.chineseName}(${field})` : field
    }
  })

  // 更新适用表选择
  selectedTableTypes.value = Array.from(tables)
  ruleForm.checkFields = Array.from(fields)

  console.log('=== 检测结束 ===')
}

// 更新条件组的适用表（独立函数，避免递归）
const updateConditionGroupTableTypes = () => {
  conditionGroups.value.forEach((group) => {
    const groupTables = getDetectedTablesForGroup(group)
    const newTableTypes = groupTables.map((table) => table.value)

    // 只有当检测到的表类型与当前不同时才更新
    if (JSON.stringify(newTableTypes) !== JSON.stringify(group.tableType)) {
      group.tableType = newTableTypes
    }
  })
}

// 获取条件组检测到的表
const getDetectedTablesForGroup = (group) => {
  if (!group || !group.expressionComponents || !group.expressionComponents.length) {
    return []
  }

  const tables = new Set<string>()

  // 递归检测单个条件组中的表（与detectTablesAndFields保持一致的逻辑）
  const detectInGroupComponent = (component, depth = 0, path = '') => {
    if (!component || depth > 2) return // 限制嵌套深度为2层

    const currentPath = path ? `${path} -> ${component.type}` : component.type

    if (component.type === 'field' && component.value) {
      // 解析字段格式: 表名.字段名
      const [tableName] = component.value.split('.')
      if (tableName) {
        tables.add(tableName)
        console.log(`[${currentPath}] 检测到字段表: ${tableName}`)
      }
    } else if (component.type === 'table' && component.value) {
      tables.add(component.value)
      console.log(`[${currentPath}] 检测到表: ${component.value}`)
    }

    // 检查函数参数中的嵌套表达式
    if (component.type === 'function' && component.parameters) {
      console.log(`[${currentPath}] 检测函数参数, 参数数量: ${component.parameters.length}`)

      component.parameters.forEach((param, paramIndex) => {
        const paramPath = `${currentPath}.param[${paramIndex}]`

        // 检查参数的components（表达式类型参数）
        if (param.components && Array.isArray(param.components)) {
          console.log(`[${paramPath}] 检测参数组件, 组件数量: ${param.components.length}`)
          param.components.forEach((subComp, subIndex) => {
            const subPath = `${paramPath}.comp[${subIndex}]`
            detectInGroupComponent(subComp, depth + 1, subPath)
          })
        }

        // 检查参数选择的表和字段
        if (param.type === 'table' && param.selectedTable?.value) {
          tables.add(param.selectedTable.value)
          console.log(`[${paramPath}] 检测到选择的表: ${param.selectedTable.value}`)
        } else if (param.type === 'field' && param.selectedField?.value) {
          const fieldValue = param.selectedField.value
          if (fieldValue.includes('.')) {
            const [tableName] = fieldValue.split('.')
            if (tableName) {
              tables.add(tableName)
              console.log(`[${paramPath}] 检测到选择的字段表: ${tableName}`)
            }
          }
        } else if (param.type === 'field[]' && param.selectedFields?.length > 0) {
          param.selectedFields.forEach((field, fieldIdx) => {
            if (field.value?.includes('.')) {
              const [tableName] = field.value.split('.')
              if (tableName) {
                tables.add(tableName)
                console.log(`[${paramPath}] 检测到选择的字段数组表[${fieldIdx}]: ${tableName}`)
              }
            }
          })
        }

        // 检查参数本身如果也是表达式
        if (param.type === 'expression' && param.value) {
          console.log(`[${paramPath}] 检测表达式参数: ${param.value}`)
          // 如果参数值包含表.字段格式，也需要解析
          const fieldMatches = param.value.match(/([A-Z_]+)\\.([a-z_]+)/g)
          if (fieldMatches) {
            fieldMatches.forEach((match) => {
              const [tableName] = match.split('.')
              if (tableName) {
                tables.add(tableName)
                console.log(`[${paramPath}] 从表达式中解析到表: ${tableName}`)
              }
            })
          }
        }
      })
    }
  }

  console.log(`=== 开始检测条件组表: ${group.groupName || '无名'} ===`)

  // 遍历条件组的表达式组件
  group.expressionComponents.forEach((component, compIndex) => {
    const path = `group.comp[${compIndex}]`
    detectInGroupComponent(component, 0, path)
  })

  console.log(`条件组检测完成，表: [${Array.from(tables).join(', ')}]`)

  // 转换为选项格式
  return Array.from(tables).map((table) => {
    const tableInfo = getTableInfo(table)
    return {
      value: table,
      label: tableInfo ? `${tableInfo.chineseName}(${table})` : table
    }
  })
}

// 获取表映射供对话框使用
const getTableMappingForDialog = () => {
  const mapping = {}

  // 将检测到的表转换为映射格式
  detectedTables.value.forEach((table) => {
    mapping[table.value] = {
      label: table.label,
      value: table.value
    }
  })

  return mapping
}

// 获取表信息
const getTableInfo = (tableName: string) => {
  const chineseName = tableMetadataMap.value[tableName]
  return chineseName ? { chineseName } : null
}

// 获取字段信息
const getFieldInfo = (fullFieldName: string) => {
  const chineseName = fieldMetadataMap.value[fullFieldName]
  if (chineseName) {
    const [tableName, fieldName] = fullFieldName.split('.')
    return { chineseName, tableName, fieldName }
  }
  return null
}

// 调试函数：打印检测到的嵌套结构
const debugNestedStructure = () => {
  console.log('=== 检测嵌套结构调试信息 ===')
  conditionGroups.value.forEach((group, groupIndex) => {
    console.log(`条件组 ${groupIndex + 1}:`, group.groupName)
    if (group.expressionComponents) {
      group.expressionComponents.forEach((component, compIndex) => {
        console.log(
          `  组件 ${compIndex + 1} (${component.type}):`,
          component.value || component.label
        )

        if (component.type === 'function' && component.parameters) {
          component.parameters.forEach((param, paramIndex) => {
            console.log(
              `    参数 ${paramIndex + 1} (${param.type}):`,
              param.value || param.displayValue
            )

            if (param.components && Array.isArray(param.components)) {
              param.components.forEach((subComp, subIndex) => {
                console.log(
                  `      嵌套组件 ${subIndex + 1} (${subComp.type}):`,
                  subComp.value || subComp.label
                )

                // 检查二层嵌套
                if (subComp.type === 'function' && subComp.parameters) {
                  subComp.parameters.forEach((subParam, subParamIndex) => {
                    console.log(
                      `        二层参数 ${subParamIndex + 1} (${subParam.type}):`,
                      subParam.value || subParam.displayValue
                    )

                    if (subParam.components && Array.isArray(subParam.components)) {
                      subParam.components.forEach((deepComp, deepIndex) => {
                        console.log(
                          `          二层嵌套组件 ${deepIndex + 1} (${deepComp.type}):`,
                          deepComp.value || deepComp.label
                        )
                      })
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  })
  console.log('=== 调试信息结束 ===')
}

// 监听数据源过滤
watch(dataSourceFilter, (val) => {
  nextTick(() => {
    if (dataSourceTreeRef.value) {
      dataSourceTreeRef.value.filter(val)
    }
  })
})

// 复制SQL表达式到剪贴板
const copySqlToClipboard = async (sqlExpression: string) => {
  try {
    await navigator.clipboard.writeText(sqlExpression)
    ElMessage.success('SQL表达式已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    // 降级方案：使用传统方法
    const textArea = document.createElement('textarea')
    textArea.value = sqlExpression
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('SQL表达式已复制到剪贴板')
    } catch (fallbackError) {
      console.error('降级复制也失败:', fallbackError)
      ElMessage.error('复制失败，请手动复制')
    }
    document.body.removeChild(textArea)
  }
}

// 表达式参数处理方法
const handleNestedExpressionDrop = (event, param) => {
  event.preventDefault()
  event.stopPropagation()

  try {
    const dragData = JSON.parse(event.dataTransfer.getData('text/plain'))

    if (!param.expressionComponents) {
      param.expressionComponents = []
    }

    let newComponent

    if (dragData.type === 'field') {
      newComponent = {
        id: `field_${Date.now()}`,
        type: 'field',
        value: dragData.value,
        label: dragData.label || dragData.value,
        dataType: dragData.dataType
      }
    } else if (dragData.type === 'operator') {
      newComponent = {
        id: `operator_${Date.now()}`,
        type: 'operator',
        value: dragData.operatorSymbol,
        label: dragData.chineseName || dragData.operatorSymbol
      }
    } else if (dragData.type === 'function') {
      newComponent = {
        id: `function_${Date.now()}`,
        type: 'function',
        value: dragData.functionName,
        label: dragData.chineseName || dragData.functionName,
        parameters: []
      }
    }

    if (newComponent) {
      param.expressionComponents.push(newComponent)
      updateParameterDisplay(param)
    }
  } catch (error) {
    console.error('处理表达式参数拖放失败:', error)
  }
}

const handleNestedExpressionDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
}

const handleNestedExpressionDragLeave = (event) => {
  event.preventDefault()
}

const updateExpressionComponent = (param, index, newComponent) => {
  if (param.expressionComponents && index >= 0 && index < param.expressionComponents.length) {
    param.expressionComponents[index] = newComponent
    updateParameterDisplay(param)
  }
}

const removeExpressionComponent = (param, index) => {
  if (param.expressionComponents && index >= 0 && index < param.expressionComponents.length) {
    param.expressionComponents.splice(index, 1)
    updateParameterDisplay(param)
  }
}

const insertExpressionComponent = (param, index, newComponent) => {
  if (param.expressionComponents) {
    param.expressionComponents.splice(index, 0, newComponent)
    updateParameterDisplay(param)
  }
}

const clearParameterExpression = (param) => {
  if (param.expressionComponents) {
    param.expressionComponents = []
    updateParameterDisplay(param)
    ElMessage.success('表达式已清空')
  }
}

// 添加参数表达式元素
const addParameterExpressionElement = (param, type) => {
  if (!param.expressionComponents) {
    param.expressionComponents = []
  }

  const element = createElementByType(type)
  param.expressionComponents.push(element)
  updateParameterDisplay(param)
  ElMessage.success(`已添加${getParameterTypeName(type)}元素`)
}

// 编辑参数表达式组件
const editParameterComponent = (param, compIndex) => {
  if (!param.expressionComponents || !param.expressionComponents[compIndex]) return

  const component = param.expressionComponents[compIndex]

  if (component.type === 'function') {
    // 设置嵌套抽屉默认激活tab为数据源
    nestedActiveTab.value = 'datasource'

    // 确保有返回值选项时默认选择第一项
    if (
      component.returnOptions &&
      component.returnOptions.length > 0 &&
      !component.selectedReturn
    ) {
      component.selectedReturn = component.returnOptions[0].name
    }

    // 为参数中的函数组件创建嵌套编辑上下文
    nestedEditFunction.value = {
      component: component,
      isParameterContext: true,
      parameterContext: param,
      componentIndex: compIndex
    }
    showNestedDrawer.value = true
    return
  }

  if (component.value === '≈' || component.value === '≉') {
    component.showTolerance = !component.showTolerance
    if (component.showTolerance && !component.tolerance) {
      component.tolerance = '±0.1'
    }
  }
}

// 移除参数表达式组件
const removeParameterExpressionComponent = (param, compIndex) => {
  if (param.expressionComponents && param.expressionComponents.length > compIndex) {
    param.expressionComponents.splice(compIndex, 1)
    updateParameterDisplay(param)
    detectTablesAndFields() // 删除组件后检测表和字段
  }
}

// 生成参数表达式文本
const generateParameterExpressionText = (components) => {
  if (!components || !Array.isArray(components)) return ''

  return components
    .map((comp) => {
      if (comp.type === 'function') {
        const params = comp.parameters
          ? comp.parameters
              .map((p) => {
                // 如果参数有表达式组件，递归生成表达式文本
                if (
                  p.type === 'expression' &&
                  p.expressionComponents &&
                  p.expressionComponents.length > 0
                ) {
                  return generateParameterExpressionText(p.expressionComponents)
                }
                return p.displayValue || p.value || p.type
              })
              .join(', ')
          : ''

        const returnSuffix =
          comp.selectedReturn && comp.selectedReturn !== 'result'
            ? `.${comp.selectedReturn}`
            : '.result'

        return `${comp.value}(${params})${returnSuffix}`
      } else if (comp.type === 'operator' && comp.tolerance) {
        return `${comp.value}(${comp.tolerance})`
      } else if (comp.type === 'literal') {
        return comp.value || comp.label || ''
      } else if (comp.type === 'field') {
        // 保持原有格式，直接返回 value 值
        return comp.value || comp.label || ''
      }
      return comp.value || comp.label || ''
    })
    .join(' ')
}

const validateParameterExpression = (param) => {
  if (!param.expressionComponents || param.expressionComponents.length === 0) {
    ElMessage.warning('表达式为空')
    return
  }

  // 简单的表达式验证
  const hasFields = param.expressionComponents.some((comp) => comp.type === 'field')
  const hasOperators = param.expressionComponents.some((comp) => comp.type === 'operator')

  if (hasFields && hasOperators) {
    ElMessage.success('表达式验证通过')
  } else {
    ElMessage.warning('表达式需要包含字段和操作符')
  }
}

// 清空参数表达式
/*const clearParameterExpression = (param) => {
  param.expressionComponents = []
}*/

// 主抽屉表达式参数处理方法
const handleExpressionDrop = (event, param) => {
  event.preventDefault()
  event.stopPropagation()

  try {
    const dragData = JSON.parse(event.dataTransfer.getData('text/plain'))

    if (!param.expressionComponents) {
      param.expressionComponents = []
    }

    let newComponent

    if (dragData.type === 'field') {
      newComponent = {
        id: `field_${Date.now()}`,
        type: 'field',
        value: dragData.value,
        label: dragData.label || dragData.value,
        dataType: dragData.dataType
      }
    } else if (dragData.type === 'operator') {
      newComponent = {
        id: `operator_${Date.now()}`,
        type: 'operator',
        value: dragData.operatorSymbol,
        label: dragData.chineseName || dragData.operatorSymbol
      }
    } else if (dragData.type === 'function') {
      newComponent = {
        id: `function_${Date.now()}`,
        type: 'function',
        value: dragData.functionName,
        label: dragData.chineseName || dragData.functionName,
        parameters: []
      }
    }

    if (newComponent) {
      param.expressionComponents.push(newComponent)
      updateParameterDisplay(param)
    }
  } catch (error) {
    console.error('处理主抽屉表达式参数拖放失败:', error)
  }
}

const handleExpressionDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
}

const handleExpressionDragLeave = (event) => {
  event.preventDefault()
}

// 监听条件组变化，实时检测表和字段
watch(
  () => conditionGroups.value,
  () => {
    detectTablesAndFields()
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.qc-rule-builder {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  position: relative;
}

.builder-card {
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.builder-header {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .card-header {
    font-weight: 600;
    color: #303133;
    font-size: 18px;
  }

  .header-desc {
    font-size: 13px;
    color: #909399;
    font-weight: 400;
  }
}

.basic-info-section {
  padding: 20px 0;

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #409eff;
    margin-bottom: 20px;
    padding-bottom: 8px;
    border-bottom: 2px solid #f0f0f0;

    .el-icon {
      font-size: 18px;
    }
  }

  .basic-form {
    margin: 0;
  }
}

.section-divider {
  margin: 20px 0;

  .el-icon {
    color: #909399;
    font-size: 16px;
  }
}

.expression-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #67c23a;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;

  .el-icon {
    font-size: 18px;
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.builder-body {
  flex: 1;
  display: flex;
  height: calc(100vh - 300px); /* 设置固定高度 */
  overflow: hidden;

  .builder-sidebar {
    width: 320px;
    background: white;
    border-right: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
    flex-shrink: 0; /* 防止缩小 */
    height: 100%; /* 明确设置高度 */

    .sidebar-tabs {
      display: flex;
      height: 100%;
      //flex-direction: column;

      :deep(.el-tabs__header) {
        flex-shrink: 0;
        margin: 0;
      }

      :deep(.el-tabs__content) {
        flex: 1;
        overflow: hidden;
      }

      :deep(.el-tab-pane) {
        height: 100%;
        overflow: hidden;
      }
    }

    .tool-panel {
      height: 100%;
      display: flex;
      flex-direction: column;

      .panel-body {
        flex: 1;
        padding: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;

        .search-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          flex-shrink: 0;

          .search-input {
            flex: 1;
          }

          .refresh-btn {
            flex-shrink: 0;
          }
        }

        .tree-container,
        .function-container,
        .operator-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;

          &::-webkit-scrollbar {
            width: 6px;
          }

          &::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }

          &::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;

            &:hover {
              background: #a8a8a8;
            }
          }

          scroll-behavior: smooth;
        }

        /* 覆盖Element Tree默认高度限制 */
        .tree-container {
          :deep(.el-tree-node__content) {
            height: auto !important;
            min-height: 12px;
            padding: 4px 0;
          }

          :deep(.el-tree-node__content.category) {
            min-height: 12px;
          }

          :deep(.el-tree-node__content.field) {
            min-height: 12px;
          }

          :deep(.el-tree-node__content.table) {
            min-height: 12px;
          }
        }
      }
    }
  }

  .builder-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0; /* 允许flex item缩小 */

    .condition-groups-builder {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 20px;

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 500;
        flex-shrink: 0; /* 标题不缩小 */

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
      }

      .condition-groups-scroll {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 8px;
        min-height: 0; /* 确保flex item能正确缩小 */

        &::-webkit-scrollbar {
          width: 8px;
        }

        &::-webkit-scrollbar-track {
          background: #f5f5f5;
          border-radius: 4px;
          margin: 4px 0;
        }

        &::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
          border: 1px solid #f5f5f5;

          &:hover {
            background: #a8a8a8;
          }

          &:active {
            background: #999;
          }
        }

        /* 确保滚动平滑 */
        scroll-behavior: smooth;
      }

      .condition-groups {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 4px 0;
        min-height: fit-content;
      }

      .condition-group {
        background: white;
        border: 2px solid #e4e7ed;
        border-radius: 8px;
        overflow: hidden;
        cursor: grab;
        transition: all 0.3s;
        position: relative;

        &:active {
          cursor: grabbing;
        }

        &.active {
          border-color: #409eff;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
        }

        // 拖拽视觉反馈
        &.drag-over-top::before {
          content: '';
          position: absolute;
          top: -2px;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #409eff, #67c23a);
          border-radius: 2px;
          z-index: 10;
        }

        &.drag-over-bottom::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #409eff, #67c23a);
          border-radius: 2px;
          z-index: 10;
        }

        .group-header {
          padding: 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #e4e7ed;
          display: flex;
          align-items: center;
          justify-content: space-between;

          .group-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-weight: 500;

            .group-title-left {
              display: flex;
              align-items: center;
              gap: 12px;

              .priority-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 24px;
                height: 24px;
                background: linear-gradient(135deg, #409eff, #67c23a);
                color: white;
                border-radius: 50%;
                font-size: 12px;
                font-weight: 600;
                box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
              }
            }
          }

          .group-actions {
            display: flex;
            gap: 4px;
          }
        }

        .expression-canvas {
          min-height: 120px;
          padding: 16px;
          border: 2px dashed #d9d9d9;
          border-radius: 8px;
          transition: all 0.3s ease;
          position: relative;

          &.drag-over {
            border-color: #409eff;
            background-color: rgba(64, 158, 255, 0.08);
            box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.2);

            &::before {
              content: '松开鼠标添加到表达式';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: rgba(64, 158, 255, 0.9);
              color: white;
              padding: 8px 16px;
              border-radius: 4px;
              font-size: 14px;
              z-index: 10;
              pointer-events: none;
            }
          }

          .empty-canvas {
            height: 100px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #909399;

            .empty-icon {
              font-size: 32px;
              margin-bottom: 8px;
              opacity: 0.6;
            }

            p {
              margin: 0;
              font-size: 14px;
              text-align: center;
              line-height: 1.4;
            }
          }

          .expression-components {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
            min-height: 40px;
          }

          .canvas-add-menu {
            margin-top: 16px;
          }

          .expression-add-menu {
            margin-left: 8px;
            align-self: center;
          }
        }

        .expression-component {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: #f0f0f0;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            background: #e6f7ff;
            border-color: #409eff;
          }

          &.field {
            background: #e6f7ff;
            border-color: #91d5ff;
          }

          &.function {
            background: #f6ffed;
            border-color: #b7eb8f;
          }

          &.operator {
            background: #fff7e6;
            border-color: #ffd591;
          }

          .component-content {
            display: flex;
            align-items: center;
            gap: 4px;

            .component-icon {
              font-size: 14px;
            }

            .component-label {
              font-size: 13px;
              font-weight: 500;
            }

            .tolerance-config {
              display: flex;
              align-items: center;
            }
          }

          .component-actions {
            display: flex;
            gap: 2px;
            margin-left: 8px;
          }

          .function-display {
            display: flex;
            align-items: center;
            flex-wrap: wrap;

            .function-name {
              font-weight: 500;
              font-family: 'Fira Code', Consolas, monospace;
            }

            .function-params-display {
              font-family: 'Fira Code', Consolas, monospace;
            }

            .function-param-display {
              display: inline-flex;
              align-items: center;
              margin: 0 2px;

              .param-value {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 12px;
                border: 1px solid transparent;

                &.expression {
                  background: #e6f7ff;
                  border-color: #91d5ff;
                  color: #1890ff;
                }

                &.number {
                  background: #f6ffed;
                  border-color: #b7eb8f;
                  color: #52c41a;
                }

                &.text {
                  background: #fff7e6;
                  border-color: #ffd591;
                  color: #fa8c16;
                }

                &.boolean {
                  background: #f9f0ff;
                  border-color: #d3adf7;
                  color: #722ed1;
                }
              }
            }
          }
        }

        .expression-preview {
          padding: 16px;
          background: #f8f9fa;
          border-top: 1px solid #e4e7ed;

          .preview-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            font-weight: 500;
          }

          .preview-content {
            background: #2d3748;
            color: #e2e8f0;
            padding: 12px;
            border-radius: 4px;
            font-family: 'Fira Code', Consolas, monospace;
            font-size: 14px;
            line-height: 1.5;
            overflow-x: auto;
          }

          .compilation-result {
            margin-top: 12px;

            .sql-expression {
              margin-top: 12px;
              padding: 12px;
              background: #f5f7fa;
              border: 1px solid #e4e7ed;
              border-radius: 4px;

              .sql-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-weight: 500;
                color: #409eff;
                margin-bottom: 8px;
                font-size: 13px;

                .copy-sql-btn {
                  padding: 4px 8px;
                  min-height: auto;
                  font-size: 12px;
                  border-radius: 4px;

                  &:hover {
                    background: rgba(64, 158, 255, 0.1);
                  }

                  .iconify {
                    font-size: 14px;
                  }
                }
              }

              .sql-content {
                background: #2d3748;
                color: #e2e8f0;
                padding: 12px;
                border-radius: 4px;
                font-family: 'Fira Code', Consolas, monospace;
                font-size: 13px;
                line-height: 1.5;
                overflow-x: auto;
                margin: 0;
                white-space: pre-wrap;
                word-break: break-all;
              }
            }
          }
        }
      }
    }
  }

  .builder-aside {
    width: 300px;
    background: white;
    border-left: 1px solid #e4e7ed;
    flex-shrink: 0; /* 防止缩小 */
    display: flex;
    flex-direction: column;

    .config-panel {
      height: 100%;
      display: flex;
      flex-direction: column;

      .panel-header {
        padding: 16px;
        border-bottom: 1px solid #e4e7ed;
        font-weight: 500;
        flex-shrink: 0;
      }

      .panel-body {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
      }
    }

    .empty-config {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;

      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
    }
  }
}

// 数据源树样式
.tree-node {
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-height: 40px;
  padding: 8px 0;
  cursor: default;

  &.draggable-node {
    cursor: grab;

    &:hover {
      background-color: rgba(64, 158, 255, 0.1);
      border-radius: 4px;
    }
  }

  .node-icon {
    margin-right: 8px;
    margin-top: 3px;
    font-size: 14px;
    color: #409eff;
    flex-shrink: 0;
  }

  .node-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
    min-width: 0;
    padding: 2px 0;

    .node-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      margin-bottom: 4px;
      min-height: 18px;

      .node-label {
        font-weight: 500;
        font-size: 13px;
        line-height: 1.4;
        flex: 1;
        min-width: 0;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }

      .field-type {
        font-size: 11px;
        color: #909399;
        background: #f0f0f0;
        padding: 2px 6px;
        border-radius: 3px;
        margin-left: 8px;
        flex-shrink: 0;
        font-family: 'Fira Code', Consolas, monospace;
        line-height: 1.2;
      }
    }

    .english-name {
      font-size: 11px;
      color: #909399;
      font-family: 'Fira Code', Consolas, monospace;
      line-height: 1.3;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      width: 100%;
      min-height: 14px;
    }
  }

  &.field {
    margin-left: 14px;
    min-height: 16px;

    .node-icon {
      color: #52c41a;
    }
  }

  &.table {
    min-height: 14px;

    .node-icon {
      color: #1890ff;
    }

    .node-label {
      font-weight: 600;
    }
  }

  &.category {
    min-height: 12px;

    .node-icon {
      color: #722ed1;
    }

    .node-label {
      font-weight: 600;
      color: #722ed1;
    }
  }
}

// 函数列表样式
.function-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.function-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.3s;
  user-select: none;

  &:hover {
    border-color: #409eff;
    background-color: rgba(64, 158, 255, 0.05);
  }

  &:active {
    cursor: grabbing;
  }

  .function-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;

    .function-name {
      font-weight: 500;
      font-family: 'Fira Code', Consolas, monospace;
    }
  }

  .function-desc {
    font-size: 13px;
    color: #606266;
    margin-bottom: 4px;
  }

  .function-usage {
    font-size: 12px;
    color: #909399;
    font-family: 'Fira Code', Consolas, monospace;
    background: #f5f5f5;
    padding: 4px 8px;
    border-radius: 4px;
    margin-top: 8px;
  }

  .function-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .function-params,
  .function-returns {
    margin: 6px 0;
    font-size: 12px;
  }

  .param-label,
  .return-label {
    color: #606266;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .param-list,
  .return-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .param-item,
  .return-item {
    display: inline-flex;
    align-items: center;
    background: #f0f2f5;
    padding: 2px 6px;
    border-radius: 3px;
    border: 1px solid #d9d9d9;

    .param-type,
    .return-type {
      color: #909399;
      margin-left: 4px;
      font-family: 'Fira Code', Consolas, monospace;
    }

    .param-required {
      color: #f56c6c;
      margin-left: 2px;
    }
  }
}

// 操作符列表样式
.operator-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.operator-item {
  padding: 12px 8px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  text-align: center;
  cursor: grab;
  transition: all 0.3s;
  user-select: none;

  &:hover {
    border-color: #409eff;
    background-color: rgba(64, 158, 255, 0.05);
  }

  &:active {
    cursor: grabbing;
  }

  .operator-symbol {
    font-size: 16px;
    font-weight: 600;
    font-family: 'Fira Code', Consolas, monospace;
    margin-bottom: 4px;
  }

  .operator-name {
    font-size: 12px;
    color: #606266;
    margin-bottom: 2px;
  }

  .tolerance-hint {
    font-size: 10px;
    color: #409eff;
    background: rgba(64, 158, 255, 0.1);
    padding: 2px 4px;
    border-radius: 2px;
    margin-top: 4px;
  }
}

// 变量帮助样式
.variable-category {
  margin-bottom: 16px;

  .category-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #f8f9fa;
    border-radius: 6px;
    margin-bottom: 8px;
    border-left: 3px solid #409eff;
    position: relative;

    &.dimension-category {
      background: linear-gradient(135deg, #f9f0ff, #faf2ff);
      border-left-color: #722ed1;

      .category-icon {
        color: #722ed1;
      }

      .category-title {
        color: #722ed1;
      }

      .category-badge {
        background: #722ed1;
        color: white;
      }
    }

    &.table-category {
      background: linear-gradient(135deg, #f0f9ff, #f0f9ff);
      border-left-color: #67c23a;

      .category-icon {
        color: #67c23a;
      }

      .category-title {
        color: #67c23a;
      }

      .category-badge {
        background: #67c23a;
        color: white;
      }
    }

    &.field-category {
      background: linear-gradient(135deg, #fdf6ec, #fef7ed);
      border-left-color: #e6a23c;

      .category-icon {
        color: #e6a23c;
      }

      .category-title {
        color: #e6a23c;
      }

      .category-badge {
        background: #e6a23c;
        color: white;
      }
    }

    &.function-category {
      background: linear-gradient(135deg, #ecf5ff, #ecf5ff);
      border-left-color: #409eff;

      .category-icon {
        color: #409eff;
      }

      .category-title {
        color: #409eff;
      }

      .category-badge {
        background: #409eff;
        color: white;
      }
    }

    .category-icon {
      font-size: 14px;
      color: #409eff;
    }

    .category-title {
      font-weight: 600;
      color: #303133;
      font-size: 13px;
      flex: 1;
    }

    .category-badge {
      background: #409eff;
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      box-shadow: 0 1px 3px rgba(64, 158, 255, 0.3);
    }
  }
}

.variable-item {
  padding: 6px 12px;
  margin: 2px 0;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;

  &:hover {
    background: #f5f7fa;
    border-color: #c6e2ff;
    box-shadow: 0 2px 4px rgba(64, 158, 255, 0.12);
    transform: translateY(-1px);
  }

  &.table-item {
    .variable-main {
      justify-content: center;
    }
  }

  .variable-main {
    display: flex;
    align-items: center;
    gap: 4px;

    .variable-name {
      font-family: 'Fira Code', Consolas, monospace;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      padding: 3px 6px;
      border-radius: 3px;
      transition: all 0.2s ease;
      cursor: pointer;
      display: inline-block;

      &.variable-dimension {
        color: #722ed1;
        background: #f9f0ff;
        border: 1px solid #d3adf7;

        &:hover {
          background: #722ed1;
          color: white;
          transform: translateY(-1px);
        }
      }

      &.variable-function {
        color: #409eff;
        background: #ecf5ff;
        border: 1px solid #d9ecff;

        &:hover {
          background: #409eff;
          color: white;
          transform: translateY(-1px);
        }
      }

      &.variable-table {
        color: #67c23a;
        background: #f0f9ff;
        border: 1px solid #c2e7b0;

        &:hover {
          background: #67c23a;
          color: white;
          transform: translateY(-1px);
        }
      }

      &.variable-field {
        color: #e6a23c;
        background: #fdf6ec;
        border: 1px solid #f5dab1;

        &:hover {
          background: #e6a23c;
          color: white;
          transform: translateY(-1px);
        }
      }
    }

    .colon {
      color: #909399;
      font-weight: 600;
      font-size: 14px;
    }

    .variable-desc {
      color: #606266;
      font-size: 12px;
      flex: 1;

      &.clickable {
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          color: #409eff;
          text-decoration: underline;
        }
      }

      &.table-desc {
        font-weight: 500;
        color: #303133;
        font-size: 13px;
        text-align: center;

        &:hover {
          color: #67c23a;
        }
      }
    }
  }
}

.variable-footer {
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;

  .el-text {
    font-size: 12px;
  }
}

// 兼容旧版本样式
.template-help {
  ul {
    margin: 8px 0;
    padding-left: 20px;
  }

  li {
    margin: 4px 0;
    font-size: 13px;
  }

  code {
    background: #f5f5f5;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Fira Code', Consolas, monospace;
  }

  .literal-display {
    display: flex;
    align-items: center;

    .component-label {
      font-size: 13px;
      font-weight: 500;
    }
  }
}

// 合并抽屉样式
.combined-drawer-content {
  display: flex;
  height: calc(100vh - 120px);
  overflow: hidden;

  // 左侧工具栏区域
  .tools-section {
    width: 350px;
    background: #f8f9fa;
    border-right: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;

    .tools-header {
      padding: 16px;
      border-bottom: 1px solid #e4e7ed;
      background: white;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
    }

    .tools-content {
      flex: 1;
      overflow: hidden;

      .combined-tools-tabs {
        display: flex;
        height: 100%;

        :deep(.el-tabs__header) {
          flex-shrink: 0;
          margin: 0;
        }

        :deep(.el-tabs__content) {
          flex: 1;
          overflow: hidden;
        }

        :deep(.el-tab-pane) {
          height: 100%;
          overflow: hidden;
        }

        .tab-label {
          display: flex;
          align-items: center;
          gap: 6px;

          .iconify {
            font-size: 14px;
          }

          span {
            font-size: 13px;
          }
        }

        .tool-panel {
          height: 100%;
          display: flex;
          flex-direction: column;

          .panel-body {
            flex: 1;
            padding: 16px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            min-height: 0;

            .search-row {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 16px;
              flex-shrink: 0;

              .search-input {
                flex: 1;
              }

              .refresh-btn {
                flex-shrink: 0;
              }
            }

            .tree-container,
            .function-container,
            .operator-container {
              flex: 1;
              overflow-y: auto;
              overflow-x: hidden;

              &::-webkit-scrollbar {
                width: 6px;
              }

              &::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
              }

              &::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 3px;

                &:hover {
                  background: #a8a8a8;
                }
              }

              scroll-behavior: smooth;
            }

            /* 覆盖Element Tree默认高度限制 */
            .tree-container {
              :deep(.el-tree-node__content) {
                height: auto !important;
                min-height: 12px;
                padding: 4px 0;
              }

              :deep(.el-tree-node__content.category) {
                min-height: 12px;
              }

              :deep(.el-tree-node__content.field) {
                min-height: 12px;
              }

              :deep(.el-tree-node__content.table) {
                min-height: 12px;
              }
            }

            // 操作符容器样式 - 参考主侧边栏的实现
            .operator-container {
              .el-collapse {
                border: none;

                :deep(.el-collapse-item__header) {
                  background: #f8f9fa;
                  border: 1px solid #e4e7ed;
                  border-radius: 4px;
                  margin-bottom: 8px;
                  font-size: 13px;
                  font-weight: 500;
                  padding: 8px 12px;
                  color: #606266;
                }

                :deep(.el-collapse-item__content) {
                  padding: 0 0 8px 0;
                }
              }

              .operator-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                gap: 8px;

                .operator-item {
                  padding: 12px 8px;
                  border: 1px solid #e4e7ed;
                  border-radius: 6px;
                  text-align: center;
                  cursor: grab;
                  transition: all 0.3s;
                  user-select: none;

                  &:hover {
                    border-color: #409eff;
                    background-color: rgba(64, 158, 255, 0.05);
                  }

                  &:active {
                    cursor: grabbing;
                  }

                  .operator-symbol {
                    font-size: 16px;
                    font-weight: 600;
                    font-family: 'Fira Code', Consolas, monospace;
                    margin-bottom: 4px;
                  }

                  .operator-name {
                    font-size: 12px;
                    color: #606266;
                    margin-bottom: 2px;
                  }

                  .tolerance-hint {
                    font-size: 10px;
                    color: #409eff;
                    background: rgba(64, 158, 255, 0.1);
                    padding: 2px 4px;
                    border-radius: 2px;
                    margin-top: 4px;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // 右侧函数编辑区域
  .function-edit-section {
    flex: 1;
    background: white;
    overflow-y: auto;

    .function-edit-content {
      padding: 20px;

      .function-info {
        margin-bottom: 20px;
        text-align: center;

        h4 {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 8px 0;
        }

        .function-desc {
          color: #909399;
          font-size: 14px;
          margin: 0;
        }
      }

      .parameters-section {
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;

          h5 {
            font-size: 16px;
            font-weight: 500;
            margin: 0;
            color: #303133;
          }
        }

        .parameter-item {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          border: 1px solid #e4e7ed;

          .param-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .param-index {
              font-weight: 500;
              color: #409eff;
            }
          }

          // 主抽屉表达式参数编辑器样式
          .expression-param-editor {
            width: 100%;

            .expression-canvas-area {
              margin-bottom: 12px;

              .expression-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding: 0 4px;

                .expression-label {
                  font-weight: 500;
                  color: #303133;
                }

                .clear-btn {
                  padding: 4px 8px;
                  font-size: 12px;
                }
              }

              .expression-canvas {
                width: 100%;
                min-height: 120px;
                border: 2px dashed #d9d9d9;
                border-radius: 8px;
                padding: 16px;
                background: #fff;
                transition: all 0.3s ease;
                position: relative;

                &.drag-over {
                  border-color: #409eff;
                  background-color: rgba(64, 158, 255, 0.08);
                  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.2);

                  &::before {
                    content: '松开鼠标添加到表达式';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(64, 158, 255, 0.9);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-size: 14px;
                    z-index: 10;
                    pointer-events: none;
                  }
                }

                .empty-canvas {
                  height: 100px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  color: #909399;

                  .empty-icon {
                    font-size: 32px;
                    margin-bottom: 8px;
                    opacity: 0.6;
                  }

                  p {
                    margin: 0;
                    font-size: 14px;
                    text-align: center;
                    line-height: 1.4;
                  }

                  .canvas-add-menu {
                    margin-top: 16px;
                  }
                }

                .expression-components {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 8px;
                  align-items: center;
                  min-height: 40px;

                  .expression-component {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 8px 12px;
                    background: #f0f0f0;
                    border: 1px solid #d9d9d9;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s;

                    &:hover {
                      background: #e6f7ff;
                      border-color: #409eff;
                    }

                    &.field {
                      background: #e6f7ff;
                      border-color: #91d5ff;
                    }

                    &.function {
                      background: #f6ffed;
                      border-color: #b7eb8f;
                    }

                    &.operator {
                      background: #fff7e6;
                      border-color: #ffd591;
                    }

                    &.literal {
                      background: #f9f0ff;
                      border-color: #d3adf7;
                    }

                    .component-content {
                      display: flex;
                      align-items: center;
                      gap: 4px;

                      .component-icon {
                        font-size: 14px;
                      }

                      .component-label {
                        font-size: 13px;
                        font-weight: 500;
                      }

                      .tolerance-config {
                        display: flex;
                        align-items: center;
                      }
                    }

                    .component-actions {
                      display: flex;
                      gap: 2px;
                      margin-left: 8px;
                    }

                    .function-display {
                      display: flex;
                      align-items: center;
                      flex-wrap: wrap;

                      .function-name {
                        font-weight: 500;
                        font-family: 'Fira Code', Consolas, monospace;
                      }

                      .function-params-display {
                        font-family: 'Fira Code', Consolas, monospace;
                      }

                      .function-param-display {
                        display: inline-flex;
                        align-items: center;
                        margin: 0 2px;

                        .param-value {
                          display: inline-block;
                          padding: 2px 6px;
                          border-radius: 3px;
                          font-size: 12px;
                          border: 1px solid transparent;

                          &.expression {
                            background: #e6f7ff;
                            border-color: #91d5ff;
                            color: #1890ff;
                          }

                          &.number {
                            background: #f6ffed;
                            border-color: #b7eb8f;
                            color: #52c41a;
                          }

                          &.text {
                            background: #fff7e6;
                            border-color: #ffd591;
                            color: #fa8c16;
                          }

                          &.boolean {
                            background: #f9f0ff;
                            border-color: #d3adf7;
                            color: #722ed1;
                          }
                        }
                      }
                    }

                    .literal-display {
                      display: flex;
                      align-items: center;

                      .component-label {
                        font-size: 13px;
                        font-weight: 500;
                      }
                    }
                  }
                }

                .expression-add-menu {
                  margin-left: 8px;
                  align-self: center;
                }
              }
            }

            .expression-actions {
              display: flex;
              gap: 8px;
              justify-content: flex-end;
              padding-top: 8px;
              border-top: 1px solid #e4e7ed;

              .el-button {
                font-size: 12px;
              }
            }
          }
        }

        .empty-params {
          text-align: center;
          padding: 40px;
          color: #909399;
        }

        .add-param-bottom {
          text-align: center;
          padding: 16px 0;
          border-top: 1px solid #f0f0f0;
          margin-top: 12px;
        }
      }

      .returns-section {
        margin-top: 20px;

        h5 {
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 12px 0;
          color: #303133;

          .required-mark {
            color: #f56c6c;
            margin-left: 4px;
          }
        }

        .return-hint {
          font-size: 13px;
          color: #909399;
          margin: 0 0 12px 0;
          padding: 8px 12px;
          background: #f5f7fa;
          border-radius: 4px;
          border-left: 3px solid #409eff;
        }

        .return-desc {
          color: #909399;
          font-size: 12px;
          margin-left: 4px;
        }

        .required-field {
          border: 1px solid #f56c6c;
          border-radius: 4px;
          padding: 8px;
          background: rgba(245, 108, 108, 0.05);
        }

        :deep(.el-radio-group) {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .el-radio {
            margin-right: 0 !important;
            margin-bottom: 8px !important;
            line-height: 1.5 !important;

            .el-radio__label {
              font-size: 14px !important;
              line-height: 1.4 !important;
              padding-left: 8px !important;
            }
          }
        }
      }
    }

    // 嵌套抽屉中的表达式画布样式
    .nested-function-edit-section {
      .nested-expression-drop-area {
        position: relative !important;
        min-height: 120px !important;
        width: 100% !important;
        border: 2px dashed #d9d9d9 !important;
        border-radius: 8px !important;
        transition: all 0.3s ease !important;
        padding: 16px !important;
        background: #fff !important;

        &.drag-over {
          border-color: #409eff !important;
          background-color: rgba(64, 158, 255, 0.08) !important;
          box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.2) !important;

          &::before {
            content: '松开鼠标添加到表达式' !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            background: rgba(64, 158, 255, 0.9) !important;
            color: white !important;
            padding: 8px 16px !important;
            border-radius: 4px !important;
            font-size: 14px !important;
            z-index: 10 !important;
            pointer-events: none !important;
          }
        }

        .drop-placeholder {
          height: 88px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          color: #909399 !important;
          position: relative !important;

          i {
            font-size: 32px !important;
            margin-bottom: 8px !important;
            opacity: 0.6 !important;
          }

          span {
            margin: 0 !important;
            font-size: 14px !important;
            text-align: center !important;
            line-height: 1.4 !important;
          }

          .param-add-menu {
            margin-top: 16px !important;
          }
        }

        .nested-expression-content {
          position: relative !important;
          min-height: 40px !important;
          background: #fff !important;
          width: 100% !important;
          padding: 8px !important;

          .expression-components {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
            align-items: center !important;
            min-height: 40px !important;
            padding: 0 !important;

            .expression-component {
              display: flex !important;
              align-items: center !important;
              gap: 4px !important;
              padding: 8px 12px !important;
              background: #f0f0f0 !important;
              border: 1px solid #d9d9d9 !important;
              border-radius: 6px !important;
              cursor: pointer !important;
              transition: all 0.3s !important;
              position: relative !important;
              font-family: inherit !important;

              &:hover {
                background: #e6f7ff !important;
                border-color: #409eff !important;
              }

              &.field {
                background: #e6fffb !important;
                border-color: #87d068 !important;
                color: #52c41a !important;

                .component-icon,
                .component-label {
                  color: #52c41a !important;
                }
              }

              &.function {
                background: #fff1f0 !important;
                border-color: #ffccc7 !important;
                color: #ff4d4f !important;

                .component-icon,
                .component-label {
                  color: #ff4d4f !important;
                }
              }

              &.operator {
                background: #fff7e6 !important;
                border-color: #ffd591 !important;
                color: #fa8c16 !important;

                .component-icon,
                .component-label {
                  color: #fa8c16 !important;
                }
              }

              &.table {
                background: #e6f7ff !important;
                border-color: #91d5ff !important;
                color: #1890ff !important;

                .component-icon,
                .component-label {
                  color: #1890ff !important;
                }
              }

              .component-content {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                flex: 1 !important;

                .component-icon {
                  font-size: 14px !important;
                  color: inherit !important;
                  display: inline-block !important;
                }

                .component-label {
                  font-size: 13px !important;
                  font-weight: 500 !important;
                  color: inherit !important;
                  white-space: nowrap !important;
                  display: inline-block !important;
                }
              }

              .component-actions {
                display: flex !important;
                gap: 4px !important;
                margin-left: 8px !important;

                .el-button {
                  padding: 4px !important;
                  min-height: auto !important;
                  border: none !important;
                  background: transparent !important;
                }
              }
            }

            .expression-add-menu {
              margin-left: 8px !important;
              align-self: center !important;
            }
          }

          .expression-preview {
            padding: 16px !important;
            background: #f8f9fa !important;
            border-top: 1px solid #e4e7ed !important;
            margin-top: 16px !important;
            border-radius: 0 0 4px 4px !important;

            .preview-header {
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              margin-bottom: 8px !important;
              font-weight: 500 !important;
            }

            .preview-content {
              background: #2d3748 !important;
              color: #e2e8f0 !important;
              padding: 12px !important;
              border-radius: 4px !important;
              font-family: 'Fira Code', Consolas, monospace !important;
              font-size: 14px !important;
              line-height: 1.5 !important;
              overflow-x: auto !important;
            }

            .compilation-result {
              margin-top: 12px !important;
            }
          }

          .clear-expression {
            position: absolute !important;
            top: 8px !important;
            right: 8px !important;
          }
        }
      }

      // 强化选择器，确保嵌套抽屉中的样式被正确应用
      :deep(.el-drawer__body) {
        .nested-expression-drop-area {
          .expression-component {
            display: flex !important;
            align-items: center !important;
            padding: 8px 12px !important;
            border-radius: 6px !important;
            font-size: 13px !important;
            line-height: 1.5 !important;

            &.field {
              background: #e6fffb !important;
              border: 1px solid #87d068 !important;
              color: #52c41a !important;

              * {
                color: #52c41a !important;
              }
            }

            &.function {
              background: #fff1f0 !important;
              border: 1px solid #ffccc7 !important;
              color: #ff4d4f !important;

              * {
                color: #ff4d4f !important;
              }
            }

            &.operator {
              background: #fff7e6 !important;
              border: 1px solid #ffd591 !important;
              color: #fa8c16 !important;

              * {
                color: #fa8c16 !important;
              }
            }

            &.table {
              background: #e6f7ff !important;
              border: 1px solid #91d5ff !important;
              color: #1890ff !important;

              * {
                color: #1890ff !important;
              }
            }
          }
        }
      }
    }

    // 表达式参数编辑器样式
    .expression-param-editor {
      width: 100%;

      .expression-canvas-area {
        margin-bottom: 12px;

        .expression-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 0 4px;

          .expression-label {
            font-weight: 500;
            color: #303133;
          }

          .clear-btn {
            padding: 4px 8px;
            font-size: 12px;
          }
        }

        .expression-canvas {
          width: 100%;
          min-height: 120px;
          border: 2px dashed #d9d9d9;
          border-radius: 8px;
          padding: 16px;
          background: #fff;
          transition: all 0.3s ease;
          position: relative;

          &.drag-over {
            border-color: #409eff;
            background-color: rgba(64, 158, 255, 0.08);
            box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.2);

            &::before {
              content: '松开鼠标添加到表达式';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: rgba(64, 158, 255, 0.9);
              color: white;
              padding: 8px 16px;
              border-radius: 4px;
              font-size: 14px;
              z-index: 10;
              pointer-events: none;
            }
          }

          .empty-canvas {
            height: 100px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #909399;

            .empty-icon {
              font-size: 32px;
              margin-bottom: 8px;
              opacity: 0.6;
            }

            p {
              margin: 0;
              font-size: 14px;
              text-align: center;
              line-height: 1.4;
            }

            .canvas-add-menu {
              margin-top: 16px;
            }
          }

          .expression-components {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
            min-height: 40px;

            .expression-component {
              display: flex;
              align-items: center;
              gap: 4px;
              padding: 8px 12px;
              background: #f0f0f0;
              border: 1px solid #d9d9d9;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.3s;

              &:hover {
                background: #e6f7ff;
                border-color: #409eff;
              }

              &.field {
                background: #e6f7ff;
                border-color: #91d5ff;
              }

              &.function {
                background: #f6ffed;
                border-color: #b7eb8f;
              }

              &.operator {
                background: #fff7e6;
                border-color: #ffd591;
              }

              &.literal {
                background: #f9f0ff;
                border-color: #d3adf7;
              }

              .component-content {
                display: flex;
                align-items: center;
                gap: 4px;

                .component-icon {
                  font-size: 14px;
                }

                .component-label {
                  font-size: 13px;
                  font-weight: 500;
                }

                .tolerance-config {
                  display: flex;
                  align-items: center;
                }
              }

              .component-actions {
                display: flex;
                gap: 2px;
                margin-left: 8px;
              }

              .function-display {
                display: flex;
                align-items: center;
                flex-wrap: wrap;

                .function-name {
                  font-weight: 500;
                  font-family: 'Fira Code', Consolas, monospace;
                }

                .function-params-display {
                  font-family: 'Fira Code', Consolas, monospace;
                }

                .function-param-display {
                  display: inline-flex;
                  align-items: center;
                  margin: 0 2px;

                  .param-value {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 12px;
                    border: 1px solid transparent;

                    &.expression {
                      background: #e6f7ff;
                      border-color: #91d5ff;
                      color: #1890ff;
                    }

                    &.number {
                      background: #f6ffed;
                      border-color: #b7eb8f;
                      color: #52c41a;
                    }

                    &.text {
                      background: #fff7e6;
                      border-color: #ffd591;
                      color: #fa8c16;
                    }

                    &.boolean {
                      background: #f9f0ff;
                      border-color: #d3adf7;
                      color: #722ed1;
                    }
                  }
                }
              }

              .literal-display {
                display: flex;
                align-items: center;

                .component-label {
                  font-size: 13px;
                  font-weight: 500;
                }
              }
            }
          }

          .expression-add-menu {
            margin-left: 8px;
            align-self: center;
          }

          .expression-preview {
            padding: 16px;
            background: #f8f9fa;
            border-top: 1px solid #e4e7ed;
            border-radius: 0 0 4px 4px;

            .preview-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 8px;
              font-weight: 500;
            }

            .preview-content {
              background: #2d3748;
              color: #e2e8f0;
              padding: 12px;
              border-radius: 4px;
              font-family: 'Fira Code', Consolas, monospace;
              font-size: 14px;
              line-height: 1.5;
              overflow-x: auto;
            }
          }
        }

        .expression-preview {
          padding: 16px;
          background: #f8f9fa;
          border-top: 1px solid #e4e7ed;
          border-radius: 0 0 4px 4px;

          .preview-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            font-weight: 500;
          }

          .preview-content2 {
            background: #2d3748;
            color: #e2e8f0;
            padding: 12px;
            border-radius: 4px;
            font-family: 'Fira Code', Consolas, monospace;
            font-size: 14px;
            line-height: 1.5;
            overflow-x: auto;
          }
        }
      }

      .expression-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        padding-top: 8px;
        border-top: 1px solid #e4e7ed;

        .el-button {
          font-size: 12px;
        }
      }
    }

    .no-function-selected {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;

      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      p {
        font-size: 16px;
        margin: 0;
      }
    }
  }

  // 增强的表达式拖拽区域样式
  .expression-drop-area {
    position: relative;
    z-index: 10;
    min-height: 120px;
    width: 100%;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    transition: all 0.3s ease;
    padding: 16px;

    &.parameter-canvas {
      min-height: 80px;
      padding: 12px;
      border-color: #e4e7ed;

      .drop-placeholder {
        height: 56px;

        i {
          font-size: 24px;
        }

        span {
          font-size: 12px;
        }
      }

      .expression-content {
        min-height: 32px;

        .expression-components {
          min-height: 32px;
          padding: 4px;
          gap: 4px;
        }

        .expression-component {
          padding: 4px 8px;

          .component-content {
            gap: 3px;

            .component-icon {
              font-size: 12px;
            }

            .component-label {
              font-size: 12px;
            }
          }
        }

        .expression-preview {
          padding: 8px;
          margin-top: 8px;

          .preview-header {
            font-size: 12px;
            margin-bottom: 4px;
          }

          .preview-content2 {
            padding: 6px;
            font-size: 11px;
            max-height: 40px;
          }

          .compilation-result {
            margin-top: 6px;

            :deep(.el-alert) {
              padding: 6px 8px;

              .el-alert__title {
                font-size: 11px;
              }

              .el-alert__description {
                font-size: 10px;
                margin-top: 2px;
              }
            }
          }
        }
      }
    }

    &.drag-over {
      z-index: 20;
      border-color: #409eff;
      background-color: rgba(64, 158, 255, 0.08);
      box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.2);

      &::before {
        content: '松开鼠标添加到表达式';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(64, 158, 255, 0.9);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 10;
        pointer-events: none;
      }
    }

    .drop-placeholder {
      height: 88px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;
      position: relative;

      i {
        font-size: 32px;
        margin-bottom: 8px;
        opacity: 0.6;
      }

      span {
        margin: 0;
        font-size: 14px;
        text-align: center;
        line-height: 1.4;
      }

      // 添加菜单按钮
      .param-add-menu {
        position: absolute;
        bottom: 8px;
        right: 8px;
      }
    }

    .expression-content {
      position: relative;
      z-index: 5;
      display: flex;
      flex-direction: column;
      background: #fff;
      border-radius: 4px;
      min-height: 40px;

      .expression-components {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        min-height: 40px;
        padding: 8px;
      }

      .expression-component {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
        background: #f0f0f0;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #e6f7ff;
          border-color: #409eff;
        }

        &.field {
          background: #e6f7ff;
          border-color: #91d5ff;
        }

        &.function {
          background: #f6ffed;
          border-color: #b7eb8f;
        }

        &.operator {
          background: #fff7e6;
          border-color: #ffd591;
        }

        .component-content {
          display: flex;
          align-items: center;
          gap: 4px;

          .component-icon {
            font-size: 14px;
          }

          .component-label {
            font-size: 13px;
            font-weight: 500;
          }
        }

        .component-actions {
          display: flex;
          gap: 2px;
          margin-left: 8px;
        }
      }

      .expression-add-menu {
        margin-left: 8px;
        align-self: center;
      }

      .expression-preview {
        padding: 12px;
        background: #f8f9fa;
        border-top: 1px solid #e4e7ed;
        border-radius: 0 0 4px 4px;

        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
          font-weight: 500;
          font-size: 13px;
        }

        .preview-content2 {
          background: #2d3748;
          color: #e2e8f0;
          padding: 8px;
          border-radius: 4px;
          font-family: 'Fira Code', Consolas, monospace;
          font-size: 12px;
          line-height: 1.5;
          overflow-x: auto;
          max-height: 60px;
        }
      }

      &.nested-expression {
        background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
        border: 2px solid #91d5ff;

        .nested-expression-display {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 2px;
          flex: 1;
          padding: 8px;

          .expression-part {
            padding: 2px 4px;
            border-radius: 2px;
            font-size: 12px;
            line-height: 1.2;

            &.function-part {
              background: rgba(103, 194, 58, 0.15);
              color: #67c23a;
              font-weight: 500;
            }

            &.field-part {
              background: rgba(64, 158, 255, 0.15);
              color: #409eff;
            }

            &.nested-level-1 {
              font-weight: 600;
            }

            &.nested-level-2 {
              font-weight: 500;
              opacity: 0.9;
            }

            &.nested-level-3 {
              font-weight: 400;
              opacity: 0.8;
            }
          }
        }
      }

      .clear-expression {
        position: absolute;
        top: 8px;
        right: 8px;
      }
    }
  }

  // 单个参数拖拽区域样式
  .param-drop-wrapper {
    position: relative;
    transition: all 0.3s ease;

    &.drag-over {
      &::after {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border: 2px solid #409eff;
        border-radius: 6px;
        background-color: rgba(64, 158, 255, 0.05);
        pointer-events: none;
        z-index: 1;
      }
    }
  }

  // 字段数组拖拽样式
  .field-array-drop-area {
    &.full-width {
      width: 100% !important;
    }

    .drop-zone {
      min-height: 120px;
      border: 2px dashed #d9d9d9;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.3s ease;
      background: #fafafa;
      position: relative;

      &.drag-over {
        border-color: #409eff;
        background-color: rgba(64, 158, 255, 0.08);
        box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.2);

        &::before {
          content: '松开鼠标添加字段';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #409eff;
          font-size: 14px;
          font-weight: 500;
          z-index: 1;
        }
      }

      .drop-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 80px;
        color: #909399;
        font-size: 14px;

        .ep-mouse {
          font-size: 24px;
          margin-bottom: 8px;
          opacity: 0.6;
        }
      }

      .selected-fields {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 40px;

        .field-tag {
          display: flex;
          align-items: center;
          padding: 6px 12px;
          background: #f0f2f5;
          border: 1px solid #d9d9d9;
          border-radius: 16px;
          font-size: 13px;
          color: #333;
          transition: all 0.2s ease;

          &:hover {
            background: #e6f7ff;
            border-color: #91d5ff;
          }

          .field-icon {
            margin-right: 4px;
            color: #1890ff;
          }

          .field-name {
            margin-right: 4px;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .remove-btn {
            padding: 0;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            margin-left: 4px;

            &:hover {
              background: #ff4d4f;
              color: white;
            }
          }
        }
      }
    }

    .field-count-info {
      margin-top: 8px;
      font-size: 12px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 4px;

      .min-items-hint {
        color: #f56c6c;
        font-weight: 500;
      }
    }
  }

  // 抽屉footer样式
  .drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #e4e7ed;
    background: #fafafa;
  }
}
</style>
<style lang="scss" scoped>
/* 嵌套抽屉样式 */
.nested-drawer-content {
  display: flex;
  height: calc(100vh - 120px);
  overflow: hidden;

  // 左侧工具栏区域
  .nested-tools-section {
    width: 300px;
    background: #f8f9fa;
    border-right: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;

    .tools-header {
      padding: 16px;
      border-bottom: 1px solid #e4e7ed;
      background: white;
      font-weight: 600;
      font-size: 16px;
    }

    .tools-content {
      flex: 1;
      overflow: hidden;

      .nested-tools-tabs {
        display: flex;
        height: 100%;

        :deep(.el-tabs__header) {
          margin: 0;
          width: 100%;
        }

        :deep(.el-tabs__nav-wrap) {
          overflow-x: auto;
          overflow-y: hidden;

          &::-webkit-scrollbar {
            height: 6px;
          }

          &::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }

          &::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;

            &:hover {
              background: #a8a8a8;
            }
          }
        }

        :deep(.el-tabs__nav) {
          white-space: nowrap;
          min-width: max-content;
        }

        .el-tabs__content {
          flex: 1;
          overflow: hidden;
        }

        .el-tab-pane {
          height: 100%;
          overflow: hidden;
        }

        .tab-label {
          display: flex;
          align-items: center;
          gap: 6px;

          i {
            font-size: 14px;
          }

          span {
            font-size: 13px;
          }
        }
      }

      .tool-panel {
        height: 100%;
        display: flex;
        flex-direction: column;

        .panel-body {
          flex: 1;
          padding: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;

          .search-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;

            .search-input {
              flex: 1;
            }

            .refresh-btn {
              flex-shrink: 0;
            }
          }

          .tree-container,
          .function-container,
          .operator-container {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;

            &::-webkit-scrollbar {
              width: 6px;
            }

            &::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 3px;
            }

            &::-webkit-scrollbar-thumb {
              background: #c1c1c1;
              border-radius: 3px;

              &:hover {
                background: #a8a8a8;
              }
            }
          }

          .tree-container {
            :deep(.el-tree-node__content) {
              height: auto !important;
              min-height: 12px;
              padding: 4px 0;
            }
          }

          // 树节点样式
          :deep(.tree-node) {
            display: flex !important;
            align-items: flex-start !important;
            width: 100% !important;
            min-height: 40px !important;
            padding: 8px 0 !important;
            cursor: default !important;

            &.draggable-node {
              cursor: grab !important;

              &:hover {
                background-color: rgba(64, 158, 255, 0.1) !important;
                border-radius: 4px !important;
              }
            }

            .node-icon {
              margin-right: 8px !important;
              margin-top: 3px !important;
              font-size: 14px !important;
              color: #409eff !important;
              flex-shrink: 0 !important;
            }

            .node-content {
              display: flex !important;
              flex-direction: column !important;
              align-items: flex-start !important;
              flex: 1 !important;
              min-width: 0 !important;
              padding: 2px 0 !important;

              .node-main {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                width: 100% !important;
                margin-bottom: 4px !important;
                min-height: 18px !important;

                .node-label {
                  font-weight: 500 !important;
                  font-size: 13px !important;
                  line-height: 1.4 !important;
                  flex: 1 !important;
                  min-width: 0 !important;
                  text-overflow: ellipsis !important;
                  overflow: hidden !important;
                  white-space: nowrap !important;
                }

                .field-type {
                  font-size: 11px !important;
                  color: #909399 !important;
                  background: #f0f0f0 !important;
                  padding: 2px 6px !important;
                  border-radius: 3px !important;
                  margin-left: 8px !important;
                  flex-shrink: 0 !important;
                  font-family: 'Fira Code', Consolas, monospace !important;
                  line-height: 1.2 !important;
                }
              }

              .english-name {
                font-size: 11px !important;
                color: #909399 !important;
                font-family: 'Fira Code', Consolas, monospace !important;
                line-height: 1.3 !important;
                text-overflow: ellipsis !important;
                overflow: hidden !important;
                white-space: nowrap !important;
                width: 100% !important;
                min-height: 14px !important;
              }
            }

            &.field {
              margin-left: 14px !important;
              min-height: 16px !important;

              .node-icon {
                color: #52c41a !important;
              }
            }

            &.table {
              min-height: 14px !important;

              .node-icon {
                color: #1890ff !important;
              }

              .node-label {
                font-weight: 600 !important;
              }
            }

            &.category {
              min-height: 12px !important;

              .node-icon {
                color: #722ed1 !important;
              }

              .node-label {
                font-weight: 600 !important;
                color: #722ed1 !important;
              }
            }
          }

          // 操作符列表样式
          .operator-list {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)) !important;
            gap: 8px !important;
          }

          .operator-item {
            padding: 12px 8px !important;
            border: 1px solid #e4e7ed !important;
            border-radius: 6px !important;
            text-align: center !important;
            cursor: grab !important;
            transition: all 0.3s !important;
            user-select: none !important;

            &:hover {
              border-color: #409eff !important;
              background-color: rgba(64, 158, 255, 0.05) !important;
            }

            &:active {
              cursor: grabbing !important;
            }

            .operator-symbol {
              font-size: 16px !important;
              font-weight: 600 !important;
              font-family: 'Fira Code', Consolas, monospace !important;
              margin-bottom: 4px !important;
            }

            .operator-name {
              font-size: 12px !important;
              color: #606266 !important;
              margin-bottom: 2px !important;
            }

            .tolerance-hint {
              font-size: 10px !important;
              color: #409eff !important;
              background: rgba(64, 158, 255, 0.1) !important;
              padding: 2px 4px !important;
              border-radius: 2px !important;
              margin-top: 4px !important;
            }
          }
        }
      }
    }
  }

  // 右侧函数编辑区域
  .nested-function-edit-section {
    flex: 1;
    background: white;
    overflow-y: auto;
    padding: 20px;

    .function-edit-content {
      .function-info {
        margin-bottom: 20px;
        text-align: center;

        h4 {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 8px 0;
        }

        .function-desc {
          color: #909399;
          font-size: 14px;
          margin: 0;
        }
      }

      .parameters-section {
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;

          h5 {
            font-size: 16px;
            font-weight: 500;
            margin: 0;
            color: #303133;
          }
        }

        .parameter-item {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          border: 1px solid #e4e7ed;

          .param-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .param-index {
              font-weight: 500;
              color: #409eff;
            }
          }

          .nested-expression-input {
            .el-input {
              width: 100%;
            }
          }

          // 表达式拖拽区域样式
          .nested-expression-drop-area {
            position: relative !important;
            min-height: 120px !important;
            width: 100% !important;
            border: 2px dashed #d9d9d9 !important;
            border-radius: 8px !important;
            transition: all 0.3s ease !important;
            padding: 16px !important;
            background: #fff !important;
            display: block !important;
            margin-top: 8px !important;

            &.parameter-canvas {
              min-height: 80px !important;
              padding: 12px !important;
              border-color: #e4e7ed !important;
            }

            &.drag-over {
              border-color: #409eff !important;
              background-color: rgba(64, 158, 255, 0.08) !important;
              box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.2) !important;

              &::before {
                content: '松开鼠标添加到表达式' !important;
                position: absolute !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                background: rgba(64, 158, 255, 0.9) !important;
                color: white !important;
                padding: 8px 16px !important;
                border-radius: 4px !important;
                font-size: 14px !important;
                z-index: 10 !important;
                pointer-events: none !important;
              }
            }

            .drop-placeholder {
              height: 88px !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              color: #909399 !important;

              i {
                font-size: 32px !important;
                margin-bottom: 8px !important;
                opacity: 0.6 !important;
              }

              span {
                margin: 0 !important;
                font-size: 14px !important;
                text-align: center !important;
                line-height: 1.4 !important;
              }

              .param-add-menu {
                margin-top: 16px !important;
              }
            }

            .nested-expression-content {
              position: relative !important;
              min-height: 40px !important;
              background: #fff !important;
              width: 100% !important;
              padding: 8px !important;

              .expression-components {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 8px !important;
                align-items: center !important;
                min-height: 40px !important;
                padding: 0 !important;

                .expression-component {
                  display: flex !important;
                  align-items: center !important;
                  gap: 4px !important;
                  padding: 8px 12px !important;
                  background: #f0f0f0 !important;
                  border: 1px solid #d9d9d9 !important;
                  border-radius: 6px !important;
                  cursor: pointer !important;
                  transition: all 0.3s !important;
                  position: relative !important;

                  &:hover {
                    background: #e6f7ff !important;
                    border-color: #409eff !important;
                  }

                  &.field {
                    background: #e6fffb !important;
                    border-color: #87d068 !important;
                    color: #52c41a !important;

                    .component-icon,
                    .component-label {
                      color: #52c41a !important;
                    }
                  }

                  &.function {
                    background: #fff1f0 !important;
                    border-color: #ffccc7 !important;
                    color: #ff4d4f !important;

                    .component-icon,
                    .component-label {
                      color: #ff4d4f !important;
                    }
                  }

                  &.operator {
                    background: #fff7e6 !important;
                    border-color: #ffd591 !important;
                    color: #fa8c16 !important;

                    .component-icon,
                    .component-label {
                      color: #fa8c16 !important;
                    }
                  }

                  &.table {
                    background: #e6f7ff !important;
                    border-color: #91d5ff !important;
                    color: #1890ff !important;

                    .component-icon,
                    .component-label {
                      color: #1890ff !important;
                    }
                  }

                  &.literal {
                    background: #f9f0ff !important;
                    border-color: #d3adf7 !important;
                    color: #722ed1 !important;

                    .component-icon,
                    .component-label {
                      color: #722ed1 !important;
                    }
                  }

                  .component-content {
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    flex: 1 !important;

                    .component-icon {
                      font-size: 14px !important;
                      color: inherit !important;
                      display: inline-block !important;
                    }

                    .component-label {
                      font-size: 13px !important;
                      font-weight: 500 !important;
                      color: inherit !important;
                      white-space: nowrap !important;
                      display: inline-block !important;
                    }

                    .literal-display {
                      display: flex !important;
                      align-items: center !important;

                      :deep(.el-input) {
                        width: 120px !important;

                        .el-input__wrapper {
                          padding: 4px 8px !important;
                          font-size: 12px !important;
                        }
                      }

                      :deep(.el-input-number) {
                        width: 120px !important;

                        .el-input__wrapper {
                          padding: 4px 8px !important;
                          font-size: 12px !important;
                        }
                      }

                      :deep(.el-select) {
                        width: 100px !important;

                        .el-input__wrapper {
                          padding: 4px 8px !important;
                          font-size: 12px !important;
                        }
                      }
                    }

                    .tolerance-config {
                      display: flex !important;
                      align-items: center !important;

                      :deep(.el-input) {
                        width: 80px !important;
                        margin-left: 8px !important;

                        .el-input__wrapper {
                          padding: 2px 6px !important;
                          font-size: 11px !important;
                        }
                      }
                    }
                  }

                  .component-actions {
                    display: flex !important;
                    gap: 4px !important;
                    margin-left: 8px !important;

                    :deep(.el-button) {
                      padding: 4px !important;
                      min-height: auto !important;
                      border: none !important;
                      background: transparent !important;
                      width: 20px !important;
                      height: 20px !important;

                      .el-icon {
                        font-size: 12px !important;
                      }
                    }
                  }
                }

                .expression-add-menu {
                  margin-left: 8px !important;
                  align-self: center !important;
                }
              }

              .expression-preview {
                padding: 12px !important;
                background: #f8f9fa !important;
                border-top: 1px solid #e4e7ed !important;
                border-radius: 0 0 4px 4px !important;
                margin-top: 16px !important;

                .preview-header {
                  display: flex !important;
                  align-items: center !important;
                  justify-content: space-between !important;
                  margin-bottom: 6px !important;
                  font-weight: 500 !important;
                  font-size: 13px !important;
                }

                .preview-content {
                  background: #2d3748 !important;
                  color: #e2e8f0 !important;
                  padding: 8px !important;
                  border-radius: 4px !important;
                  font-family: 'Fira Code', Consolas, monospace !important;
                  font-size: 12px !important;
                  line-height: 1.5 !important;
                  overflow-x: auto !important;
                  max-height: 60px !important;
                }

                .compilation-result {
                  margin-top: 8px !important;

                  :deep(.el-alert) {
                    padding: 6px 8px !important;
                    border-radius: 4px !important;

                    .el-alert__title {
                      font-size: 11px !important;
                      line-height: 1.3 !important;
                    }

                    .el-alert__description {
                      font-size: 10px !important;
                      margin-top: 2px !important;
                      line-height: 1.2 !important;
                    }
                  }
                }
              }

              .clear-expression {
                position: absolute !important;
                top: 8px !important;
                right: 8px !important;

                :deep(.el-button) {
                  padding: 2px !important;
                  min-height: auto !important;
                  width: 18px !important;
                  height: 18px !important;

                  .el-icon {
                    font-size: 10px !important;
                  }
                }
              }
            }
          }
        }

        .empty-params {
          text-align: center;
          padding: 40px;
          color: #909399;
        }

        .add-param-bottom {
          text-align: center;
          padding: 16px 0;
          border-top: 1px solid #f0f0f0;
          margin-top: 12px;
        }
      }

      .returns-section {
        margin-top: 20px;

        h5 {
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 12px 0;
          color: #303133;

          .required-mark {
            color: #f56c6c;
            margin-left: 4px;
          }
        }

        .return-hint {
          font-size: 13px;
          color: #909399;
          margin: 0 0 12px 0;
          padding: 8px 12px;
          background: #f5f7fa;
          border-radius: 4px;
          border-left: 3px solid #409eff;
        }

        .return-desc {
          color: #909399;
          font-size: 12px;
          margin-left: 4px;
        }

        .required-field {
          border: 1px solid #f56c6c;
          border-radius: 4px;
          padding: 8px;
          background: rgba(245, 108, 108, 0.05);
        }

        :deep(.el-radio-group) {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .el-radio {
            margin-right: 0 !important;
            margin-bottom: 8px !important;
            line-height: 1.5 !important;

            .el-radio__label {
              font-size: 14px !important;
              line-height: 1.4 !important;
              padding-left: 8px !important;
            }
          }
        }
      }
    }

    .no-function-selected {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;

      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      p {
        font-size: 16px;
        margin: 0;
      }
    }
  }

  // 拖拽时的全局样式
  body.dragging {
    .global-drag-indicator {
      z-index: 2510 !important;
    }
  }
}

// 增强嵌套抽屉的深度样式穿透
:deep(.nested-drawer-modal) {
  .el-drawer {
    .el-drawer__body {
      padding: 0 !important;
      overflow: hidden !important;

      .nested-drawer-content {
        display: flex !important;
        height: calc(100vh - 120px) !important;
        overflow: hidden !important;
      }
    }

    .el-drawer__header {
      margin-bottom: 0 !important;
      padding: 16px 20px !important;
      border-bottom: 1px solid #e4e7ed !important;
    }

    .el-drawer__footer {
      border-top: 1px solid #e4e7ed !important;
      background: #fafafa !important;
    }
  }
}

// 抽屉footer样式
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
  background: #fafafa;
}

// 单个参数拖拽区域样式
.single-param-drop-area {
  width: 100%;

  .drop-zone {
    width: 100%;
    min-height: 40px;
    border: 2px dashed #e4e7ed;
    border-radius: 6px;
    background-color: #fafafa;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover,
    &.drag-over {
      border-color: #409eff;
      background-color: #f0f9ff;
    }

    .drop-placeholder {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #999;
      font-size: 14px;

      .icon {
        font-size: 16px;
        color: #c0c4cc;
      }
    }

    .selected-item {
      width: 100%;
      padding: 4px 8px;

      .item-tag {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: #409eff;
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 14px;

        .item-icon {
          margin-right: 6px;
          font-size: 14px;
        }

        .item-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .remove-btn {
          margin-left: 8px;
          padding: 0;
          min-height: auto;
          width: 20px;
          height: 20px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          color: white;

          &:hover {
            background: rgba(255, 255, 255, 0.3);
          }

          .icon {
            font-size: 12px;
          }
        }
      }
    }
  }
}
</style>
