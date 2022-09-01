<template>
    <q-page-container>
        <q-page>
            <div class="section">
                <div class="q-my-lg text-h5 text-weight-bold row justify-between">
                    <span>{{ title }}</span>
                </div>
                <div class="q-my-md row no-wrap q-col-gutter-x-md items-start">
                    <div :class="`col-${chart.col}`" v-for="(chart, idx) in charts" :key="chart.name">
                        <component :is="chart.name" :title="chart.title" :color="chart.color"
                            :category="chart.category" :comparatorIdx="chart.comparatorIdx"
                            :xAxisIdx="chart.xAxisIdx" :targetIdx="chart.targetIdx" :scaleIdx="chart.scaleIdx"
                            :filterIdx="chart.filterIdx"></component>
                    </div>
                </div>
            </div>
        </q-page>
    </q-page-container>
</template>

<script>
import MapChart from '@/components/charts/map.vue';
import LineChart from '@/components/charts/line.vue';
import BarChart from '@/components/charts/bar.vue';
import Selector from '@/components/selector.vue';
import LineChartOverview from '@/components/overview-charts/line.vue';
import MapBarChart from '@/components/charts/map-bar.vue';

export default {
    components: {
        MapChart,
        LineChart,
        BarChart,
        Selector,
        LineChartOverview,
        MapBarChart,
    },
    props: {
        charts: {
            type: Array,
            default: [{
                name: 'line-chart-overview',
                category: 'cases',
                col: 6,
                title: 'Daily new confirmed cases comparing with World Line',
                comparatorIdx: 0,
                xAxisIdx: 5,
                targetIdx: 1,
            }, {
                name: 'line-chart',
                category: 'cases',
                col: 6,
                title: 'Daily new confirmed cases comparing with countries population over 100m',
                xAxisIdx: 5,
                targetIdx: 1,
                filterIdx: 1,
                scaleIdx: 0,
            }],
        }
    },
    data() {
        return {
            title: 'TWITTER',
        }
    }
}
</script>