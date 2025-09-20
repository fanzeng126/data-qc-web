<template>
  <div class="head-container">
    <el-input v-model="regionName" class="mb-20px" clearable placeholder="请输入地区名称">
      <template #prefix>
        <Icon icon="ep:search" />
      </template>
    </el-input>
  </div>
  <div class="head-container">
    <el-tree
      ref="treeRef"
      :data="regionList"
      :expand-on-click-node="false"
      :filter-node-method="filterNode"
      :props="defaultProps"
      default-expand-all
      highlight-current
      node-key="id"
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <span class="tree-node">
          <Icon :icon="getRegionIcon(data.level)" class="node-icon" />
          <span>{{ node.label }}</span>
          <el-tag size="small" class="org-count-tag" v-if="data.orgCount > 0">
            {{ data.orgCount }}
          </el-tag>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script lang="ts" setup>
import { ElTree } from 'element-plus'
import { RegionsApi } from '@/api/system/regions'
import * as AreaOrgApi from '@/api/system/areaOrg'
import { defaultProps, handleTree } from '@/utils/tree'

defineOptions({ name: 'SystemUserRegionTree' })

const regionName = ref('')
const regionList = ref<Tree[]>([]) // 树形结构
const treeRef = ref<InstanceType<typeof ElTree>>()

/** 获得地区树 */
const getTree = async () => {
  try {
    // const res = await AreaOrgApi.getAreaTree()
    const res = await RegionsApi.getSimpleRegionsList()
    // regionList.value = await AreaOrgApi.getAreaTree()
    regionList.value.push(...handleTree(res))
  } catch (error) {
    // 如果 area-org API 不可用，降级使用原 regions API
/*    console.warn('area-org API不可用，使用regions API')
    const res = await RegionsApi.getSimpleRegionsList()
    regionList.value = []
    regionList.value.push(...handleTree(res))*/
  }
}

/** 获取地区图标 */
const getRegionIcon = (level: number) => {
  const icons = {
    1: 'ep:location', // 省
    2: 'ep:map-location', // 市
    3: 'ep:place' // 区
  }
  return icons[level] || 'ep:location'
}

/** 基于名字过滤 */
const filterNode = (name: string, data: Tree) => {
  if (!name) return true
  return data.name.includes(name)
}

/** 处理地区被点击 */
const handleNodeClick = async (row: { [key: string]: any }) => {
  emits('node-click', row)
}
const emits = defineEmits(['node-click'])

/** 监听regionName */
watch(regionName, (val) => {
  treeRef.value!.filter(val)
})

/** 初始化 */
onMounted(async () => {
  await getTree()
})
</script>

<style scoped lang="scss">
.tree-node {
  display: flex;
  align-items: center;
  flex: 1;

  .node-icon {
    margin-right: 6px;
    color: var(--el-color-primary);
  }

  .org-count-tag {
    margin-left: auto;
    margin-right: 8px;
  }
}
</style>
