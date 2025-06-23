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
      <el-form-item label="关联YPID版本表ID" prop="versionId">
        <el-input
          v-model="queryParams.versionId"
          placeholder="请输入关联YPID版本表ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="国家药管平台药品编码（YPID）" prop="ypid">
        <el-input
          v-model="queryParams.ypid"
          placeholder="请输入国家药管平台药品编码（YPID）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="国家医保药品编码" prop="medicalInsuranceCode">
        <el-input
          v-model="queryParams.medicalInsuranceCode"
          placeholder="请输入国家医保药品编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="药品本位码" prop="drugCode">
        <el-input
          v-model="queryParams.drugCode"
          placeholder="请输入药品本位码"
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
      <el-form-item label="标化产品名称" prop="standardProductName">
        <el-input
          v-model="queryParams.standardProductName"
          placeholder="请输入标化产品名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="通用名（中文）" prop="genericNameCn">
        <el-input
          v-model="queryParams.genericNameCn"
          placeholder="请输入通用名（中文）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="通用名（英文）" prop="genericNameEn">
        <el-input
          v-model="queryParams.genericNameEn"
          placeholder="请输入通用名（英文）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="商品名" prop="tradeName">
        <el-input
          v-model="queryParams.tradeName"
          placeholder="请输入商品名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="商品名（英文）" prop="tradeNameEn">
        <el-input
          v-model="queryParams.tradeNameEn"
          placeholder="请输入商品名（英文）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="生产企业名称" prop="manufacturerName">
        <el-input
          v-model="queryParams.manufacturerName"
          placeholder="请输入生产企业名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="生产企业编码" prop="manufacturerCode">
        <el-input
          v-model="queryParams.manufacturerCode"
          placeholder="请输入生产企业编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="上市许可持有人" prop="licenseHolder">
        <el-input
          v-model="queryParams.licenseHolder"
          placeholder="请输入上市许可持有人"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="批准文号" prop="approvalNumber">
        <el-input
          v-model="queryParams.approvalNumber"
          placeholder="请输入批准文号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="剂型名称" prop="dosageForm">
        <el-input
          v-model="queryParams.dosageForm"
          placeholder="请输入剂型名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="剂型分类码" prop="dosageFormCode">
        <el-input
          v-model="queryParams.dosageFormCode"
          placeholder="请输入剂型分类码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="制剂规格" prop="specification">
        <el-input
          v-model="queryParams.specification"
          placeholder="请输入制剂规格"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="规格标化" prop="standardSpecification">
        <el-input
          v-model="queryParams.standardSpecification"
          placeholder="请输入规格标化"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="制剂单位" prop="dosageUnit">
        <el-input
          v-model="queryParams.dosageUnit"
          placeholder="请输入制剂单位"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="最小销售包装单位" prop="minPackageUnit">
        <el-input
          v-model="queryParams.minPackageUnit"
          placeholder="请输入最小销售包装单位"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="转换系数" prop="conversionFactor">
        <el-input
          v-model="queryParams.conversionFactor"
          placeholder="请输入转换系数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="是否基本药物:0-否,1-是" prop="isBasicDrug">
        <el-input
          v-model="queryParams.isBasicDrug"
          placeholder="请输入是否基本药物:0-否,1-是"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="药品类别" prop="drugCategory">
        <el-input
          v-model="queryParams.drugCategory"
          placeholder="请输入药品类别"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="药理/功效分类" prop="pharmacologyCategory">
        <el-input
          v-model="queryParams.pharmacologyCategory"
          placeholder="请输入药理/功效分类"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="医保甲乙类" prop="medicalInsuranceType">
        <el-select
          v-model="queryParams.medicalInsuranceType"
          placeholder="请选择医保甲乙类"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="医保编号" prop="medicalInsuranceNumber">
        <el-input
          v-model="queryParams.medicalInsuranceNumber"
          placeholder="请输入医保编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="是否集中采购:0-否,1-是" prop="isCentralizedProcurement">
        <el-input
          v-model="queryParams.isCentralizedProcurement"
          placeholder="请输入是否集中采购:0-否,1-是"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="是否通过一致性评价:0-否,1-是" prop="isConsistencyEvaluation">
        <el-input
          v-model="queryParams.isConsistencyEvaluation"
          placeholder="请输入是否通过一致性评价:0-否,1-是"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="是否进口药:0-否,1-是" prop="isImportedDrug">
        <el-input
          v-model="queryParams.isImportedDrug"
          placeholder="请输入是否进口药:0-否,1-是"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态:1-启用,2-停用,3-已删除" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态:1-启用,2-停用,3-已删除"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="生效日期" prop="effectiveDate">
        <el-date-picker
          v-model="queryParams.effectiveDate"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="失效日期" prop="expiryDate">
        <el-date-picker
          v-model="queryParams.expiryDate"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
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
          v-hasPermi="['drug:standard-library:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['drug:standard-library:export']"
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
      <el-table-column label="关联YPID版本表ID" align="center" prop="versionId" />
      <el-table-column label="国家药管平台药品编码（YPID）" align="center" prop="ypid" />
      <el-table-column label="国家医保药品编码" align="center" prop="medicalInsuranceCode" />
      <el-table-column label="药品本位码" align="center" prop="drugCode" />
      <el-table-column label="产品名称" align="center" prop="productName" />
      <el-table-column label="标化产品名称" align="center" prop="standardProductName" />
      <el-table-column label="通用名（中文）" align="center" prop="genericNameCn" />
      <el-table-column label="通用名（英文）" align="center" prop="genericNameEn" />
      <el-table-column label="商品名" align="center" prop="tradeName" />
      <el-table-column label="商品名（英文）" align="center" prop="tradeNameEn" />
      <el-table-column label="生产企业名称" align="center" prop="manufacturerName" />
      <el-table-column label="生产企业编码" align="center" prop="manufacturerCode" />
      <el-table-column label="上市许可持有人" align="center" prop="licenseHolder" />
      <el-table-column label="批准文号" align="center" prop="approvalNumber" />
      <el-table-column label="剂型名称" align="center" prop="dosageForm" />
      <el-table-column label="剂型分类码" align="center" prop="dosageFormCode" />
      <el-table-column label="制剂规格" align="center" prop="specification" />
      <el-table-column label="规格标化" align="center" prop="standardSpecification" />
      <el-table-column label="制剂单位" align="center" prop="dosageUnit" />
      <el-table-column label="最小销售包装单位" align="center" prop="minPackageUnit" />
      <el-table-column label="转换系数" align="center" prop="conversionFactor" />
      <el-table-column label="是否基本药物:0-否,1-是" align="center" prop="isBasicDrug" />
      <el-table-column label="药品类别" align="center" prop="drugCategory" />
      <el-table-column label="药理/功效分类" align="center" prop="pharmacologyCategory" />
      <el-table-column label="医保甲乙类" align="center" prop="medicalInsuranceType" />
      <el-table-column label="医保编号" align="center" prop="medicalInsuranceNumber" />
      <el-table-column
        label="是否集中采购:0-否,1-是"
        align="center"
        prop="isCentralizedProcurement"
      />
      <el-table-column
        label="是否通过一致性评价:0-否,1-是"
        align="center"
        prop="isConsistencyEvaluation"
      />
      <el-table-column label="是否进口药:0-否,1-是" align="center" prop="isImportedDrug" />
      <el-table-column label="状态:1-启用,2-停用,3-已删除" align="center" prop="status" />
      <el-table-column
        label="生效日期"
        align="center"
        prop="effectiveDate"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="失效日期"
        align="center"
        prop="expiryDate"
        :formatter="dateFormatter"
        width="180px"
      />
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
            v-hasPermi="['drug:standard-library:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['drug:standard-library:delete']"
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
  <StandardLibraryForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { StandardLibraryApi, StandardLibraryVO } from '@/api/drug/ypid/standardlibrary'
