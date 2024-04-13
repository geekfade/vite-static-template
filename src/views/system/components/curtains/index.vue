<script setup lang="ts">
import { useColumns } from "./columns";
defineOptions({
  name: "curtains",
});

const {
  params,
  sliderRef,
  selectedKey,
  equipmentMap,
  getImageUrl,
  computedWidth,
  filterDeviceStatus,
  handleChangeAction,
} = useColumns();
</script>
<template>
  <a-row
    v-if="equipmentMap[selectedKey]?.data"
    class="h-full gap-8 bg-[#2d2928] text-white"
  >
    <a-col :span="10" class="px-9 py-6 h-full">
      <h1 class="text-5xl">
        {{ params.title || equipmentMap[selectedKey]?.data[0].equipment_name }}
      </h1>
      <div class="bg-[#48403c] h-5" />
      <a-flex
        class="bg-no-repeat bg-top bg-[length:70%_90%] h-[36rem] relative"
        :style="{
          backgroundImage: `url(${getImageUrl('bg/cl03.png')})`,
        }"
      >
        <div
          class="bg-no-repeat bg-[length:100%_100%] bg-left h-full absolute left-0 -top-4"
          :style="{
            width: computedWidth,
            backgroundImage: `url(${getImageUrl('bg/cur.png')})`,
          }"
        />
        <div
          class="bg-no-repeat bg-[length:100%_100%] bg-right h-full absolute right-0 -top-4"
          :style="{
            width: computedWidth,
            backgroundImage: `url(${getImageUrl('bg/cur.png')})`,
          }"
        />
      </a-flex>
      <a-flex justify="space-between" class="text-3xl my-6">
        <span>自由调整</span>
        <span>{{ params.curNum }}%</span>
      </a-flex>
      <a-slider
        ref="sliderRef"
        v-model:value="params.curNum"
        :tooltipOpen="false"
        :railStyle="{
          backgroundColor: '#40392E',
          height: '100%',
          borderRadius: '10px',
        }"
        :trackStyle="{
          backgroundColor: '#867045',
          height: '100%',
          borderRadius: '10px',
        }"
        :handleStyle="{
          width: '30px',
          height: '30px',
          backgroundImage: 'url(src/assets/bg/tips.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          borderRadius: '50%',
          top: '-5px',
        }"
        @change="handleChangeAction('change', true)"
        @focus="handleChangeAction('focus', false)"
        @afterChange="handleChangeAction('afterChange', params.curNum)"
      />
    </a-col>
    <a-col flex="auto" class="bg-gradient-cur overflow-x-auto h-full">
      <template
        v-for="(item, index) in equipmentMap[selectedKey]?.data"
        :key="index"
      >
        <div
          v-if="filterDeviceStatus(params.areaIds, [item])"
          :class="{
            'bg-[url(@/assets/bg/cl04.svg)]': index == params.curActive,
          }"
          class="bg-no-repeat bg-[0%_center] h-28 text-2xl flex px-10 items-center gap-6 cursor-pointer"
          @click="
            () => {
              params.curActive = index;
              params.title = item.equipment_name;
            }
          "
        >
          <span class="flex-none">{{ item.position || 0 }}%</span>
          <span class="grow">{{ item.equipment_name }}</span>
          <a-switch
            v-model:checked="item.isClose"
            checked-children="开"
            un-checked-children="关"
            class="w-32 h-10"
            :style="{
              background: item.isClose ? '#7D6841' : '#2D2928',
            }"
            @change="handleChangeAction('switch', item)"
          />
        </div>
      </template>
    </a-col>
  </a-row>
</template>
<style lang="scss" scoped>
:deep(.ant-slider-handle) {
  &::after,
  &::before {
    display: none;
  }
}
:deep(.ant-switch.ant-switch-checked) {
  .ant-switch-handle {
    inset-inline-start: calc(100% - 36px);
  }
}
:deep(.ant-switch) {
  .ant-switch-handle {
    @apply w-9 h-9;
    &::before {
      @apply rounded-full;
    }
  }
  .ant-switch-inner {
    @apply flex items-center justify-between;
    span {
      font-size: 25px;
    }
    .ant-switch-inner-unchecked {
      @apply mt-0;
    }
  }
}
</style>
