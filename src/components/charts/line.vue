<template>
    <q-card :class="isFullscreen ? 'fullscreen' : ''">
        <q-card-section>
            <q-responsive :ratio="chartRatio">
                <div ref="chart" />
            </q-responsive>
        </q-card-section>
        <q-separator :class="`${isFullscreen ? 'invisible' : ''}`" />
        <div :class="`${isFullscreen ? 'fixed-bottom' : ''}`">
            <q-toolbar dense class="q-pa-md row no-wrap justify-between">
                <div class="row wrap q-col-gutter-md justify-start">
                    <q-select class="col" options-cover dense outlined :options="options.scale"
                        :option-value="item => item.value" :option-label="item => item.name" v-model="scale">
                        <template #before>
                            <span class="text-body1">Scale</span>
                        </template>
                        <template v-slot:selected-item="scope">
                            <div class="ellipsis">{{ scope.opt.name }}</div>
                        </template>
                    </q-select>
                    <q-select class="col" options-cover dense outlined :options="options.target"
                        :option-value="item => item.value" :option-label="item => item.name" v-model="target">
                        <template #before>
                            <span class="text-body1">Data</span>
                        </template>
                        <template v-slot:selected-item="scope">
                            <div class="ellipsis">{{ scope.opt.name }}</div>
                        </template>
                    </q-select>
                    <q-select class="col" options-cover options-selected-class="text-deep-orange-8" dense outlined
                        :option-value="item => item.value" :option-label="item => item.name" :options="options.filter"
                        v-model="filter">
                        <template #before>
                            <span class="text-body1">Filter</span>
                        </template>
                        <template #option="filter">
                            <q-expansion-item v-if="filter.opt.type == 'group'" default-opened
                                header-class="text-weight-bold" :group="filter.opt.name" expand-separator
                                :label="filter.opt.name">
                                <template v-for="child in filter.opt.children" :key="child.name">
                                    <q-item clickable v-ripple v-close-popup>
                                        <q-item-section @click="setFilter(Object.assign(child, {
                                            type: filter.opt.name,
                                        }))">
                                            <q-item-label>{{ child.name }}</q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </template>
                            </q-expansion-item>
                            <q-item v-else clickable v-ripple v-close-popup>
                                <q-item-section @click="setFilter(Object.assign(filter.opt, {
                                    type: filter.opt.name
                                }))">
                                    <q-item-label>{{ filter.opt.name }}</q-item-label>
                                </q-item-section>
                            </q-item>
                        </template>
                    </q-select>
                    <q-select class="col" options-cover dense outlined :options="options.xAxis"
                        :option-value="item => item.value" :option-label="item => item.name" v-model="xAxis">
                        <template #before>
                            <span class="text-body1">x-Axis</span>
                        </template>
                        <template v-slot:selected-item="scope">
                            <div class="ellipsis">{{ scope.opt.name }}</div>
                        </template>
                    </q-select>
                </div>
                <div class="row no-wrap justify-end">
                    <q-btn flat round dense icon="restart_alt" @click="resetChart">
                        <q-tooltip>Reset</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense :icon="!isFullscreen ? 'fullscreen' : 'fullscreen_exit'" @click="setFullscreen">
                        <q-tooltip>Fullscreen</q-tooltip>
                    </q-btn>
                </div>
            </q-toolbar>
        </div>
        <q-inner-loading :showing="loading" />
    </q-card>
</template>

<script lang="js">
import { fetch, formatDate, i18nEncoder, i18n_en } from '@/assets/util.js';
import * as echarts from 'echarts';
import { markRaw, nextTick } from 'vue';
import meta from '@/assets/owid-covid-data.meta.json';
import * as d3 from 'd3';
import { filters, xAxis, default_countries, countries } from '@/assets/charts.config.js';

const scale = [
    {
        name: 'Linear',
        value: 'value'
    },
    {
        name: 'Log',
        value: 'log',
    }
]

