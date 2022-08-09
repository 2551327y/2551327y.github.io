import { defineStore } from 'pinia';
import { default_countries } from '@/assets/charts.config';
import * as _ from 'lodash';

export const countriesStore = defineStore('countries', {
    state: () => {
        return {
            selection: [...default_countries],
        }
    },
    actions: {
        addSelection(target) {
            this.selection = _.union(this.selection, [target]);
        },
        removeSelection(target) {
            if (target.length == 3 && this.selection.includes(target)) {
                this.selection = _.without(this.selection, target);
                return true;
            } else {
                return false;
            }
        },
    }
})