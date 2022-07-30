<template>
    <q-responsive :ratio="4 / 3">
        <div ref="map" />
    </q-responsive>
</template>

<script>
import { fetch } from "@/assets/fetch.js";
import * as echarts from "echarts";
import * as i18nEncoder from "i18n-iso-countries";
import i18_en from "i18n-iso-countries/langs/en.json";

export default {
    props: {
        targetLabel: {
            type: String,
            default: 'new_cases',
        }
    },
    data() {
        return {
            dataset: {
                raw: null,
                geo: null,
            }
        }
    },
    methods: {
        initMap() {

        },
        initRaw() {
            const that = this;
            that.$emit("loaded", true);
            await fetch.requestRaw().then(raw => {
                that.dataset.raw = raw;
                that.$emit("loaded", false);
            })
        }
    },
    created: function() {
        i18nEncoder.registerLocale(i18_en);
    }
}
</script>