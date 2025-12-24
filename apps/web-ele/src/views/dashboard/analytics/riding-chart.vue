<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import { onMounted, ref } from 'vue';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

onMounted(() => {
  renderEcharts({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value' },
    series: [{
      type: 'line',
      smooth: true,
      data: [1200, 1500, 1800, 2200, 2800, 3200],
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: '#5ab1ef' },
    }],
  });
});
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
