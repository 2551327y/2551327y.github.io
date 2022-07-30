<template>
    <nav-bar></nav-bar>
    <router-view name="main"></router-view>
</template>

<script>
import NavBar from "@/components/nav-bar.vue";

export default {
    components: {
        NavBar,
    },
};
</script>
