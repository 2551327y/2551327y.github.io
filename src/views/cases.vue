<template>
    <q-page-container>
        <q-page padding>
            <q-list>
                <q-item class="col justify-center">
                    <div class="col-8">
                        <div class="text-h5 text-blue text-weight-bold q-my-md" v-intersection="onIntersection"
                            :data-id="0">Confirmed
                            Cases
                            Chart</div>
                        <bar-chart />
                    </div>
                </q-item>
                <q-item class="col justify-center">
                    <div class="col-8">
                        <div class="text-h5 q-my-md" v-intersection="onIntersection" :data-id="1">Confirmed Cases
                            Map</div>
                        <line-chart />
                    </div>
                </q-item>
                <q-item class="col justify-center q-col-gutter-x-md">
                    <div class="col-6">
                        <div class="text-h5 q-my-md" v-intersection="onIntersection" :data-id="2">Confirmed Cases
                            Bar</div>
                        <map-chart />
                    </div>
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
import MapChart from '@/components/charts/map.vue';
import LineChart from '@/components/charts/line.vue';
import BarChart from '@/components/charts/bar.vue';
import Selector from '../components/selector.vue';

export default {
    components: {
        MapChart,
        LineChart,
        BarChart,
        Selector
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
