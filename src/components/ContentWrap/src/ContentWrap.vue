<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'ContentWrap' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('content-wrap')

defineProps({
  title: propTypes.string.def(''),
  message: propTypes.string.def(''),
  bodyStyle: propTypes.object.def({ padding: '10px' })
})
</script>

<template>
  <ElCard :body-style="bodyStyle" :class="[prefixCls, 'mb-20px']" shadow="never">
    <template v-if="title" #header>
      <div class="flex items-center">
        <span class="text-16px font-700">{{ title }}</span>
        <ElTooltip v-if="message" effect="dark" placement="right">
          <template #content>
            <div class="max-w-200px">{{ message }}</div>
          </template>
          <Icon :size="14" class="ml-5px" icon="ep:question-filled" />
        </ElTooltip>
        <div class="flex flex-grow pl-20px">
          <slot name="header"></slot>
        </div>
      </div>
    </template>
    <slot></slot>
  </ElCard>
</template>

<style scoped>
.v-content-wrap {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s ease;
}

.v-content-wrap:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 覆盖 Element Plus Card 的默认样式 */
:deep(.el-card) {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: none;
  transition: all 0.3s ease;
}

:deep(.el-card:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.el-card__header) {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 18px 24px;
}

:deep(.el-card__body) {
  background: #ffffff;
}
</style>
