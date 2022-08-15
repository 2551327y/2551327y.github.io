<template>
    <q-layout view="hHh Lpr lff">
        <q-header elevated class="bg-white">
            <nav-bar @toggleDrawer="toggleDrawer"></nav-bar>
        </q-header>

        <q-drawer v-model="drawer" overlay :width="300" :breakpoint="700" elevated class="z-top rounded-borders">
            <q-scroll-area class="fit">
                <q-list v-if="bookmarks.length" padding>
                    <q-item v-for="(bookmark, idx) in bookmarks" :key="idx" class="q-pa-md">
                        <q-item-section>
                            <ul class="no-margin no-padding q-px-md">
                                <q-card class="full-width">
                                    <q-card-section>
                                        <li v-for="(pairs) in [['✒️', 'name'], ['📃', 'category']]" :key="pairs[1]"
                                            class="row justify-between">
                                            <span class="text-body1 text-weight-bold">{{ `${pairs[0]} ${pairs[1]}`
                                            }}</span>
                                            <span class="text-teal text-body1">{{ bookmark[pairs[1]] }}</span>
                                        </li>
                                    </q-card-section>
                                    <q-card-actions>
                                        <q-btn outline dense color='teal' label='remove' @click="removeBookmark(bookmark)" />
                                    </q-card-actions>
                                </q-card>
                            </ul>
                        </q-item-section>
                    </q-item>
                </q-list>
                <div v-else class="q-pa-xl text-center bg-grey-3">
                    <div class="text-h6">Nothing</div>
                    <span class="text-caption text-grey">No bookmarks added</span>
                </div>
            </q-scroll-area>
        </q-drawer>

        <div>
            <router-view name="main"></router-view>
        </div>
    </q-layout>
</template>

<script>
import NavBar from "@/components/nav-bar.vue";
import { mapState, mapActions } from 'pinia';
import { useBookmarks } from '@/stores/bookmarks.js';

export default {
    components: {
        NavBar,
    },
    data() {
        return {
            drawer: false,
        }
    },
    computed: {
        ...mapState(useBookmarks, ['bookmarks'])
    },
    methods: {
        toggleDrawer() {
            this.drawer = !this.drawer;
        },
        ...mapActions(useBookmarks, {
            removeBookmark: 'remove',
        })
    }
};
</script>
