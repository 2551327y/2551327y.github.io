<template>
    <q-card :class="isFullscreen ? 'fullscreen' : ''">
        <q-card-section>
            <q-responsive :ratio="chartRatio">
                <div ref="bar" />
            </q-responsive>
        </q-card-section>
        <q-separator />
        <div :class="`${isFullscreen ? 'fixed-bottom' : ''}`">
            <q-toolbar dense class="q-pa-md row no-wrap justify-between">
                <div class="row no-wrap q-col-gutter-md justify-start">
                    <q-select class="col" dense options-cover outlined :options="options.xAxis" v-model="xAxis"
                        :option-value="item => item.value" :option-label="item => item.name">
                        <template #before>
                            <span class="text-caption">
                                Range
                            </span>
                        </template>
                        <template v-slot:selected-item="scope">
                            <div class="ellipsis">{{ scope.opt.name }}</div>
                        </template>
                        <q-tooltip>Ranges providing different granularity of changes</q-tooltip>
                    </q-select>
                    <q-select class="col" options-cover dense outlined :options="options.target"
                        :option-value="item => item.value" :option-label="item => item.name" v-model="target">
                        <template #before>
                            <span class="text-caption">Data</span>
                        </template>
                        <template v-slot:selected-item="scope">
                            <div class="ellipsis">{{ scope.opt.name }}</div>
                        </template>
                        <q-tooltip>Target Keys providing different perspectives</q-tooltip>
                    </q-select>
                    <q-input class="col" type="number" requied debounce="300" dense min="1" max="30" outlined
                        v-model="yAxis">
                        <template #before>
                            <span class="text-caption">yAxis</span>
                        </template>
                        <q-tooltip>
                            Num of top displayed
                        </q-tooltip>
                    </q-input>
                </div>
                <div>
                    <q-btn flat round dense :icon="!play.state ? 'play_circle' : 'pause_circle'" @click="setThumb">
                        <q-tooltip>Play</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense icon="restart_alt">
                        <q-tooltip>Reset</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense :icon="!isFullscreen ? 'fullscreen' : 'fullscreen_exit'"
                        @click="setFullscreen">
                        <q-tooltip>Fullscreen</q-tooltip>
                    </q-btn>
                </div>
            </q-toolbar>
            <q-separator />
            <q-toolbar dense class="q-mt-md row justify-center">
                <q-slider class="col-10 q-mx-xl" dense :min="0" :max="100" color="teal" v-model="rangeValue"
                    @change="setCurrentDate" label :markers="25" :marker-labels="markerLabels"
                    :label-always="play.state ? true : false" :label-value="`${setLabelsValue(rangeValue)}`" />
            </q-toolbar>
        </div>
        <q-inner-loading :showing="loading" />
    </q-card>
</template>

