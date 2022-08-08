<template>
    <q-card :class="isFullscreen ? 'fullscreen' : ''">
        <q-card-section>
            <q-responsive :ratio="chartRatio">
                <div ref="map" />
            </q-responsive>
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
            default: 0,
        },
    },
    watch: {
        timeRange: {
            handler: function () {
                this.setMap();
                this.hasBubble.value && this.setBubble();
            }
        },
        hasBubble: {
            // FIXME: switch the bubble
            handler: function () {
                if (this.hasBubble.value) {
                    this.setBubble();
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
                this.setMap();
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
            });

            // set event listener
            const that = this;
            this.map.on('click', function (param) {
                that.$emit('selected', param);
            });

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
            this.map.setOption({
                series: [
                    {
                        type: 'map',
                        id: 'map',
                        geoIndex: 0,
                        data: data,
                        tooltip: {
                            position: 'right',
                            formatter: (params) => `${i18nEncoder.getName(params.name, 'en')}: <b>${d3.format(',')(params.data.value)}</b>`
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

            this.map.on("click", (param) => {
                this.$emit("selected", param);
            });
        },
        async setBubble() {
            // init params 
            const getSize = val => d3[this.scale.value]().domain(this.dataset.domain).range([0, this.maxRadius])(val[2]);
            const geo = this.dataset.geo;
            const data = this.dataset.data.map(d => {
                return {
                    name: d.name,
                    value: d3.geoCentroid(geo.features.find(c => c.properties.iso_a3 == d.name)).concat([d.value])
                }
            })
            this.map.setOption({
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
                            formatter: (params) => `${i18nEncoder.getName(params.name, 'en')}: <b>${d3.format(',')(params.value[2])}</b>`
                        }
                    }
                ]
            });
        },
        setLoading(state) {
            this.loading = state
        },
        resetMap() { },
        async setFullscreen() {
            this.isFullscreen = !this.isFullscreen;
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
