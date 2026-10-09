<template>
  <div class="w-full h-full min-h-[260px]">
    <div ref="chartContainer" class="w-full h-full min-h-[260px]"></div>
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
  
  // If pie/donut chart or already custom legend, keep or adjust gently
  const isPie = props.schema?.data?.some((d: any) => d.type === 'pie')

  return {
    ...layout,
    autosize: true,
    margin: {
      ...(layout.margin || {}),
      l: layout.margin?.l ?? 30,
      r: layout.margin?.r ?? 30,
      t: layout.title ? 42 : (layout.margin?.t ?? 20),
      b: Math.max(50, layout.margin?.b ?? 50)
    },
    legend: isPie ? {
      ...(layout.legend || {}),
      font: { ...(layout.legend?.font || {}), size: 10 }
    } : {
      ...(layout.legend || {}),
      orientation: 'h',
      x: 0.5,
      xanchor: 'center',
      y: -0.25,
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
