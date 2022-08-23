<template>
    <q-layout view="hHh Lpr lff">
        <q-header elevated class="bg-white">
            <nav-bar @toggleDrawer="toggleDrawer"></nav-bar>
        </q-header>

        <initialization />

        <q-drawer v-model="drawer" overlay :width="300" :breakpoint="700" elevated class="z-top rounded-borders">
            <q-scroll-area class="fit">
                <q-list v-if="bookmarks.length" padding>
                    <div class="text-h6 text-center text-teal text-weight-bold">🗂️ Bookmark</div>
                    <q-item v-for="(bookmark, idx) in bookmarks" :key="idx" class="q-pa-md">
                        <q-item-section>
                            <bookmark-card :content="bookmark" />
                        </q-item-section>
                    </q-item>
                </q-list>
                <div v-else class="q-pa-xl text-center bg-grey-3">
                    <div class="text-h6">Nothing</div>
                    <span class="text-caption text-grey">No bookmarks added</span>
                </div>
            </q-scroll-area>
            <q-banner rounded class="text-white bg-teal absolute-bottom q-ma-md">
                <p class="q-ma-sm">💡 check
                    <q-icon name="bookmark" /> on each section to add/remove charts to explorer.
                </p>
            </q-banner>
        </q-drawer>
        <div>
            <router-view name="main"></router-view>
        </div>
    </q-layout>
</template>

<script>
import NavBar from "@/components/nav-bar.vue";
import BookmarkCard from "@/components/bookmark-card.vue";
import Initialization from "./components/initialization.vue";
import { mapState } from 'pinia';
import { useBookmarks } from '@/stores/bookmarks.js';

export default {
    components: {
    NavBar,
    BookmarkCard,
    BookmarkCard,
    Initialization,
    Initialization
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
    },
    mounted: function () {
        console.log('🤨 %cImplementation of Coordinated & Multiple Views in COVID-19 Visualization\n%c👉 Authored by 2551327, School of Computing Science, University of Glasgow', 'color:teal; font-size:16px; font-weight:bold', 'color:black; ')
    }
};
</script>
