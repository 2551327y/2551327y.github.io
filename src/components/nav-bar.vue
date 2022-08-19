<template>
    <q-toolbar class="text-teal">
        <q-btn flat size="md"> Covid Visualization </q-btn>
        <q-btn flat ripple round :icon="!drawer ? 'bookmark_border' : 'bookmark'" class="q-mr-sm" @click="toggleBookmark" />
        <q-space />

        <q-tabs no-caps>
            <q-route-tab ripple to="/cases" icon="dashboard" label="Cases" />
            <q-route-tab ripple to="/deaths" icon="gavel" label="Deaths" />
            <q-route-tab ripple to="/vaccinations" icon="vaccines" label="Vaccin" />
            <q-route-tab ripple to="/testing" icon="science" label="Test" />
            <q-route-tab ripple to="/explorer" icon="join_full" label="Explorer" />
            <q-route-tab ripple to="/survey" icon="quiz" label="Survey" class="text-blue" />
        </q-tabs>
    </q-toolbar>
</template>

<script lang="js">
export default {
    data() {
        return {
            drawer: false,
        }
    },
    methods: {
        toggleBookmark() {
            this.drawer = !this.drawer;
            this.$emit('toggleDrawer')
        },
    }
}
</script>