import { app, shell, BrowserWindow, ipcMain, BrowserView } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow
const views: Array<BrowserView> = []

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  const homeView = createBrowserView()
  views.push(homeView)
  mainWindow.setBrowserView(homeView)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createBrowserView(): BrowserView {
  const browserView = new BrowserView()
  browserView.setBounds({
    x: 0,
    y: 65,
    width: mainWindow.getBounds().width,
    height: mainWindow.getBounds().height - 65
  })
  browserView.setAutoResize({ width: true, height: true })

  browserView.webContents.on('page-title-updated', (_, title) => {
    mainWindow.webContents.send('page-title-updated', { title })
  })
  browserView.webContents.on('did-navigate', (_, url) => {
    mainWindow.webContents.send('page-url-updated', { url })
  })

  return browserView
}
function selectTab(index: number) {
  const selectedView = views[index]
  if (selectedView) {
    mainWindow.setBrowserView(selectedView)
  }
}
function closeTab(index: number) {
  const viewToClose = views[index]
  if (viewToClose) {
    viewToClose.webContents.destroy()
    views.splice(index, 1)

    if (views.length === 0) {
      app.quit()
    } else {
      selectTab(views.length - 1)
    }
  }
}

function goBack(index: number) {
  const view = views[index]
  if (view && view.webContents.canGoBack()) {
    view.webContents.goBack()
  }
}
function goForward(index: number) {
  const view = views[index]
  if (view && view.webContents.canGoForward()) {
    view.webContents.goForward()
  }
}

function reloadTab(index: number) {
  const view = views[index]
  if (view) {
    view.webContents.reload()
  }
}
function openTab(payload: { url: string }) {
  const view = createBrowserView()
  views.push(view)
  mainWindow.setBrowserView(view)
  view.webContents.loadURL(payload.url)
}

function loadUrl(payload: { index: number; url: string }) {
  if (process.env['ELECTRON_RENDERER_URL'] === payload.url) return

  const view = views[payload.index]

  if (!view) return

  if (payload.index > 0) {
    view.webContents.loadURL(payload.url)
  } else {
    mainWindow.webContents.send('open-new-tab', { url: payload.url })
  }
}
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  ipcMain.on('open-tab', (_, payload) => {
    openTab(payload)
  })
  ipcMain.on('select-tab', (_, index) => {
    selectTab(index)
  })
  ipcMain.on('close-tab', (_, index) => {
    closeTab(index)
  })
  ipcMain.on('reload-tab', (_, index) => {
    reloadTab(index)
  })
  ipcMain.on('go-back', (_, index) => {
    goBack(index)
  })
  ipcMain.on('go-forward', (_, index) => {
    goForward(index)
  })
  ipcMain.on('load-url', (_, payload) => {
    loadUrl(payload)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
