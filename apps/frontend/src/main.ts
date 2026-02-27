import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Import Vant styles
import 'vant/lib/index.css'

// Import Vant icon styles
import 'vant/lib/icon/index.css'

// Import custom theme
import './styles/theme.css'

// Import Vant components
import { Icon } from 'vant'

import router from './router'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Icon)

app.mount('#app')
