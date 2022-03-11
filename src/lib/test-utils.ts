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

export const silenceTestWasNotWrappedInActWarning = () => {
  const originalError = console.error
  console.error = (...args) => {
    if (/inside a test was not wrapped in act/.test(args[0])) {
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
  silenceTestWasNotWrappedInActWarning,
  silenceUpdateUnmountedComponentWarning,
  restoreAll
}

export default testUtils