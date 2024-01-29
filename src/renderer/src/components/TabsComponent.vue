<template>
  <div class="navigation">
    <div class="navigation__tabs">
      <div
        v-for="(tab, index) in tabs"
        :key="tab.id"
        class="navigation__tabs__item"
        :class="{ 'navigation__tabs__item--active': index === activeTabIndex }"
        @click="selectTab(index)"
      >
        <span>
          {{ tab.title }}
        </span>
        <button class="navigation__btn" @click.stop="closeTab(index)">
          <img src="../assets/icons/close.svg" alt="" />
        </button>
      </div>
      <div class="navigation__tabs__add">
        <button class="navigation__btn" @click="addTab()">
          <img src="../assets/icons/add.svg" alt="" />
        </button>
      </div>
    </div>
    <div class="navigation__footer">
      <div class="navigation__footer__buttons">
        <button class="navigation__btn" @click="goBack">
          <img src="../assets/icons/arrow-back.svg" alt="" />
        </button>
        <button class="navigation__btn" @click="goForward">
          <img src="../assets/icons/arrow-forward.svg" alt="" />
        </button>
        <button class="navigation__btn" @click="reloadTab">
          <img src="../assets/icons/refresh.svg" alt="" />
        </button>
      </div>
      <input type="text" :value="activeTabUrl" @keyup.enter="handleUrlEnter" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Urls, useTabsStore } from '../stores/useTabsStore'
import { computed, onMounted, onUnmounted } from 'vue'
import { validateUrlPattern } from '../utils/validators'

const tabsStore = useTabsStore()
const { addTab, closeTab, selectTab, goBack, goForward, reloadTab, updateActiveTabInfo } = tabsStore

const tabs = computed(() => tabsStore.getTabs)
const activeTabIndex = computed(() => tabsStore.getActiveTabIndex)
const activeTabUrl = computed(() => tabs.value[activeTabIndex.value]?.url ?? '')

function handleUrlEnter(e) {
  const url = addProtocol(e.target.value.trim())

  if (validateUrl(url)) {
    window.electron.ipcRenderer.send('load-url', { url, index: activeTabIndex.value })
  } else {
    window.electron.ipcRenderer.send('load-url', {
      url: Urls.defaultSearchEngine,
      index: activeTabIndex.value
    })
  }
}

function validateUrl(url: string) {
  return validateUrlPattern.test(url)
}

function addProtocol(url: string) {
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
}

onMounted(() => {
  window.electron.ipcRenderer.on('page-title-updated', (_, data) => {
    updateActiveTabInfo(data)
  })
  window.electron.ipcRenderer.on('page-url-updated', (_, data) => {
    updateActiveTabInfo(data)
  })
  window.electron.ipcRenderer.on('open-new-tab', (_, data) => {
    addTab(data.url)
  })
})
onUnmounted(() => {
  window.electron.ipcRenderer.removeAllListeners('page-title-updated')
  window.electron.ipcRenderer.removeAllListeners('page-url-updated')
  window.electron.ipcRenderer.removeAllListeners('open-new-tab')
})
</script>

<style lang="scss" scoped>
.navigation {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  &__tabs {
    display: flex;
    flex-wrap: nowrap;
    &__item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px;
      min-width: 50px;
      max-width: 230px;
      width: 100%;
      background: #31363d;
      font-size: 14px;
      border-right: 1px solid black;
      &:last-of-type {
        border-right: none;
      }
      &--active {
        background: #283548;
      }
      span {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        max-width: 100px;
        width: 100%;
      }
    }
    &__add {
      display: flex;
      justify-content: center;
      align-items: center;
      flex: 0 0 auto;
    }
  }
  &__footer {
    display: flex;
    padding: 4px 12px;
    &__buttons {
      display: flex;
      margin-right: 12px;
    }
    input {
      width: 100%;
      border-radius: 30px;
      padding: 0 12px;
      outline: none;
    }
  }
  &__btn {
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    outline: none;
    border: none;
    cursor: pointer;
  }
}
</style>
