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
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '10%',
      bottom: '3%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: '报名人数',
    },
    yAxis: {
      type: 'category',
      data: [
        '新手骑行入门',
        '进阶操控技巧',
        '长途骑行技巧',
        '赛道驾驶基础',
        '安全防护知识',
      ],
    },
    series: [{
      name: '报名人数',
      type: 'bar',
      data: [38, 32, 28, 22, 18],
      itemStyle: {
        color: '#ffb980',
        borderRadius: [0, 8, 8, 0],
      },
      label: {
        show: true,
        position: 'right',
        fontSize: 14,
        fontWeight: 'bold',
      },
    }],
  });
});
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
