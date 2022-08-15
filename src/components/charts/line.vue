<template>
    <q-card :class="isFullscreen ? 'fullscreen' : ''">
        <q-card-section>
            <q-responsive :ratio="chartRatio">
                <div ref="chart" />
            </q-responsive>
        </q-card-section>
        <q-separator :class="`${isFullscreen ? 'invisible' : ''}`" />
        <div v-if="!hideBottom" :class="`${isFullscreen ? 'fixed-bottom' : ''}`">
            <q-toolbar dense class="q-pa-md row no-wrap justify-between">
                <div class="row wrap q-col-gutter-md justify-start">
                    <q-select class="col" options-cover dense outlined :options="options.scale"
                        :option-value="item => item.value" :option-label="item => item.name" v-model="scale">
                        <template #before>
                            <span class="text-caption">Scale</span>
                        </template>
                        <template v-slot:selected-item="scope">
                            <div class="ellipsis">{{ scope.opt.name }}</div>
                        </template>
                    </q-select>
                    <q-select class="col" options-cover dense outlined :options="options.target"
                        :option-value="item => item.value" :option-label="item => item.name" v-model="target">
                        <template #before>
                            <span class="text-caption">Data</span>
                        </template>
                        <template v-slot:selected-item="scope">
                            <div class="ellipsis">{{ scope.opt.name }}</div>
                        </template>
                    </q-select>
                    <q-select class="col" options-cover options-selected-class="text-deep-orange-8" dense outlined
                        :option-value="item => item.value" :option-label="item => item.name" :options="options.filter"
                        v-model="filter">
                        <template #before>
                            <span class="text-caption">Comparator</span>
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
                        <template v-slot:selected-item="scope">
                            <div class="ellipsis">{{ scope.opt.name }}</div>
                        </template>
                    </q-select>
                    <q-select class="col" options-cover dense outlined :options="options.xAxis"
                        :option-value="item => item.value" :option-label="item => item.name" v-model="xAxis">
                        <template #before>
                            <span class="text-caption">x-Axis</span>
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
                    <q-btn flat round dense :icon="!isFullscreen ? 'fullscreen' : 'fullscreen_exit'"
                        @click="setFullscreen">
                        <q-tooltip>Fullscreen</q-tooltip>
                    </q-btn>
                </div>
            </q-toolbar>
        </div>
        <q-inner-loading :showing="loading" />
    </q-card>
</template>

<script lang="js">
// color scheme
import colorScheme from '@/assets/colors.echarts.json';
import * as echarts from 'echarts';
import { fetch, formatDate, i18nEncoder, i18n_en } from '@/assets/util.js';
import { markRaw, nextTick } from 'vue';
import meta from '@/assets/owid-covid-data.meta.json';
import * as d3 from 'd3';
import { filters, xAxis, default_countries, countries } from '@/assets/charts.config.js';
// pinia import
import { mapState, mapActions } from 'pinia';
import { countriesStore } from '@/stores/countries.js';
import _ from 'lodash';

const scale = [
    {
        name: 'Linear',
        value: 'value',
    },
    {
        name: 'Log',
        value: 'log',
    }
]

