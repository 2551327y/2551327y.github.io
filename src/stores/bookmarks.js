import { defineStore } from 'pinia';
import _ from 'lodash';

export const useMeta = defineStore('useMeta', {
    state: () => {
        return {
            isMetaVisible: true,
        }
    },
    actions: {
        toggle() {
            this.isMetaVisible = !this.isMetaVisible;
        }
    }
})
/**
 * Format example
 * 
 * [{
    name: 'bar-chart',
    category: 'cases',
    col: 6,
    title: 'Daily new confirmed cases Rank',
    targetIdx: 1,
}]
 */
export const useBookmarks = defineStore('useBookmarks', {
    state: () => {
        return {
            bookmarks: [],
        }
    },
    actions: {
        add(meta) {
            const isObject = typeof (meta) == 'object';
            const props = Object.keys(meta);
            // whether to has the must prop
            const hasName = props.includes('name');
            const hasCategory = props.includes('category');
            const hasCol = props.includes('col');

            if (isObject && hasName && hasCategory && hasCol) this.bookmarks.push(meta);
        },
        remove(meta) {
            return _.remove(this.bookmarks, d => d.name == meta.name && d.category == meta.category);
        },
        toggle(metas) {
            metas.forEach(meta => {
                if (_.findIndex(this.bookmarks, d => d.name == meta.name && d.category == meta.category) == -1) {
                    this.add(meta);
                } else {
                    this.remove(meta);
                }
            })
        },
        has(metas) {
            return metas.every(meta => _.findIndex(this.bookmarks, d => d.name == meta.name && d.category == meta.category) > -1)
        },
        modify(meta, key, value) {
            meta[key] = value;
        },
    }
})

