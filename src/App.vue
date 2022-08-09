<template>
    <q-layout view="hHh Lpr lff" >
        <q-header elevated class="bg-white">
            <nav-bar></nav-bar>
        </q-header>

        <div>
            <router-view name="main"></router-view>
            
        </div>
    </q-layout>
</template>

<script>
import NavBar from "@/components/nav-bar.vue";

export default {
    components: {
        NavBar,
    },
};
</script>
