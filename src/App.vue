<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppLayout from './components/layout/AppLayout.vue'
import { initDB } from './services/db'

onMounted(async () => {
  // Initialize IndexedDB when app starts
  await initDB()
})
</script>

<template>
  <AppLayout>
    <RouterView />
  </AppLayout>
</template>
