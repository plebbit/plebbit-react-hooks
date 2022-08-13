import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import useSubplebbitsPages from './use-subplebbits-pages'

describe('useSubplebbitsPages', () => {
  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(async () => {
    testUtils.restoreAll()
    try {
      await testUtils.resetDatabasesAndStores()
    } catch (e) {}
  })

  let rendered: any, waitFor: any
  beforeEach(async () => {
    // @ts-ignore
    rendered = renderHook<any, any>((props: any) => useSubplebbitsPages(props.subplebbitsPostsInfo, props.subplebbits))
    waitFor = testUtils.createWaitFor(rendered)
  })

  test('undefined props', async () => {
    const subplebbitsPostsInfo = undefined
    const subplebbits = undefined
    rendered.rerender({subplebbitsPostsInfo, subplebbits})
    expect(rendered.result.current).toEqual({})
  })

  test('empty props', async () => {
    const subplebbitsPostsInfo = {}
    const subplebbits = {}
    rendered.rerender({subplebbitsPostsInfo, subplebbits})
    expect(rendered.result.current).toEqual({})
  })
})
