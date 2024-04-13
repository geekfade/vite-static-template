<script setup lang="ts">
import "animate.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/vue";
import dayjs from "dayjs";
import { PlusCircleFilled } from "@ant-design/icons-vue";
import { usePublicStoreHook } from "@/store/modules/public";
import { ReLunarCalendar } from "@/components";
import { useColumns } from "./columns";

defineOptions({
  name: "dashboard",
});
const { date, week, params, getAqiColor, getImageUrl, handleChangeScene } =
  useColumns();
</script>
<template>
  <a-row :gutter="60">
    <a-col :span="8">
      <a-flex vertical :gap="20" align="center" justify="center">
        <a-col class="text-center text-[#e8d0ae] font-[200]">
          <h1 class="text-[150px] my-5">{{ usePublicStoreHook().time }}</h1>
          <h1 class="text-5xl">{{ date }} {{ week }}</h1>
        </a-col>
        <a-col>
          <ReLunarCalendar />
        </a-col>
      </a-flex>
    </a-col>
    <a-col :span="15">
      <a-flex vertical :gap="70" align="center" justify="center">
        <a-col
          class="w-full h-[542px] text-center bg-[#1d191880] py-16 overflow-hidden"
        >
          <swiper>
            <swiper-slide>
              <a-list
                item-layout="vertical"
                :grid="{ column: 4 }"
                :data-source="usePublicStoreHook().weather"
                :loading="usePublicStoreHook().weather.length ? false : true"
              >
                <template #renderItem="{ item, index }">
                  <a-list-item
                    class="border-solid border-[#676058] border-r-2 text-[25px] leading-relaxed cursor-pointer text-nowrap"
                    :class="{ 'border-none': index == 3 }"
                    @click="params.active = index"
                  >
                    <div
                      v-if="index == params.active"
                      class="animate__animated animate__fadeInDown"
                    >
                      <a-image
                        :src="getImageUrl(`weather/${item.wea_img}.png`)"
                        :alt="item.wea_day"
                        :height="145"
                        :preview="false"
                      />
                      <div class="flex text-white text-left justify-center">
                        <h1 class="text-8xl m-0">
                          {{ item.tem }}
                        </h1>
                        <p class="grid text-xl content-between">
                          <sub class="text-xl">℃</sub>
                          <sup class="text-xl">{{ item.wea }}(实时)</sup>
                        </p>
                      </div>
                    </div>
                    <div v-else>
                      <h4 class="text-[#e5f7ee]">
                        {{ dayjs(item.date).format("ddd") }}
                      </h4>
                      <p class="text-[#909087]">{{ item.date }}</p>
                      <a-image
                        :src="getImageUrl(`weather/${item.wea_img}.png`)"
                        :alt="item.wea_day"
                        :height="160"
                        :preview="false"
                      />
                    </div>
                    <p class="text-white">{{ item.tem2 }}~{{ item.tem1 }}℃</p>
                    <p class="text-white my-2">{{ item.wea }}</p>
                    <p
                      :style="{
                        backgroundColor: getAqiColor(item.air),
                      }"
                      class="rounded-lg py-1"
                    >
                      {{ item.air }}{{ item.air_level }}
                    </p>
                  </a-list-item>
                </template>
              </a-list>
            </swiper-slide>
            <swiper-slide
              v-if="usePublicStoreHook().envPayLoad.deviceName"
              class="cursor-pointer"
            >
              <a-flex vertical :gap="20">
                <a-row
                  justify="space-between"
                  align="middle"
                  class="border-b border-[#343029] pb-5"
                >
                  <a-col
                    class="text-[#e8d0ae]"
                    flex="0.3"
                    push="1"
                    style="text-align-last: justify"
                  >
                    <h1 class="text-5xl my-2">环境监测</h1>
                    <p class="text-base">公司测试智能环境综合传感器</p>
                  </a-col>
                  <a-col
                    flex="0.6"
                    class="text-white grid grid-cols-3 justify-items-center"
                  >
                    <div class="leading-[2.5]">
                      <span class="text-xl tracking-[.25em]">{{
                        params.envData[0].name
                      }}</span>
                      <img
                        :src="getImageUrl(`env/${params.envData[0].key}.svg`)"
                        alt=""
                        class="h-20"
                      />
                    </div>
                    <h1 class="text-8xl my-0">
                      {{ params.envData[0].value }}
                    </h1>
                    <div class="grid content-between">
                      <p
                        :style="{ backgroundColor: params.envData[0].color }"
                        class="rounded-md px-2 text-black leading-normal"
                      >
                        {{ params.envData[0].val }}
                      </p>
                      <span class="tracking-[.25em]">{{
                        params.envData[0].unit
                      }}</span>
                    </div>
                  </a-col>
                </a-row>
                <a-row class="grid grid-cols-4 gap-x-2 gap-y-12">
                  <a-col
                    v-for="(item, index) in params.envData.slice(1)"
                    :key="index"
                    class="grid grid-cols-2 justify-items-center border-r border-[#676058]"
                    :class="{ 'border-none': index == 3 || index == 7 }"
                  >
                    <div>
                      <p class="text-[#93907e] text-lg text-left mb-3">
                        {{ item.name }}
                      </p>
                      <img
                        :src="getImageUrl(`env/${item.key}.svg`)"
                        alt=""
                        class="h-[76px] w-[76px]"
                      />
                    </div>
                    <div class="grid content-between">
                      <p
                        class="rounded-md px-4 text-black leading-normal"
                        :style="{ backgroundColor: item.color }"
                      >
                        {{ item.val }}
                      </p>
                      <h2 class="text-white text-2xl text-left">
                        {{ item.value }}
                      </h2>
                      <span class="text-[#93907e] text-right">{{
                        item.unit
                      }}</span>
                    </div>
                  </a-col>
                </a-row>
              </a-flex>
            </swiper-slide>
          </swiper>
        </a-col>
        <a-row :gutter="[20, 20]" class="w-full">
          <a-col
            v-for="item in usePublicStoreHook().sceneList"
            :key="item"
            :span="8"
          >
            <a-button
              class="bg-[#443d37] text-[#e8e4c8] h-32 text-3xl w-full"
              @click="handleChangeScene(item.data)"
            >
              <div v-if="item?.data">
                <p class="text-3xl">{{ item.data.name }}</p>
              </div>
              <div v-else>
                <PlusCircleFilled class="text-white text-4xl" />
                <p class="text-xl">添加快捷场景</p>
              </div>
            </a-button>
          </a-col>
        </a-row>
      </a-flex>
    </a-col>
  </a-row>
</template>
<style lang="scss" scoped></style>
