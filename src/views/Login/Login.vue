<template>
  <div
    :class="prefixCls"
    class="relative h-[100%] lt-md:px-10px lt-sm:px-10px lt-xl:px-10px lt-xl:px-10px"
  >
    <div class="relative mx-auto h-full flex">
      <div
        :class="`${prefixCls}__left flex-1 bg-gray-500 bg-opacity-20 relative p-30px lt-xl:hidden overflow-x-hidden overflow-y-auto`"
      >
        <!-- 左上角的 logo + 系统标题 -->
        <div class="relative text-white">
          <div class="flex items-center">
            <img alt="" class="mr-10px h-48px w-48px" src="@/assets/imgs/logo.png" />
            <div class="flex flex-col">
              <span class="text-20px font-bold leading-tight">{{ underlineToHump(appStore.getTitle) }}</span>
              <span class="text-14px opacity-80 mt-1">{{ appStore.getTitleEn }}</span>
            </div>
          </div>
        </div>
        <!-- 左边的背景图 + 欢迎语 -->
        <div class="h-[calc(100%-60px)] flex items-center justify-center">
          <TransitionGroup
            appear
            enter-active-class="animate__animated animate__bounceInLeft"
            tag="div"
            class="w-full flex flex-col items-center justify-center"
          >
            <img key="1" alt="" class="w-350px mb-8" src="@/assets/imgs/logo-box-bg.png" />
            <div key="2" class="system-description-wrapper">
<!--              <p class="system-description text-white text-center mb-8">
                基于智能规则处理的病案首页质量控制平台，帮助医疗机构提高数据质量，支持精确决策<br />
              </p>-->
            </div>
            <div key="3" class="login-features w-full max-w-400px">
              <div class="feature-item">
                <div class="feature-icon">
                  <el-icon><Check /></el-icon>
                </div>
                <span>智能规则配置，灵活管理质控标准</span>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <el-icon><Check /></el-icon>
                </div>
                <span>数据自动处理，提高质控效率</span>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <el-icon><Check /></el-icon>
                </div>
                <span>多维度分析，全面把控质量问题</span>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <el-icon><Check /></el-icon>
                </div>
                <span>全流程管理，前置后置后全覆盖</span>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
      <div
        class="relative flex-1 p-30px dark:bg-[var(--login-bg-color)] lt-sm:p-10px overflow-x-hidden overflow-y-auto"
      >
        <!-- 右上角的主题、语言选择 -->
        <div
          class="flex items-center justify-between at-2xl:justify-end at-xl:justify-end"
          style="color: var(--el-text-color-primary)"
        >
          <div class="flex items-center at-2xl:hidden at-xl:hidden">
            <img alt="" class="mr-10px h-48px w-48px" src="@/assets/imgs/logo.png" />
            <span class="text-20px font-bold">{{ underlineToHump(appStore.getTitle) }}</span>
          </div>
          <div class="flex items-center justify-end space-x-10px h-48px">
            <ThemeSwitch />
            <LocaleDropdown />
          </div>
        </div>
        <!-- 右边的登录界面 -->
        <Transition appear enter-active-class="animate__animated animate__bounceInRight">
          <div
            class="m-auto h-[calc(100%-60px)] w-[100%] flex items-center at-2xl:max-w-500px at-lg:max-w-500px at-md:max-w-500px at-xl:max-w-500px"
          >
            <!-- 账号登录 -->
            <LoginForm class="m-auto h-auto p-20px lt-xl:(rounded-3xl light:bg-white)" />
            <!-- 手机登录 -->
            <MobileForm class="m-auto h-auto p-20px lt-xl:(rounded-3xl light:bg-white)" />
            <!-- 二维码登录 -->
            <QrCodeForm class="m-auto h-auto p-20px lt-xl:(rounded-3xl light:bg-white)" />
            <!-- 注册 -->
            <RegisterForm class="m-auto h-auto p-20px lt-xl:(rounded-3xl light:bg-white)" />
            <!-- 三方登录 -->
            <SSOLoginVue class="m-auto h-auto p-20px lt-xl:(rounded-3xl light:bg-white)" />
            <!-- 忘记密码 -->
            <ForgetPasswordForm class="m-auto h-auto p-20px lt-xl:(rounded-3xl light:bg-white)" />
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { underlineToHump } from '@/utils'
import { useI18n } from '@/hooks/web/useI18n'
import { useDesign } from '@/hooks/web/useDesign'
import { useAppStore } from '@/store/modules/app'
import { ThemeSwitch } from '@/layout/components/ThemeSwitch'
import { LocaleDropdown } from '@/layout/components/LocaleDropdown'
import { Check } from '@element-plus/icons-vue'

import {
  LoginForm,
  MobileForm,
  QrCodeForm,
  RegisterForm,
  SSOLoginVue,
  ForgetPasswordForm
} from './components'

defineOptions({ name: 'Login' })

const { t } = useI18n()
const appStore = useAppStore()
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('login')
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-login;

.#{$prefix-cls} {
  overflow: auto;

  &__left {
    &::before {
      position: absolute;
      top: 0;
      left: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      background-image: url('@/assets/svgs/login-bg.svg');
      background-position: center;
      background-repeat: no-repeat;
      content: '';
    }
  }
}

// 系统描述样式
.system-description-wrapper {
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  }
}

.system-description {
  font-size: 16px;
  line-height: 1.8;
  opacity: 0.95;
  max-width: 450px;
  margin: 0 auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

// 功能特性列表样式
.login-features {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: white;
  opacity: 0.95;
  padding: 8px 0;
  transition: all 0.3s ease;
  
  &:hover {
    opacity: 1;
    transform: translateX(5px);
  }

  .feature-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin-right: 14px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    font-size: 14px;
    font-weight: bold;
    flex-shrink: 0;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    .el-icon {
      color: white;
      font-size: 16px;
    }
  }

  span {
    flex: 1;
    line-height: 1.4;
  }
}

// 响应式适配
@media (max-height: 800px) {
  .system-description {
    font-size: 15px;
    padding: 16px;
    margin-bottom: 1.5rem !important;
  }

  .login-features {
    gap: 8px;
  }

  .feature-item {
    font-size: 13px;
    padding: 6px 0;

    .feature-icon {
      width: 24px;
      height: 24px;
      margin-right: 10px;
      
      .el-icon {
        font-size: 14px;
      }
    }
  }
}

@media (max-height: 700px) {
  .system-description {
    font-size: 14px;
    line-height: 1.6;
    padding: 14px;
    margin-bottom: 1rem !important;
  }

  .login-features {
    gap: 6px;
  }

  .feature-item {
    font-size: 12px;
    padding: 4px 0;

    .feature-icon {
      width: 22px;
      height: 22px;
      margin-right: 8px;
      
      .el-icon {
        font-size: 12px;
      }
    }
  }
}
</style>

<style lang="scss">
.dark .login-form {
  .el-divider__text {
    background-color: var(--login-bg-color);
  }

  .el-card {
    background-color: var(--login-bg-color);
  }
}
</style>
