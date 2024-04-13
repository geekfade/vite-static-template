<script setup lang="ts">
import { useColumns } from "./columns";
import { ReMain, ReFooter } from "../index";
defineOptions({
  name: "lamplight",
});
const {
  params,
  selectedKey,
  equipmentMap,
  getEquipLampOnline,
  handleChangeAction,
  filterDeviceStatus,
} = useColumns();
</script>
<template>
  <ReMain>
    <template v-for="(item, index) in equipmentMap[selectedKey]">
      <a-col
        v-if="filterDeviceStatus(params.areaIds, item)"
        :key="index"
        class="h-80 flex w-full gap-[2px]"
      >
        <a-row
          v-for="(val, index) in item"
          :key="index"
          align="middle"
          class="h-3/4 grid w-full bg-[#373330]"
        >
          <a-spin size="large" class="h-full" :spinning="val.loading">
            <a-col
              class="grid justify-items-center h-full py-6 text-white cursor-pointer content-between"
              @click="handleChangeAction('singleLight', val)"
            >
              <a-image
                :preview="false"
                :width="60"
                :height="60"
                :src="getEquipLampOnline(val).src"
              />
              <div>
                <p class="text-lg text-[#b0afae]">
                  {{ val?.equipment_name }}
                </p>
                <p
                  v-for="device in val.devices"
                  :key="device.id"
                  class="rounded-full w-[5px] h-[5px] bg-[#787068] mx-auto mt-4"
                  :class="{
                    'bg-[#fcc869]': item.offline && item.powerstate,
                  }"
                />
              </div>
            </a-col>
          </a-spin>
        </a-row>
        <p
          class="absolute bottom-0 left-0 right-0 text-xl text-center text-white"
        >
          {{ item[0]?.area_name }}
        </p>
      </a-col>
    </template>
  </ReMain>
  <ReFooter>
    <a-button @click="handleChangeAction('smartLight')">智能灯控制</a-button>
    <a-button @click="handleChangeAction('switch', { powerstate: 1 })"
      >全开</a-button
    >
    <a-button @click="handleChangeAction('switch', { powerstate: 0 })"
      >全关</a-button
    >
  </ReFooter>
</template>
<style lang="scss" scoped>
:deep(.ant-spin-nested-loading) {
  height: 100%;
  .ant-spin-container {
    height: 100%;
  }
}
</style>
