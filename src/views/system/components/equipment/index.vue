<script setup lang="ts">
import { ReMain, ReFooter } from "../index";
import { useColumns } from "./columns";
defineOptions({
  name: "equipment",
});
const {
  params,
  selectedKey,
  equipmentMap,
  getDeviceStatusImage,
  handleChangeAction,
  filterDeviceStatus,
} = useColumns();
</script>
<template>
  <ReMain>
    <template v-for="(item, index) in equipmentMap[selectedKey]" :key="index">
      <a-col
        v-if="filterDeviceStatus(params.areaIds, [item])"
        class="h-56 flex w-full gap-[2px] cursor-pointer justify-center"
        align="middle"
        justify="center"
        @click="handleChangeAction('device', item)"
      >
        <img
          v-if="!getDeviceStatusImage(item).offline"
          class="absolute z-10 top-1/3 w-1/4"
          :src="getDeviceStatusImage(item).offlineUrl"
        />
        <a-col class="h-full py-6">
          <a-spin
            :spinning="item.loading"
            class="absolute top-[5.05rem] z-10 left-0 right-0 scale-150"
            size="large"
          />
          <a-image
            class="relative"
            :preview="false"
            :src="getDeviceStatusImage(item).src"
          />
          <p
            v-for="device in item.devices"
            :key="device.id"
            class="rounded-full w-[5px] h-[5px] bg-[#787068] mx-auto absolute left-0 right-0 bottom-[59px]"
            :class="{ 'bg-[#fcc869]': getDeviceStatusImage(item).state }"
          />
        </a-col>
        <p
          class="absolute bottom-0 text-xl left-0 right-0 text-center text-white"
        >
          {{ item.equipment_name }}
        </p>
      </a-col>
    </template>
  </ReMain>
  <ReFooter>
    <a-button @click="handleChangeAction('switch', { powerstate: 1 })"
      >全开</a-button
    >
    <a-button @click="handleChangeAction('switch', { powerstate: 0 })"
      >全关</a-button
    >
  </ReFooter>
</template>
<style lang="scss" scoped></style>
