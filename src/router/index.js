import { createRouter, createWebHistory } from 'vue-router'

const Dashboard = () => import("@/views/Dashboard.vue");

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/dashboard',
        },
        {
            path: '/dashboard',
            components: {
                main: Dashboard,
            },
            meta: {
                keepAlive: true,
            }
        }
    ]
})

export default router
