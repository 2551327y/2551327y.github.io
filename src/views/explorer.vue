<template>
    <q-page-container>
        <q-page padding>
            <div v-if="bookmarks.length" class="q-my-md row wrap q-col-gutter-x-md items-start">
                <div v-for="(bookmark, idx) in bookmarks" :key="idx" :class="`col-${bookmark.col}`">
                    <div class="text-h6 text-weight-bold q-mb-md">{{ bookmark.title }}</div>
                    <component :is="bookmark.name" :title="bookmark.title" :color="bookmark.color"
                        :category="bookmark.category" :comparatorIdx="bookmark.comparatorIdx"
                        :xAxisIdx="bookmark.xAxisIdx" :targetIdx="bookmark.targetIdx" :scaleIdx="bookmark.scaleIdx"
                        :filterIdx="bookmark.filterIdx" />
                </div>
            </div>
            <div v-else class="fit row flex-center">
                <div class="text-center">
                    <q-icon name="error_outline" size="lg" color="teal" tag="div" />
                    <div class="text-capitalize text-grey">No Charts Added.</div>
                </div>
            </div>
            <q-page-sticky position="bottom-right" :offset="[30, 30]">
                <q-fab color="secondary" push icon="keyboard_arrow_left" direction="left">
                    <q-fab-action color="primary" @click="setSelectorVisible" icon="filter_alt" label="filter" />
                    <q-fab-action color="accent" icon="alarm" label="time controller" />
                </q-fab>
            </q-page-sticky>
        </q-page>
    </q-page-container>
    <q-dialog persistent v-model="selectorVisible">
        <selector />
    </q-dialog>
</template>

<script lang="js">
import MapChart from '@/components/charts/map.vue';
import LineChart from '@/components/charts/line.vue';
import BarChart from '@/components/charts/bar.vue';
import Selector from '@/components/selector.vue';
import LineChartOverview from '@/components/overview-charts/line.vue';
import MapBarChart from '@/components/charts/map-bar.vue';

import { mapState } from 'pinia';
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
            selectorVisible: false,
        }
    },
    computed: {
        ...mapState(useBookmarks, ['bookmarks']),
    },
    methods: {
        setSelectorVisible() {
            this.selectorVisible = !this.selectorVisible;
        },
    }
}
</script>

<style>
.menu-list .q-item {
    border-radius: 32px;
}
</style>