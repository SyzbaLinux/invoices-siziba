<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { RouterView } from 'vue-router'
import AppLayout from './components/layout/AppLayout.vue'
import { initDB } from './services/db'

const route = useRoute()

onMounted(async () => {
  await initDB()
})
</script>

<template>
  <RouterView v-if="route.meta.public" />
  <AppLayout v-else>
    <RouterView />
  </AppLayout>
</template>
