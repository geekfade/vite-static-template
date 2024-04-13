<script setup lang="ts">
import { emitter } from "@/utils/mitt";
import { useNav } from "@/layout/hooks/useNav";
import { ReSettingComponent } from "@/components";
defineOptions({
  name: "ReNavBar",
});
const { bankName } = useNav();
</script>
<template>
  <a-flex gap="middle" vertical>
    <a-flex justify="end">
      <a-affix :offset-top="0" class="w-14 h-14 text-center">
        <!-- <img src="@/assets/vue.svg" alt="" class="w-14 h-14" /> -->
      </a-affix>
    </a-flex>
    <a-flex gap="middle" justify="space-between" align="center" class="px-8">
      <a-col class="flex">
        <a-tag class="bg-[#282520] flex items-center gap-2 rounded-3xl">
          <template #icon>
            <img src="@/assets/bg/tips.png" alt="" class="w-4 h-4" />
          </template>
          <span class="text-[#e6d0ab] text-sm">{{ bankName }}</span>
        </a-tag>
        <a-button
          id="setting"
          class="bg-[#282520] text-[#e6d0ab]"
          shape="round"
          @click="
            emitter.emit('openSetting', {
              visible: true,
              key: '1',
            })
          "
        >
          设置
        </a-button>
      </a-col>
      <a-col>
        <a-button
          class="bg-[#282520] text-[#e6d0ab]"
          shape="round"
          size="large"
          @click="$router.push('/system')"
        >
          进入系统
        </a-button>
      </a-col>
    </a-flex>
  </a-flex>
  <ReSettingComponent />
</template>
<style lang="scss" scoped></style>
