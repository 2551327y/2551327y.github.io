import { defineStore } from 'pinia';

export const useRunningStore = defineStore('useRunningStore', {
    state: () => {
        return {
            loading: true,
        }
    },
    actions: {
        confirm() {
            this.loading = false;
        },
        wait() {
            this.loading = true;
        },
    }
})

