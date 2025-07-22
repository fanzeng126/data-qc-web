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
            <el-col :span="8">
              <el-form-item label="规则类型" prop="ruleType">
                <el-radio-group v-model="ruleForm.ruleType" @change="handleRuleTypeChange">
                  <el-radio :value="1">前置质控</el-radio>
                  <el-radio :value="2">后置质控</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="8">
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
                    v-for="table in availableTables"
                    :key="table.value"
                    :label="table.label"
                    :value="table.value"
                  />
                </el-select>
                <div class="form-tip">适用表将根据表达式中使用的表自动推导</div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
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
            <el-col :span="8">
              <el-form-item label="检查维度" prop="checkDimension">
                <el-select v-model="ruleForm.checkDimension" placeholder="请选择">
                  <el-option label="记录维度" value="RECORD" />
                  <el-option label="机构维度" value="ORGANIZATION" />
                  <el-option label="全局维度" value="GLOBAL" />
                  <el-option label="省份维度" value="PROVINCE" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="是否启用" prop="enabled">
                <el-switch v-model="ruleForm.enabled" />
                <span class="form-tip ml-2">新建规则默认启用</span>
              </el-form-item>
            </el-col>
            <el-col :span="8">
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
                              {{ data.tableName || data.fieldName }}
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
              <el-button type="primary" size="small" @click="addConditionGroup">
                <Icon icon="ep:plus" class="mr-5px" />
                添加条件组
              </el-button>
            </div>

            <div class="condition-groups-scroll">
              <div class="condition-groups">
                <div
                  v-for="(group, index) in conditionGroups"
                  :key="group.id"
                  class="condition-group"
                  :class="{ active: activeGroupIndex === index }"
                  @click="setActiveGroup(index)"
                >
                  <div class="group-header">
                    <div class="group-title">
                      <span>{{ group.groupName || `条件组 ${index + 1}` }}</span>
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
                                    param.displayValue || param.value
                                  }}</span>
                                </template>
                                <div>表达式: {{ param.value }}</div>
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
                        编译检查
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
                    <el-popover placement="top" :width="300" trigger="click">
                      <template #reference>
                        <el-button text size="small" class="mt-5px">
                          <Icon icon="ep:question-filled" class="mr-5px" />
                          变量说明
                        </el-button>
                      </template>
                      <div class="variable-help">
                        <p><strong>可用变量：</strong></p>
                        <ul>
                          <li><code>${tableName}</code> - 表名</li>
                          <li><code>${fieldName}</code> - 字段名</li>
                          <li><code>${functionName.result}</code> - 函数返回值</li>
                          <li><code>${COUNT.result}</code> - 计数结果</li>
                          <li><code>${HAS_NULL_FIELDS.nullFieldsList}</code> - 空值字段列表</li>
                        </ul>
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
        size="88%"
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
              <el-tabs v-model="activeTab" class="tools-tabs">
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
                                  {{ data.tableName || data.fieldName }}
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
                                <div
                                  class="function-params"
                                  v-if="getFunctionParams(func).length > 0"
                                >
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
                  <el-button size="small" type="primary" @click="addFunctionParameter">
                    <Icon icon="ep:plus" />
                    添加参数
                  </el-button>
                </div>

                <div
                  v-for="(param, paramEditIndex) in currentEditFunction.component?.parameters || []"
                  :key="param.id"
                  class="parameter-item"
                >
                  <div class="param-header">
                    <span class="param-index">参数 {{ paramEditIndex + 1 }}</span>
                    <el-button
                      size="small"
                      text
                      type="danger"
                      @click="removeFunctionParameter(paramEditIndex)"
                    >
                      <Icon icon="ep:delete" />
                    </el-button>
                  </div>

                  <el-form-item label="参数类型">
                    <el-select v-model="param.type" @change="onParameterTypeChange(param)">
                      <el-option label="表达式" value="expression" />
                      <el-option label="数值" value="number" />
                      <el-option label="文本" value="text" />
                      <el-option label="布尔值" value="boolean" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="参数值">
                    <el-input
                      v-if="param.type === 'text'"
                      v-model="param.value"
                      placeholder="输入文本值"
                      @input="updateParameterDisplay(param)"
                    />
                    <el-input-number
                      v-else-if="param.type === 'number'"
                      v-model="param.value"
                      placeholder="输入数值"
                      style="width: 100%"
                      @change="updateParameterDisplay(param)"
                    />
                    <el-select
                      v-else-if="param.type === 'boolean'"
                      v-model="param.value"
                      @change="updateParameterDisplay(param)"
                    >
                      <el-option label="true" :value="true" />
                      <el-option label="false" :value="false" />
                    </el-select>
                    <!-- 表达式类型支持拖拽构建 -->
                    <div
                      v-else
                      class="expression-drop-area parameter-canvas"
                      @drop="handleParameterDrop($event, param)"
                      @dragover="handleParameterDragOver"
                      @dragleave="handleParameterDragLeave"
                    >
                      <div
                        v-if="!param.components || param.components.length === 0"
                        class="drop-placeholder"
                      >
                        <Icon icon="ep:mouse" />
                        <span>拖拽字段、函数或操作符到此处构建表达式</span>
                        <el-dropdown
                          trigger="click"
                          @command="(cmd) => addParameterElement(param, cmd)"
                          class="param-add-menu"
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
                      <div v-else class="expression-content">
                        <div class="expression-components">
                          <div
                            v-for="(component, compIndex) in param.components"
                            :key="`param-${param.id}-${compIndex}`"
                            class="expression-component"
                            :class="component.type"
                          >
                            <div class="component-content">
                              <Icon :icon="getComponentIcon(component)" class="component-icon" />

                              <div v-if="component.type === 'function'" class="function-display">
                                <span class="function-name">{{ component.value }}</span>
                                <span class="function-params-display">(</span>
                                <span
                                  v-for="(subParam, subParamIndex) in component.parameters || []"
                                  :key="subParamIndex"
                                  class="function-param-display"
                                >
                                  <span v-if="subParamIndex > 0">, </span>
                                  <el-popover
                                    placement="top"
                                    :width="200"
                                    trigger="hover"
                                    v-if="subParam.type === 'expression'"
                                  >
                                    <template #reference>
                                      <span class="param-value expression">{{
                                        subParam.displayValue || subParam.value
                                      }}</span>
                                    </template>
                                    <div>表达式: {{ subParam.value }}</div>
                                  </el-popover>
                                  <span v-else class="param-value" :class="subParam.type">
                                    {{ subParam.displayValue || subParam.value }}
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
                                  @change="updateLiteralValue(component, $event)"
                                  @click.stop
                                />
                                <el-input
                                  v-else-if="
                                    component.type === 'literal' && isTextLiteral(component)
                                  "
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
                                @click.stop="removeParameterComponent(param, compIndex)"
                              >
                                <Icon icon="ep:close" />
                              </el-button>
                            </div>
                          </div>

                          <el-dropdown
                            trigger="click"
                            @command="(cmd) => addParameterElement(param, cmd)"
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

                        <!-- 表达式预览 -->
                        <div
                          v-if="param.components && param.components.length > 0"
                          class="expression-preview"
                        >
                          <div class="preview-header">
                            <span>表达式预览：</span>
                            <el-button size="small" text @click="compileParameterExpression(param)">
                              <Icon icon="ep:cpu" class="mr-5px" />
                              编译检查
                            </el-button>
                          </div>
                          <div class="preview-content">
                            <code>{{ generateParameterExpressionText(param.components) }}</code>
                          </div>
                          <div v-if="param.compilationResult" class="compilation-result">
                            <el-alert
                              :type="param.compilationResult.isValid ? 'success' : 'error'"
                              :title="
                                param.compilationResult.isValid
                                  ? '表达式语法正确'
                                  : '表达式语法错误'
                              "
                              :description="param.compilationResult.message"
                              show-icon
                              :closable="false"
                              size="small"
                            />
                          </div>
                        </div>

                        <el-button
                          size="small"
                          text
                          type="danger"
                          class="clear-expression"
                          @click="clearParameter(param)"
                        >
                          <Icon icon="ep:close" />
                        </el-button>
                      </div>
                    </div>
                  </el-form-item>
                </div>

                <div v-if="!currentEditFunction.component?.parameters?.length" class="empty-params">
                  <p>暂无参数，点击上方"添加参数"按钮添加</p>
                </div>
              </div>

              <el-divider />

              <!-- 返回值选择区域 -->
              <div
                class="returns-section"
                v-if="currentEditFunction.component?.returnOptions?.length > 1"
              >
                <h5>选择返回值</h5>
                <el-radio-group v-model="currentEditFunction.component.selectedReturn">
                  <el-radio
                    v-for="(returnItem, radioIndex) in currentEditFunction.component.returnOptions"
                    :key="radioIndex"
                    :value="returnItem.name"
                  >
                    {{ returnItem.name }} ({{ returnItem.type }})
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
                                  {{ data.tableName || data.fieldName }}
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
                    <el-button size="small" type="primary" @click="addFunctionParameter">
                      <Icon icon="ep:plus" />
                      添加参数
                    </el-button>
                  </div>

                  <div
                    v-for="(param, paramEditIndex) in nestedEditFunction.component?.parameters ||
                    []"
                    :key="param.id"
                    class="parameter-item"
                  >
                    <div class="param-header">
                      <span class="param-index">参数 {{ paramEditIndex + 1 }}</span>
                      <el-button
                        size="small"
                        text
                        type="danger"
                        @click="removeFunctionParameter(paramEditIndex)"
                      >
                        <Icon icon="ep:delete" />
                      </el-button>
                    </div>

                    <el-form-item label="参数类型">
                      <el-select v-model="param.type" @change="onParameterTypeChange(param)">
                        <el-option label="表达式" value="expression" />
                        <el-option label="数值" value="number" />
                        <el-option label="文本" value="text" />
                        <el-option label="布尔值" value="boolean" />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="参数值">
                      <el-input
                        v-if="param.type === 'text'"
                        v-model="param.value"
                        placeholder="输入文本值"
                        @input="updateParameterDisplay(param)"
                      />
                      <el-input-number
                        v-else-if="param.type === 'number'"
                        v-model="param.value"
                        placeholder="输入数值"
                        style="width: 100%"
                        @change="updateParameterDisplay(param)"
                      />
                      <el-select
                        v-else-if="param.type === 'boolean'"
                        v-model="param.value"
                        @change="updateParameterDisplay(param)"
                      >
                        <el-option label="true" :value="true" />
                        <el-option label="false" :value="false" />
                      </el-select>
                      <!-- 嵌套抽屉中的表达式类型支持拖拽构建 -->
                      <div
                        v-else
                        class="nested-expression-drop-area parameter-canvas"
                        @drop="handleNestedParameterDrop($event, param)"
                        @dragover="handleParameterDragOver"
                        @dragleave="handleParameterDragLeave"
                      >
                        <div
                          v-if="!param.components || param.components.length === 0"
                          class="drop-placeholder"
                        >
                          <Icon icon="ep:mouse" />
                          <span>拖拽字段、函数或操作符到此处构建表达式</span>
                          <el-dropdown
                            trigger="click"
                            @command="(cmd) => addParameterElement(param, cmd)"
                            class="param-add-menu"
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
                        <div v-else class="nested-expression-content">
                          <div class="expression-components">
                            <div
                              v-for="(component, compIndex) in param.components"
                              :key="`nested-param-${param.id}-${compIndex}`"
                              class="expression-component"
                              :class="component.type"
                            >
                              <div class="component-content">
                                <Icon :icon="getComponentIcon(component)" class="component-icon" />
                                <span class="component-label">{{
                                  getComponentDisplayText(component)
                                }}</span>
                              </div>
                              <div class="component-actions">
                                <el-button
                                  size="small"
                                  text
                                  type="danger"
                                  @click.stop="removeParameterComponent(param, compIndex)"
                                >
                                  <Icon icon="ep:close" />
                                </el-button>
                              </div>
                            </div>

                            <el-dropdown
                              trigger="click"
                              @command="(cmd) => addParameterElement(param, cmd)"
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

                          <!-- 表达式预览 -->
                          <div
                            v-if="param.components && param.components.length > 0"
                            class="expression-preview"
                          >
                            <div class="preview-header">
                              <span>表达式预览：</span>
                              <el-button
                                size="small"
                                text
                                @click="compileParameterExpression(param)"
                              >
                                <Icon icon="ep:cpu" class="mr-5px" />
                                编译检查
                              </el-button>
                            </div>
                            <div class="preview-content">
                              <code>{{ generateParameterExpressionText(param.components) }}</code>
                            </div>
                            <div v-if="param.compilationResult" class="compilation-result">
                              <el-alert
                                :type="param.compilationResult.isValid ? 'success' : 'error'"
                                :title="
                                  param.compilationResult.isValid
                                    ? '表达式语法正确'
                                    : '表达式语法错误'
                                "
                                :description="param.compilationResult.message"
                                show-icon
                                :closable="false"
                                size="small"
                              />
                            </div>
                          </div>

                          <el-button
                            size="small"
                            text
                            type="danger"
                            class="clear-expression"
                            @click="clearParameter(param)"
                          >
                            <Icon icon="ep:close" />
                          </el-button>
                        </div>
                      </div>
                    </el-form-item>
                  </div>

                  <div
                    v-if="!nestedEditFunction.component?.parameters?.length"
                    class="empty-params"
                  >
                    <p>暂无参数，点击上方“添加参数”按钮添加</p>
                  </div>
                </div>

                <el-divider />

                <!-- 返回值选择区域 -->
                <div
                  class="returns-section"
                  v-if="nestedEditFunction.component?.returnOptions?.length > 1"
                >
                  <h5>选择返回值</h5>
                  <el-radio-group v-model="nestedEditFunction.component.selectedReturn">
                    <el-radio
                      v-for="(returnItem, radioIndex) in nestedEditFunction.component.returnOptions"
                      :key="radioIndex"
                      :value="returnItem.name"
                    >
                      {{ returnItem.name }} ({{ returnItem.type }})
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

            <template>
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
            </template>
          </div>
        </div>
      </el-drawer>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { View, Cpu, Document, Check, InfoFilled, Setting, Tools } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader/index.vue'

import {
  getDataSourceCategories,
  createQcRule,
  updateQcRule,
  getQcRule
} from '@/api/drug/qc/rule/builder'

import { QcFunctionConfigApi, QcOperatorConfigApi, QcExpressionApi } from '@/api/drug/qc/builder'

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

// 可用表选项
const availableTables = ref([
  { value: 'inbound', label: '采购入库表' },
  { value: 'outbound', label: '药品发放表' },
  { value: 'usage', label: '临床用药表' },
  { value: 'catalog', label: '药品目录表' }
])

const selectedTableTypes = ref<string[]>([])

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
  ruleCategory: 'FIELD',
  tableType: '',
  priority: 100,
  executeAction: 'RECORD_ERROR',
  enabled: true,
  description: ''
})

