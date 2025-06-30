<template>
  <div class="app-container">
    <!-- 版本管理区域 -->
    <ContentWrap>
      <el-card shadow="never" class="mb-4">
        <template #header>
          <div class="card-header">
            <span>版本管理</span>
            <div class="header-actions">
              <el-button
                type="primary"
                @click="openImportDialog"
                v-hasPermi="['drug:ypid-version:import']"
              >
                <Icon icon="ep:upload" class="mr-5px" /> 导入标准库
              </el-button>
              <el-button @click="downloadTemplate">
                <Icon icon="ep:download" class="mr-5px" /> 下载模板
              </el-button>
            </div>
          </div>
        </template>

        <el-row :gutter="20" class="version-info">
          <el-col :span="8">
            <div class="version-selector">
              <label>当前版本：</label>
              <el-select
                v-model="currentVersionId"
                placeholder="请选择版本"
                @change="handleVersionChange"
                class="w-full"
              >
                <el-option
                  v-for="version in versionList"
                  :key="version.id"
                  :label="`${version.versionCode} - ${version.versionName}`"
                  :value="version.id"
                >
                  <div class="version-option">
                    <span>{{ version.versionCode }} - {{ version.versionName }}</span>
                    <el-tag :type="getVersionStatusType(version.status)" size="small" class="ml-2">
                      {{ getVersionStatusText(version.status) }}
                    </el-tag>
                  </div>
                </el-option>
              </el-select>
            </div>
          </el-col>

          <el-col :span="16">
            <div class="version-details" v-if="currentVersion">
              <el-descriptions :column="3" size="small">
                <el-descriptions-item label="版本名称">
                  {{ currentVersion.versionName }}
                </el-descriptions-item>
                <el-descriptions-item label="导入类型">
                  <el-tag :type="currentVersion.importType === 1 ? 'success' : 'warning'">
                    {{ currentVersion.importType === 1 ? '全量导入' : '增量导入' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="getVersionStatusType(currentVersion.status)">
                    {{ getVersionStatusText(currentVersion.status) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="总记录数">
                  {{ formatNumber(currentVersion.totalRecords) }}
                </el-descriptions-item>
                <el-descriptions-item label="新增记录">
                  {{ formatNumber(currentVersion.newRecords) }}
                </el-descriptions-item>
                <el-descriptions-item label="更新记录">
                  {{ formatNumber(currentVersion.updatedRecords) }}
                </el-descriptions-item>
              </el-descriptions>

              <div class="version-actions mt-3">
                <el-button
                  v-if="currentVersion.status === 2"
                  type="success"
                  @click="publishVersion"
                  v-hasPermi="['drug:ypid-version:publish']"
                >
                  发布版本
                </el-button>
                <el-button
                  v-if="currentVersion.status === 2"
                  @click="importToCurrentVersion"
                  v-hasPermi="['drug:ypid-version:import']"
                >
                  继续导入
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </ContentWrap>

    <!-- 数据查询区域 -->
    <ContentWrap>
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="100px"
      >
        <el-form-item label="YPID" prop="ypid">
          <el-input
            v-model="queryParams.ypid"
            placeholder="请输入YPID"
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
        <el-form-item label="通用名" prop="genericNameCn">
          <el-input
            v-model="queryParams.genericNameCn"
            placeholder="请输入通用名"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="生产企业" prop="manufacturerName">
          <el-input
            v-model="queryParams.manufacturerName"
            placeholder="请输入生产企业"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            class="!w-240px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="2" />
          </el-select>
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

    <!-- 数据列表 -->
    <ContentWrap>
      <el-table
        v-loading="loading"
        :data="list"
        :stripe="true"
        :show-overflow-tooltip="true"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="YPID" prop="ypid" width="120" fixed="left" />
        <el-table-column label="产品名称" prop="productName" width="200" show-overflow-tooltip />
        <el-table-column
          label="标化产品名称"
          prop="standardProductName"
          width="200"
          show-overflow-tooltip
        />
        <el-table-column label="通用名" prop="genericNameCn" width="150" />
        <el-table-column label="商品名" prop="tradeName" width="150" />
        <el-table-column
          label="生产企业"
          prop="manufacturerName"
          width="200"
          show-overflow-tooltip
        />
        <el-table-column label="剂型" prop="dosageForm" width="100" />
        <el-table-column label="规格" prop="specification" width="120" />
        <el-table-column label="转换系数" prop="conversionFactor" width="100" />
        <el-table-column label="基药" width="60">
          <template #default="scope">
            <el-tag v-if="scope.row.isBasicDrug === 1" type="success" size="small">是</el-tag>
            <el-tag v-else type="info" size="small">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="集采" width="60">
          <template #default="scope">
            <el-tag v-if="scope.row.isCentralizedProcurement === 1" type="success" size="small"
              >是</el-tag
            >
            <el-tag v-else type="info" size="small">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small">
              {{ scope.row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          prop="createTime"
          :formatter="dateFormatter"
          width="180px"
        />
        <el-table-column label="操作" align="center" width="150" fixed="right">
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

    <!-- 导入对话框 -->
    <ImportDialog ref="importDialogRef" @success="handleImportSuccess" />

    <!-- 表单弹窗：添加/修改 -->
    <StandardLibraryForm ref="formRef" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { StandardLibraryApi, StandardLibraryVO } from '@/api/drug/ypid/standardlibrary'
import { YpidVersionApi, YpidVersionVO } from '@/api/drug/ypid/version'
import StandardLibraryForm from './StandardLibraryForm.vue'
import ImportDialog from './ImportDialog.vue'

defineOptions({ name: 'StandardLibraryIndex' })

const message = useMessage()
const { t } = useI18n()

// 数据状态
const loading = ref(true)
const list = ref<StandardLibraryVO[]>([])
const total = ref(0)
const exportLoading = ref(false)
const selectedRows = ref<StandardLibraryVO[]>([])

// 版本相关
const versionList = ref<YpidVersionVO[]>([])
const currentVersionId = ref<number>()
const currentVersion = ref<YpidVersionVO>()

// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  versionId: undefined,
  ypid: undefined,
  productName: undefined,
  genericNameCn: undefined,
  manufacturerName: undefined,
  status: undefined
})

const queryFormRef = ref()
const formRef = ref()
const importDialogRef = ref()

/** 初始化 */
onMounted(async () => {
  await loadVersionList()
  if (versionList.value.length > 0) {
    // 默认选择已发布的版本，如果没有则选择第一个
    const publishedVersion = versionList.value.find((v) => v.status === 4)
    currentVersionId.value = publishedVersion?.id || versionList.value[0].id
    await handleVersionChange(currentVersionId.value)
  }
})

/** 加载版本列表 */
const loadVersionList = async () => {
  try {
    versionList.value = await YpidVersionApi.getYpidVersionList()
  } catch (error) {
    console.error('加载版本列表失败:', error)
  }
}

/** 版本切换 */
const handleVersionChange = async (versionId: number) => {
  if (!versionId) return

  try {
    // 获取版本详情
    currentVersion.value = await YpidVersionApi.getYpidVersion(versionId)

    // 更新查询参数
    queryParams.versionId = versionId

    // 刷新数据列表
    await getList()
  } catch (error) {
    console.error('获取版本详情失败:', error)
  }
}

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
  queryParams.versionId = currentVersionId.value
  handleQuery()
}

/** 多选 */
const handleSelectionChange = (selection: StandardLibraryVO[]) => {
  selectedRows.value = selection
}

/** 新增/修改操作 */
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id, currentVersionId.value)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await StandardLibraryApi.deleteStandardLibrary(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await StandardLibraryApi.exportStandardLibrary(queryParams)
    download.excel(data, `药品标准库_${currentVersion.value?.versionCode}.xls`)
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 打开导入对话框 */
const openImportDialog = () => {
  importDialogRef.value.open()
}

/** 导入成功回调 */
const handleImportSuccess = async () => {
  await loadVersionList()
  await getList()
}

/** 继续导入到当前版本 */
const importToCurrentVersion = () => {
  importDialogRef.value.openForVersion(currentVersionId.value)
}

/** 发布版本 */
const publishVersion = async () => {
  try {
    await message.confirm('确认发布此版本？发布后将成为当前有效版本。')
    await YpidVersionApi.publishVersion(currentVersionId.value!)
    message.success('版本发布成功')
    await loadVersionList()
    await handleVersionChange(currentVersionId.value!)
  } catch {}
}

/** 下载模板 */
const downloadTemplate = async () => {
  try {
    const data = await YpidVersionApi.getImportTemplate()
    download.excel(data, 'YPID标准库导入模板.xls')
  } catch {
    message.error('下载模板失败')
  }
}

/** 工具方法 */
const getVersionStatusType = (status: number) => {
  const statusMap = {
    1: 'warning', // 导入中
    2: 'success', // 导入成功
    3: 'danger', // 导入失败
    4: 'primary', // 已发布
    5: 'info' // 已停用
  }
  return statusMap[status] || 'info'
}

const getVersionStatusText = (status: number) => {
  const statusMap = {
    1: '导入中',
    2: '导入成功',
    3: '导入失败',
    4: '已发布',
    5: '已停用'
  }
  return statusMap[status] || '未知'
}

const formatNumber = (num: number) => {
  return num ? num.toLocaleString() : 0
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-info {
  margin-top: 16px;
}

.version-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.version-details {
  padding-left: 20px;
  border-left: 1px solid #e4e7ed;
}

.version-actions {
  display: flex;
  gap: 8px;
}
</style>
