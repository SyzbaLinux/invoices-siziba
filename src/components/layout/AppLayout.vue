<script setup>
import AppSidebar from './AppSidebar.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppSidebar />
    <main class="ml-64 min-h-screen">
      <slot />
    </main>
  </div>
</template>
