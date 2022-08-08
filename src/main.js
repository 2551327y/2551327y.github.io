import { createApp } from 'vue'
import App from './App.vue'
import { Quasar, Notify } from 'quasar'

// Import Router index.js
import router from './router'
const app = createApp(App).use(router)

// Import icon libraries
import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'
// Import Quasar css
import 'quasar/dist/quasar.css'

app.use(Quasar, {
    plugins: { Notify }, // import Quasar plugins and add here
    config: {
        notify: {}
    }
})

import { createPinia } from 'pinia';

const pinia = createPinia();
app.use(pinia);

app.mount('#app')
