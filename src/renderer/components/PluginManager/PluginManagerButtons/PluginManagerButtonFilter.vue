<template>
  <div
    v-click-outside="closeDropdown"
    class="PluginManagerButtonFilter"
  >
    <button
      class="flex items-center"
      @click="toggleDropdown"
    >
      <span class="mr-1 md:whitespace-no-wrap">
        {{ $t(`PAGES.PLUGIN_MANAGER.FILTERS.${activeFilter.toUpperCase()}`) }}
      </span>

      <SvgIcon
        :class="{ 'rotate-180': isOpen }"
        name="caret"
        view-box="0 0 16 16"
      />
    </button>

    <ul
      v-show="isOpen"
      class="PluginManagerButtonFilter--options"
    >
      <li
        v-for="filter of availableFilters"
        :key="filter"
      >
        <div
          @click="emitFilterChange(filter)"
        >
          {{ $t(`PAGES.PLUGIN_MANAGER.FILTERS.${activeFilter.toUpperCase()}`) }}
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import SvgIcon from '@/components/SvgIcon'

export default {
  name: 'PluginManagerButtonFilter',

  components: {
    SvgIcon
  },

  props: {
    activeFilter: {
      type: String,
      required: true
    }
  },

  data: () => ({
    isOpen: false,
    filters: () => [
      'all',
      'available',
      'installed'
    ]
  }),

  computed: {
    availableFilters () {
      return this.filters.filter(filter => filter !== this.activeFilter)
    }
  },

  methods: {
    closeDropdown () {
      this.isOpen = false
    },

    toggleDropdown () {
      this.isOpen = !this.isOpen
    },

    emitFilterChange (filter) {
      this.$emit('filter-changed', filter)
    }
  }
}
</script>

<style lang="postcss" scoped>
.PluginManagerButtonFilter {
  @apply .flex .relative .z-20;
}

.PluginManagerButtonFilter--options {
  @apply .absolute .bg-theme-content-background .shadow-theme .rounded .border .overflow-hidden .text-sm;
}
</style>
