<template>
    <q-toolbar class="text-teal">
        <q-btn flat size="md"> Covid Visualization </q-btn>
        <q-btn flat size="md" round icon="invert_colors" />
        <q-btn flat size="md" round icon="g_translate" />
        <q-space />

        <q-tabs no-caps>
            <q-route-tab ripple to="/cases" icon="dashboard" label="Cases" />
            <q-route-tab ripple to="/deaths" icon="gavel" label="Deaths" />
            <q-route-tab ripple to="/vaccinations" icon="vaccines" label="Vaccin" />
            <q-route-tab ripple to="/testing" icon="science" label="Test" />
        </q-tabs>
    </q-toolbar>
</template>