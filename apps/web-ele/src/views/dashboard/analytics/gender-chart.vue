<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import { onMounted, ref } from 'vue';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

onMounted(() => {
  renderEcharts({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}人 ({d}%)',
    },
    series: [{
      name: '性别分布',
      type: 'pie',
      radius: '70%',
      data: [
        { name: '男性会员', value: 35 },
        { name: '女性会员', value: 15 },
      ],
      color: ['#5ab1ef', '#ffb980'],
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
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
