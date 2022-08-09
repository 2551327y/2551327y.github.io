<template>
    <q-card :class="isFullscreen ? 'fullscreen' : ''">
        <q-card-section>
            <div class="q-gutter-x-md">
                <q-responsive :ratio="chartRatio">
                    <div ref="map"></div>
                </q-responsive>
            </div>
        </q-card-section>
        <q-separator :class="`${isFullscreen ? 'invisible' : ''}`" />
        <div :class="`${isFullscreen ? 'fixed-bottom' : ''}`">
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
                    <q-select class="col" v-model="hasBubble" options-cover dense outlined :options="options.hasBubble"
                        text-color="black">
                        <template #before>
                            <span class="text-caption">Bubble</span>
                        </template>
                        <template v-slot:selected-item="scope">
                            <div class="ellipsis">{{ scope.opt.label }}</div>
                        </template>
                    </q-select>
                    <q-input class="col" type="number" requied debounce="300" dense step="5" min="20" max="100" outlined
                        v-model="maxRadius">
                        <template #before>
                            <span class="text-caption">Max Radius</span>
                        </template>
                        <template v-slot:selected-item="scope">
                            <div class="ellipsis">{{ scope.opt.name }}</div>
                        </template>
                        <q-tooltip>
                            Only applied when 'Bubble' is 'ON'
                        </q-tooltip>
                    </q-input>
                </div>
                <div class="row no-wrap justify-end">
                    <q-btn flat round dense :icon="!play.state ? 'play_circle' : 'pause_circle'" @click="setThumb">
                        <q-tooltip>Play</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense icon="restart_alt" @click="resetMap">
                        <q-tooltip>Reset</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense :icon="!isFullscreen ? 'fullscreen' : 'fullscreen_exit'"
                        @click="setFullscreen">
                        <q-tooltip>Fullscreen</q-tooltip>
                    </q-btn>
                </div>
            </q-toolbar>
            <q-separator />
            <q-toolbar class="row wrap justify-center q-mt-md">
                <q-range class="col-10 q-mx-xl" dense :min="0" :max="100" color="teal" v-model="rangeValue"
                    @change="setTimeRange" label :label-always="this.play.state" :markers="25"
                    :marker-labels="setMarkerLabels" :left-label-value="`${setLabelsValue(rangeValue.min)}`"
                    :right-label-value="`${setLabelsValue(rangeValue.max)}`">
                </q-range>
            </q-toolbar>
        </div>
        <q-inner-loading :showing="loading" />
    </q-card>
</template>

<script lang="js">
import { fetch, i18nEncoder, i18n_en, formatDate } from '@/assets/util.js';
import * as echarts from 'echarts';
import meta from '@/assets/owid-covid-data.meta.json';
import * as d3 from 'd3';
import { markRaw, nextTick } from 'vue';
import { mapActions, mapState } from 'pinia';
import { countriesStore } from '@/stores/countries.js';

// scale Handler list
const scale = [
    {
        name: 'Linear',
        value: 'scaleSequential',
    },
    {
        name: 'Sqrt',
        value: 'scaleSequentialSqrt',
    },
    {
        name: 'Log',
        value: 'scaleSequentialLog',
    }
]

const hasBubble = [
    {
        label: 'OFF',
        value: false,
    },
    {
        label: 'ON',
        value: true,
    }
]

