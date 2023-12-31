<template>
  <div class="mod-container" :class="{ loaded: ready }">
    <div class="mod-wrapper" ref="m">
      <component v-if="ready" :is="mod" v-bind="$attrs" v-on="$listeners" />
      <span v-else>⏳ loading...</span>
    </div>
    <div class="shadow-wrapper" ref="s"></div>
  </div>
</template>

<script>
import { loadComponent, loadStyle, loadPrefetch } from "../utils/load";
import { handleScopedStyle } from "../utils/scoped-style";

export default {
  name: "ModContainer",
  props: {
    src: {
      type: String,
      required: true,
    },
    assets: {
      type: Array,
      default: () => [],
    },
    hostName: {
      type: String,
      default: "",
    },
    cssScoped: {
      type: Boolean,
      default: true,
    },
    dependenciesReady: {
      type: Boolean,
      default: false,
    },
    preFetch: {
      type: Boolean,
      default: false,
    },
    classnameWhitelist: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      preFetchedMod: null,
      mod: null,
    };
  },
  computed: {
    ready() {
      return this.dependenciesReady && !!this.mod;
    },
  },
  methods: {
    async doFetch() {
      const res = await loadComponent(this.src, {
        hostName: this.hostName,
      });
      return res.default || res;
    },
  },
  async created() {
    if (this.preFetch) {
      loadPrefetch(this.src);
    }
  },
  mounted() {
    let modWrapper = this.$refs.m;
    let shadowWrapper = this.$refs.s;

    let shadow = this.cssScoped
      ? handleScopedStyle(shadowWrapper, modWrapper, {
          isPrepare: true,
        })
      : void 0;

    this.assets
      ?.filter((asset) => /\.css$/.test(asset))
      .forEach((asset) => {
        loadStyle(asset, shadow);
        console.log("mod-container asset loaded", asset);
      });

    this.$watch(
      () => this.dependenciesReady,
      async (ready) => {
        if (!ready) return;

        window.Vue = window.Vue2;

        const res = await loadComponent(this.src);
        if (!res) {
          console.error("load failure", this.src);
          return;
        }
        const comp = res.default || res;
        this.mod = comp;
        console.log("mod-container component loaded", comp, window.Vue.version);

        if (this.cssScoped) {
          // TODO 此处时机待查
          this.$nextTick(() => {
            // setTimeout(() => {
            shadow = handleScopedStyle(shadowWrapper, modWrapper, {
              whitelist: this.classnameWhitelist,
              globalWhitelist: [/\W\.el-/],
              includeAncestorScopedWhitelist: true,
            });
            // }, 0);
          });
        }
      },
      { immediate: true }
    );
  },
};
</script>

<style scoped>
.mod-container {
  min-width: 50px;
  min-height: 50px;
  background-color: #ccc;
}
.mod-container.loaded {
  background-color: transparent;
}
.mod-container,
.mod-wrapper,
.shadow-wrapper {
  display: inline-block;
  width: auto;
}
</style>
