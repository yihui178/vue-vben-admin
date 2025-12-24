<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import { onMounted, ref } from 'vue';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

onMounted(() => {
  renderEcharts({
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['报名人次', '参与人次'],
      bottom: '2%',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: {
      type: 'value',
      name: '人次',
    },
    series: [
      {
        name: '报名人次',
        type: 'line',
        data: [45, 52, 61, 58, 66, 72],
        smooth: true,
        itemStyle: { color: '#5ab1ef' },
        lineStyle: { width: 2 },
      },
      {
        name: '参与人次',
        type: 'line',
        data: [38, 45, 55, 50, 60, 65],
        smooth: true,
        itemStyle: { color: '#2ec7c9' },
        lineStyle: { width: 2 },
      },
    ],
  });
});
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