const ruleRules = {
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  ruleType: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  checkDimension: [{ required: true, message: '请选择检查维度', trigger: 'change' }]
}

// 条件组数据
const conditionGroups = ref([])
const activeGroupIndex = ref(-1)

const activeGroup = computed(() => {
  return activeGroupIndex.value >= 0 && conditionGroups.value[activeGroupIndex.value]
    ? conditionGroups.value[activeGroupIndex.value]
    : null
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

// 全局拖拽状态管理
const globalDragData = ref(null)
const isDragging = ref(false)

// 初始化
onMounted(async () => {
  try {
    await Promise.all([loadDataSource(), loadFunctions(), loadOperators()])

    if (isEdit.value) {
      await loadRuleData(route.params.id)
    } else {
      updateRuleCode()
      addConditionGroup()
    }

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
  } catch (error) {
    console.error('加载数据源失败:', error)
    ElMessage.error('加载数据源失败')
  } finally {
    loadingDataSource.value = false
  }
}

const processTreeData = (treeData) => {
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
      tableName: node.tableName,
      fieldName: node.fieldName,
      fieldType: node.fieldType,
      dataType: node.fieldType,
      isRequired: node.fieldName ? true : undefined
    }

    if (node.children && node.children.length > 0) {
      processedNode.children = processTreeData(node.children)
    }

    return processedNode
  })
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

const loadRuleData = async (ruleId) => {
  try {
    const { data } = await getQcRule(ruleId)
    Object.assign(ruleForm, data)

    if (data.conditionGroups && data.conditionGroups.length > 0) {
      conditionGroups.value = data.conditionGroups.map((group) => ({
        ...group,
        expressionComponents: parseExpressionJson(group.expressionJson) || []
      }))
      activeGroupIndex.value = 0
    }
  } catch (error) {
    console.error('加载规则数据失败:', error)
    ElMessage.error('加载规则数据失败')
  }
}

// 条件组操作
const addConditionGroup = () => {
  const newGroup = {
    id: Date.now(),
    groupName: `条件组 ${conditionGroups.value.length + 1}`,
    priority: conditionGroups.value.length + 1,
    executeAction: 'RECORD_ERROR',
    errorMessageTemplate: '',
    description: '',
    expressionComponents: [],
    compilationResult: null
  }

  conditionGroups.value.push(newGroup)
  activeGroupIndex.value = conditionGroups.value.length - 1
}

const removeGroup = (index) => {
  if (conditionGroups.value.length === 1) {
    ElMessage.warning('至少需要保留一个条件组')
    return
  }

  conditionGroups.value.splice(index, 1)
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
    expressionComponents: JSON.parse(JSON.stringify(originalGroup.expressionComponents || []))
  }

  conditionGroups.value.splice(index + 1, 0, newGroup)
  activeGroupIndex.value = index + 1
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

  const dragData = {
    type: 'datasource',
    nodeType: node.data.type,
    data: node.data
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
          component = {
            type: 'field',
            value: `${dragData.data.tableName || ''}.${dragData.data.fieldName || ''}`,
            label: dragData.data.label || '',
            dataType: dragData.data.dataType || dragData.data.fieldType || ''
          }
        } else if (dragData.nodeType === 'table') {
          component = {
            type: 'table',
            value: dragData.data.tableName || '',
            label: dragData.data.label || ''
          }
        }
        break

      case 'function':
        component = {
          type: 'function',
          value: dragData.data.functionName || '',
          label: dragData.data.chineseName || dragData.data.displayName || '',
          parameters: [],
          config: dragData.data,
          returnOptions: getFunctionReturns(dragData.data)
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
  const types = { 1: 'info', 2: 'warning', 3: 'danger' }
  return types[level] || 'info'
}

const getFunctionLevelText = (level) => {
  const texts = { 1: '基础', 2: '高级', 3: '专家' }
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
    APPROXIMATION: '近似比较'
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
}

// 组件编辑处理
const editComponent = (groupId, compIndex) => {
  const group = conditionGroups.value.find((g) => g.id === groupId)
  if (group && group.expressionComponents && group.expressionComponents[compIndex]) {
    const component = group.expressionComponents[compIndex]

    if (component.type === 'function') {
      // 设置默认激活tab为数据源
      activeTab.value = 'datasource'
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

    if (config.type && !config.variables) {
      return [
        {
          name: 'result',
          type: config.type
        }
      ]
    }

    if (config.variables) {
      return Object.entries(config.variables).map(([key, description]) => ({
        name: key,
        type: config.type || 'unknown',
        description: description
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
    case 'expression':
      return {
        ...baseParam,
        value: '',
        displayValue: '表达式',
        canDrag: true
      }
    case 'number':
      return {
        ...baseParam,
        value: 0,
        displayValue: '0'
      }
    case 'text':
      return {
        ...baseParam,
        value: '',
        displayValue: '文本'
      }
    case 'boolean':
      return {
        ...baseParam,
        value: true,
        displayValue: 'true'
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
        label: '文本',
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
    expression: '表达式',
    number: '数值',
    text: '文本',
    boolean: '布尔值'
  }
  return names[type] || type
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
  const editContext = nestedEditFunction.value || currentEditFunction.value
  if (!editContext?.component) return

  if (!editContext.component.parameters) {
    editContext.component.parameters = []
  }

  const newParam = createParameterByType('expression')
  editContext.component.parameters.push(newParam)
}

const removeFunctionParameter = (paramIndex) => {
  const editContext = nestedEditFunction.value || currentEditFunction.value
  if (!editContext?.component?.parameters) return
  editContext.component.parameters.splice(paramIndex, 1)
}

const onParameterTypeChange = (param) => {
  switch (param.type) {
    case 'expression':
      param.value = ''
      param.displayValue = '表达式'
      break
    case 'number':
      param.value = 0
      param.displayValue = '0'
      break
    case 'text':
      param.value = ''
      param.displayValue = '文本'
      break
    case 'boolean':
      param.value = true
      param.displayValue = 'true'
      break
  }
}

const updateParameterDisplay = (param) => {
  switch (param.type) {
    case 'text':
      param.displayValue = param.value || '文本'
      break
    case 'number':
      param.displayValue = String(param.value)
      break
    case 'boolean':
      param.displayValue = String(param.value)
      break
    case 'expression':
      if (param.components && param.components.length > 0) {
        param.value = generateParameterExpressionText(param.components)
        param.displayValue = param.value || '表达式'
      } else {
        param.displayValue = param.value || '表达式'
      }
      break
    default:
      param.displayValue = String(param.value || '')
  }
}

const saveFunctionEdit = () => {
  if (!currentEditFunction.value) return

  if (currentEditFunction.value.component.parameters) {
    currentEditFunction.value.component.parameters.forEach((param) => {
      updateParameterDisplay(param)
    })
  }

  if (
    currentEditFunction.value.component.returnOptions?.length > 1 &&
    !currentEditFunction.value.component.selectedReturn
  ) {
    currentEditFunction.value.component.selectedReturn =
      currentEditFunction.value.component.returnOptions[0].name
  }

  ElMessage.success('函数配置已保存')
  closeCombinedDrawer()
}

const saveNestedFunctionEdit = () => {
  if (!nestedEditFunction.value) return

  if (nestedEditFunction.value.component.parameters) {
    nestedEditFunction.value.component.parameters.forEach((param) => {
      updateParameterDisplay(param)
    })
  }

  if (
    nestedEditFunction.value.component.returnOptions?.length > 1 &&
    !nestedEditFunction.value.component.selectedReturn
  ) {
    nestedEditFunction.value.component.selectedReturn =
      nestedEditFunction.value.component.returnOptions[0].name
  }

  // 更新参数上下文的显示
  if (nestedEditFunction.value.isParameterContext && nestedEditFunction.value.parameterContext) {
    updateParameterDisplay(nestedEditFunction.value.parameterContext)
  }

  ElMessage.success('函数配置已保存')
  closeNestedDrawer()
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
          component = {
            type: 'field',
            value: `${dragData.data.tableName || ''}.${dragData.data.fieldName || ''}`,
            label: dragData.data.label || '',
            dataType: dragData.data.dataType || dragData.data.fieldType || ''
          }
        } else if (dragData.nodeType === 'table') {
          component = {
            type: 'table',
            value: dragData.data.tableName || '',
            label: dragData.data.label || ''
          }
        }
        break

      case 'function':
        component = {
          type: 'function',
          value: dragData.data.functionName || '',
          label: dragData.data.chineseName || dragData.data.displayName || '',
          parameters: [],
          config: dragData.data,
          returnOptions: getFunctionReturns(dragData.data)
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
  return component.subType === 'text' || component.label === '文本'
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
    component.label = value || '文本'
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
      tableName: 'temp_table'
    })

    group.compilationResult = {
      isValid: data.isValid,
      message: data.isValid
        ? '表达式语法正确'
        : data.errors && data.errors.length > 0
          ? data.errors.map((err) => err.errorDescription).join('; ')
          : '编译失败'
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
const updateRuleCode = () => {
  if (!isEdit.value && !ruleForm.ruleCode.includes('_')) {
    const timestamp = Date.now().toString().slice(-6)
    ruleForm.ruleCode = `${ruleCodePrefix.value}_${timestamp}`
  }
}

// 主要操作方法
const handlePreview = () => {
  ElMessage.info('表达式预览功能正在开发中')
}

const handleTest = () => {
  ElMessage.info('规则测试功能正在开发中')
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
      tableType: selectedTableTypes.value.join(','),
      conditionGroups: conditionGroups.value.map((group) => ({
        ...group,
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

    router.push('/drug/qc-rules')
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

  ElMessage.success(`已添加${getParameterTypeName(type)}元素`)
}

const removeParameterComponent = (param, compIndex) => {
  if (param.components && param.components.length > compIndex) {
    param.components.splice(compIndex, 1)
    updateParameterDisplay(param)
  }
}

const editParameterComponent = (param, compIndex) => {
  if (!param.components || !param.components[compIndex]) return

  const component = param.components[compIndex]

  if (component.type === 'function') {
    // 设置嵌套抽屉默认激活tab为数据源
    nestedActiveTab.value = 'datasource'
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
      }
      return comp.value || comp.label || ''
    })
    .join(' ')
}

const compileParameterExpression = async (param) => {
  try {
    const expressionJson = {
      type: 'expression',
      components: param.components || []
    }

    const data = await QcExpressionApi.compileRuleExpression({
      expressionJson,
      tableName: 'temp_table'
    })

    param.compilationResult = {
      isValid: data.isValid,
      message: data.isValid
        ? '表达式语法正确'
        : data.errors && data.errors.length > 0
          ? data.errors.map((err) => err.errorDescription).join('; ')
          : '编译失败'
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

// 监听数据源过滤
watch(dataSourceFilter, (val) => {
  nextTick(() => {
    if (dataSourceTreeRef.value) {
      dataSourceTreeRef.value.filter(val)
    }
  })
})
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
  overflow: hidden;

  .builder-sidebar {
    width: 320px;
    background: white;
    border-right: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;

    .sidebar-tabs {
      .tab-label {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 8px;

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
          height: 850px;
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

    .condition-groups-builder {
      flex: 1;
      padding: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 500;
        flex-shrink: 0;
      }

      .condition-groups-scroll {
        flex: 1;
        overflow-y: auto;
        padding-right: 8px;

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

      .condition-groups {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-height: min-content;
      }

      .condition-group {
        background: white;
        border: 2px solid #e4e7ed;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s;

        &.active {
          border-color: #409eff;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
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
            gap: 8px;
            font-weight: 500;
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
          }
        }
      }
    }
  }

  .builder-aside {
    width: 300px;
    background: white;
    border-left: 1px solid #e4e7ed;

    .config-panel {
      height: 100%;
      display: flex;
      flex-direction: column;

      .panel-header {
        padding: 16px;
        border-bottom: 1px solid #e4e7ed;
        font-weight: 500;
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

// 帮助样式
.template-help {
  .variable-help {
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
}

// 合并抽屉样式
.combined-drawer-content {
  display: flex;
  height: calc(100vh - 120px);
  overflow: hidden;

  // 左侧工具栏区域
  .tools-section {
    width: 400px;
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

      .tools-tabs {
        display: flex;
        height: 100%;

        :deep(.el-tabs__header) {
          margin: 0;
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

          // 添加树节点高度限制覆盖样式
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
        }

        .empty-params {
          text-align: center;
          padding: 40px;
          color: #909399;
        }
      }

      .returns-section {
        h5 {
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 12px 0;
          color: #303133;
        }

        .return-desc {
          color: #909399;
          font-size: 12px;
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

          .preview-content {
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

        .preview-content {
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
      }

      .returns-section {
        margin-top: 20px;

        h5 {
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 12px 0;
          color: #303133;
        }

        .return-desc {
          color: #909399;
          font-size: 12px;
          margin-left: 4px;
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
</style>
