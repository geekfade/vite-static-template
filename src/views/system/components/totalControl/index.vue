<script setup lang="ts">
import { ReMain, ReFooter } from "../index";
import { useColumns } from "./columns";
defineOptions({
  name: "totalControl",
});
const {
  params,
  selectedKey,
  equipmentMap,
  filterDeviceStatus,
  handleChangeAction,
} = useColumns();
</script>
<template>
  <ReMain>
    <template v-for="(item, index) in equipmentMap[selectedKey]">
      <a-flex
        v-if="filterDeviceStatus(params.areaIds, [item])"
        :key="index"
        class="grid gap-2 relative"
        :class="{
          'opacity-30': !item.offline,
        }"
      >
        <div
          v-if="!item.offline"
          class="absolute inset-0 w-full bg-no-repeat bg-[length:20%] bg-[center_100px] z-10"
          :style="{
            backgroundImage: `url('assets/totalControl/offline.svg')`,
          }"
        />
        <a-row class="flex bg-[#2f2b29] h-64">
          <a-col
            class="flex-1 grid justify-center items-center cursor-pointer"
            @click="handleChangeAction('control', item)"
          >
            <a-spin
              :spinning="item.id === params.loading"
              size="large"
              class="absolute w-full h-full grid place-content-center bg-gray-500 bg-opacity-70"
            />
            <p
              class="flex justify-center gap-1"
              :style="{
                '--color': item.powerstate ? '#53ef9d' : '#48433C',
              }"
            >
              <span
                v-for="k in 3"
                :key="k"
                class="bg-[--color] rounded-full w-4 h-4 block drop-shadow-[0_0_10px_--color]"
              />
            </p>
            <img
              src="/src/assets/totalControl/zk03.png"
              alt=""
              class="w-14 h-14"
            />
            <p
              class="text-xs text-center h-5"
              :class="[item.offline ? 'bg-[#e4d480]' : 'bg-[#e4d4804d]']"
            >
              {{ item.offline ? "在线" : "离线" }}
            </p>
          </a-col>
          <a-col
            class="flex-[1.1] bg-[#292624] grid items-center justify-center cursor-pointer"
            @click="handleChangeAction('model', [item.DeviceName])"
          >
            <p
              v-for="(item1, index1) in [
                {
                  name: '单项电压',
                  unit: 'V',
                },
                {
                  name: '单相两线电流',
                  unit: 'A',
                },
                {
                  name: '单相L线温',
                  unit: '℃',
                },
              ]"
              :key="index1"
              class="text-lg grid text-white"
            >
              <span class="text-[#e6d1a4]">{{ item1.name }}</span>
              <span
                >--
                <b> {{ item1.unit }}</b>
              </span>
            </p>
          </a-col>
        </a-row>
        <a-col class="text-center text-white">
          <p class="text-lg">{{ item.area_name }}</p>
          <p class="text-2xl">{{ item.nickName }}</p>
        </a-col>
      </a-flex>
    </template>
  </ReMain>
  <ReFooter>
    <a-button @click="handleChangeAction('allControl', { powerstate: 1 })"
      >全开</a-button
    >
    <a-button @click="handleChangeAction('allControl', { powerstate: 0 })"
      >全关</a-button
    >
  </ReFooter>
</template>
<style lang="scss" scoped></style>
