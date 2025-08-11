if (typeof window !== 'undefined') {
  // inject env var e.g. DEBUG=plebbit*
  if (localStorageDebug) {
    window.localStorage.setItem('debug', localStorageDebug)
  }

  // make sure browser errors are logged
  window.addEventListener('error', (e) => console.error('window.error', e.message, e.error?.stack || ''))
  window.addEventListener('unhandledrejection', (e) => console.error('unhandledrejection', e.reason?.message || e.reason || ''))
}
