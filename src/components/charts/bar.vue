<template>
    <q-card :class="isFullscreen ? 'fullscreen' : ''">
        <q-card-section>
            <q-responsive :ratio="chartRatio">
                <div ref="bar" />
            </q-responsive>
        </q-card-section>
        <q-separator />
        <div>
            <q-toolbar dense class="q-pa-md row no-wrap justify-between">
                <div class="row no-wrap q-col-gutter-md justify-start">
                    <q-select class="col" dense options-cover outlined :options="options.xAxis" v-model="xAxis"
                        :option-value="item => item.value" :option-label="item => item.name">
                        <template #before>
                            <span class="text-body1">Range</span>
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
                    <q-input class="col" type="number" requied debounce="300" dense min="1" max="30" outlined
                        v-model="yAxis">
                        <template #before>
                            <span class="text-body1">yAxis</span>
                        </template>
                        <q-tooltip>
                            Num of top displayed
                        </q-tooltip>
                    </q-input>
                </div>
                <div>
                    <q-btn class="col" flat round dense icon="filter_alt" @click="isFilterDialog = !isFilterDialog">
                        <q-tooltip>Select Countries in a popup dialog</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense :icon="!play.state ? 'play_circle' : 'pause_circle'" @click="setThumb">
                        <q-tooltip>Play</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense icon="restart_alt">
                        <q-tooltip>Reset</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense :icon="!isFullscreen ? 'fullscreen' : 'fullscreen_exit'">
                        <q-tooltip>Fullscreen</q-tooltip>
                    </q-btn>
                </div>
            </q-toolbar>
            <q-separator />
            <q-toolbar dense class="q-mt-md row justify-center">
                <q-slider class="col-10 q-mx-xl" dense :min="0" :max="100" color="teal" v-model="rangeValue"
                    @change="setTimeRange" label :markers="25" :marker-labels="setMarkerLabels"
                    :label-value="`${setLabelsValue(rangeValue)}`" />
            </q-toolbar>
        </div>
        <q-inner-loading :showing="loading" />
    </q-card>
    <q-dialog v-model="isFilterDialog">
        <q-card>
            <q-card-section>
                <div class="text-h6">Filter</div>
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat label="Cancel" color="primary" v-close-popup />
                <q-btn flat label="Confrim" color="primary" v-close-popup />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="js">
