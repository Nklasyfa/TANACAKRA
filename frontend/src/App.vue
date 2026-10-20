<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/common/ToastContainer.vue'
import PwaInstallBanner from '@/components/common/PwaInstallBanner.vue'
import ChatbotTaniWidget from '@/components/common/ChatbotTaniWidget.vue'
</script>

<template>
  <RouterView />
  <ToastContainer />
  <PwaInstallBanner />
  <ChatbotTaniWidget />
</template>

