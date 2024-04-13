<script setup lang="ts">
import VScaleScreen from "v-scale-screen";
</script>

<template>
  <a-config-provider>
    <v-scale-screen width="1920" height="1080">
      <router-view />
    </v-scale-screen>
  </a-config-provider>
</template>

<style scoped lang="scss"></style>