import * as echarts from 'echarts';
import * as d3 from 'd3';
import { countries, default_countries, xAxis } from '@/assets/charts.config.js';
import meta from '@/assets/owid-covid-data.meta.json';
import { fetch, i18nEncoder, i18n_en, formatDate } from '@/assets/util.js';

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
        target: {
            handler: function () {
                this.updateDataset();
                this.setBar();
            }
        },
        yAxis: {
            handler: function () {
                this.setBar();
            }
        },
        xAxis: {
            handler: function () {
                const [handler, offset] = this.xAxis.value;
                const end = meta.properties.data.range[1];
                const start = d3[handler].offset(new Date(end), -offset);
            }
        }
    },
    data() {
        return {
            bar: null, // bar chart instance
            isFullscreen: false, // fullscreen flag
            loading: true,  // inner loading flag
            isFilterDialog: false, // filter dialog flag
            /**
             * play state store
             */
            play: {
                state: false,
                timer: null,
            },
            // component dataset
            dataset: {
                raw: null, // owid-covid-data
                map: null, // transform to fit the bar requirement
            },
            options: {
                xAxis: xAxis,
                target: Object.entries(meta.properties).filter(d => d[1].category == this.category).map(d => d[1]),
            },
            // option selected
            xAxis: xAxis[5],
            yAxis: 10,
            target: Object.entries(meta.properties).filter(d => d[1].category == this.category).map(d => d[1])[0],
            rangeValue: 100,
            chartRatio: this.ratio,
            timeRange: meta.properties.date.range,
            currentDate: '2021-01-01',
            /** 
             *  transform value to date
             *  combine with formatDate function.
             */
            dateInterpolator: d3.scaleLinear(meta.properties.date.range.map(d => new Date(d))).domain([0, 100]),
        }
    },
    methods: {
        initBar() {
            if (!this.bar) this.bar = echarts.init(this.$refs['bar']);

            this.bar.setOption({
                xAxis: {
                    id: 'xAxis',
                    max: 'dataMax',
                    axisLabel: {
                        formatter: d3.format(',')
                    }
                },
                tooltip: {
                    show: true,
                },
                title: {
                    show: true,
                    text: meta.properties.new_cases.name.replace(/\b\w/g, (s) =>
                        s.toUpperCase()),
                },
                grid: [{
                    left: '15%',
                    right: '10%',
                    bottom: 30,
                }],
                yAxis: {
                    id: 'yAxis',
                    type: 'category',
                    max: Math.min(this.yAxis, default_countries.length) - 1,
                    inverse: true,
                    nameLocation: 'middle',
                    axisLabel: {
                        show: true,
                        formatter: code => i18nEncoder.getName(code, 'en'),
                        overflow: 'break',
                        fontWeight: 'bold',
                    },
                },
                series: [
                    {
                        id: 'bar',
                        type: 'bar',
                        realtimeSort: true,
                        seriesLayoutBy: 'column',
                        type: 'bar',
                        itemStyle: {
                            color: 'rgb(52, 106, 83)',
                        },
                        label: {
                            show: true,
                            formatter: params => params.data[params.dimensionNames[2]],
                            align: 'center',
                            fontFamily: 'sans-serif monospace',
                            valueAnimation: true,
                        }
                    }
                ]
            });

            const data = new Array;
            const raw = this.dataset.raw;
            // init prop Dataset array
            default_countries.map(code => {
                const inRange = raw[code].data.filter(d => d.date < this.timeRange[1] && d.date >= this.timeRange[0]);
                data.push(...inRange.map(d => {
                    return {
                        iso_a3: code,
                        date: d.date,
                        value: d[this.target.value],
                    }
                }))
            })
            // set temperate dataset in option
            this.dataset.map = data;

            this.setBar();
        },
        updateDataset() {
            this.loading = true;
            const { raw, map } = this.dataset;
            map.forEach(d => d.value = raw[d.iso_a3].data.find(r => r.date == d.date)[this.target.value]);
            this.loading = false;
        },
        setBar() {
            this.bar.setOption({
                dataset: {
                    id: 'bar',
                    dimensions: ['iso_a3', 'date', 'value'],
                    source: this.dataset.map.filter(d => d.date == this.currentDate),
                },
                series: [{
                    id: 'bar',

                    encode: {
                        x: 'value',
                        y: 'iso_a3',
                    },

                }],
                yAxis: {
                    id: 'yAxis',
                    max: Math.min(default_countries.length, this.yAxis) - 1,
                }
            })
        },
        updateDate() {

        },
        setMarkerLabels(value) {
            return formatDate(new Date(this.dateInterpolator(value))).replace(/-/g, '/')
        },
        setLabelsValue(value) {
            return formatDate(this.dateInterpolator(value))
        },
        setTimeRange() {
            this.timeRange = [formatDate(this.dateInterpolator(this.rangeValue.min)), formatDate(this.dateInterpolator(this.rangeValue.max))];
        },
        setThumb() {
            this.play.state = !this.play.state;
            const that = this;
            if (this.play.state) {
                this.rangeValue.max = 0;
                this.play.timer = setInterval(() => {
                    if (that.rangeValue.max < 100) {
                        that.rangeValue.max++;
                        that.setTimeRange();
                    } else {
                        that.setThumb();
                    }
                }, 1000);
            } else {
                clearInterval(this.play.timer);
            }
        },
        async pullRaw() {
            const that = this;
            that.loading = true;
            await fetch.requestRaw().then((raw) => {
                that.dataset.raw = raw;
                that.loading = false;
            });
        }
    },
    created: function () {
        //  register the en lang for encoder
        i18nEncoder.registerLocale(i18n_en);
    },
    mounted: async function () {
        await this.pullRaw();
        this.initBar();
    }
}
</script>