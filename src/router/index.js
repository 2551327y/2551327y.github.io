import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/cases',
        },
        {
            path: '/cases',
            components: {
                main: () => import("@/views/cases.vue"),
            },
            meta: {
                keepAlive: true,
            }
        },
        {
            path: '/test',
            components: {
                main: () => import("@/views/test.vue"),
            },
        }
    ]
})

export default router