export default {
    props: {
        title: {
            type: String,
            default: '',
        },
        ratio: {
            type: Number,
            default: 16 / 9,
        },
        color: {
            type: String,
            default: 'interpolateGnBu',
        },
        category: {
            type: String,
            default: 'cases',
        },
        scaleIdx: {
            type: Number,
            default: 0,
        },
        targetIdx: {
            type: Number,
            default: 0,
        },
        hasBubbleIdx: {
            type: Number,
            default: 1,
        },
    },
    emits: ['brushAreas', 'updateTimeRange', 'targetChange', 'areaSelected'],
    watch: {
        timeRange: {
            handler: function () {
                this.setMap();
                this.hasBubble.value && this.setBubble();
            }
        },
        hasBubble: {
            handler: function () {
                if (this.hasBubble.value) {
                    this.setBubble();
                } else {
                    this.removeBubble();
                }
            }
        },
        maxRadius: {
            handler: function () {
                this.hasBubble.value && this.setBubble();
            }
        },
        scale: {
            handler: function () {
                this.setMap();
                this.hasBubble.value && this.setBubble();
            }
        },
        target: {
            handler: function () {
                this.$emit('targetChange', this.target);
                this.setMap();
                if (this.hasBubble) {
                    this.updateBubble();
                    this.setBubble();
                }
            }
        },
    },
    data() {
        return {
            // echarts instance
            chartRatio: this.ratio,
            map: null,
            loading: true,
            play: {
                state: false,
                timer: null,
            },
            isFullscreen: false,
            // component dataset store
            dataset: {
                raw: null,
                geo: null,
                data: null,
                domain: null,
            },
            options: {
                scale: scale,
                target: Object.entries(meta.properties).filter(d => d[1].category == this.category).map(d => d[1]),
                hasBubble: hasBubble,
            },
            // config
            scale: scale[this.scaleIdx],
            target: Object.entries(meta.properties).filter(d => d[1].category == this.category).map(d => d[1])[this.targetIdx],
            hasBubble: hasBubble[this.hasBubbleIdx],
            maxRadius: 40,
            timeRange: meta.properties.date.range,
            // range
            rangeValue: {
                min: 0,
                max: 100,
            },
            dateInterpolator: d3.scaleLinear(meta.properties.date.range.map(d => new Date(d))).domain([0, 100]),
        };
    },
    computed: {
        ...mapState(countriesStore, {
            selection: 'selection',
        }),
    },
    methods: {
        async initGeo() {
            this.map = markRaw(echarts.init(this.$refs['map']));

            // map generation
            if (!this.dataset.geo) await this.pullGeo();
            const geo = this.dataset.geo;

            echarts.registerMap('world', geo);
            this.map.setOption({
                title: {
                    show: true,
                    text: this.title,
                },
                // geo config
                geo: [
                    {
                        id: 'world',
                        map: 'world',
                        roam: true,
                        projection: {
                            project: d3.geoMercator(),
                            unproject: d3.geoMercator().invert,
                        },
                        nameProperty: 'iso_a3',
                        emphasis: {
                            label: { show: false },
                            focus: 'self',
                        },
                    }
                ],
                tooltip: {
                    show: true,
                    trigger: 'item',
                },
                toolbox: {
                    id: 'toolbox',
                    orient: 'vertical',
                    left: 0,
                },
            });

            // add db event listener
            const that = this;
            this.map.on('dblclick', function (params) {
                const { data: { name: code } } = params;
                const result = that.selection.findIndex(d => d == code);
                console.log(code,result)

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
                that.$emit('areaSelected', params);
            })

            await this.setMap();
            this.hasBubble.value && await this.setBubble();
        },
        async setMap() {
            if (!this.dataset.raw) await this.pullRaw();
            const raw = this.dataset.raw;

            // domain caculation
            const keys = Object.keys(raw).filter((d) => d.length == 3);
            const domain = [
                0,
                d3.max(keys, (key) =>
                    d3.max(
                        raw[key].data.filter((r) => r.date == this.timeRange[1]),
                        (d) => d[this.target.value]
                    )
                ),
            ];
            if (domain[1] == undefined) domain[1] = 0;
            this.dataset.domain = domain;

            // data caculation && series define
            const data = new Array();
            const getValue = (key, time) => {
                const target = raw[key].data.find((r) => r.date == time);
                return target?.[this.target.value]
                    ? target[this.target.value]
                    : 0;
            };
            keys.forEach((key) => {
                data.push({
                    name: key,
                    value:
                        getValue(key, this.timeRange[1]) -
                        (/^total_/.test(this.target.value)
                            ? getValue(key, this.timeRange[0])
                            : 0),
                });
            });
            // format => {name: 'ABW', value: 221} 
            this.dataset.data = data; // data can be shared by bubbles && map color chart.
            const that = this;
            this.map.setOption({
                series: [
                    {
                        type: 'map',
                        id: 'map',
                        geoIndex: 0,
                        data: data,
                        tooltip: {
                            position: 'right',
                            formatter: params => this.getTooltip(params, that),
                        },
                    }
                ]
            });

            // visualMap pieces config
            const color = d3
            [this.scale.value](d3[this.color])
                .domain(domain);

            const ticks = color.ticks(5);
            const pieces = [{
                gte: ticks[ticks.length - 1],
                color: color(ticks[ticks.length - 1]),
            }];
            try {
                ticks.reduce((min, max) => {
                    pieces.push({
                        gte: min,
                        lt: max,
                        color: color(min),
                    });
                    return max;
                });
            } catch (e) {
                console.log(ticks, domain, this.target.value, this.timeRange[1])
            }
            this.map.setOption({
                visualMap: {
                    id: 'map',
                    seriesIndex: this.map.getOption().series.findIndex(d => d.id == 'map'),
                    type: 'piecewise',
                    itemSymbol: 'circle',
                    pieces: pieces,
                    formatter: (a, b) => {
                        const format = d3.format(',');
                        return `${format(a)}-${format(b)}`;
                    },
                    right: 0,
                    top: 0,
                }
            });
        },
        async setBubble(init = {}) {
            const that = this;
            // init params 
            const getSize = val => {
                const handler = d3[this.scale.value]().domain(this.dataset.domain).range([0, this.maxRadius])
                handler.unknown(0);
                return handler((val[2]));
            };
            const geo = this.dataset.geo;
            const data = this.dataset.data.map(d => {
                return {
                    name: d.name,
                    value: d3.geoCentroid(geo.features.find(c => c.properties.iso_a3 == d.name)).concat([d.value])
                }
            })
            
            this.map.setOption({
                brush: {
                    id: 'bubbleBrush',
                    toolbox: ['rect', 'polygon', 'clear'],
                    geoIndex: 0,
                    seriesIndex: 1,
                    brushStyle: {
                        borderWidth: 2,
                        color: 'rgb(0, 150, 136, 0.2)',
                    },
                    throttleType: 'debounce',
                    throttleDelay: 300,
                    inBrush: {
                        color: 'rgb(176, 57, 91)'
                    },
                },
                series: [
                    {
                        id: 'bubble',
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        geoIndex: 0,
                        data: data,
                        symbolSize: getSize,
                        encode: {
                            value: 2,
                        },
                        itemStyle: {
                            color: "rgba(208, 54, 54, 1)",
                        },
                        tooltip: {
                            position: 'right',
                            formatter: params => this.getTooltip(params, that),
                        }
                    }
                ]
            }, init);

            // add brush event listener
            this.map.on('brushselected', function (params) {
                const idxs = params.batch[0].selected[1].dataIndex;
                const codes = idxs.map(idx => data[idx]?.name);
                if (codes.length > 0) that.$emit('brushAreas', codes);
            })
        },
        updateBubble() {
            const getSize = val => d3[this.scale.value]().domain(this.dataset.domain).range([0, this.maxRadius])(val[2]);
            this.map.setOption({
                series: [
                    {
                        id: 'bubble',
                        type: 'scatter',
                        symbolSize: getSize,
                        data: this.dataset.data,
                    }
                ]
            });
        },
        removeBubble() {
            this.map.setOption({
                series: [
                    {
                        id: 'map',
                    }
                ]
            }, {
                replaceMerge: ['series']
            })
        },
        getTooltip(params, that) {
            const { value, name } = params;
            const targetName = that.target.value;
            const date = that.timeRange[1];
            // average
            const { raw } = that.dataset;
            // caculate the time range
            const begin7day = formatDate(d3.timeDay.offset(new Date(date), -7));
            const past7days = raw[name].data.filter(d => d.date <= date && d.date > begin7day);
            const mean = d3.mean(past7days, d => d[targetName]);
            const max = d3.max(past7days, d => d[targetName]);
            const min = d3.min(past7days, d => d[targetName]);
            const median = d3.median(past7days, d => d[targetName]);
            const deviation = d3.deviation(past7days, d => d[targetName]);

            // format
            const format = d3.format(',')

            return `<div>
                        <p style='color:black;font-weight:bold;border-bottom:solid black 1px;margin:0'>${i18nEncoder.getName(name,'en')}, ${d3.timeDay.count(new Date(date), new Date)} days ago</p>
                        <p style='font-size:10px;color:grey;border-bottom:solid black 1px;margin:0;padding:0'>
                            <span style='font-weight:bold;font-style:italic;'>${format(value[2])}</span> ${targetName.replace(/_/g, ' ')} cases on ${value.date}
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
                            double click to add this line to other charts.
                        </div>
                    </div>
                    `
        },
        setLoading(state) {
            this.loading = state
        },
        resetMap() { },
        async setFullscreen() {
            this.isFullscreen = !this.isFullscreen;
            this.chartRatio = this.isFullscreen ? (16 / 7) : this.ratio;
            // waitting for next update
            await nextTick();
            this.map.resize();
        },
        setMarkerLabels(value) {
            return formatDate(new Date(this.dateInterpolator(value))).replace(/-/g, '/')
        },
        setLabelsValue(value) {
            return formatDate(this.dateInterpolator(value))
        },
        setTimeRange() {
            this.timeRange = [formatDate(this.dateInterpolator(this.rangeValue.min)), formatDate(this.dateInterpolator(this.rangeValue.max))];
            this.$emit('updateTimeRange', this.timeRange);
        },
        setThumb() {
            this.play.state = !this.play.state;
            const that = this;
            if (this.play.state) {
                if (this.rangeValue.max == 100) this.rangeValue.max = 0;
                this.play.timer = setInterval(() => {
                    if (that.rangeValue.max < 100) {
                        that.rangeValue.max++;
                        that.setTimeRange();
                    } else {
                        that.setThumb();
                    }
                }, 1300);
            } else {
                clearInterval(this.play.timer);
            }
        },
        async pullRaw() {
            const that = this;
            that.setLoading(true);
            await fetch.requestRaw().then((raw) => {
                that.dataset.raw = raw;
                that.setLoading(false);
            });
        },
        async pullGeo() {
            const that = this;
            await fetch.requestGeo().then((geo) => {
                that.dataset.geo = geo;
            });
        },
        ...mapActions(countriesStore, {
            addSelection: 'addSelection', removeSelection: 'removeSelection'
        })
    },
    created: function () {
        //  register the en lang for encoder
        i18nEncoder.registerLocale(i18n_en);
    },
    mounted: async function () {
        await this.pullGeo();
        this.initGeo();
    },
};
</script>
