import localForage from 'localforage'

function createLocalForageInstance(localForageLruOptions: any): any {
  if (typeof localForageLruOptions?.size !== 'number') {
    throw Error(
      `LocalForageLru.createInstance localForageLruOptions.size '${localForageLruOptions?.size}' not a number`
    )
  }
  const localForageOptions = { ...localForageLruOptions }
  delete localForageOptions.size
  let database1: any,
    database2: any,
    databaseSize: number,
    initialized = false

  ;(async () => {
    const localForage1 = localForage.createInstance({
      ...localForageOptions,
      name: localForageLruOptions.name,
    })
    const localForage2 = localForage.createInstance({
      ...localForageOptions,
      name: localForageLruOptions.name + '2',
    })
    const [localForage1Size, localForage2Size] = await Promise.all([localForage1.length(), localForage2.length()])
    if (localForage1Size > localForage2Size) {
      database2 = localForage1
      database1 = localForage2
      databaseSize = localForage1Size
    } else {
      database2 = localForage2
      database1 = localForage1
      databaseSize = localForage2Size
    }
    initialized = true
  })()

  return {
    getItem: async function (key: string) {
      await initialization()
      const value = await database1.getItem(key)
      const value2 = await database2.getItem(key)

      let returnValue = value
      if (returnValue !== null && value !== undefined) return returnValue
      if ((returnValue = value2) !== null && (returnValue = value2) !== undefined) {
        await updateDatabases(key, returnValue)
        return returnValue
      }
    },
    setItem: async function (key: string, value: any) {
      await initialization()
      const databaseValue = await database1.getItem(key)
      if (databaseValue !== null && databaseValue !== undefined) {
        await database1.setItem(key, value)
      } else {
        await updateDatabases(key, value)
      }
    },
    removeItem: async function (key: string) {
      await initialization()
      await database1.removeItem(key)
      await database2.removeItem(key)
    },
    clear: async function () {
      await initialization()
      await database1.clear()
      await database2.clear()
    },
    key: async function (keyIndex: number) {
      throw Error('not implemented')
    },
    keys: async function () {
      await initialization()
      return [...new Set([
        ...(await database1.keys()),
        ...(await database2.keys())
      ])]
    },
    length: async function () {
      throw Error('not implemented')
    },
  }

  async function updateDatabases(key: string, value: any) {
    await database1.setItem(key, value)
    databaseSize++
    if (databaseSize >= localForageLruOptions.size) {
      databaseSize = 0
      const database1Temp = database1
      const database2Temp = database2
      database2 = database1Temp
      database1 = database2Temp
      await database1.clear()
    }
  }

  async function initialization() {
    if (initialized) return
    await new Promise((r) => setTimeout(r, 10))
    await initialization()
  }
}

const instances: any = {}

const createInstance = (localForageLruOptions: any) => {
  if (typeof localForageLruOptions?.name !== 'string') {
    throw Error(
      `LocalForageLru.createInstance localForageLruOptions.name '${localForageLruOptions?.name}' not a string`
    )
  }
  if (instances[localForageLruOptions.name]) {
    if (localForageLruOptions.size) {
      throw Error(
        `LocalForageLru.createInstance with name '${localForageLruOptions.name}' already created, remove localForageLruOptions.size, size cannot be changed`
      )
    }
    return instances[localForageLruOptions.name]
  }
  instances[localForageLruOptions.name] = createLocalForageInstance(localForageLruOptions)
  return instances[localForageLruOptions.name]
}

export default { createInstance }
