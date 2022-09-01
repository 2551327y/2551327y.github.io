<template>
    <q-slider class="q-mx-xl" dense :min="0" :max="100" color="teal" v-model="rangeValue"
        @change="setCurrentDate" label :markers="25" :marker-labels="markerLabels"
        :label-always="play.state ? true : false" />
</template>

<script>
export default {
    data() {
        return {
            
        }
    }
}
</script>