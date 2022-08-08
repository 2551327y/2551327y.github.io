<script setup>
import Selector from '../components/selector.vue';
</script>

<template>
    <q-page-container>
        <q-page padding>
            <div class="row no-wrap justify-between">
                <selector />
                <q-btn class="col-5" label="click" @click="log" />
            </div>
        </q-page>
    </q-page-container>
</template>

<script>
import { countriesStore } from '@/stores/countries.js';
import { mapWritableState } from 'pinia'

export default {
    computed: {
        ...mapWritableState(countriesStore, {
            selection: 'selection',
        })
    },
    methods: {
        log() {
            console.log(this.selection);
        }
    }
}
</script>