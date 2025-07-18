<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="分类编码" prop="categoryCode">
        <el-input
          v-model="formData.categoryCode"
          placeholder="请输入分类编码，如：IMPORT_TABLES"
          :disabled="formType === 'update' && formData.categoryType === 1"
        />
      </el-form-item>

      <el-form-item label="分类名称" prop="categoryName">
        <el-input v-model="formData.categoryName" placeholder="请输入分类名称" />
      </el-form-item>

      <el-form-item label="分类类型" prop="categoryType">
        <el-select
          v-model="formData.categoryType"
          placeholder="请选择分类类型"
          :disabled="formType === 'update'"
          class="w-full"
        >
          <el-option label="系统内置" :value="1" />
          <el-option label="用户自定义" :value="2" />
        </el-select>
      </el-form-item>

      <el-form-item label="排序" prop="sortOrder">
        <el-input-number
          v-model="formData.sortOrder"
          :min="0"
          :max="999"
          placeholder="排序值，数字越小越靠前"
          class="w-full"
        />
      </el-form-item>

      <el-form-item label="图标" prop="icon">
        <!-- 使用 IconSelect 组件替代原有的图标选择 -->
        <IconSelect v-model="formData.icon" clearable />

        <!-- 保留常用图标快捷选择 -->
        <div class="mt-3">
          <div class="text-xs text-gray-600 mb-2">常用图标快捷选择：</div>
          <div class="flex flex-wrap gap-2">
            <el-tag
              v-for="icon in commonIcons"
              :key="icon.value"
              size="small"
              class="cursor-pointer hover:scale-105 transition-transform"
              :class="{ 'border-primary text-primary': formData.icon === icon.value }"
              @click="formData.icon = icon.value"
            >
              <!-- 修复：size 属性应该是数字类型，不是字符串 -->
              <Icon :icon="icon.value" :size="12" class="mr-1" />
              {{ icon.label }}
            </el-tag>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入分类描述信息"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="是否启用" prop="isActive">
        <el-switch
          v-model="formData.isActive"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import {
  QcBuilderDatasourceCategoryApi,
  QcBuilderDatasourceCategoryVO
} from '@/api/drug/qc/builder'
defineOptions({ name: 'DataSourceCategoryForm' })
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  categoryCode: undefined,
  categoryName: undefined,
  categoryType: 2, // 默认用户自定义
  sortOrder: 0,
  icon: undefined,
  description: undefined,
  isActive: 1 // 默认启用
})

// 常用图标 - 优化图标选择
const commonIcons = [
  { label: '导入', value: 'fa-solid:file-import' },
  { label: '数据库', value: 'fa-solid:database' },
  { label: '仓库', value: 'fa-solid:warehouse' },
  { label: '表格', value: 'fa-solid:table' },
  { label: '设置', value: 'fa-solid:cogs' },
  { label: '文件夹', value: 'fa-solid:folder-open' },
  { label: '云端', value: 'fa-solid:cloud' },
  { label: '服务器', value: 'fa-solid:server' },
  { label: '链接', value: 'fa-solid:link' },
  { label: 'API', value: 'fa-solid:plug' }
]

const formRules = reactive({
  categoryCode: [
    { required: true, message: '分类编码不能为空', trigger: 'blur' },
    { pattern: /^[A-Z_]+$/, message: '分类编码只能包含大写字母和下划线', trigger: 'blur' }
  ],
  categoryName: [
    { required: true, message: '分类名称不能为空', trigger: 'blur' },
    { min: 2, max: 100, message: '分类名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  categoryType: [{ required: true, message: '分类类型不能为空', trigger: 'change' }],
  sortOrder: [{ required: true, message: '排序不能为空', trigger: 'blur' }]
})

const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增数据源分类' : '编辑数据源分类'
  formType.value = type
  resetForm()

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await QcBuilderDatasourceCategoryApi.getQcBuilderDatasourceCategory(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()

  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as QcBuilderDatasourceCategoryVO
    if (formType.value === 'create') {
      await QcBuilderDatasourceCategoryApi.createQcBuilderDatasourceCategory(data)
      message.success('创建成功')
    } else {
      await QcBuilderDatasourceCategoryApi.updateQcBuilderDatasourceCategory(data)
      message.success('更新成功')
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    categoryCode: undefined,
    categoryName: undefined,
    categoryType: 2, // 默认用户自定义
    sortOrder: 0,
    icon: undefined,
    description: undefined,
    isActive: 1 // 默认启用
  }
  formRef.value?.resetFields()
}
</script>

<style scoped>
/* 优化样式 */
.border-primary {
  border-color: var(--el-color-primary) !important;
}

.text-primary {
  color: var(--el-color-primary) !important;
}

/* 图标标签悬浮效果 */
.el-tag:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}
</style>
