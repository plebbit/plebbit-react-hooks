const restorables: any = []

export const silenceUpdateUnmountedComponentWarning = () => {
  const originalError = console.error
  console.error = (...args) => {
    if (/Can't perform a React state update on an unmounted component/.test(args[0])) {
      return
    }
    originalError.call(console, ...args)
  }
  const restore = () => {
    console.error = originalError
  }
  restorables.push(restore)
  return restore
}

const restoreAll = () => {
  for (const restore of restorables) {
    restore()
  }
}

const testUtils = {
  silenceUpdateUnmountedComponentWarning,
  restoreAll
}

export default testUtils