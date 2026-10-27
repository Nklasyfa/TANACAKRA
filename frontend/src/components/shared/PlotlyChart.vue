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

const formatLayout = (layout: any) => {
  const isPie = props.schema?.data?.some((d: any) => d.type === 'pie')
  if (isPie) {
    return {
      ...layout,
      autosize: true,
      font: { ...(layout.font || {}), family: 'Plus Jakarta Sans, sans-serif' }
    }
  }

  // Preserve the exact diagram layout, margins, and legend as created in API/service.
  // Lock drag/zoom so mobile touch swipe seamlessly scrolls the parent container horizontally.
  return {
    ...layout,
    autosize: true,
    dragmode: false,
    xaxis: {
      ...(layout.xaxis || {}),
      fixedrange: true
    },
    yaxis: {
      ...(layout.yaxis || {}),
      fixedrange: true
    },
    ...(layout.xaxis2 ? { xaxis2: { ...layout.xaxis2, fixedrange: true } } : {}),
    ...(layout.yaxis2 ? { yaxis2: { ...layout.yaxis2, fixedrange: true } } : {}),
    font: { ...(layout.font || {}), family: 'Plus Jakarta Sans, sans-serif' }
  }
}

const getPlotlyInstance = async () => {
  if (plotlyModule) return plotlyModule
  if (typeof window !== 'undefined' && (window as any).Plotly) {
    plotlyModule = (window as any).Plotly
    return plotlyModule
  }
  try {
    const mod = await import('plotly.js-dist-min')
    plotlyModule = mod.default || mod
    return plotlyModule
  } catch (err) {
    console.warn('Local dynamic import of Plotly failed, loading from CDN...', err)
    // Fallback load CDN script
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.plot.ly/plotly-2.35.2.min.js'
      script.onload = () => {
        plotlyModule = (window as any).Plotly
        resolve()
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
    return plotlyModule
  }
}

const renderChart = async () => {
  if (!chartContainer.value || !props.schema) return

  try {
    const Plotly = await getPlotlyInstance()
    if (!Plotly || !chartContainer.value) return

    const layout = formatLayout(props.schema.layout || {})
    const config = {
      responsive: true,
      displayModeBar: false,
      autosizable: true,
      scrollZoom: false
    }

    await Plotly.react(chartContainer.value, props.schema.data || [], layout, config)
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

<style scoped>
:deep(.js-plotly-plot),
:deep(.plot-container),
:deep(.svg-container) {
  touch-action: pan-x pan-y !important;
}

:deep(.nsewdrag),
:deep(.draglayer),
:deep(.ndrag),
:deep(.edrag),
:deep(.nsdrag),
:deep(.swdrag),
:deep(.wdrag),
:deep(.ewdrag),
:deep(.sdrag) {
  touch-action: pan-x pan-y !important;
}
</style>
