export class PluginManagerError extends Error {
  constructor (message) {
    super(message)

    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotInitiatedError extends PluginManagerError {
  constructor () {
    super('Plugin Manager not initiated')
  }
}

export class PluginAlreadyInstalledError extends PluginManagerError {
  constructor (plugin) {
    super(`Plugin '${plugin}' is already installed`)
  }
}

export class PluginDownloadFailedError extends PluginManagerError {
  constructor (plugin) {
    super(`Plugin '${plugin}' could not be downloaded`)
  }
}

export class PluginNotEnabledError extends PluginManagerError {
  constructor (plugin) {
    super(`Plugin '${plugin}' is not enabled`)
  }
}

export class PluginNotFoundError extends Error {
  constructor (plugin) {
    super(`Plugin '${plugin}' not found`)
  }
}