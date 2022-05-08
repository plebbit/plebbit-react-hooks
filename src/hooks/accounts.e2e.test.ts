import { act, renderHook } from '@testing-library/react-hooks'

import {useAccount} from "./accounts";
import {PlebbitProvider} from "../index";

describe('no accounts in database', () => {
    test('generate default account on load', async () => {
        // on first render, the account is undefined because it's not yet loaded from database
        const rendered = renderHook(() => useAccount(), { wrapper: PlebbitProvider })
        expect(rendered.result.current).toBe(undefined)

        // on second render, you get the default generated account
        try {
            await rendered.waitForNextUpdate()
        } catch (e) {
            console.error(e)
        }
        const account = rendered.result.current
        expect(account.name).toBe('Account 1')
        expect(account.author.displayName).toBe(null)
        expect(typeof account.author.address).toBe('string')
        expect(Array.isArray(account.subscriptions)).toBe(true)
        expect(account.blockedAddresses && typeof account.blockedAddresses === 'object').toBe(true)
        expect(account.plebbit && typeof account.plebbit === 'object').toBe(true)
        expect(account.plebbitOptions.ipfsGatewayUrl).toBe('https://cloudflare-ipfs')
        expect(account.plebbitOptions.ipfsApiUrl).toBe('http://localhost:8080')
    });
});
