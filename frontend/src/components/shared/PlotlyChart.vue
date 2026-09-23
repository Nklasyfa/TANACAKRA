<template>
  <div class="w-full h-full">
    <div ref="chartContainer" class="w-full h-[340px] sm:h-[420px] lg:h-[460px]"></div>
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
  if (!isMobile) {
    return {
      ...layout,
      autosize: true,
      font: { ...(layout.font || {}), family: 'Plus Jakarta Sans, sans-serif' }
    }
  }
  return {
    ...layout,
    autosize: true,
    margin: {
      ...(layout.margin || {}),
      l: 38,
      r: 30,
      t: layout.title ? 42 : (layout.margin?.t ?? 25),
      b: Math.max(78, layout.margin?.b ?? 78)
    },
    legend: {
      ...(layout.legend || {}),
      orientation: 'h',
      x: 0.5,
      xanchor: 'center',
      y: -0.35,
      font: { ...(layout.legend?.font || {}), size: 10 }
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
