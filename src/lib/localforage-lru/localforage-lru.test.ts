import {describe, expect, test, vi, beforeAll, afterAll, afterEach} from 'vitest'
import localForageLru, {instances} from './localforage-lru'

let dbCount = 0
const getNewTestDbName = () => `testDb${++dbCount}`

describe('localForageLru', () => {
  test('get last recently used', async () => {
    const name = getNewTestDbName()
    const testDatabase = localForageLru.createInstance({name, size: 4})

    await testDatabase.setItem('one', 1)
    await testDatabase.setItem('two', 2)
    await testDatabase.setItem('three', 3)
    await testDatabase.setItem('four', 4)

    // access 1 and 2 last to make them last recently used
    await testDatabase.getItem('three')
    await testDatabase.getItem('four')
    await testDatabase.getItem('one')
    await testDatabase.getItem('two')

    // erase 3 and 4 by adding 2 more items over than size limit 4
    await testDatabase.setItem('five', 5)
    await testDatabase.setItem('six', 6)
    expect(await testDatabase.getItem('one')).toBe(1)
    expect(await testDatabase.getItem('two')).toBe(2)
    expect(await testDatabase.getItem('three')).toBe(undefined)
    expect(await testDatabase.getItem('four')).toBe(undefined)
    expect(await testDatabase.getItem('five')).toBe(5)
    expect(await testDatabase.getItem('six')).toBe(6)

    // .keys() is implemented
    expect(await testDatabase.keys()).toEqual(['five', 'six', 'one', 'two'])

    // .entries() is implemented
    expect(await testDatabase.entries()).toEqual([
      ['five', 5],
      ['six', 6],
      ['one', 1],
      ['two', 2],
    ])

    // .clear() is implemented
    await testDatabase.clear()
    expect(await testDatabase.entries()).toEqual([])
    expect(await testDatabase.keys()).toEqual([])
    expect(await testDatabase.getItem('one')).toBe(undefined)
    expect(await testDatabase.getItem('two')).toBe(undefined)
  })

  test('reinstantiate', async () => {
    const name = getNewTestDbName()
    let testDatabase = localForageLru.createInstance({name, size: 4})

    await testDatabase.setItem('one', 1)
    await testDatabase.setItem('two', 2)

    // reinstantiate
    delete instances[name]
    testDatabase = localForageLru.createInstance({name, size: 4})

    await testDatabase.setItem('three', 3)
    await testDatabase.setItem('four', 4)
    expect(await testDatabase.getItem('one')).toBe(1)
    expect(await testDatabase.getItem('two')).toBe(2)
  })

  test('reinstantiate and overfill', async () => {
    const name = getNewTestDbName()
    let testDatabase = localForageLru.createInstance({name, size: 4})

    await testDatabase.setItem('one', 1)
    await testDatabase.setItem('two', 2)

    // reinstantiate
    delete instances[name]
    testDatabase = localForageLru.createInstance({name, size: 4})

    await testDatabase.setItem('three', 3)
    await testDatabase.setItem('four', 4)
    await testDatabase.setItem('five', 5)
    // need to add 2 more, because the max size is actually not just 4, it can be up to 4*2-1
    await testDatabase.setItem('six', 6)
    await testDatabase.setItem('seven', 7)
    expect(await testDatabase.getItem('one')).toBe(1) // since the 1 is gotten first, the 2 gets deleted, even if the 2 was set last
    expect(await testDatabase.getItem('two')).toBe(undefined)
  })

  test('reinstantiate twice', async () => {
    const name = getNewTestDbName()
    let testDatabase = localForageLru.createInstance({name, size: 100})

    await testDatabase.setItem('a', 1)

    // reinstantiate
    delete instances[name]
    testDatabase = localForageLru.createInstance({name, size: 100})

    await testDatabase.setItem('a', 2)
    await testDatabase.setItem('b', 2)

    // reinstantiate
    delete instances[name]
    testDatabase = localForageLru.createInstance({name, size: 100})

    expect(await testDatabase.getItem('a')).toBe(2)
    expect(await testDatabase.getItem('b')).toBe(2)
  })

  test('reinstantiate twice and overfill', async () => {
    const name = getNewTestDbName()
    let testDatabase = localForageLru.createInstance({name, size: 4})

    await testDatabase.setItem('a', 1)
    await testDatabase.setItem('b', 1)
    await testDatabase.setItem('c', 1)
    await testDatabase.setItem('d', 1)

    // reinstantiate
    delete instances[name]
    testDatabase = localForageLru.createInstance({name, size: 4})

    await testDatabase.setItem('a', 2)
    await testDatabase.setItem('b', 2)
    await testDatabase.setItem('e', 2)

    // reinstantiate
    delete instances[name]
    testDatabase = localForageLru.createInstance({name, size: 4})

    expect(await testDatabase.getItem('a')).toBe(2)
    expect(await testDatabase.getItem('b')).toBe(2)
    expect(await testDatabase.getItem('d')).toBe(1)

    // reinstantiate
    delete instances[name]
    testDatabase = localForageLru.createInstance({name, size: 4})
  })
})
