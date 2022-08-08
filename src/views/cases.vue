<template>
    <q-page-container>
        <q-page padding>
            <q-list>
                <q-item class="col justify-center q-col-gutter-x-md">
                    <q-item-section>
                        <div class="q-my-md text-h5 text-weight-bold row justify-between">
                            <span>Daily number of confirmed cases</span>
                            <q-icon name="bookmark_border" />
                        </div>
                        <div class="q-my-md row no-wrap q-col-gutter-x-md">
                            <div class="col-6">
                                <line-chart-overview title="Daily new confirmed cases comparing with World Line"
                                    :comparatorIdx="0" :xAxisIdx="5" :targetIdx="1" />
                            </div>
                            <div class="col-6">
                                <line-chart title="Daily new confirmed cases comparing with countries population over 100m" :xAxisIdx="5" :targetIdx="1" :filterIdx="1" :scaleIdx="0" />
                            </div>
                        </div>
                    </q-item-section>
                </q-item>
                <q-item class="col justify-center q-col-gutter-x-md">
                    <q-item-section>
                        <div class="q-my-md text-h5 text-weight-bold row justify-between">
                            <span>Daily confirmed cases per million people</span>
                            <q-icon name="bookmark_border" />
                        </div>
                        <div class="q-my-md row no-wrap q-col-gutter-x-md">
                            <div class="col-6">
                                <map-chart />
                            </div>
                        </div>
                    </q-item-section>
                </q-item>
            </q-list>
            <q-page-sticky position="bottom-right" :offset="[30, 30]">
                <q-btn fab icon="filter_alt" color="teal" @click="setSelectorVisible" />
            </q-page-sticky>
        </q-page>
    </q-page-container>
    <q-drawer v-model="drawer" show-if-above :width="200" :breakpoint="500">
        <q-scroll-area class="fit">
            <q-list padding class="menu-list q-ma-md">
                <q-item :active="h.active" :focused="h.active" clickable v-ripple v-for="h in records" :key="h.content">
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
import Selector from '../components/selector.vue';
import LineChartOverview from '../components/overview-charts/line.vue';

export default {
    components: {
        MapChart,
        LineChart,
        BarChart,
        Selector,
        LineChartOverview,
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
                    icon: 'inbox',
                    content: 'Chart',
                    id: 0,
                    active: true,
                },
                {
                    icon: 'inbox',
                    content: 'Map',
                    id: 1,
                    active: false,
                },
                {
                    icon: 'inbox',
                    content: 'Other',
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
        }
    },
};
</script>

<style>
.menu-list .q-item {
    border-radius: 32px;
}
</style>
