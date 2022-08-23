<template>
    <div :class="`col-${size}`">
        <div class="text-h6 text-weight-bold q-mb-md">{{ bookmark.title }}</div>
        <component ref="chart" :is="bookmark.name" :title="bookmark.title" :color="bookmark.color" :category="bookmark.category"
            :comparatorIdx="bookmark.comparatorIdx" :xAxisIdx="bookmark.xAxisIdx" :targetIdx="bookmark.targetIdx"
            :scaleIdx="bookmark.scaleIdx" :filterIdx="bookmark.filterIdx" />
    </div>
</template>

<script lang="js">
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
        MapBarChart
    },
    props: {
        bookmark: {
            type: Object,
            default: () => new Object,
        }
    },
    computed: {
        size: function() {
            return this.bookmark.col
        }
    },
    watch: {
        size: {
            handler: function() {
                this.$refs['chart'].resizeChart();
            }
        }
    }
}
</script>