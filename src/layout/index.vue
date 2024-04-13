<script setup lang="ts">
import { usePublicStoreHook } from "@/store/modules/public";
import ReNavBar from "./components/navBar.vue";
import { useUserStoreHook } from "@/store/modules/user";

const { connectMqtt, connectLocal, disconnectMqtt, disconnectLocal } =
  useUserStoreHook();

const {
  getWeather,
  getSystemSetting,
  getSceneList,
  getGatewayInfo,
  destroyTime,
  updateTime,
} = usePublicStoreHook();

onBeforeMount(() => {
  connectMqtt();
  connectLocal();
  getWeather();
  getGatewayInfo();
  getSystemSetting();
  destroyTime();
  getSceneList();
});

onMounted(() => {
  updateTime();
});

onUnmounted(() => {
  disconnectMqtt();
  disconnectLocal();
  usePublicStoreHook().selectedKey = "air";
});
</script>
<template>
  <a-flex
    v-if="$router.currentRoute.value.path == '/dashboard'"
    vertical
    :gap="20"
    class="home bg-[url('@/assets/bg/bg.png')] bg-cover bg-no-repeat bg-center h-full"
  >
    <ReNavBar />
    <RouterView />
  </a-flex>
  <RouterView v-else />
</template>
<style lang="scss" scoped></style>
