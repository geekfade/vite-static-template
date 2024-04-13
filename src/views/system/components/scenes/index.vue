<script setup lang="ts">
import dayjs from "dayjs";
import { useColumns } from "./columns";
defineOptions({
  name: "scenes",
});
const { columns, taskList, getWeekDate, executeScene, handleTaskChange } =
  useColumns();
</script>
<template>
  <a-row
    class="bg-[#48403d] py-8 px-10 grid grid-cols-[1fr,200px,500px,1fr,1fr] gap-4"
  >
    <a-col
      v-for="(item, index) in columns"
      :key="index"
      class="text-white text-2xl"
      :class="{
        'text-center': index > 1,
      }"
    >
      {{ item.title }}
    </a-col>
  </a-row>
  <a-list
    item-layout="horizontal"
    :data-source="taskList"
    class="overflow-auto bg-[#191716]"
  >
    <template #renderItem="{ item }">
      <a-list-item
        class="text-white my-2 bg-[#23211F]"
        :style="{
          padding: '2.5rem',
        }"
      >
        <a-row
          align="middle"
          class="grid grid-cols-[1fr,1fr,500px,1fr,1fr] w-full"
        >
          <a-col class="text-2xl">{{ item.task_name }}</a-col>
          <a-col class="text-xl">{{
            item.task_type == 1 ? "自动模式" : "手动模式"
          }}</a-col>
          <a-col class="text-xl grid items-center grid-flow-col justify-center">
            <a-tag
              v-for="week in 7"
              :key="week"
              :bordered="false"
              class="bg-[#48403d] rounded-[50%] p-2 w-8 h-8 mx-1 text-xl text-center grid place-content-center"
              :color="getWeekDate(item, week)"
            >
              {{ week == 7 ? "日" : week }}
            </a-tag>
            <span class="w-14 text-center">
              {{
                (item.next_time !== "-" &&
                  dayjs(item.next_time)?.format("HH:mm")) ||
                "-"
              }}
            </span>
          </a-col>
          <a-col class="text-center">
            <a-switch
              v-if="item.task_type == 1"
              v-model:checked="item.status"
              :checkedValue="1"
              :unCheckedValue="0"
              class="w-24 h-10 bg-[#48403d]"
              @click="handleTaskChange(item.id, item.status)"
            />
            <span v-else>-</span>
          </a-col>
          <a-col class="text-center">
            <a-button
              class="bg-[#877044] border-none"
              size="large"
              shape="round"
              @click="executeScene(item.id, '确定执行该任务吗？')"
              >手动执行</a-button
            >
          </a-col>
        </a-row>
      </a-list-item>
    </template>
  </a-list>
</template>
<style lang="scss" scoped>
* {
  color: #fff;
}
:deep(.ant-switch-handle) {
  @apply w-9 h-9 bg-[url('@/assets/bg/tips.png')] bg-no-repeat bg-contain opacity-45;
  &::before {
    @apply rounded-3xl bg-transparent;
  }
}
:deep(.ant-switch-checked) {
  @apply bg-[#48403d];
  .ant-switch-handle {
    inset-inline-start: calc(100% - 38px);
  }
  .ant-switch-handle {
    @apply opacity-100;
  }
}
</style>
