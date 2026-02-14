<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import Menubar from 'primevue/menubar'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const menuItems = [
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    command: () => router.push({ name: 'dashboard' }),
    routeName: 'dashboard',
  },
  {
    label: 'Clienți',
    icon: 'pi pi-users',
    command: () => router.push({ name: 'clients-list' }),
    routeName: 'clients-list',
  },
  {
    label: 'Setări',
    icon: 'pi pi-cog',
    command: () => router.push({ name: 'settings' }),
    routeName: 'settings',
  },
]

const activeRouteName = computed(() => route.name)

function onLogout() {
  authStore.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="layout-root">
    <Menubar :model="menuItems">
      <template #start>
        <div class="brand">TRexGYM</div>
      </template>
      <template #item="{ item, props }">
        <a
          class="p-menubar-item-link"
          :class="{ 'is-active': item.routeName === activeRouteName }"
          v-bind="props.action"
        >
          <span :class="item.icon" />
          <span>{{ item.label }}</span>
        </a>
      </template>
      <template #end>
        <div class="layout-actions">
          <span class="admin-email">{{ authStore.user?.email }}</span>
          <Button label="Deconectare" severity="secondary" variant="outlined" @click="onLogout" />
        </div>
      </template>
    </Menubar>

    <main class="layout-main">
      <RouterView />
    </main>
  </div>
</template>