import StandardLibraryForm from './StandardLibraryForm.vue'

/** 药品标准库 列表 */
defineOptions({ name: 'StandardLibrary' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<StandardLibraryVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  versionId: undefined,
  ypid: undefined,
  medicalInsuranceCode: undefined,
  drugCode: undefined,
  productName: undefined,
  standardProductName: undefined,
  genericNameCn: undefined,
  genericNameEn: undefined,
  tradeName: undefined,
  tradeNameEn: undefined,
  manufacturerName: undefined,
  manufacturerCode: undefined,
  licenseHolder: undefined,
  approvalNumber: undefined,
  dosageForm: undefined,
  dosageFormCode: undefined,
  specification: undefined,
  standardSpecification: undefined,
  dosageUnit: undefined,
  minPackageUnit: undefined,
  conversionFactor: undefined,
  isBasicDrug: undefined,
  drugCategory: undefined,
  pharmacologyCategory: undefined,
  medicalInsuranceType: undefined,
  medicalInsuranceNumber: undefined,
  isCentralizedProcurement: undefined,
  isConsistencyEvaluation: undefined,
  isImportedDrug: undefined,
  status: undefined,
  effectiveDate: [],
  expiryDate: [],
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await StandardLibraryApi.getStandardLibraryPage(queryParams)
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
    await StandardLibraryApi.deleteStandardLibrary(id)
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
    const data = await StandardLibraryApi.exportStandardLibrary(queryParams)
    download.excel(data, '药品标准库.xls')
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
