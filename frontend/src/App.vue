<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import ToastContainer from '@/components/common/ToastContainer.vue'
import ChatbotTaniWidget from '@/components/common/ChatbotTaniWidget.vue'

const route = useRoute()

// Chatbot only visible when authenticated and not on public entry pages (landing / login)
const showChatbot = computed(() => {
  const publicRoutes = ['landing', 'login']
  const isPublicPage = publicRoutes.includes(route.name as string) || route.path === '/' || route.path === '/login'
  const hasToken = Boolean(localStorage.getItem('tanacakra_token'))
  return !isPublicPage && hasToken
})
</script>

<template>
  <RouterView />
  <ToastContainer />
  <ChatbotTaniWidget v-if="showChatbot" />
</template>