export default {
    props: {
        entries: {
            type: Array,
            default: [],
        },
        title: {
            type: String,
            default: '',
        },
        ratio: {
            type: Number,
            default: 16 / 9,
        },
        category: {
            type: String,
            default: 'cases',
        },
        // initialize some parameters
        scaleIdx: {
            type: Number,
            default: 0,
        },
        targetIdx: {
            type: Number,
            default: 1,
        },
        filterIdx: {
            type: Number,
            default: 0,
        },
        xAxisIdx: {
            type: Number,
            default: 5,
        },
        hideBottom: {
            type: Boolean,
            default: false,
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
                                (d, i) => d.date < this.timeRange[1] && d.date >= this.timeRange[0] && !(i % this.sample)
                            )
                        }
                    })
                })
            }
        },
        filter: {
            handler: function (scheme) {
                this.updateFilter(scheme);

                this.chart.setOption({
                    dataset: this.countries.map(code => {
                        return {
                            id: `dataset_${code}`,
                            dimensions: ['date', this.target.value],
                            source: this.dataset.raw[code].data.filter(
                                (d, i) => d.date < this.timeRange[1] && d.date >= this.timeRange[0] && !(i % this.sample) // sample the dataset to have better performance
                            )
                        }
                    }),
                }, {
                    replaceMerge: ['dataset'],
                    lazyUpdate: true,
                });

                this.setChart({
                    replaceMerge: ['series'],
                    lazyUpdate: true,
                });
            },
        },
        countries: {
            handler: function () { }
        },
        selection: {
            handler: function () {
                this.countries = _.union(this.filterCountries, this.selection, this.entries);
                this.setDataset();
                this.setChart({
                    replaceMerge: ['series', 'dataset']
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
            sample: xAxis[this.xAxisIdx].sample,
            countries: null,
            scale: scale[this.scaleIdx],
            target: Object.entries(meta.properties).filter(d => d[1].category == this.category).map(d => d[1])[this.targetIdx],
            filter: filters[this.filterIdx].children[0],
            filterCountries: [],
            xAxis: xAxis[this.xAxisIdx],
        }
    },
    computed: {
        // config
        timeRange: function () {
            const scheme = this.xAxis.value;
            this.sample = this.xAxis.sample;

            if (scheme == -1) {
                return meta.properties.date.range;
            } else {
                const b = new Date(meta.properties.date.range[1]);
                const a = d3[scheme[0]].offset(b, -scheme[1]);
                return [formatDate(a), formatDate(b)];
            }
        },
        ...mapState(countriesStore, {
            selection: 'selection',
        }),
    },
    methods: {
        async initChart() {

            if (!this.chart) {
                echarts.registerTheme('shine', colorScheme);
                this.chart = markRaw(echarts.init(this.$refs['chart'], 'shine'));
            }
            if (!this.dataset.raw) await this.pullRaw();

            this.updateFilter(this.filter);

            // default option for chart
            this.chart.setOption({
                dataZoom: [
                    {
                        id: 'inside',
                        type: 'inside',
                    },
                    {
                        type: 'slider',
                        show: true,
                        yAxisIndex: 0,
                        left: 0,
                    },
                    {
                        type: 'slider',
                        show: true,
                        xAxisIndex: 0,
                    },
                ],
                brush: {
                    id: 'brush',
                    toolbox: ['lineX', 'clear'],
                    brushLink: 'all',
                    xAxisIndex: 'all',
                    throttleType: 'debounce',
                    throttleDelay: 300,
                },
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
                        },
                        nameTextStyle: {
                            align: 'left',
                        },
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
                    trigger: 'item',
                    // order: 'valueDesc',
                    confine: true,
                },
                title: {
                    id: 'title',
                    show: true,
                    text: this.title,
                    left: 'left',
                },
                dataset: this.countries.map(code => {
                    const datasetId = `dataset_${code}`;
                    return {
                        id: datasetId,
                        dimensions: ['date', this.target.value],
                        source: this.dataset.raw[code].data.filter(
                            (d, i) => d.date < this.timeRange[1] && d.date >= this.timeRange[0] && !(i % this.sample)
                        )
                    }
                })
            })

            const that = this;
            this.chart.on('brushSelected', function (params) {
                that.$emit('brushSelected', params);
            })

            this.chart.on('dblclick', function (params) {
                const { seriesId: code } = params;
                const result = that.selection.findIndex(d => d == code);

                if (result == -1) {
                    that.addSelection(code);
                    that.$q.notify({
                        message: `${i18nEncoder.getName(code, 'en')} have been added from charts`,
                        color: 'secondary',
                    })
                } else {
                    that.removeSelection(code);
                    that.$q.notify({
                        message: `${i18nEncoder.getName(code, 'en')} have been removed from charts`,
                        color: 'secondary',
                    })
                }
            })

            this.setChart();
        },
        // update dataset due to selectior.vue notification
        setDataset(init = {}) {
            this.chart.setOption({
                dataset: this.countries.map(code => {
                    const datasetId = `dataset_${code}`;
                    return {
                        id: datasetId,
                        dimensions: ['date', this.target.value],
                        source: this.dataset.raw[code].data.filter(
                            (d, i) => d.date < this.timeRange[1] && d.date >= this.timeRange[0] && !(i % this.sample)
                        )
                    }
                })
            }, init)
        },
        setChart(init = {}) {
            const that = this;

            this.chart.setOption({
                dataset: this.countries.map(code => {
                    return {
                        id: `dataset_${code}`,
                        dimensions: ['date', that.target.value],
                    }
                }),
                series: this.countries.map(code => {
                    return {
                        id: code,
                        type: 'line',
                        datasetId: `dataset_${code}`,
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
                        emphasis: Object.assign({
                            show: true,
                            focus: 'self',

                        }, !this.selection.includes(code) ? {
                            lineStyle: {
                                opacity: 1,
                            },
                            itemStyle: {
                                opacity: 1,
                            }
                        } : {}),
                        itemStyle: !this.selection.includes(code) ? {
                            opacity: 0.2,
                        } : {
                            opacity: 1,
                        },
                        lineStyle: !this.selection.includes(code) ? {
                            type: 'solid',
                            width: 1,
                            opacity: 0.2,
                        } : {
                            type: 'solid',
                            width: 3,
                            opacity: 1,
                        },
                        tooltip: {
                            formatter: params => this.getTooltip(params, that),
                            extraCssText: 'width: 200px; white-space:normal'
                        },
                    }
                }),
                yAxis: [
                    {
                        id: 'yAxis',
                        name: this.target.name.replace(/\b\w/g, d => d.toUpperCase()),
                    }
                ],
            }, init);
        },
        getTooltip(params, that) {
            const { value, seriesName, seriesId, dimensionNames } = params;
            const targetName = dimensionNames[1];
            const { date } = value;
            // average
            const { raw } = that.dataset;
            // caculate the time range
            const begin7day = formatDate(d3.timeDay.offset(new Date(date), -7));
            const past7days = raw[seriesId].data.filter(d => d.date <= date && d.date > begin7day);
            const mean = d3.mean(past7days, d => d[targetName]);
            const max = d3.max(past7days, d => d[targetName]);
            const min = d3.min(past7days, d => d[targetName]);
            const median = d3.median(past7days, d => d[targetName]);
            const deviation = d3.deviation(past7days, d => d[targetName]);
            // format
            const format = d3.format(',')

            return `<div>
                        <p style='color:black;font-weight:bold;border-bottom:solid black 1px;margin:0'>${seriesName}, ${d3.timeDay.count(new Date(date), new Date)} days ago</p>
                        <p style='font-size:10px;color:grey;border-bottom:solid black 1px;margin:0;padding:0'>
                            <span style='font-weight:bold;font-style:italic;'>${format(value[targetName])}</span> ${targetName.replace(/_/g, ' ')} cases on ${value.date}
                        </p>
                        <div style='font-size:10px;color:black;margin:0;border-bottom:solid black 1px;'>
                            <p style='margin:0'>Over past 7 days, ${targetName.replace(/_/g, ' ')}</p>
                            <p style='margin:0'>🔹Average <span style='font-weight:bold;font-style:italic;'>${format(mean.toFixed(2))}</span></p>
                            <p style='margin:0'>🔹Median <span style='font-weight:bold;font-style:italic;'>${format(median.toFixed(2))}</span></p>
                            <p style='margin:0'>🔹Max <span style='font-weight:bold;font-style:italic;'>${format(max)}</span></p>
                            <p style='margin:0'>🔹Min <span style='font-weight:bold;font-style:italic;'>${format(min)}</span></p>
                            <p style='margin:0'>🔹Deviation <span style='font-weight:bold;font-style:italic;'>${format(deviation.toFixed(2))}</span></p>
                        </div>
                        <div style='font-size:10px;margin-top:5px'>
                            click to add this line to other charts.
                        </div>
                    </div>
                    `
        },
        setFilter(filter) {
            this.filter = filter;
        },
        updateFilter(scheme) {
            const raw = this.dataset.raw;

            switch (scheme.label) {
                case 'continent': {
                    this.filterCountries = countries.filter(code => raw[code].continent == scheme.value)
                    break;
                }
                case 'population': {
                    this.filterCountries = countries.filter(code => raw[code].population > scheme.value)
                    break;
                }
                case 'default': {
                    this.filterCountries = []
                    break;
                }
            }

            this.countries = _.union(this.filterCountries, this.selection, this.entries);
        },
        resetChart() {
            this.chart.clear();

            // set default settings for chart.
            this.countries = this.selection;
            this.target = Object.entries(meta.properties).filter(d => d[1].category == this.category).map(d => d[1])[0];
            this.scale = scale[0];
            this.xAxis = xAxis[this.xAxisIdx];
            this.filter = filters[0];

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
        ...mapActions(countriesStore, {
            addSelection: 'addSelection', removeSelection: 'removeSelection'
        })
    },
    created: function () {
        i18nEncoder.registerLocale(i18n_en);
    },
    mounted: async function () {
        
        this.countries = this.selection;
        await this.initChart();
    }
}
</script>