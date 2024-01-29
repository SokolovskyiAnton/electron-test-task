import { app, shell, BrowserWindow, ipcMain, BrowserView, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow
const views: Array<BrowserView> = []
const heightOffset = 65
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
  mainWindow.setMenu(null)
  Menu.setApplicationMenu(null)
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
  browserView.webContents.on('did-finish-load', () => {
    browserView.setBounds({
      x: 0,
      y: heightOffset,
      width: mainWindow.getBounds().width,
      height: mainWindow.getBounds().height - heightOffset
    })
  })
  let lastHandle
  const handleWindowResize = (e) => {
    e.preventDefault()

    lastHandle = setTimeout(() => {
      if (lastHandle != null) clearTimeout(lastHandle)
      browserView.setBounds({
        x: 0,
        y: heightOffset,
        height: mainWindow.getBounds().height - heightOffset,
        width: mainWindow.getBounds().width
      })
    })
  }
  mainWindow.on('resize', handleWindowResize)
  browserView.webContents.on('page-title-updated', (_, title) => {
    mainWindow.webContents.send('page-title-updated', { title })
  })
  browserView.webContents.on('did-navigate', (_, url) => {
    mainWindow.webContents.send('page-url-updated', { url })
  })

  return browserView
}
function selectTab(selectTabIndex: number) {
  const selectedView = views[selectTabIndex]
  if (selectedView) {
    mainWindow.setBrowserView(selectedView)
  }
}
function closeTab(closeTabIndex: number) {
  const viewToClose = views[closeTabIndex]
  if (!viewToClose) return
  try {
    viewToClose.webContents.destroy()
    views.splice(closeTabIndex, 1)
  } catch (e) {
    console.log(e)
  }
}

function goBack(tabIndex: number) {
  const view = views[tabIndex]
  if (view && view.webContents.canGoBack()) {
    view.webContents.goBack()
  }
}
function goForward(tabIndex: number) {
  const view = views[tabIndex]
  if (view && view.webContents.canGoForward()) {
    view.webContents.goForward()
  }
}

function reloadTab(tabIndex: number) {
  const view = views[tabIndex]
  if (view) {
    view.webContents.reload()
  }
}
async function openTab(payload: { url: string }) {
  const view = createBrowserView()
  views.push(view)
  mainWindow.setBrowserView(view)
  await view.webContents.loadURL(payload.url)
}

async function loadUrl(payload: { index: number; url: string }) {
  if (process.env['ELECTRON_RENDERER_URL'] === payload.url) return

  const view = views[payload.index]

  if (!view) {
    mainWindow.webContents.send('open-new-tab', { url: payload.url })
    return
  }
  await view.webContents.loadURL(payload.url)
}
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  ipcMain.on('open-tab', async (_, payload) => {
    await openTab(payload)
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
  ipcMain.on('load-url', async (_, payload) => {
    await loadUrl(payload)
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
