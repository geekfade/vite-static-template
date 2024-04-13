<script setup lang="ts"></script>
<template>
  <a-col class="footer">
    <slot />
  </a-col>
</template>
<style lang="scss">
.footer {
  @apply bg-[#282523] text-white absolute bottom-0 w-full left-0 right-0 h-24 flex justify-center items-center  gap-16;
  button {
    @apply h-16 text-white text-xl bg-[#877045] border-none;
  }
}
</style>
