<template>
  <div class="p-4">
    <canvas ref="chartCanvas" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  Chart, LineElement, PointElement, LineController,
  CategoryScale, LinearScale, Filler, Tooltip,
} from 'chart.js'

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Filler, Tooltip)

const props = defineProps<{ elevation: number[] }>()
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

function buildChart() {
  if (!chartCanvas.value) return
  if (chartInstance) chartInstance.destroy()
  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: props.elevation.map((_, i) => i),
      datasets: [{
        data: props.elevation,
        borderColor: '#8B6914',
        backgroundColor: 'rgba(139,105,20,0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 1.5,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: {
          grid: { color: 'rgba(58,53,41,0.8)' },
          ticks: { color: '#8B7D65', font: { family: 'Space Mono', size: 11 } },
          title: { display: true, text: '海拔 (m)', color: '#8a7966', font: { family: 'Space Mono', size: 11 } },
        },
      },
    },
  })
}

onMounted(buildChart)
watch(() => props.elevation, buildChart)
</script>