<script lang="js">
import { markRaw, nextTick } from 'vue';
import * as echarts from 'echarts';
import * as d3 from 'd3';
import { countries, xAxis } from '@/assets/charts.config.js';
import { mapState } from 'pinia';
import { countriesStore } from '@/stores/countries.js';
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
        },
        color: {
            type: String,
            default: 'rgb(52, 106, 83)',
        },
        targetIdx: {
            type: Number,
            default: 1,
        }
    },
    watch: {
        target: {
            handler: function () {
                this.updateDataset();
                this.setBar();
            }
        },
        xAxis: {
            handler: function () {
                const scheme = this.xAxis.value;

                if (scheme == -1) {
                    this.timeRange = d3.extent(this.dataset.map.keys(), d => d);
                } else {
                    const b = new Date(this.timeRange[1]);
                    const a = d3[scheme[0]].offset(b, -scheme[1]);
                    this.timeRange = [formatDate(a), formatDate(b)];
                }

                this.sliderStep = this.xAxis.step;
                this.dateInterpolator.range(this.timeRange.map(d => new Date(d)));
                this.markerLabels = this.getMarkerLabels();
                this.currentDate = this.timeRange[1];
            }
        },
        yAxis: {
            handler: function () {
                this.setBar();
            }
        },
        selection: {
            handler: function () {
                // TODO: optimize the structure of function
                const data = new Array;
                const raw = this.dataset.raw;
                // init prop Dataset array
                this.selection.map(code => {
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
                this.dataset.map = d3.group(data, d => d.date);

                // set the timeRange
                this.timeRange = d3.extent(this.dataset.map.keys(), d => d);
                this.dateInterpolator.range(this.timeRange.map(d => new Date(d))); // re-orientate the date interpolator
                this.currentDate = this.timeRange[1];

                try {
                    this.setBar();
                    // this.initBar()
                } catch (e) {
                    console.log(e);
                }
            }
        },
        currentDate: {
            handler: function (latest, old) {
                this.setBar();
            }
        }
    },
    data() {
        return {
            bar: null, // bar chart instance
            isFullscreen: false, // fullscreen flag
            loading: true,  // inner loading flag
            // slider markers props
            markerLabels: [],
            sliderStep: 1,
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
            target: Object.entries(meta.properties).filter(d => d[1].category == this.category).map(d => d[1])[this.targetIdx],
            rangeValue: 100,
            timeRange: meta.properties.date.range, // date range in current dataset map
            currentDate: null,
            chartRatio: this.ratio,
            /** 
             *  transform value to date
             *  combine with formatDate function.
             */
            dateInterpolator: d3.scaleLinear(meta.properties.date.range.map(d => new Date(d))).domain([0, 100]),
        }
    },
    computed: {
        ...mapState(countriesStore, {
            selection: 'selection',
        }),
    },
    methods: {
        setCurrentDate() {
            this.currentDate = formatDate(this.dateInterpolator(this.rangeValue));
        },
        initBar() {
            if (!this.bar) this.bar = markRaw(echarts.init(this.$refs['bar']));

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
                    text: this.target.name.replace(/\b\w/g, (s) =>
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
                    max: Math.min(this.yAxis, this.selection.length) - 1,
                    inverse: true,
                    nameLocation: 'middle',
                },
                series: [
                    {
                        id: 'bar',
                        type: 'bar',
                        realtimeSort: true,
                        seriesLayoutBy: 'column',
                        // datasetI: 'bar',
                        itemStyle: {
                            color: this.color,
                        },
                        encode: {
                            x: 'value',
                            y: 'iso_a3',
                        },
                        label: {
                            show: true,
                            formatter: params => params.data[params.dimensionNames[2]],
                            align: 'center',
                            fontFamily: 'sans-serif monospace',
                            valueAnimation: true,
                        }
                    }
                ],
                animationDuration: 0,
            });

            const data = new Array;
            const raw = this.dataset.raw;
            // init prop Dataset array
            this.selection.map(code => {
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
            this.dataset.map = d3.group(data, d => d.date);
            this.timeRange = d3.extent(this.dataset.map.keys(), d => d);
            this.dateInterpolator.range(this.timeRange.map(d => new Date(d))); // reorientate the date interpolator
            this.currentDate = this.timeRange[1];
            
            this.setBar();
        },
        updateDataset() {
            this.loading = true;
            const { raw, map } = this.dataset;
            for (let items of map.values()) {
                items.forEach(d => d.value = raw[d.iso_a3].data.find(r => r.date == d.date)[this.target.value])
            }
            this.loading = false;
        },
        setBar() {
            const data = this.dataset.map.get(this.currentDate);
            this.bar.setOption({
                series: [
                    {
                        id: 'bar',
                        data: data,
                    }
                ],
                yAxis: {
                    id: 'yAxis',
                    max: Math.min(this.selection.length, this.yAxis) - 1,
                }
            })
            this.bar.setOption({
                yAxis: {
                    id: 'yAxis',
                    axisLabel: {
                        show: true,
                        formatter: (val, idx) => {
                            try {
                                
                                return i18nEncoder.getName(data[idx].iso_a3, 'en')
                            } catch(e) {
                                console.log(idx, data, e);
                            }
                        },
                        overflow: 'break',
                        fontWeight: 'bold',
                    },
                },
                title: {
                    text: this.currentDate
                }
            })
        },
        getMarkerLabels() {
            let marker = [0, 25, 50, 75, 100];

            return marker.map(num => {
                return {
                    value: num,
                    label: formatDate(new Date(this.dateInterpolator(num))).replace(/-/g, '/'),
                }
            })
        },
        setLabelsValue(value) {
            return formatDate(this.dateInterpolator(value))
        },
        setThumb() {
            this.play.state = !this.play.state;
            const that = this;
            if (this.play.state) {
                this.rangeValue = this.rangeValue >= 100 ? 0 : this.rangeValue;
                this.play.timer = setInterval(() => {
                    if (that.rangeValue < 100) {
                        this.setCurrentDate(that.rangeValue = that.rangeValue + that.sliderStep);
                    } else {
                        that.setThumb();
                    }
                }, 1000);
            } else {
                clearInterval(this.play.timer);
            }
        },
        async setFullscreen() {
            this.isFullscreen = !this.isFullscreen;
            this.chartRatio = this.isFullscreen ? (16 / 7) : this.ratio;
            // waitting for next update
            await nextTick();
            this.bar.resize();
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
        /**
         * init some data props
         */
        this.markerLabels = this.getMarkerLabels();

        await this.pullRaw();
        this.initBar();
    }
}
</script>