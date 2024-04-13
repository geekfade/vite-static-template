<script setup lang="ts">
import { useColumns } from "./columns";
defineOptions({
  name: "airConditioner",
});
const {
  params,
  selectedKey,
  equipmentMap,
  getImageUrl,
  filterDeviceStatus,
  getTelecontrolKey,
  handleChangeModel,
} = useColumns();
</script>
<template>
  <a-flex vertical class="h-full text-white">
    <a-row class="w-full">
      <a-col
        class="px-9 py-9 bg-[#2d2928] w-full grid grid-cols-[20rem_repeat(2,1fr)] items-stretch gap-24"
      >
        <div class="leading-[5rem]">
          <span class="text-xl">全部</span>
          <p class="text-5xl">统一调整</p>
        </div>
        <div class="grid grid-cols-3 gap-10">
          <div
            v-for="(item, index) in params.allModel"
            :key="index"
            class="bg-[#48403d] grid place-content-evenly text-center font-light cursor-pointer"
            @click="() => item.onClick(item)"
          >
            <img
              v-if="item.icon"
              :src="
                getImageUrl(
                  `air/${
                    getTelecontrolKey(params.areaIds, item.model)?.uniteData ||
                    item.model + '_0'
                  }.svg`,
                )
              "
              alt=""
              class="w-14 h-14 mx-auto"
            />
            <span v-if="item.model == 'ac_temp'" class="text-5xl"
              >{{
                getTelecontrolKey(params.areaIds, item.model)?.value ||
                item.text
              }}<b class="text-2xl align-top">℃</b></span
            >
            <p class="text-xl">
              {{
                getTelecontrolKey(params.areaIds, item.model)?.singleData ||
                item.name
              }}
            </p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-10 ml-40">
          <span
            v-for="(item, index) in ['全开', '全关']"
            :key="index"
            :class="{
              'bg-[#877046]':
                index == 0 ||
                getTelecontrolKey(params.areaIds, 'ac_power')?.value,
            }"
            class="bg-[#48403d] grid place-content-center text-xl cursor-pointer"
            @click="handleChangeModel('ac_power', { powerstate: index })"
          >
            {{ item }}
          </span>
        </div>
      </a-col>
    </a-row>
    <a-row class="overflow-auto">
      <template
        v-for="(item, index) in equipmentMap[selectedKey]?.data"
        :key="index"
      >
        <a-col
          v-if="filterDeviceStatus(params.areaIds, [item])"
          class="mx-9 py-6 w-full grid grid-cols-[20rem_repeat(2,1fr)] items-stretch gap-24 border-b-2 border-[#48403d]"
        >
          <div class="leading-none">
            <span class="text-lg">{{ item.area_name }}</span>
            <p class="text-3xl">{{ item.equipment_name }}</p>
          </div>
          <div class="grid grid-cols-3 gap-10 items-center">
            <div
              v-for="(item1, index) in params.allModel"
              :key="index"
              class="grid place-content-center text-center font-light cursor-pointer border-[1px] border-[#be9b60] h-12"
              @click="() => item1.onClick(item)"
            >
              <span v-if="item1.icon" class="text-xl">{{
                getTelecontrolKey(item.id, item1.model)?.singleData ||
                item1.name
              }}</span>
              <span v-else-if="item1.model == 'ac_more'">{{ item.name }}</span>
              <span v-else class="text-xl"
                >{{
                  getTelecontrolKey(item.id, item1.model)?.value || item1.text
                }}<b class="text-base align-top">℃</b></span
              >
            </div>
          </div>
          <div class="grid grid-cols-2 gap-10 ml-40 items-center">
            <span
              v-for="(item2, index) in ['开', '关']"
              :key="index"
              :class="{
                'bg-[#877046]': index == 0 || item.telecontrol?.ac_power,
              }"
              class="bg-[#48403d] h-12 grid place-content-center text-xl cursor-pointer"
              @click="
                handleChangeModel('ac_power', {
                  ...item,
                  powerstate: index,
                })
              "
            >
              {{ item2 }}
            </span>
          </div>
        </a-col>
      </template>
    </a-row>
  </a-flex>
  <a-modal
    v-model:open="params.open"
    :centered="true"
    :destroyOnClose="true"
    :footer="null"
    width="auto"
    @cancel="handleChangeModel('cancel')"
  >
    <component :is="params.component" v-if="params.component" />
  </a-modal>
</template>
<style lang="scss" scoped></style>
