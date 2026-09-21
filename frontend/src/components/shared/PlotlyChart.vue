<template>
  <div class="w-full h-full">
    <div ref="chartContainer" class="w-full h-[320px] md:h-[400px]"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
  schema: {
    data: any[]
    layout: any
  }
}>()

const chartContainer = ref<HTMLDivElement | null>(null)
let plotlyModule: any = null
let resizeObserver: ResizeObserver | null = null

const mobileLayout = (layout: any) => {
  const isMobile = window.innerWidth < 768
  return {
    ...layout,
    autosize: true,
    margin: {
      ...(layout.margin || {}),
      l: isMobile ? 38 : layout.margin?.l ?? 60,
      r: isMobile ? 30 : layout.margin?.r ?? 60,
      t: layout.title ? (isMobile ? 42 : layout.margin?.t ?? 50) : layout.margin?.t ?? 30,
      b: isMobile ? 52 : layout.margin?.b ?? 45
    },
    legend: {
      orientation: 'h' as const,
      x: 0,
      y: isMobile ? 1.22 : 1.15,
      font: { ...(layout.legend?.font || {}), size: isMobile ? 10 : 11 }
    },
    font: { ...(layout.font || {}), family: 'Plus Jakarta Sans, sans-serif' }
  }
}

const renderChart = async () => {
  if (!chartContainer.value || !props.schema) return

  try {
    if (!plotlyModule) {
      plotlyModule = await import('plotly.js-dist-min')
    }
    const layout = mobileLayout(props.schema.layout || {})
    const config = {
      responsive: true,
      displayModeBar: false,
      autosizable: true
    }

    await plotlyModule.react(chartContainer.value, props.schema.data || [], layout, config)
  } catch (err) {
    console.error('Failed to render Plotly chart:', err)
  }
}

const resizeChart = () => {
  if (plotlyModule && chartContainer.value) {
    plotlyModule.Plots.resize(chartContainer.value)
  }
}

onMounted(async () => {
  await renderChart()
  resizeObserver = new ResizeObserver(() => resizeChart())
  if (chartContainer.value) {
    resizeObserver.observe(chartContainer.value)
  }
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', resizeChart)
})

watch(() => props.schema, async () => {
  await renderChart()
}, { deep: true })
</script>