export default {
    props: {
        ratio: {
            type: Number,
            default: 16 / 9,
        },
        category: {
            type: String,
            default: 'cases',
        }
    },
    watch: {
        scale: {
            handler: function (scale) {
                this.chart.setOption({
                    yAxis: [
                        {
                            id: 'yAxis',
                            type: scale.value,
                            min: scale.value == 'log' ? 1 : 0,
                        }
                    ]
                })
            }
        },
        target: {
            handler: function () {
                this.setChart();
            }
        },
        timeRange: {
            handler: function () {
                this.chart.setOption({
                    dataset: this.countries.map(code => {
                        return {
                            id: `dataset_${code}`,
                            source: this.dataset.raw[code].data.filter(
                                d => d.date < this.timeRange[1] && d.date >= this.timeRange[0]
                            )
                        }
                    })
                })
            }
        },
        filter: {
            handler: function (scheme) {
                const raw = this.dataset.raw;

                switch (scheme.label) {
                    case 'continent': {
                        this.countries = countries.filter(code => raw[code].continent == scheme.value)
                        break;
                    }
                    case 'population': {
                        this.countries = countries.filter(code => raw[code].population > scheme.value);
                        break;
                    }
                    case 'default': {
                        this.countries = default_countries;
                        break;
                    }
                }
                this.chart.showLoading();
                this.chart.setOption({
                    dataset: this.countries.map(code => {
                        return {
                            id: `dataset_${code}`,
                            dimensions: ['date', this.target.value],
                            source: this.dataset.raw[code].data.filter(
                                d => d.date < this.timeRange[1] && d.date >= this.timeRange[0]
                            )
                        }
                    }),
                }, {
                    replaceMerge: ['dataset'],
                    lazyUpdate: true,
                });
                this.chart.hideLoading();

                this.setChart({
                    replaceMerge: ['series'],
                    lazyUpdate: true,
                });
            }
        }
    },
    data() {
        return {
            chart: null,
            loading: true,
            isFullscreen: false,
            chartRatio: this.ratio,
            dataset: {
                raw: null,
            },
            options: {
                scale: scale,
                target: Object.entries(meta.properties).filter(d => d[1].category == this.category).map(d => d[1]),
                filter: filters,
                xAxis: xAxis,
            },
            // config
            // timeRange
            countries: default_countries,
            scale: scale[0],
            target: Object.entries(meta.properties).filter(d => d[1].category == this.category).map(d => d[1])[0],
            filter: filters[0],
            xAxis: xAxis[5],
        }
    },
    computed: {
        // config
        timeRange: function () {
            const scheme = this.xAxis.value;

            if (scheme == -1) {
                return meta.properties.date.range;
            } else {
                const b = new Date(meta.properties.date.range[1]);
                const a = d3[scheme[0]].offset(b, -scheme[1]);
                return [formatDate(a), formatDate(b)];
            }
        }
    },
    methods: {
        async initChart() {
            if (!this.chart) this.chart = markRaw(echarts.init(this.$refs['chart']));
            if (!this.dataset.raw) await this.pullRaw();

            // default option for chart
            this.chart.setOption({
                dataZoom: [
                    {
                        id: 'inside',
                        type: 'inside',
                    },
                    {
                        type: 'slider',
                    }
                ],
                xAxis: {
                    type: 'time',
                    name: 'Date',
                },
                yAxis: [
                    {
                        id: 'yAxis',
                        type: 'value',
                        name: this.target.name.replace(/\b\w/g, d => d.toUpperCase()),
                        axisLabel: {
                            formatter: d3.format('~s')
                        }
                    }
                ],
                grid: [
                    {
                        id: 'grid',
                        show: true,
                    }
                ],
                tooltip: {
                    show: true,
                    trigger: 'axis',
                    order: 'valueDesc',
                    confine: true,
                },
                title: {
                    id: 'title',
                    show: true,
                    text: this.target.name.replace(/\b\w/g, d => d.toUpperCase()),
                    subtext: `From ${formatDate(new Date(this.timeRange[0]))} To ${formatDate(new Date(this.timeRange[1]))}`,
                    left: 'center',
                },
                dataset: this.countries.map(code => {
                    const datasetId = `dataset_${code}`;
                    return {
                        id: datasetId,
                        dimensions: ['date', this.target.value],
                        source: this.dataset.raw[code].data.filter(
                            d => d.date < this.timeRange[1] && d.date >= this.timeRange[0]
                        )
                    }
                })
            })

            this.setChart();
        },
        setChart(init) {
            this.chart.setOption({
                dataset: this.countries.map(code => {
                    return {
                        id: `dataset_${code}`,
                        dimensions: ['date', this.target.value],
                    }
                }),
                series: this.countries.map(code => {
                    return {
                        id: code,
                        type: 'line',
                        datasetId: `dataset_${code}`,
                        showSymbol: false,
                        name: i18nEncoder.getName(code, 'en'),
                        encode: {
                            itemId: 'date',
                            x: 'date',
                            y: this.target.value,
                        },
                        endLabel: {
                            show: true,
                            formatter: '{a}',
                            overflow: 'truncate',
                            valueAnimation: false,
                        },
                        emphasis: {
                            show: true,
                            focus: 'self',
                        }
                    }
                }),
                yAxis: [
                    {
                        id: 'yAxis',
                        name: this.target.name.replace(/\b\w/g, d => d.toUpperCase()),
                    }
                ],
                title: {
                    id: 'title',
                    text: this.target.name.replace(/\b\w/g, d => d.toUpperCase()),
                }
            }, init);
        },
        setFilter(filter) {
            this.filter = filter;
        },
        resetChart() {
            this.chart.clear();

            // set default settings for chart.
            this.countries = default_countries;
            this.target = Object.entries(meta.properties).filter(d => d[1].category == this.category).map(d => d[1])[0];
            this.scale = scale[0];
            this.timeRange = meta.properties.date.range;

            // re-init chart
            this.initChart();
        },
        async setFullscreen() {
            this.isFullscreen = !this.isFullscreen;
            this.chartRatio = this.isFullscreen ? (16 / 7) : this.ratio;
            // waitting for next update
            await nextTick();
            this.chart.resize();
        },
        async pullRaw() {
            const that = this;
            that.loading = true;
            await fetch.requestRaw().then((raw) => {
                that.dataset.raw = raw;
                that.loading = false;
            });
        },
    },
    created: function () {
        i18nEncoder.registerLocale(i18n_en);
    },
    mounted: async function () {
        await this.initChart();
    }
}
</script>