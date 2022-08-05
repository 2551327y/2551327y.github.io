import { defineStore } from 'pinia';
import { default_countries } from '@/assets/charts.config';

export const countriesStore = defineStore('countries', {
    state: () => {
        return {
            selection: [...default_countries],
        }
    }
})