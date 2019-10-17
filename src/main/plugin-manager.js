import { PLUGINS } from '../../config'
import { download } from 'electron-dl'
import decompress from 'decompress'
import trash from 'trash'
import { ensureDirSync } from 'fs-extra'

const logger = require('electron-log')

export const setupPluginManager = ({ sendToWindow, mainWindow, ipcMain }) => {
  let downloadItem
  let savePath
  let totalBytes

  const pluginsPath = `${process.env.NODE_ENV !== 'development' ? PLUGINS.path : PLUGINS.devPath}`
  const cachePath = `${pluginsPath}/.cache`

  ensureDirSync(cachePath)

  const prefix = 'plugin-manager:'

  ipcMain.on(prefix + 'download', async (_, { url }) => {
    downloadItem = undefined

    const options = {
      directory: cachePath,
      onCancel: item => {
        logger.log(`${prefix} Download cancelled`)
      },
      onStarted: item => {
        logger.log(`${prefix} Download started`)

        downloadItem = item
        totalBytes = item.getTotalBytes()
        savePath = item.getSavePath()
      },
      onProgress: percent => {
        sendToWindow(prefix + 'download-progress', {
          percent,
          transferred: parseInt(percent * totalBytes, 10),
          total: totalBytes
        })
      }
    }

    try {
      await download(mainWindow, url, options)
      logger.log(`${prefix} Download complete`)
      sendToWindow(prefix + 'plugin-downloaded', savePath)
    } catch (error) {
      sendToWindow(prefix + 'error', error)
    }
  })

  ipcMain.on(prefix + 'install', async (_, pluginId) => {
    const pluginPath = [pluginsPath, pluginId].join('/')

    try {
      await decompress(savePath, pluginPath, {
        map: file => {
          file.path = file.path.split('/').slice(1).join('/')
          return file
        }
      })

      await trash(savePath)

      sendToWindow(prefix + 'plugin-installed', {
        pluginId,
        pluginPath
      })
    } catch (error) {
      sendToWindow(prefix + 'error', error)
    }
  })

  ipcMain.on(prefix + 'cancel', () => {
    const wait = () => {
      if (downloadItem) {
        downloadItem.cancel()
      } else {
        logger.log(`${prefix} Trying to cancel download...`)
        setTimeout(wait, 100)
      }
    }

    wait()
  })

  ipcMain.on(prefix + 'cleanup', async () => {
    await trash(savePath)
  })
}
