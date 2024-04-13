<script setup lang="ts">
import { getImageUrl } from "@/utils";
import { useAppStoreHook } from "@/store/modules/app";
</script>
<template>
  <div class="flex justify-center items-center h-full">
    <a-row
      align="middle"
      class="text-white w-2/4 h-2/4 border-solid border-[#f6ab00] border-4 rounded-3xl overflow-hidden"
    >
      <a-col :flex="7">
        <img
          :src="getImageUrl('svg/logo.svg')"
          alt=""
          class="object-none m-auto"
        />
      </a-col>
      <a-col :flex="0.5" class="bg-[#0f0e0d] h-full px-20 grid content-center">
        <h1>当前设备未授权</h1>
        <h2>请联系管理员获取授权</h2>
        <a-input-group class="my-6 h-10">
          <a-input
            v-model:value="useAppStoreHook().serial"
            style="width: calc(100% - 100px)"
            placeholder="手动验证授权"
            class="text-2xl"
          />
          <a-button
            type="primary"
            class="bg-[#877045] text-2xl h-full"
            @click="useAppStoreHook().setSerial(useAppStoreHook().serial)"
            >验证</a-button
          >
        </a-input-group>
      </a-col>
    </a-row>
  </div>
</template>
<style lang="scss" scoped>
h1,
h2 {
  @apply text-3xl font-normal;
  text-align-last: justify;
}
</style>
