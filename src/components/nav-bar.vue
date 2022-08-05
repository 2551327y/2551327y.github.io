<template>
    <q-toolbar class="text-teal">
        <q-btn flat size="md"> Covid Visualization </q-btn>
        <q-btn flat size="md" round icon="invert_colors" />
        <q-btn flat size="md" round icon="g_translate" />
        <q-space />

        <q-tabs no-caps>
            <q-route-tab ripple to="/" icon="dashboard" label="Cases" />
        </q-tabs>
    </q-toolbar>
</template>