<script setup lang="ts">
import { message } from "ant-design-vue";
import { emitter } from "@/utils/mitt";
import { PlusCircleFilled, MinusCircleFilled } from "@ant-design/icons-vue";
import { useAppStoreHook } from "@/store/modules/app";
import { usePublicStoreHook } from "@/store/modules/public";
import { cloneDeep } from "@pureadmin/utils";

defineOptions({
  name: "ReSetting",
});

const { version, client_serial, address, serial, setAddress } =
  useAppStoreHook();
const { lockScreenInfo, taskList, getSystemSetting } = usePublicStoreHook();

const params = reactive({
  visible: false,
  activeKey: "1",
  sceneMap: new Map(Array.from({ length: 6 }, (_, i) => [i + 1, false])),
  taskMap: new Map(
    Array.from({ length: 6 }, (_, i) => {
      return [
        i,
        new Map(
          taskList.map((item1, index1) => {
            return [`${item1.id}_${index1}`, index1 === 0];
          }),
        ),
      ];
    }),
  ),
  data: [
    {
      title: "APK版本号",
      name: version,
    },
    {
      title: "设备序列号",
      name: serial,
    },
    {
      title: "客户端版本号",
      name: client_serial,
    },
    {
      title: "天气地址",
      name: address,
    },
  ],
  sceneList: [],
});

/**
 * 处理设置变更
 * @param {any} item - 设置项
 * @param {string | number} type - 设置类型
 */
const handleChangeAction = (item: string | number, type: string | number) => {
  const action = {
    // 删除密码
    del: () => {
      lockScreenInfo.password.splice(lockScreenInfo.password.indexOf(item), 1);
    },
    // 确认密码
    ok: () => {
      if (lockScreenInfo.password.length === 0) {
        message.warning("请输入密码");
        return;
      }
      getSystemSetting({
        ...lockScreenInfo,
        password: lockScreenInfo.password.join(""),
      });
    },
    // 场景设置
    scene: () => {
      const quick_scene = params.sceneList
        .map((item1) => item1.data)
        .filter(Boolean);
      getSystemSetting({
        quick_scene: JSON.stringify(quick_scene),
      });
    },
    // 修改密码
    change: () => {
      if (lockScreenInfo.password.length === 4) {
        return;
      }
      lockScreenInfo.password.push(item);
    },
    // 自动锁屏
    autoLock: () => {
      lockScreenInfo.is_auto = +item;
    },
    // 锁屏时间
    time: () => {
      lockScreenInfo.autotime = +item;
    },
    // 地址设置
    address: () => {
      setAddress(item.toString());
    },
  };
  action[type]?.();
};

emitter.on("openSetting", (val) => {
  params.visible = val.visible;
  params.activeKey = val.key;
});

watchDeep(
  () => params.activeKey,
  (val) => {
    if (val == "3") {
      params.sceneList.splice(
        0,
        params.sceneList.length,
        ...cloneDeep(usePublicStoreHook().sceneSetList),
      );
    }
  },
);

watchDeep(
  () => params.visible,
  (val) => {
    if (!val) {
      params.activeKey = "1";
    }
  },
);
</script>

