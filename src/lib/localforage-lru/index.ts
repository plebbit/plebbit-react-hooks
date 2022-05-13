import localForageLru from './localforage-lru'

// for debugging without caching
if (process?.env?.REACT_APP_PLEBBIT_REACT_HOOKS_NO_CACHE) {
  // @ts-ignore
  localForageLru.createInstance = () => {
    console.warn('@plebbit/plebbit-react-hooks cache is disabled for testing')
    return {
      getItem: async function (key: string) {},
      setItem: async function (key: string, value: any) {},
      removeItem: async function (key: string) {},
      clear: async function () {},
      keys: async function () {return []}
    }
  }
}

export default localForageLru
