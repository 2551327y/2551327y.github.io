<template>
    <q-page-container>
        <q-page padding>
            <div class="list">
                <div class="item">
                    <div class="section">
                        <div class="q-my-lg text-h5 text-weight-bold row justify-between" :data-id="0"
                            v-intersection="onIntersection">
                            <span>⬇️ Daily number of confirmed cases rank</span>
                            <q-btn v-ripple round flat icon="bookmark" @click="toggleBookmark(elements[0].charts)">
                                <q-tooltip>Toogle the the charts to bookmark</q-tooltip>
                            </q-btn>
                        </div>
                        <div class="q-my-md row no-wrap q-col-gutter-x-md items-start">
                            <div class="col-8">
                                <bar-chart :color="elements[0].charts[0].color" category="vac" :ratio="16 / 7" />
                            </div>
                            <div class="col-4">
                                <q-card>
                                    <q-card-section>
                                        <span class="text-h6">Side Column</span>
                                        <div class="text-caption">Some secondary aid content for novice user.</div>
                                    </q-card-section>
                                </q-card>
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
                            <q-btn v-ripple round flat icon="bookmark" @click="toggleBookmark(elements[1].charts)">
                                <q-tooltip>Toogle the the charts to bookmark</q-tooltip>
                            </q-btn>
                        </div>
                        <div class="q-my-md row no-wrap q-col-gutter-x-md items-start">
                            <div class="col-6">
                                <line-chart-overview title="Daily new confirmed cases comparing with World Line"
                                    category="vac" :comparatorIdx="0" :xAxisIdx="5" :targetIdx="1" />
                            </div>
                            <div class="col-6">
                                <line-chart
                                    title="Daily new confirmed cases comparing with countries population over 100m"
                                    category="vac" :xAxisIdx="5" :targetIdx="1" :filterIdx="1" :scaleIdx="0" />
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
                            <q-btn v-ripple round flat icon="bookmark" @click="toggleBookmark(elements[2].charts)">
                                <q-tooltip>Toogle the the charts to bookmark</q-tooltip>
                            </q-btn>
                        </div>
                        <map-bar-chart category="vac" />
                    </div>
                </div>
                <q-separator class="q-my-xl" />
            </div>
            <q-page-sticky position="bottom-right" :offset="[30, 30]">
                <q-btn fab icon="filter_alt" color="teal" @click="setSelectorVisible" />
            </q-page-sticky>
        </q-page>
    </q-page-container>
    <q-drawer v-model="drawer" show-if-above :width="200" :breakpoint="500">
        <q-scroll-area class="fit">
            <q-list padding class="menu-list q-ma-md">
                <q-item :active="h.active" :focused="h.active" clickable v-ripple v-for="h in elements" :key="h.content"
                    @click="toChart(h)">
                    <q-item-section avatar>
                        <q-icon :name="h.icon" />
                    </q-item-section>
                    <q-item-section>
                        {{ h.content }}
                    </q-item-section>
                </q-item>
            </q-list>
            <q-banner rounded class="bg-blue text-white q-ml-md q-mb-md absolute-bottom">
                <p class="banner-tip">💡 Click to scroll to views conveniently.</p>
                <p class="banner-tip">💡 Use <q-icon name="bookmark_border" /> in header to add charts to explorer section</p>
            </q-banner>
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
import { mapActions } from 'pinia';
import { useBookmarks } from '@/stores/bookmarks.js';

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
            elements: [
                {
                    icon: 'bar_chart',
                    content: 'Rank, Bar Chart',
                    id: 0,
                    active: true,
                    charts: [{
                        name: 'bar-chart',
                        title: 'Daily vaccinations Rank',
                        color: 'rgb(0, 3, 18)',
                        category: 'vac',
                        col: 6,
                    }],
                },
                {
                    icon: 'timeline',
                    content: 'TimeLine, Line Chart',
                    id: 1,
                    active: false,
                    charts: [{
                        name: 'line-chart-overview',
                        category: 'vac',
                        col: 6,
                        title: 'Daily vaccinations comparing with World Line',
                        comparatorIdx: 0,
                        xAxisIdx: 5,
                        targetIdx: 1,
                    }, {
                        name: 'line-chart',
                        category: 'vac',
                        col: 6,
                        title: 'Daily vaccinations comparing with countries population over 100m',
                        xAxisIdx: 5,
                        targetIdx: 1,
                        filterIdx: 1,
                        scaleIdx: 0,
                    }],
                },
                {
                    icon: 'map',
                    content: 'Geo, Map Chart',
                    id: 2,
                    active: false,
                    charts: [
                        {
                            name: 'map-bar-chart',
                            category: 'vac',
                            col: 12,
                        }
                    ]
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
            const target = this.elements[entry.target.dataset.id];
            target.active = !!entry.isIntersecting ? true : false;
        },
        toChart(h) {
            const target = document.querySelector(`div[data-id='${h.id}']`);
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        },
        toggleBookmark(metas) {
            this.$q.notify({
                message: 'bookmark toggled',
                color: 'secondary',
            });
            this.toggle(metas);
        },
        ...mapActions(useBookmarks, {
            toggle: 'toggle',
        })
    },
};
</script>

<style>
.menu-list .q-item {
    border-radius: 32px;
}
</style>
