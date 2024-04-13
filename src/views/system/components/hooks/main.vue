<script setup lang="ts"></script>
<template>
  <a-flex vertical class="h-full">
    <a-flex class="h-[44rem] px-20 mt-14 mb-8 overflow-y-auto" vertical>
      <a-row class="grid grid-cols-4 gap-y-12 gap-x-20">
        <slot />
      </a-row>
    </a-flex>
  </a-flex>
</template>
<style lang="scss" scoped></style>
