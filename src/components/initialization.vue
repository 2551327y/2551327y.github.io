<template>
    <q-dialog :model-value="show" persistent>
        <q-stepper v-model="step" ref="stepper" color="primary" animated header-nav header-class="row no-wrap"
            style="min-width: 50%;">
            <q-step :name="1" title="Chart Component" icon="settings" :done="step > 1">
                <div class="row no-wrap">
                    <q-img ref="meta1" src="http://tva1.sinaimg.cn/large/006hPLGily1h5fw8hqflzj30v90iejxt.jpg" />
                </div>
            </q-step>

            <q-step :name="2" title="Bookmark Component" caption="Optional" icon="create_new_folder" :done="step > 2">
                <div class="row no-wrap">
                    <q-img ref="meta1" src="http://tva1.sinaimg.cn/large/006hPLGily1h5fwbkkr1sj31hc0prwxo.jpg" />
                </div>
            </q-step>

            <q-step :name="4" title="Coordination" icon="add_comment">
                <div class="row no-wrap flex-center">
                    <div class="col row justify-center">
                        <div class="text-h1">💡</div>
                    </div>
                    <div class="col text-body1">Try to interact with different elements in different tables to enable
                        data coordination before icons.</div>
                </div>
            </q-step>

            <template v-slot:navigation>
                <q-stepper-navigation>
                    <q-btn @click="$refs.stepper.next()" color="primary" v-if="step < 4" :label="'Continue'" />
                    <q-btn @click="leave" color="primary" v-if="step == 4" :label="'Finish'" />
                    <q-btn v-if="step > 1" flat color="primary" @click="$refs.stepper.previous()" label="Back"
                        class="q-ml-sm" />
                </q-stepper-navigation>
            </template>
        </q-stepper>
    </q-dialog>
</template>

<script>
// import meta1Url from '@/assets/imgs/meta-1.png';

export default {
    data() {
        return {
            show: true,
            step: 1,
        }
    },
    methods: {
        getImg(meta, name) {
            const url = new URL(`@/assets/imgs/${name}.png`, import.meta.url).href
            this.$refs[meta].src = url;
        },
        leave() {
            this.show = false;
        }
    }
}
</script>