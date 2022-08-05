<template>
    <q-table style="height: 70vh; width: 400px" :filter="search" virtual-scroll hide-header hide-pagination :rows="rows"
        row-key="location" :columns="cols" v-model:selected="choices" selection="multiple" :rows-per-page-options="[0]">
        <template #top>
            <div class="q-col-gutter-y-md full-width">
                <q-input autofocus filled dense placeholder="Type to add a state/area" v-model="search"
                    hint="⭐ States names following ISO 3166">
                    <template #prepend>
                        <q-icon name="search" />
                    </template>
                </q-input>
                <q-select class="full-width" options-cover :options="typeFilter.keys" v-model="type" dense outlined
                    :option-label="getLabel">
                    <template #before>
                        <span class="text-body1">Sort By</span>
                    </template>
                    <template #after>
                        <q-btn round :class="isAscending ? 'flip-vertical' : ''" v-ripple flat dense icon="sort" @click="toggleAscending" />
                    </template>
                </q-select>
            </div>
        </template>
        <template v-slot:body-cell="{ row, value, selected }">
            <q-td>
                <div class="row no-wrap justify-between">
                    <span class="text-weight-bold">{{ value }}</span>
                    <span class="text-caption text-italic">{{ formatter(row[type]) }}</span>
                </div>
            </q-td>
        </template>
        <template #bottom>
            <div class="row no-wrap q-ma-sm justify-end q-col-gutter-x-md full-width">
                <div>
                    <q-btn flat outlined v-ripple color="warning" label="cancel" v-close-popup />
                </div>
                <div>
                    <q-btn flat outlined v-ripple class="bg-teal" color="white" v-close-popup label="confirm"
                        @click="updateSelection" />
                </div>
            </div>
        </template>
    </q-table>
</template>

<script lang="js">
import { countriesStore } from '@/stores/countries.js';
import { i18nEncoder, i18n_en } from '@/assets/util.js';
import propMeta from '@/assets/owid-covid-data.meta.prop.json';
import * as d3 from 'd3';
import { mapWritableState } from 'pinia'

export default {
    data() {
        return {
            rows: propMeta.properties,
            search: '',
            choices: [],
            cols: [
                {
                    name: 'location',
                    field: 'location',
                    align: 'left',
                    sortable: true,
                    sortOrder: 'ad'
                }
            ],
            typeFilter: {
                keys: propMeta.keys,
            },
            type: propMeta.keys[0],
            formatter: d3.format(','),
            isAscending: true,
        }
    },
    watch: {
        type: function (latest) {
            this.sortTable(latest);
        }
    },
    computed: {
        ...mapWritableState(countriesStore, {
            selection: 'selection',
        })
    },
    methods: {
        toggleAscending() {
            this.isAscending = !this.isAscending;
            this.sortTable(this.type, this.isAscending);
        },
        updateSelection() {
            this.selection = this.choices.map(d => d.iso_code);
        },
        getLabel(item) {
            return item.replace(/_/g, ' ').replace(/\b\w/g, word => word.toUpperCase())
        },
        getField(item) {
            return item.iso_name;
        },
        getName(code) {
            return i18nEncoder.getName(code, 'en');
        },
        sortTable(key, Ad = false) {
            const selection = this.selection;
            this.rows.sort((a, b) => {
                let isA = selection.includes(a.iso_code), isB = selection.includes(b.iso_code), r = Ad ? -1 : 1;
                if (isA && isB) return (b[key] - a[key]) * r
                else if (isA || isB) return (isA ? -1 : 1)
                else return (b[key] - a[key]) * r;
            })
        }
    },
    created: function () {
        i18nEncoder.registerLocale(i18n_en);
    },
    mounted: function () {
        this.choices = this.selection.map(code => this.rows.find(d => d.iso_code == code));
        this.sortTable(this.type);
    }
}
</script>
