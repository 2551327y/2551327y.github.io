<template>
    <q-card class="full-width">
        <q-card-section>
            <ul class="no-margin no-padding q-px-md">
                <li v-for="(pairs) in [['✒️', 'name'], ['📃', 'category']]" :key="pairs[1]" class="row justify-between">
                    <span class="text-body1 text-weight-bold">{{ `${pairs[0]} ${pairs[1]}`
                    }}</span>
                    <span class="text-teal text-body1">{{ content[pairs[1]] }}</span>
                </li>
            </ul>
            <q-slide-transition>
                <div v-show="isEditVisible">
                    <q-toolbar class="row wrap bg-teal-1 rounded-borders q-mt-md">
                        <div class="col-12 row no-wrap justify-between items-center">
                            <span class="text-weight-bold text-body1">size</span>
                            <q-select dense :options="sizeOpts" v-model="sizeOpt">
                                <template v-slot:selected-item="scope">
                                    <div class="ellipsis">{{ scope.opt.label }}</div>
                                </template>
                            </q-select>

                        </div>
                    </q-toolbar>
                </div>
            </q-slide-transition>
        </q-card-section>
        <q-card-actions align="right">
            <q-btn flat dense class="text-teal" label='Edit Props' no-caps @click="toggleEditVisible" />
            <q-btn outline dense class="text-warning" label='Remove' no-caps @click="removeBookmark(content)" />
        </q-card-actions>
    </q-card>
</template>

<script lang="js">
import { mapActions } from 'pinia';
import { useBookmarks } from '@/stores/bookmarks';

export default {
    props: {
        content: {
            type: Object,
            default: new Object,
        },
        sizeOptions: {
            type: Array,
            default: function () {
                return [
                    {
                        label: 'Take up 1/3 space of a line',
                        value: 4,
                    },
                    {
                        label: 'Take up 1/2 space of a line',
                        value: 6,
                    },
                    {
                        label: 'Take up all space of a line',
                        value: 12,
                    },
                ];
            },
        },
        size: {
            type: Number,
            default: 6,
        }
    },
    data() {
        return {
            isEditVisible: false,
            sizeOpt: this.sizeOptions[0],
            sizeOpts: this.sizeOptions,
        }
    },
    watch: {
        sizeOpt: {
            handler: function () {
                this.modifyBookmark(this.content, 'col', this.sizeOpt.value)
            }
        }
    },
    methods: {
        toggleEditVisible() {
            this.isEditVisible = !this.isEditVisible;
        },
        ...mapActions(useBookmarks, {
            removeBookmark: 'remove',
            modifyBookmark: 'modify',
        })
    }
}
</script>

<style scoped>
</style>