<template>
  <a-modal
    :open="params.visible"
    :getContainer="false"
    :centered="true"
    :destroy-on-close="true"
    :footer="null"
    @cancel="params.visible = false"
  >
    <a-tabs
      v-model:activeKey="params.activeKey"
      class="h-[44rem]"
      size="large"
      type="card"
      tabPosition="left"
      :tabBarStyle="{
        background: '#2b2826',
        width: '300px',
      }"
    >
      <a-tab-pane key="1">
        <template #tab>
          <span class="menuItem">自动锁屏</span>
        </template>
        <div
          class="bg-[url('@/assets/svg/sock.svg')] h-full bg-contain bg-no-repeat bg-center relative"
        >
          <a-space :size="20" class="absolute right-4 top-[8.7rem]">
            <a-button
              v-for="(item, index) in ['开启', '关闭']"
              :key="index"
              :class="{
                'bg-[#877045]': lockScreenInfo.is_auto === (index == 0 ? 1 : 0),
              }"
              class="text-white h-16 text-2xl cursor-pointer bg-[#51493c]"
              @click="handleChangeAction(index === 0 ? 1 : 0, 'autoLock')"
              >{{ item }}</a-button
            >
          </a-space>
          <a-space
            :size="28"
            class="absolute left-6 top-[19rem] w-[27.5rem] h-20 grid grid-flow-col"
          >
            <a-tag
              v-for="(item, index) in 4"
              :key="item"
              :bordered="false"
              class="text-white text-5xl w-[5.5rem] block cursor-pointer text-center m-0"
              :class="{
                'animate__animated animate__fadeInDown':
                  lockScreenInfo.password.length > index,
                'animate__animated animate__fadeOutDown':
                  lockScreenInfo.password.length <= index,
              }"
            >
              {{ lockScreenInfo.password[index] }}
            </a-tag>
          </a-space>
          <a-space
            :size="24"
            class="absolute left-6 top-[29rem] h-20 grid grid-flow-col text-center"
          >
            <a-tag
              v-for="(item, index) in [1, 2, 5]"
              :key="index"
              class="text-white text-3xl cursor-pointer px-6 py-1"
              :bordered="false"
              :color="lockScreenInfo.autotime === item ? '#877045' : '#463e34'"
              @click="handleChangeAction(item, 'time')"
              >{{ item }}分钟</a-tag
            >
          </a-space>
          <div
            :size="[20, 19]"
            class="absolute right-0 top-[17rem] w-[29.5rem] grid grid-cols-5 gap-x-5 gap-y-[1.2rem]"
          >
            <a-button
              v-for="item in 12"
              :key="item"
              class="h-[5.4rem] w-full cursor-pointer border-none rounded-none hover:border-s-orange-100"
              :class="{ 'col-span-2': item === 11, 'col-span-3': item === 12 }"
              @click="
                handleChangeAction(
                  item,
                  item === 11 ? 'del' : item === 12 ? 'ok' : 'change',
                )
              "
            />
          </div>
        </div>
      </a-tab-pane>
      <a-tab-pane key="2">
        <template #tab>
          <span class="menuItem">系统信息</span>
        </template>
        <a-list :data-source="params.data" size="large">
          <template #renderItem="{ item, index }">
            <a-list-item
              :style="{
                'border-block-end': '1px solid #4b4440',
              }"
            >
              <span class="text-4xl text-[#e8d2ac]">{{ item.title }}</span>
              <a-input
                v-if="index === 3"
                v-model:value="item.name"
                :bordered="false"
                placeholder="请输入地址"
                class="text-white text-2xl w-60 placeholder:text-white"
                @change="handleChangeAction(item.name, 'address')"
              />
              <span v-else class="text-4xl text-white">
                {{ item.name }}
              </span>
            </a-list-item>
          </template>
        </a-list>
      </a-tab-pane>
      <a-tab-pane key="3">
        <template #tab>
          <span class="menuItem">设置场景</span>
        </template>
        <a-card
          :bordered="false"
          class="bg-transparent"
          :headStyle="{
            border: 'none',
          }"
        >
          <template #title>
            <span class="text-center w-full block text-white text-2xl"
              >设置快捷方式</span
            >
          </template>
          <a-card-grid
            v-for="(scene, key) in params.sceneList"
            :key="key"
            :hoverable="false"
            class="text-[#d6d5c0] text-center m-6 cursor-pointer grid items-center relative"
            :style="{
              width: '28.5%',
              height: '180px',
            }"
            @click="
              () => {
                if (!scene.data) {
                  scene.visible = false;
                  scene.data = {};
                }
              }
            "
          >
            <a-list
              v-if="!scene.visible"
              :bordered="false"
              :split="false"
              class="absolute w-full top-0 h-full overflow-y-auto"
              :data-source="usePublicStoreHook().taskList"
            >
              <template #renderItem="{ item, index }">
                <a-list-item
                  class="text-3xl"
                  :class="{
                    'bg-[#877046]': params.taskMap
                      .get(key)
                      .get(`${item.id}_${index}`),
                  }"
                  :style="{
                    'justify-content': 'center',
                    color: '#d6d5c0',
                  }"
                  @click="
                    () => {
                      params.taskMap.set(
                        key,
                        new Map([[`${item.id}_${index}`, true]]),
                      );
                      scene.data = {
                        id: item.id,
                        name: item.task_name,
                      };
                    }
                  "
                  >{{ item.task_name }}</a-list-item
                >
              </template>
            </a-list>
            <div v-else>
              <p v-if="scene?.data" class="text-2xl">
                {{ scene.data?.name }}
              </p>
              <div v-else>
                <PlusCircleFilled class="text-5xl" />
                <p class="text-xl">添加快捷场景</p>
              </div>
            </div>

            <MinusCircleFilled
              v-if="scene?.data"
              class="text-5xl absolute -right-8 -top-8"
              @click="
                (e) => {
                  e.stopPropagation();
                  scene.data = null;
                  scene.visible = true;
                }
              "
            />
          </a-card-grid>
          <a-button
            class="text-white text-2xl bg-[#877046] m-auto h-20 w-44"
            @click="handleChangeAction(null, 'scene')"
            >确定</a-button
          >
        </a-card>
      </a-tab-pane>
    </a-tabs>
  </a-modal>
</template>
<style lang="scss" scoped>
.menuItem {
  @apply text-white block text-3xl;
}
:deep(.ant-tabs-tab) {
  @apply justify-center h-24;
}
:deep(.ant-tabs-tab-active) {
  background-image: url("@/assets/bg/menu_active.png") !important;
  background-color: transparent !important;
  border-right-color: transparent !important;
}
:deep(.ant-tabs-content) {
  @apply h-full;
}
:deep(.ant-modal-content) {
  @apply bg-[#363230] w-[1400px];
  left: 50%;
  top: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
}
</style>
