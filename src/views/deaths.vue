<template>
    <q-page-container>
        <q-page padding>
            <div class="list">
                <div class="item">
                    <div class="section">
                        <div class="q-my-lg text-h5 text-weight-bold row justify-between" :data-id="0"
                            v-intersection="onIntersection">
                            <span>⬇️ Daily number of confirmed cases rank</span>
                            <q-btn v-ripple round flat icon="bookmark_border" />
                        </div>
                        <div class="q-my-md row no-wrap q-col-gutter-x-md items-start">
                            <div class="col-8">
                                <bar-chart color="rgb(167, 42, 70)" category="deaths" :ratio="16 / 7" />
                            </div>
                        </div>
                    </div>
                </div>
                <q-separator class="q-my-xl" />
                <div class="item">
                    <div class="section">
                        <div class="q-my-lg text-h5 text-weight-bold row justify-between" :data-id="1"
                            v-intersection="onIntersection">
                            <span>⏱️ Daily number of confirmed cases over the timeline</span>
                            <q-icon name="bookmark_border" />
                        </div>
                        <div class="q-my-md row no-wrap q-col-gutter-x-md items-start">
                            <div class="col-6">
                                <line-chart-overview title="Daily new confirmed cases comparing with World Line"
                                    category="deaths" :comparatorIdx="0" :xAxisIdx="5" :targetIdx="1" />
                            </div>
                            <div class="col-6">
                                <line-chart
                                    title="Daily new confirmed cases comparing with countries population over 100m"
                                    category="deaths" :xAxisIdx="5" :targetIdx="1" :filterIdx="1" :scaleIdx="0" />
                            </div>
                        </div>
                    </div>
                </div>
                <q-separator class="q-my-xl" />
                <div class="item">
                    <div class="section">
                        <div class="q-my-lg text-h5 text-weight-bold row justify-between" :data-id="2"
                            v-intersection="onIntersection">
                            <span>🗺️ Daily number of confirmed cases with geographical perspective</span>
                            <q-icon name="bookmark_border" />
                        </div>
                        <map-bar-chart category="deaths" />
                    </div>
                </div>
                <q-separator class="q-my-xl" />
                <div class="item">
                    <div class="section">
                        <div class="q-my-lg text-h5 text-weight-bold row justify-between">
                            <span>Daily confirmed cases per million people</span>
                            <q-icon name="bookmark_border" />
                        </div>
                    </div>
                </div>
            </div>
            <q-page-sticky position="bottom-right" :offset="[30, 30]">
                <q-btn fab icon="filter_alt" color="teal" @click="setSelectorVisible" />
            </q-page-sticky>
        </q-page>
    </q-page-container>
    <q-drawer v-model="drawer" show-if-above :width="200" :breakpoint="500">
        <q-scroll-area class="fit">
            <q-list padding class="menu-list q-ma-md">
                <q-item :active="h.active" :focused="h.active" clickable v-ripple v-for="h in records" :key="h.content"
                    @click="toChart(h)">
                    <q-item-section avatar>
                        <q-icon :name="h.icon" />
                    </q-item-section>
                    <q-item-section>
                        {{ h.content }}
                    </q-item-section>
                </q-item>
            </q-list>
        </q-scroll-area>
    </q-drawer>
    <q-dialog persistent v-model="selectorVisible">
        <selector />
    </q-dialog>
</template>

<script>
// TODO: modularize the code
// TODO: had better to move the drawer
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
    data() {
        return {
            drawer: true,
            selectorVisible: false,
            charts: {
                map: { loading: true },
                line: { loading: true },
            },
            records: [
                {
                    icon: 'bar_chart',
                    content: 'Rank, Bar Chart',
                    id: 0,
                    active: true,
                },
                {
                    icon: 'timeline',
                    content: 'TimeLine, Line Chart',
                    id: 1,
                    active: false,
                },
                {
                    icon: 'map',
                    content: 'Geo, Map Chart',
                    id: 2,
                    active: false,
                }
            ]
        };
    },
    methods: {
        setSelectorVisible() {
            this.selectorVisible = !this.selectorVisible;
        },
        setLoading(target, state) {
            this.charts[target].loading = state;
        },
        onIntersection(entry) {
            const target = this.records[entry.target.dataset.id];
            target.active = !!entry.isIntersecting ? true : false;
        },
        toChart(h) {
            const target = document.querySelector(`div[data-id='${h.id}']`);
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        },

    },
};
</script>

<style>
.menu-list .q-item {
    border-radius: 32px;
}
</style>
