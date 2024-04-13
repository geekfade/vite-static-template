<script lang="ts" setup>
import { usePublicStoreHook } from "@/store/modules/public";
import { LoadingOutlined } from "@ant-design/icons-vue";
import { useColumns } from "./columns";
import { ReHeader } from "./components";

defineOptions({
  name: "system",
});
const {
  date,
  week,
  menuList,
  loadingMap,
  selectedKey,
  findMenuKey,
  getImageUrl,
  handleChangeMenu,
} = useColumns();
const indicator = h(LoadingOutlined, {
  style: {
    fontSize: "84px",
  },
  spin: true,
});
</script>
<template>
  <a-flex class="h-full">
    <a-col class="h-full bg-[#242321]" flex="300px">
      <div class="text-center text-[#e8d0ae] font-[200]">
        <h1 class="text-7xl my-5">{{ usePublicStoreHook().time }}</h1>
        <h1 class="text-xl">{{ date }} {{ week }}</h1>
      </div>
      <a-space direction="vertical" class="w-full" :size="5">
        <template v-for="(item, index) in menuList" :key="index">
          <div
            class="h-[112px] justify-center flex text-white text-3xl items-center bg-[url('@/assets/svg/menu_bg.png')] font-normal bg-no-repeat bg-[length:100%_100%] cursor-pointer"
            :class="{
              'bg-[url(@/assets/bg/menu_bg_active.png)]':
                selectedKey == item.typeKey,
            }"
            @click="handleChangeMenu(item.typeKey)"
          >
            <img
              :src="
                getImageUrl(
                  `svg/${
                    item.isMenu || item.isDefault
                      ? item.typeKey
                      : findMenuKey(item.typeKey)?.type_key
                  }.svg`,
                )
              "
              class="w-16 h-16 mr-12"
            />
            {{
              item.isMenu || item.isDefault
                ? item.typeName
                : findMenuKey(item.typeKey)?.type_name
            }}
          </div>
        </template>
      </a-space>
      <a-button
        class="absolute left-9 bottom-4 w-56 h-20 bg-[url('@/assets/svg/back.svg')] bg-no-repeat bg-center bg-contain cursor-pointer border-none"
        @click="$router.push('/')"
      />
    </a-col>
    <a-col flex="auto" class="p-11 overflow-hidden">
      <a-flex vertical class="h-full bg-[#24201f] relative overflow-hidden">
        <a-spin
          :spinning="loadingMap[selectedKey]"
          :indicator="indicator"
          style="max-height: max-content"
        >
          <ReHeader v-show="selectedKey !== 'scenes'" />
          <component
            :is="
              menuList.find((item) => item.typeKey === selectedKey)?.component
            "
          />
        </a-spin>
      </a-flex>
    </a-col>
  </a-flex>
</template>
<style lang="scss" scoped>
:deep(.ant-spin-nested-loading) {
  @apply h-full;
  .ant-spin-blur,
  .ant-spin-container {
    @apply h-full;
  }
}
</style>
