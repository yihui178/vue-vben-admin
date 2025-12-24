<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import { onMounted, ref } from 'vue';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

onMounted(() => {
  renderEcharts({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['骑行', '聚会', '培训', '比赛'] },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: [25, 15, 18, 8],
      itemStyle: { color: '#5ab1ef' },
    }],
  });
});
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
