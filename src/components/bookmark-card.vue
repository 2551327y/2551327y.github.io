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
                    <div class="q-pa-md bg-blue">
                        
                    </div>
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
        }
    },
    data() {
        return {
            isEditVisible: false, 
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