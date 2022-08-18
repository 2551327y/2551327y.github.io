<template>
    <div class="q-my-md q-col-gutter-x-md row no-wrap items-stretch">
        <div class="col-8 self-start">
            <map-chart :ratio="mapRatio" @targetChange="updateTarget" @brushAreas='updateAreaBrushed'
                @updateTimeRange='updateTimeRange' />
        </div>
        <div class="col-4 row items-stretch">
            <q-card class="col">
                <q-card-section class="bg-green-1 fit">
                    <div ref="chart" class="fit"></div>
                </q-card-section>
                <q-btn flat icon="menu" round class="q-md-sm"
                    style="position:absolute;bottom:5px;transform:translateX(15%);">
                    <q-popup-proxy>
                        <q-toolbar class="q-pa-md">
                            <q-input type="number" outlined dense v-model="topNum" :min="1">
                                <template #before>
                                    <span class="text-caption">Top Number</span>
                                </template>
                            </q-input>
                        </q-toolbar>
                    </q-popup-proxy>
                </q-btn>
                <q-inner-loading :showing="loading" />
            </q-card>
        </div>
    </div>
</template>

<script lang="js">
import * as echarts from 'echarts';
import * as d3 from 'd3';
import mapChart from '@/components/charts/map.vue';
import lineChart from '@/components/charts/line.vue';
import { markRaw, nextTick } from 'vue';
import { mapState } from 'pinia';
import { countriesStore } from '@/stores/countries.js';
import { fetch, i18nEncoder, i18n_en, formatDate } from '@/assets/util.js';
import _ from 'lodash';
import meta from '@/assets/owid-covid-data.meta.json';

