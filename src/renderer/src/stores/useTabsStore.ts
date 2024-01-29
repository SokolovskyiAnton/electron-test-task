import { defineStore } from 'pinia'

export enum Urls {
  defaultSearchEngine = 'https://www.google.com',
  defaultHost = 'http://localhost:5173'
}
interface TabInterface {
  id: number
  title: string
  url: string
}

interface TabsState {
  tabs: Array<TabInterface>
  activeTabIndex: number
}
export const useTabsStore = defineStore('tabsStore', {
  state: (): TabsState => {
    return {
      tabs: [],
      activeTabIndex: 0
    }
  },
  getters: {
    getTabs: ({ tabs }) => tabs,
    getActiveTabIndex: ({ activeTabIndex }) => activeTabIndex
  },
  actions: {
    addTab(url = Urls.defaultSearchEngine) {
      const newTab = {
        id: Date.now(),
        title: 'Google',
        url
      }

      this.tabs.push(newTab)
      window.electron.ipcRenderer.send('open-tab', newTab)
      this.selectTab(this.tabs.length - 1)
    },
    selectTab(index: number) {
      this.activeTabIndex = index
      window.electron.ipcRenderer.send('select-tab', index)
    },
    closeTab(index: number) {
      this.tabs.splice(index, 1)
      this.activeTabIndex = this.tabs.length - 1
      window.electron.ipcRenderer.send('close-tab', index)
    },
    goBack() {
      window.electron.ipcRenderer.send('go-back', this.activeTabIndex)
    },
    goForward() {
      window.electron.ipcRenderer.send('go-forward', this.activeTabIndex)
    },
    reloadTab() {
      window.electron.ipcRenderer.send('reload-tab', this.activeTabIndex)
    },
    updateActiveTabInfo(updatedData: Omit<TabInterface, 'id'>) {
      const activeTab = this.tabs[this.activeTabIndex]
      if (activeTab) {
        Object.assign(activeTab, updatedData)
      }
    }
  }
})
