import { createApp } from "vue";
import { createPinia } from "pinia";

// Import Vant styles
import "vant/lib/index.css";

// Import Vant icon styles
import "vant/lib/icon/index.css";

// Import custom theme
import "./styles/theme.css";

// Import Vant components
import { Icon, Lazyload, setToastDefaultOptions } from "vant";

// Configure global Toast options
setToastDefaultOptions({
  duration: 2000,
  zIndex: 9999,
  className: 'custom-toast'
});

import router from "./router";
import App from "./App.vue";

const app = createApp(App);

// Add custom toast styles
const style = document.createElement('style');
style.textContent = `
  .custom-toast .van-toast__text {
    color: #1E293B !important;
  }
  .van-toast {
    background: rgba(255, 255, 255, 0.95) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  .van-toast--fail, .van-toast--success {
    color: #1E293B !important;
  }
`;
document.head.appendChild(style);

app.use(createPinia());
app.use(router);
app.use(Icon);
app.use(Lazyload);

app.mount("#app");