export default {
    components: {
        mapChart,
        lineChart,
    },
    props: {
        mapRatio: {
            type: Number,
            default: 19 / 9,
        },
        category: {
            type: String,
            default: 'cases',
        },
    },
    watch: {
        currendDate: {
            handler: function () {
                this.updateBar();
            }
        },
        areaBrushed: {
            handler: function () {
                // update map dataset
                let data = new Array;
                const { raw } = this.dataset;
                this.series = _.union(this.selection, this.areaBrushed);
                this.series.map(code => {
                    data.push(...raw[code].data.map(d => {
                        return {
                            iso_a3: code,
                            date: d.date,
                            value: !!d[this.target.value] ? d[this.target.value] : 0,
                        }
                    }))
                })

                // set map dataset
                this.dataset.map = d3.group(data, d => d.date);

                // set the line chart
                this.chart.setOption({
                    dataset: this.series.map(code => {
                        const datasetId = `line_${code}`;
                        return {
                            id: datasetId,
                            dimensions: ['date', this.target.value],
                            source: this.dataset.raw[code].data.filter(
                                (d, i) => d.date < this.timeRange[1] && d.date >= this.timeRange[0] && !(i % 7)
                            )
                        }
                    })
                })

                this.updateBar();
            }
        },
        topNum: {
            handler: function () {
                this.chart.setOption({
                    yAxis: {
                        id: 'yAxis',
                        max: Math.min(this.series.length, this.topNum) - 1,
                    }
                })
            }
        },
        selection: {
            handler: function () {
                // console.log(this.selection)
            }
        }
    },
    data() {
        return {
            chart: null,
            loading: true,
            dataset: {
                raw: null,
                map: null,
            },
            series: [],
            areaBrushed: [],
            timeRange: meta.properties.date.range,
            target: Object.entries(meta.properties).filter(d => d[1].category == this.category).map(d => d[1])[0],
            topNum: 15,

        }
    },
    computed: {
        ...mapState(countriesStore, ['selection']),
        currendDate: function () {
            return this.timeRange[1];
        }
    },
    methods: {
        setBar() {
            if (!this.chart) this.chart = markRaw(echarts.init(this.$refs['chart']));

            const options = {
                tooltip: {
                    show: true,
                },
                grid: [
                    {
                        id: 'bar',
                        left: '15%',
                        right: '5%',
                        top: '5%',
                        height: '40%',
                    },
                    {
                        id: 'line',
                        bottom: '5%',
                        height: '40%',
                        left: '10%',
                        right: '5%',
                    }
                ],
                xAxis: [
                    {
                        id: 'xAxis',
                        gridIndex: 0,
                        max: 'dataMax',
                        axisLabel: {
                            formatter: d3.format(','),
                        }
                    },
                    {
                        id: 'line',
                        gridIndex: 1,
                        type: 'time',
                    }
                ],
                yAxis: [
                    {
                        id: 'yAxis',
                        gridIndex: 0,
                        type: 'category',
                        nameLocation: 'middle',
                        inverse: true,
                        max: Math.min(this.series.length, this.topNum) - 1,
                        axisLabel: {
                            show: true,
                            formatter: code => i18nEncoder.getName(code, 'en'),
                            overflow: 'break',
                            fontWeight: 'bold',
                        },
                    },
                    {
                        id: 'line',
                        gridIndex: 1,
                        type: 'value',
                        name: this.target.name.replace(/\b\w/g, d => d.toUpperCase()),
                        axisLabel: {
                            formatter: d3.format('~s'),
                        }
                    }
                ],
                dataZoom: [
                    {
                        xAxisIndex: 1,
                        type: 'inside',
                    }
                ],
                series: [
                    {
                        id: 'bar',
                        xAxisIndex: 0,
                        yAxisIndex: 0,
                        type: 'bar',
                        realtimeSort: true,
                        seriesLayoutBy: 'column',
                        itemStyle: {
                            color: 'rgb(52, 106, 83)',
                        },
                        encode: {
                            x: 'value',
                            y: 'iso_a3',
                        },
                        datasetIndex: 0,
                        label: {
                            show: true,
                            formatter: params => params.data[params.dimensionNames[2]],
                            align: 'center',
                            fontFamily: 'sans-serif monospace',
                            valueAnimation: true,
                        },
                        animationDuration: 300,
                    },
                    ...this.series.map(code => {
                        return {
                            id: code,
                            type: 'line',
                            datasetId: `line_${code}`,
                            name: i18nEncoder.getName(code, 'en'),
                            xAxisIndex: 1,
                            yAxisIndex: 1,
                            encode: {
                                itemId: 'date',
                                x: 'date',
                                y: this.target.value,
                            },
                            
                        }
                    })
                ],
            };
            this.chart.setOption(options);

            let data = new Array;
            const { raw } = this.dataset;
            this.series = _.union(this.selection, this.areaBrushed);
            this.series.map(code => {
                const inRange = raw[code].data;
                data.push(...inRange.map(d => {
                    return {
                        iso_a3: code,
                        date: d.date,
                        value: !!d[this.target.value] ? d[this.target.value] : 0,
                    }
                }))
            })

            // set map dataset
            this.dataset.map = d3.group(data, d => d.date);
            this.updateBar();
        },
        updateBar(init = {}) {
            const result = this.dataset.map.get(this.currendDate);

            const options = {
                dataset: [
                    {
                        id: 'bar',
                        source: !!result ? result : [],
                    },
                    ...this.series.map(code => {
                        const datasetId = `line_${code}`;
                        return {
                            id: datasetId,
                            dimensions: ['date', this.target.value],
                            source: this.dataset.raw[code].data.filter(
                                (d, i) => d.date < this.timeRange[1] && d.date >= this.timeRange[0] && !(i % 7)
                            )
                        }
                    })
                ],
                title: {
                    text: `${!!result ? this.target.name : 'NO DATA'} ${this.currendDate}`,
                }
            }
            this.chart.setOption(options, init);
            console.log(this.chart.getOption())
        },
        updateAreaBrushed(params) {
            this.areaBrushed = params;
        },
        updateTimeRange(params) {
            this.timeRange = params;
        },
        updateTarget(params) {
            this.target = params;
            const { raw, map } = this.dataset;
            for (let items of map.values()) {
                items.forEach(d => d.value = raw[d.iso_a3].data.find(r => r.date == d.date)[this.target.value])
            }
            this.chart.setOption({
                series: [
                    ...this.series.map(code => {
                        return {
                            id: code,
                            encode: {
                                itemId: 'date',
                                x: 'date',
                                y: this.target.value,
                            },
                        }
                    })
                ]
            })
            this.updateBar();
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
    mounted: async function () {
        this.series = [...this.selection];

        await this.pullRaw();
        this.setBar();
    }
}
</script>