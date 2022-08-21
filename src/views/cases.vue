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
                        <q-banner rounded class="bg-teal text-white" v-if="isMetaVisible">
                            <p class="banner-tip">💡 Try to use
                                <q-icon name="filter_alt" /> in the bottom right corner to filter specific
                                countries.
                            </p>
                            <p class="banner-tip">💡 Check the tooltip infomation to understand parameter meaning
                                while
                                hover mouse on the input.</p>
                            <template v-slot:action>
                                <q-btn flat color="white" label="Dismiss" />
                            </template>
                        </q-banner>
                        <div class="q-my-md row no-wrap q-col-gutter-x-md items-start">
                            <div class="col-8">
                                <bar-chart category="cases" :ratio="16 / 7" :targetIdx="1" />
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
                        <q-banner rounded class="bg-teal text-white" v-if="isMetaVisible">
                            <p class="banner-tip">💡 Left line👈 contains the lines generalising a subset of dataset.
                                Right
                                line👉 contains the lines displaying specific countires data.</p>
                            <p class="banner-tip">💡 Drag the brushes next to the line graph to zoom the X-axis/Y-axis
                            </p>
                            <template v-slot:action>
                                <q-btn flat color="white" label="Dismiss" />
                            </template>
                        </q-banner>
                        <div class="q-my-md row no-wrap q-col-gutter-x-md items-start">
                            <div class="col-6">
                                <line-chart-overview title="Daily new confirmed cases comparing with World Line"
                                    :comparatorIdx="0" :xAxisIdx="5" :targetIdx="1" />
                            </div>
                            <div class="col-6">
                                <line-chart
                                    title="Daily new confirmed cases comparing with countries population over 100m"
                                    :xAxisIdx="5" :targetIdx="1" :filterIdx="1" :scaleIdx="0" />
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
                        <q-banner rounded class="bg-teal text-white" v-if="isMetaVisible">
                            <p class="banner-tip">💡 Try to delineate a geographical area with the brush tool and then
                                look at the histogram information in the area on the right</p>
                            <template v-slot:action>
                                <q-btn flat color="white" label="Dismiss" />
                            </template>
                        </q-banner>
                        <map-bar-chart />
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
            <q-banner rounded class="bg-blue text-white q-ml-md q-mb-md absolute-bottom" v-if="isMetaVisible">
                <p class="banner-tip">💡 Click to scroll to views conveniently.</p>
                <p class="banner-tip">💡 Use
                    <q-icon name="bookmark_border" /> in header to add charts to explorer section
                </p>
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
import { mapActions, mapState } from 'pinia';
import { useBookmarks, useMeta } from '@/stores/bookmarks.js';

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
                    content: 'Daily Cases Rank',
                    id: 0,
                    active: true,
                    marked: false,
                    charts: [{
                        name: 'bar-chart',
                        category: 'cases',
                        col: 6,
                        title: 'Daily new confirmed cases Rank',
                        targetIdx: 1,
                    }],
                },
                {
                    icon: 'timeline',
                    content: 'Daily Cases Timeline',
                    id: 1,
                    active: false,
                    marked: false,
                    charts: [{
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
                },
                {
                    icon: 'map',
                    content: 'Daily Cases Spread Map',
                    id: 2,
                    active: false,
                    marked: false,
                    charts: [{
                        name: 'map-bar-chart',
                        category: 'cases',
                        col: 12,
                    }],
                },
            ]
        };
    },
    computed: {
        ...mapState(useMeta, ['isMetaVisible']),
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
                message: `${metas.length} bookmark toggled`,
                color: 'secondary',
            });
            this.toggle(metas);
        },
        ...mapActions(useBookmarks, {
            toggle: 'toggle',
            hasBookmark: 'has',
        })
    },
    mounted: function () {
        this.elements.forEach(e => {
            e.marked = this.hasBookmark(e.charts);
        })
    }
};
</script>

<style>
.menu-list .q-item {
    border-radius: 32px;
}

.banner-tip {
    margin-block: 0;
}
</style>
