import Vue from "vue";
import App from "./App.vue";

window.Vue2 = Vue;
Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount("#app");
