<template>
  <div ref="chartContainer" class="w-full h-full min-h-[300px]"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  schema: {
    data: any[]
    layout: any
  }
}>()

const chartContainer = ref<HTMLDivElement | null>(null)

const renderChart = async () => {
  if (!chartContainer.value || !props.schema) return
  
  try {
    // Dynamic import to avoid SSR issues
    const Plotly = await import('plotly.js-dist-min')
    Plotly.newPlot(
      chartContainer.value, 
      props.schema.data || [], 
      props.schema.layout || {},
      { responsive: true, displayModeBar: false }
    )
  } catch (err) {
    console.error('Failed to render Plotly chart:', err)
  }
}

onMounted(() => {
  renderChart()
})

watch(() => props.schema, () => {
  renderChart()
}, { deep: true })
</script>
