<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="导入任务ID" prop="taskId">
        <el-input
          v-model="queryParams.taskId"
          placeholder="请输入导入任务ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="组织机构代码" prop="organizationCode">
        <el-input
          v-model="queryParams.organizationCode"
          placeholder="请输入组织机构代码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="医疗机构代码" prop="hospitalCode">
        <el-input
          v-model="queryParams.hospitalCode"
          placeholder="请输入医疗机构代码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="组织机构名称" prop="organizationName">
        <el-input
          v-model="queryParams.organizationName"
          placeholder="请输入组织机构名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="省级行政区划代码" prop="domainCode">
        <el-input
          v-model="queryParams.domainCode"
          placeholder="请输入省级行政区划代码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="国家药管平台药品编码(YPID)" prop="ypid">
        <el-input
          v-model="queryParams.ypid"
          placeholder="请输入国家药管平台药品编码(YPID)"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="院内药品唯一码" prop="hospitalDrugId">
        <el-input
          v-model="queryParams.hospitalDrugId"
          placeholder="请输入院内药品唯一码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="省级药品集中采购平台药品编码" prop="provinceDrugId">
        <el-input
          v-model="queryParams.provinceDrugId"
          placeholder="请输入省级药品集中采购平台药品编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="产品名称" prop="productName">
        <el-input
          v-model="queryParams.productName"
          placeholder="请输入产品名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="药品销售日期" prop="usageDate">
        <el-date-picker
          v-model="queryParams.usageDate"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="销售数量（最小销售包装单位）" prop="usagePackQuantity">
        <el-input
          v-model="queryParams.usagePackQuantity"
          placeholder="请输入销售数量（最小销售包装单位）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="销售数量（最小制剂单位）" prop="usageDosageQuantity">
        <el-input
          v-model="queryParams.usageDosageQuantity"
          placeholder="请输入销售数量（最小制剂单位）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="销售总金额（元）" prop="usageTotalAmount">
        <el-input
          v-model="queryParams.usageTotalAmount"
          placeholder="请输入销售总金额（元）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="销售价格（最小销售包装单位）" prop="usagePackPrice">
        <el-input
          v-model="queryParams.usagePackPrice"
          placeholder="请输入销售价格（最小销售包装单位）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="销售价格（最小制剂单位）" prop="usageDosagePrice">
        <el-input
          v-model="queryParams.usageDosagePrice"
          placeholder="请输入销售价格（最小制剂单位）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="质控状态:0-未质控,1-质控通过,2-质控失败" prop="qcStatus">
        <el-select
          v-model="queryParams.qcStatus"
          placeholder="请选择质控状态:0-未质控,1-质控通过,2-质控失败"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="质控结果详情(JSON格式)" prop="qcResult">
        <el-input
          v-model="queryParams.qcResult"
          placeholder="请输入质控结果详情(JSON格式)"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="错误信息" prop="errorMessage">
        <el-input
          v-model="queryParams.errorMessage"
          placeholder="请输入错误信息"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="价格状态:0-正常,1-价格过高,2-价格过低,3-价格异常" prop="priceStatus">
        <el-select
          v-model="queryParams.priceStatus"
          placeholder="请选择价格状态:0-正常,1-价格过高,2-价格过低,3-价格异常"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="修复状态:0-未修复,1-自动修复,2-手动修复" prop="fixStatus">
        <el-select
          v-model="queryParams.fixStatus"
          placeholder="请选择修复状态:0-未修复,1-自动修复,2-手动修复"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="修复规则标记(如FIX0081)" prop="fixRule">
        <el-input
          v-model="queryParams.fixRule"
          placeholder="请输入修复规则标记(如FIX0081)"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['drug:usage:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['drug:usage:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="主键ID" align="center" prop="id" />
      <el-table-column label="导入任务ID" align="center" prop="taskId" />
      <el-table-column label="组织机构代码" align="center" prop="organizationCode" />
      <el-table-column label="医疗机构代码" align="center" prop="hospitalCode" />
      <el-table-column label="组织机构名称" align="center" prop="organizationName" />
      <el-table-column label="省级行政区划代码" align="center" prop="domainCode" />
      <el-table-column label="国家药管平台药品编码(YPID)" align="center" prop="ypid" />
      <el-table-column label="院内药品唯一码" align="center" prop="hospitalDrugId" />
      <el-table-column label="省级药品集中采购平台药品编码" align="center" prop="provinceDrugId" />
      <el-table-column label="产品名称" align="center" prop="productName" />
      <el-table-column label="药品销售日期" align="center" prop="usageDate" />
      <el-table-column
        label="销售数量（最小销售包装单位）"
        align="center"
        prop="usagePackQuantity"
      />
      <el-table-column label="销售数量（最小制剂单位）" align="center" prop="usageDosageQuantity" />
      <el-table-column label="销售总金额（元）" align="center" prop="usageTotalAmount" />
      <el-table-column label="销售价格（最小销售包装单位）" align="center" prop="usagePackPrice" />
      <el-table-column label="销售价格（最小制剂单位）" align="center" prop="usageDosagePrice" />
      <el-table-column
        label="质控状态:0-未质控,1-质控通过,2-质控失败"
        align="center"
        prop="qcStatus"
      />
      <el-table-column label="质控结果详情(JSON格式)" align="center" prop="qcResult" />
      <el-table-column label="错误信息" align="center" prop="errorMessage" />
      <el-table-column
        label="价格状态:0-正常,1-价格过高,2-价格过低,3-价格异常"
        align="center"
        prop="priceStatus"
      />
      <el-table-column
        label="修复状态:0-未修复,1-自动修复,2-手动修复"
        align="center"
        prop="fixStatus"
      />
      <el-table-column label="修复规则标记(如FIX0081)" align="center" prop="fixRule" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['drug:usage:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['drug:usage:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <UsageForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { UsageApi, UsageVO } from '@/api/drug/data/usage'
import UsageForm from './UsageForm.vue'

/** 药品使用情况 列表 */
defineOptions({ name: 'Usage' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<UsageVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: undefined,
  organizationCode: undefined,
  hospitalCode: undefined,
  organizationName: undefined,
  domainCode: undefined,
  ypid: undefined,
  hospitalDrugId: undefined,
  provinceDrugId: undefined,
  productName: undefined,
  usageDate: [],
  usagePackQuantity: undefined,
  usageDosageQuantity: undefined,
  usageTotalAmount: undefined,
  usagePackPrice: undefined,
  usageDosagePrice: undefined,
  qcStatus: undefined,
  qcResult: undefined,
  errorMessage: undefined,
  priceStatus: undefined,
  fixStatus: undefined,
  fixRule: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await UsageApi.getUsagePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await UsageApi.deleteUsage(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await UsageApi.exportUsage(queryParams)
    download.excel(data, '药品使用情况.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
