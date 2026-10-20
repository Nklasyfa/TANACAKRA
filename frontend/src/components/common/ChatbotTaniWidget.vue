<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { chatMessages, isAiThinking, sendChatMessage, clearChatHistory } from '@/services/chatbot'

const isOpen = ref(false)
const inputQuery = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const handleSend = async (queryText?: string) => {
  const text = queryText || inputQuery.value
  if (!text || !text.trim() || isAiThinking.value) return

  inputQuery.value = ''
  scrollToBottom()
  await sendChatMessage(text)
  scrollToBottom()
}

const formatMessage = (text: string) => {
  if (!text) return ''
  // Escape raw HTML entities to prevent XSS
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  // Convert markdown: **bold**, *italic*, \n to <br/>
  return safe
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
}
</script>

<template>
  <div class="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[60]">
    <!-- Floating Trigger Button -->
    <button
      v-if="!isOpen"
      @click="toggleChat"
      class="group bg-[#243319] hover:bg-[#1A2612] text-white p-3 md:px-4 md:py-3 rounded-full shadow-2xl flex items-center gap-2.5 transition-all duration-300 transform hover:scale-105 border-2 border-[#D5E9C3]/50 cursor-pointer"
      title="Tanya Cakra AI — Asisten Agronomi"
    >
      <div class="relative flex items-center justify-center">
        <span class="material-symbols-outlined text-[24px] text-[#D5E9C3]">smart_toy</span>
        <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#243319] animate-pulse"></span>
      </div>
      <span class="hidden md:inline text-xs font-bold tracking-wide">Tanya Cakra AI</span>
    </button>

    <!-- Chat Modal Window -->
    <Transition name="chat-window">
      <div
        v-if="isOpen"
        class="bg-white rounded-2xl shadow-2xl border border-[#E2D8C7] flex flex-col overflow-hidden w-[92vw] sm:w-[400px] h-[520px] max-h-[85vh] fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[70]"
      >
        <!-- Chat Header -->
        <div class="px-4 py-3 bg-[#243319] text-[#FFF8F4] flex items-center justify-between border-b border-[#3D562B] shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-[#3D562B] flex items-center justify-center relative">
              <span class="material-symbols-outlined text-[18px] text-[#D5E9C3]">smart_toy</span>
              <span class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-[#243319]"></span>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <h4 class="font-bold text-xs text-white">Cakra AI</h4>
                <span class="px-1.5 py-0.5 bg-[#17230F] text-[#A3E635] border border-[#A3E635]/40 rounded text-[9px] font-bold tracking-wider flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse"></span>
                  NVIDIA AI
                </span>
              </div>
              <p class="text-[10px] text-[#C2D7B2]">Llama 3.2 &bull; Agronomi Presisi Merapi</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              @click="clearChatHistory"
              class="text-[#C2D7B2] hover:text-white p-1 rounded transition text-[11px]"
              title="Bersihkan percakapan"
            >
              <span class="material-symbols-outlined text-[16px]">delete_sweep</span>
            </button>
            <button
              @click="toggleChat"
              class="text-[#C2D7B2] hover:text-white p-1 rounded transition"
              title="Tutup"
            >
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FFF8F4] text-xs"
        >
          <div
            v-for="msg in chatMessages"
            :key="msg.id"
            class="flex flex-col"
            :class="msg.role === 'user' ? 'items-end' : 'items-start'"
          >
            <!-- Message Bubble -->
            <div
              class="max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs leading-relaxed"
              :class="
                msg.role === 'user'
                  ? 'bg-[#A8452A] text-white rounded-tr-none'
                  : 'bg-white text-[#231a10] border border-[#E2D8C7] rounded-tl-none'
              "
            >
              <div v-html="formatMessage(msg.text)" class="prose-sm"></div>
              <div class="flex items-center justify-between gap-2 mt-1.5">
                <span
                  v-if="msg.role === 'assistant' && msg.model"
                  class="text-[9px] font-semibold text-[#2E7D32] flex items-center gap-0.5 bg-[#E8F5E9] px-1.5 py-0.5 rounded border border-[#C8E6C9]"
                >
                  <span class="material-symbols-outlined text-[11px]">bolt</span>
                  {{ msg.model }}
                </span>
                <span v-else></span>
                <span
                  class="text-[9px]"
                  :class="msg.role === 'user' ? 'text-white/70' : 'text-[#7E7063]'"
                >
                  {{ msg.timestamp }}
                </span>
              </div>
            </div>

            <!-- Quick Suggestions under AI message -->
            <div
              v-if="msg.suggestions && msg.suggestions.length > 0 && msg.id === chatMessages[chatMessages.length - 1].id"
              class="mt-2 flex flex-wrap gap-1.5 max-w-[95%]"
            >
              <button
                v-for="(sug, sIdx) in msg.suggestions"
                :key="'sug-' + sIdx"
                @click="handleSend(sug)"
                class="text-[11px] bg-white hover:bg-[#FDEBDB] text-[#A8452A] border border-[#E2D8C7] px-2.5 py-1 rounded-full transition-colors cursor-pointer text-left leading-tight"
              >
                {{ sug }}
              </button>
            </div>
          </div>

          <!-- Thinking Indicator -->
          <div v-if="isAiThinking" class="flex items-center gap-2 text-[#7E7063] text-xs p-2 bg-white rounded-xl border border-[#E2D8C7] w-fit shadow-2xs">
            <span class="material-symbols-outlined text-[16px] text-[#A8452A] animate-spin">progress_activity</span>
            <span>NVIDIA AI (Llama 3.2) sedang menganalisis...</span>
          </div>
        </div>

        <!-- Input Bar -->
        <div class="p-3 bg-white border-t border-[#E2D8C7] shrink-0">
          <form @submit.prevent="handleSend()" class="flex items-center gap-2">
            <input
              v-model="inputQuery"
              type="text"
              placeholder="Tanya soal tanah, pupuk, hama, cuaca..."
              class="flex-1 bg-[#FFF8F4] border border-[#E2D8C7] rounded-xl px-3.5 py-2 text-xs text-[#231a10] focus:outline-none focus:ring-1 focus:ring-[#A8452A] placeholder:text-[#9E9388]"
              :disabled="isAiThinking"
            />
            <button
              type="submit"
              :disabled="!inputQuery.trim() || isAiThinking"
              class="bg-[#243319] hover:bg-[#1A2612] disabled:opacity-40 text-white w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs cursor-pointer"
              title="Kirim Pesan"
            >
              <span class="material-symbols-outlined text-[16px]">send</span>
            </button>
          </form>
          <p class="text-[9px] text-center text-[#7E7063] mt-1.5">
            Model agronomi presisi lereng Merapi &bull; Balai Penyuluhan Cangkringan
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.chat-window-enter-active,
.chat-window-leave-active {
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.chat-window-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.94);
}
.chat-window-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.94);
}
</style>
