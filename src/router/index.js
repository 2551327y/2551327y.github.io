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
            path: '/deaths',
            components: {
                main: () => import("@/views/deaths.vue"),
            },
            meta: {
                keepAlive: true,
            }
        },
        {
            path: '/vaccinations',
            components: {
                main: () => import("@/views/vaccinations.vue"),
            },
            meta: {
                keepAlive: true,
            }
        },
        {
            path: '/testing',
            components: {
                main: () => import("@/views/testing.vue"),
            },
            meta: {
                keepAlive: true,
            }
        },
        {
            path: '/explorer',
            components: {
                main: () => import("@/views/explorer.vue"),
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
