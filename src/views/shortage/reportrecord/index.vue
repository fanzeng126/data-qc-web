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
      <el-form-item label="专区ID" prop="zoneId">
        <el-input
          v-model="queryParams.zoneId"
          placeholder="请输入专区ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="药品配置ID" prop="drugConfigId">
        <el-input
          v-model="queryParams.drugConfigId"
          placeholder="请输入药品配置ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="机构ID" prop="deptId">
        <el-input
          v-model="queryParams.deptId"
          placeholder="请输入机构ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="填报周期(YYYY-WW)" prop="reportWeek">
        <el-input
          v-model="queryParams.reportWeek"
          placeholder="请输入填报周期(YYYY-WW)"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="填报日期" prop="reportDate">
        <el-date-picker
          v-model="queryParams.reportDate"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="本周累计使用量" prop="weekUsageAmount">
        <el-input
          v-model="queryParams.weekUsageAmount"
          placeholder="请输入本周累计使用量"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="当日实时库存量" prop="currentStockAmount">
        <el-input
          v-model="queryParams.currentStockAmount"
          placeholder="请输入当日实时库存量"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="供应情况: 1-充足 2-较充足 3-短缺 4-严重短缺" prop="supplyStatus">
        <el-select
          v-model="queryParams.supplyStatus"
          placeholder="请选择供应情况: 1-充足 2-较充足 3-短缺 4-严重短缺"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
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
          v-hasPermi="['shortage:report-record:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['shortage:report-record:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编码" align="center" prop="id" />
      <el-table-column label="专区ID" align="center" prop="zoneId" />
      <el-table-column label="药品配置ID" align="center" prop="drugConfigId" />
      <el-table-column label="机构ID" align="center" prop="deptId" />
      <el-table-column label="填报周期(YYYY-WW)" align="center" prop="reportWeek" />
      <el-table-column label="填报日期" align="center" prop="reportDate" />
      <el-table-column label="本周累计使用量" align="center" prop="weekUsageAmount" />
      <el-table-column label="当日实时库存量" align="center" prop="currentStockAmount" />
      <el-table-column label="供应情况: 1-充足 2-较充足 3-短缺 4-严重短缺" align="center" prop="supplyStatus" />
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
            v-hasPermi="['shortage:report-record:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['shortage:report-record:delete']"
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
  <ReportRecordForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { ReportRecordApi, ReportRecordVO } from '@/api/shortage/reportrecord'
import ReportRecordForm from './ReportRecordForm.vue'

/** 药品填报记录 列表 */
defineOptions({ name: 'ReportRecord' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<ReportRecordVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  zoneId: undefined,
  drugConfigId: undefined,
  deptId: undefined,
  reportWeek: undefined,
  reportDate: [],
  weekUsageAmount: undefined,
  currentStockAmount: undefined,
  supplyStatus: undefined,
  createTime: [],
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReportRecordApi.getReportRecordPage(queryParams)
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
    await ReportRecordApi.deleteReportRecord(id)
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
    const data = await ReportRecordApi.exportReportRecord(queryParams)
    download.excel(data, '药品填报记录.xls')
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
