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
                    <q-select multiple class="col" options-selected-class="text-blue bg-grey-3" options-cover dense
                        outlined :options="options.comparators" :option-value="item => item.value"
                        :option-label="item => item.name" v-model="comparator">
                        <template #before>
                            <span class="text-caption">Line</span>
                        </template>
                        <template #selected>
                            <div class="ellipsis">{{ comparator.length }} lines added</div>
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
import * as d3 from 'd3';
import { markRaw, nextTick } from 'vue';
// fetch dataset && iso code translator
import { fetch, i18n_en, i18nEncoder, formatDate } from '@/assets/util.js';
// some configs imported
import { xAxis, OWID_data } from '@/assets/charts.config.js';
// pinia store
import { mapState, mapActions } from 'pinia';
import { countriesStore } from '@/stores/countries.js';
// meta info
import meta from '@/assets/owid-covid-data.meta.json';
// lodash
import * as _ from 'lodash';

// select options
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
        hideBottom: {
            type: Boolean,
            default: false,
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
        comparatorIdx: {
            type: Number,
            default: 0,
        },
        xAxisIdx: {
            type: Number,
            default: 5,
        },
        targetIdx: {
            type: Number,
            default: 0,
        }
    },
    watch: {
        scale: {
            handler: function (scale) {
                this.chart.setOption({
                    yAxis: [
                        {
                            id: 'left',
                            type: scale.value,
                            min: scale.value == 'log' ? 1 : 0,
                        }
                    ]
                })
            }
        },
        target: {
            handler: function () {
                this.updateLine();
            }
        },
        timeRange: {
            handler: function () {
                this.chart.setOption({
                    dataset: this.lines.map(code => {
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
        comparator: {
            handler: function () {
                this.lines = _.union(this.comparator.map(d => d.value), this.selection, this.entries);
                this.updateDataset({
                    replaceMerge: ['dataset'],
                })
                this.updateLine();
            }
        },
        selection: {
            handler: function () {
                this.lines = _.union(this.comparator.map(d => d.value), this.selection, this.entries);
                this.updateDataset({
                    replaceMerge: ['dataset'],
                })
                this.updateLine();
            }
        }
    },
    data() {
        return {
            chart: null,
            isFullscreen: false,
            dataset: {
                raw: null,
                selection: null,
            },
            chartRatio: this.ratio,
            loading: true,
            lines: [],
            options: {
                scale: scale,
                target: Object.entries(meta.properties).filter(d => d[1].category == this.category && /per_million/.test(d[0])).map(d => d[1]),
                comparators: OWID_data,
                xAxis: xAxis,
            },
            // toolbar config
            sample: xAxis[this.xAxisIdx].sample, // sampling parameters to elevate performance
            scale: scale[this.scaleIdx], // scale handler
            target: Object.entries(meta.properties).filter(d => d[1].category == this.category && /per_million/.test(d[0])).map(d => d[1])[this.targetIdx], // target dimension
            comparator: [OWID_data[this.comparatorIdx]], // select comparator
            xAxis: xAxis[this.xAxisIdx],
        }
    },
    computed: {
        // filtering dataset within a date range
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
        setLine() {
            if (!this.chart) {
                echarts.registerTheme('shine', colorScheme);
                this.chart = markRaw(echarts.init(this.$refs['chart'], 'shine'));
            }

            this.lines = _.union(this.selection, this.comparator.map(d => d.value), this.entries);

            const options = {
                dataZoom: [
                    {
                        id: 'inside',
                        type: 'inside',
                        xAxisIndex: 0,
                    },
                    {
                        id: 'slider',
                        type: 'slider',
                        show: true,
                        yAxisIndex: 0,
                        left: 0,
                    },
                    {
                        id: 'sliderBottom',
                        type: 'slider',
                        show: true,
                        xAxisIndex: 0,
                    }
                ],
                xAxis: [
                    {
                        type: 'time',
                        name: 'Date',
                    }
                ],
                yAxis: [
                    {
                        id: 'left',
                        type: 'value',
                        name: this.category,
                        axisLabel: {
                            formatter: d3.format('~s'),
                        }
                    }
                ],
                grid: [
                    {
                        id: 'grid',
                        show: true,
                    }
                ],
                title: {
                    id: 'title',
                    show: true,
                    text: this.title,
                    left: 'left',
                },
                brush: {
                    id: 'brush',
                    toolbox: ['lineX', 'clear'],
                    brushLink: 'all',
                    xAxisIndex: 'all',
                    throttleType: 'debounce',
                    throttleDelay: 300,
                },
                tooltip: {
                    show: true,
                    trigger: 'item',
                    confine: true,
                },
                dataset: this.lines.map(code => {
                    const id = `dataset_${code}`;
                    return {
                        id: id,
                        dimensions: ['date', this.target.value],
                        source: this.dataset.raw[code].data.filter(
                            (d, i) => d.date < this.timeRange[1] && d.date >= this.timeRange[0] && !(i % this.sample)
                        )
                    }
                }),
            }

            this.chart.setOption(options);

            const that = this;
            // throw an event about selected brush
            this.chart.on('brushSelected', function (params) {
                that.$emit('brushSelected', params);
            })
            // coordination dbclick to add/remove selection
            this.chart.on('dblclick', function (params) {
                console.log(params);
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

            this.updateLine();
        },
        updateLine(init = {}) {
            const that = this;
            const options = {
                dataset: this.lines.map(code => {
                    return {
                        id: `dataset_${code}`,
                        dimensions: ['date', this.target.value],
                    }
                }),
                series: this.lines.map(code => {
                    return {
                        id: code,
                        type: 'line',
                        datasetId: `dataset_${code}`,
                        name: code.length == 3 ? i18nEncoder.getName(code, 'en') : (OWID_data.find(d => d.value == code).name),
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
                        },
                        lineStyle: !this.selection.includes(code) ? {
                            shadowColor: 'black',
                            width: 3,
                            shadowBlur: 10,
                        } : {},
                        tooltip: {
                            formatter: params => this.getTooltip(params, that),
                            extraCssText: 'width: 200px; white-space:normal'
                        }
                    }
                }),
            };

            this.chart.setOption(options, init)
        },
        async setFullscreen() {
            this.isFullscreen = !this.isFullscreen;
            this.chartRatio = this.isFullscreen ? (16 / 7) : this.ratio;
            // waitting for next update
            await nextTick();
            this.chart.resize();
        },
        updateDataset(init = {}) {
            const options = {
                dataset: this.lines.map(code => {
                    const id = `dataset_${code}`;
                    return {
                        id: id,
                        dimensions: ['date', this.target.value],
                        source: this.dataset.raw[code].data.filter(
                            (d, i) => d.date < this.timeRange[1] && d.date >= this.timeRange[0] && !(i % this.sample)
                        )
                    }
                })
            }

            this.chart.setOption(options, init);
        },
        resetChart() {
            this.scale = scale[this.scaleIdx];
            this.target = this.options.target[0];
            this.comparator = [];
            this.xAxis = xAxis[this.xAxisIdx];
        },
        getTooltip(params, that, datasetIdx = 'raw') {
            const { value, seriesName, seriesId, dimensionNames } = params;
            const targetName = dimensionNames[1];
            const { date } = value;
            // average
            const { raw, selection } = that.dataset;
            // caculate the time range
            const begin7day = formatDate(d3.timeDay.offset(new Date(date), -7));
            let past7days;
            if (datasetIdx == 'raw') {
                past7days = raw[seriesId].data.filter(d => d.date <= date && d.date > begin7day);
            } else {
                past7days = selection.filter(d => d.date <= date && d.date > begin7day);
            }
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
        getSelectionLine() {
            const raw = _.flatten(this.selection.map(code => this.dataset.raw[code].data.filter(
                (d, i) => d.date < this.timeRange[1] && d.date >= this.timeRange[0] && !(i % this.sample)
            )));
            const data = d3.group(raw, d => d.date);

            const res = new Array;
            for (const date of data.keys()) {
                const values = data.get(date);
                const o = { date: date };
                this.options.target.forEach(key => o[key.value] = d3.mean(values, d => d[key.value]));
                res.push(o);
            }
            this.dataset.selection = res;
            return res;
        },
        async pullRaw() {
            const that = this;
            that.loading = true;
            await fetch.requestRaw().then((raw) => {
                that.dataset.raw = raw;
                that.loading = false;
            });
        },
        ...mapActions(countriesStore, ['addSelection', 'removeSelection']),
    },
    created: function () {
        i18nEncoder.registerLocale(i18n_en);
    },
    mounted: async function () {
        // fetch data
        await this.pullRaw();
        // init parameters
        this.lines = this.selection;

        this.setLine();
    },
}
</script>