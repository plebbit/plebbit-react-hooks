import localForageLru from './localforage-lru'

describe('localForageLru', () => {
  test('get last recently used', async () => {
    const testDatabase = localForageLru.createInstance({ name: 'testDatabase', size: 4 })
    await testDatabase.clear()

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

    await testDatabase.clear()
  })
})
