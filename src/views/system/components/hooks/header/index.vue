<script setup lang="ts">
import { RightOutlined } from "@ant-design/icons-vue";
import { useColumns } from "./columns";
defineOptions({
  name: "ReHeader",
});
const { params, dropRef, getDropBg, renderParentDom, handleChangeAction } =
  useColumns();
</script>
<template>
  <a-row align="middle" :wrap="false" class="border-b-4 border-[#8c7447]">
    <a-col
      flex="267px"
      class="head-item"
      :class="{ active: params.active == 0 }"
      @click="
        handleChangeAction('menu', {
          index: 0,
          item: {
            ...params.menuArea[0],
          },
        })
      "
    >
      <h4>{{ params.menuArea[0]?.area_name || "全部" }}</h4>
      <span v-if="params.menuArea[0]?.isNumber">
        {{ params.menuArea[0]?.active }}/{{ params.menuArea[0]?.total }}
      </span>
    </a-col>
    <a-row
      ref="dropRef"
      class="overflow-x-scroll w-[70.5%]"
      :wrap="false"
      align="middle"
    >
      <a-col
        v-for="(item, index) in params.menuArea?.slice(1)"
        :key="index"
        flex="267px"
        class="head-item"
        :class="{ active: params.active === index + 1 }"
        @click="handleChangeAction('menu', { index: index + 1, item })"
      >
        <h4>{{ item.area_name }}</h4>
        <span v-if="item.isNumber">{{ item.active + "/" + item.total }}</span>
      </a-col>
    </a-row>
    <a-col id="dropRef" flex="auto" class="cursor-pointer relative">
      <a-dropdown
        v-model:open="params.visible"
        placement="topRight"
        trigger="click"
        :getPopupContainer="() => renderParentDom"
        :overlayClassName="'renderParentDom'"
      >
        <RightOutlined class="text-white text-4xl" />
        <template #overlay>
          <div
            class="text-center text-[#e0caa6] grid gap-2 text-2xl bg-[url('@/assets/bg/slide.png')] bg-no-repeat bg-[length:100%_100%] pl-[66px]"
          >
            <div
              v-for="(item, index) in params.dropArea"
              :key="index"
              class="grid gap-2"
              @click="
                (e) => {
                  e.stopPropagation();
                  handleChangeAction('slide', {
                    index: item.area_id == 0 ? 0 : index,
                    item,
                  });
                }
              "
            >
              <span
                class="w-80 bg-no-repeat bg-cover h-12 leading-loose"
                :style="{
                  backgroundImage: 'url(' + getDropBg(item, index) + ')',
                }"
                >{{ item.area_name }}</span
              >
              <template v-if="item.children">
                <span
                  v-for="(child, index1) in item.parent_id"
                  :key="index1"
                  class="w-80 bg-no-repeat bg-cover h-12 leading-loose"
                  :style="{
                    backgroundImage: 'url(' + getDropBg(child, index1) + ') ',
                  }"
                  @click="
                    (e) => {
                      e.stopPropagation();
                      handleChangeAction('slide', {
                        item: child,
                        index: index1,
                      });
                    }
                  "
                >
                  {{ child.area_name }}
                </span>
              </template>
            </div>
          </div>
        </template>
      </a-dropdown>
    </a-col>
  </a-row>
</template>
<style lang="scss" scoped>
.head-item {
  @apply flex items-center justify-center py-8 bg-[#48403d] cursor-pointer mr-1 text-white;
  &.active {
    @apply bg-[#8c7447];
  }
  h4 {
    @apply text-[28px] mr-5;
  }
  span {
    @apply text-lg;
  }
}
:deep(.renderParentDom) {
  top: 76px !important;
  bottom: 0 !important;
  left: -207px !important;
}
</style>
