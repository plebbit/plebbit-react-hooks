import assert from 'assert'

const toString = (value: any) => {
  if (typeof value === 'string') {
    return value
  }
  try {
    const string = JSON.stringify(value)
    return string
  } catch (e) {}
  return value
}

export const validateAccountsActionsPublishCommentArguments = ({publishCommentOptions, accountName, account}: any) => {
  assert(!accountName || typeof accountName === 'string', `publishComment accountName '${accountName}' not a string`)
  assert(accountName !== '', `publishComment accountName argument is empty string`)
  assert(!accountName || account, `publishComment no account with name '${accountName}' in AccountsContext`)
  assert(publishCommentOptions && typeof publishCommentOptions === 'object', 'publishComment publishCommentOptions not an object')
  assert(typeof publishCommentOptions.onChallenge === 'function', 'publishComment publishCommentOptions.onChallenge not a function')
  assert(typeof publishCommentOptions.onChallengeVerification === 'function', 'publishComment publishCommentOptions.onChallengeVerification not a function')
  assert(typeof publishCommentOptions.subplebbitAddress === 'string', 'publishComment publishCommentOptions.subplebbitAddress not a string')
  assert(!publishCommentOptions.parentCid || typeof publishCommentOptions.parentCid === 'string', 'publishComment publishCommentOptions.parentCid not a string')
  assert(typeof publishCommentOptions.content === 'string', 'publishComment publishCommentOptions.content not a string')
  assert(publishCommentOptions.content !== '', 'publishComment publishCommentOptions.content is an empty string')
  assert(!publishCommentOptions.timestamp || typeof publishCommentOptions.timestamp === 'number', 'publishComment publishCommentOptions.timestamp is not a number')
}

export const validateAccountsActionsPublishVoteArguments = ({publishVoteOptions, accountName, account}: any) => {
  assert(!accountName || typeof accountName === 'string', `publishVote accountName '${accountName}' not a string`)
  assert(accountName !== '', `publishVote accountName argument is empty string`)
  assert(!accountName || account, `publishVote no account with name '${accountName}' in AccountsContext`)
  assert(publishVoteOptions && typeof publishVoteOptions === 'object', 'publishVote publishVoteOptions not an object')
  assert(typeof publishVoteOptions.onChallenge === 'function', 'publishVote publishVoteOptions.onChallenge not a function')
  assert(typeof publishVoteOptions.onChallengeVerification === 'function', 'publishVote publishVoteOptions.onChallengeVerification not a function')
  assert(typeof publishVoteOptions.subplebbitAddress === 'string', 'publishVote publishVoteOptions.subplebbitAddress not a string')
  assert(typeof publishVoteOptions.commentCid === 'string', 'publishVote publishVoteOptions.commentCid not a string')
  assert(publishVoteOptions.vote === 1 || publishVoteOptions.vote === 0 || publishVoteOptions.vote === -1, 'publishVote publishVoteOptions.vote not 1, 0 or -1')
  assert(!publishVoteOptions.timestamp || typeof publishVoteOptions.timestamp === 'number', 'publishVote publishVoteOptions.timestamp is not a number')
}

export const validateAccountsActionsPublishCommentEditArguments = ({publishCommentEditOptions, accountName, account}: any) => {
  assert(!accountName || typeof accountName === 'string', `publishCommentEdit accountName '${accountName}' not a string`)
  assert(accountName !== '', `publishCommentEdit accountName argument is empty string`)
  assert(!accountName || account, `publishCommentEdit no account with name '${accountName}' in AccountsContext`)
  assert(publishCommentEditOptions && typeof publishCommentEditOptions === 'object', 'publishCommentEdit publishCommentEditOptions not an object')
  assert(typeof publishCommentEditOptions.onChallenge === 'function', 'publishCommentEdit publishCommentEditOptions.onChallenge not a function')
  assert(typeof publishCommentEditOptions.onChallengeVerification === 'function', 'publishCommentEdit publishCommentEditOptions.onChallengeVerification not a function')
  assert(typeof publishCommentEditOptions.subplebbitAddress === 'string', 'publishCommentEdit publishCommentEditOptions.subplebbitAddress not a string')
  assert(typeof publishCommentEditOptions.commentCid === 'string', 'publishCommentEdit publishCommentEditOptions.commentCid not a string')
  assert(
    !publishCommentEditOptions.timestamp || typeof publishCommentEditOptions.timestamp === 'number',
    'publishCommentEdit publishCommentEditOptions.timestamp is not a number'
  )
}

export const validateAccountsActionsPublishSubplebbitEditArguments = ({subplebbitAddress, publishSubplebbitEditOptions, accountName, account}: any) => {
  assert(!accountName || typeof accountName === 'string', `publishSubplebbitEdit accountName '${accountName}' not a string`)
  assert(accountName !== '', `publishSubplebbitEdit accountName argument is empty string`)
  assert(!accountName || account, `publishSubplebbitEdit no account with name '${accountName}' in AccountsContext`)
  assert(publishSubplebbitEditOptions && typeof publishSubplebbitEditOptions === 'object', 'publishSubplebbitEdit publishSubplebbitEditOptions not an object')
  assert(typeof publishSubplebbitEditOptions.onChallenge === 'function', 'publishSubplebbitEdit publishSubplebbitEditOptions.onChallenge not a function')
  assert(
    typeof publishSubplebbitEditOptions.onChallengeVerification === 'function',
    'publishSubplebbitEdit publishSubplebbitEditOptions.onChallengeVerification not a function'
  )
  assert(subplebbitAddress !== '', `publishSubplebbitEdit subplebbitAddress argument is empty string`)
  assert(typeof subplebbitAddress === 'string', 'publishSubplebbitEdit subplebbitAddress not a string')
  assert(
    !publishSubplebbitEditOptions.timestamp || typeof publishSubplebbitEditOptions.timestamp === 'number',
    'publishSubplebbitEdit publishSubplebbitEditOptions.timestamp is not a number'
  )
}

export const validateAccountsActionsExportAccountArguments = (accountName: any) => {
  assert(typeof accountName === 'string', `exportAccount accountName '${accountName}' not a string`)
  assert(accountName !== '', `exportAccount accountName argument is empty string`)
}

export const validateAccountsActionsSetAccountsOrderArguments = (newOrderedAccountNames: any, accountNames: any) => {
  assert(
    JSON.stringify([...accountNames].sort()) === JSON.stringify([...newOrderedAccountNames].sort()),
    `previous account names '${accountNames} contain different account names than argument newOrderedAccountNames '${newOrderedAccountNames}'`
  )
}

export const validateAccountsActionsSetAccountArguments = (account: any) => {
  assert(account && typeof account === 'object', `setAccount account '${account}' not an object`)
  assert(typeof account.name === 'string', `setAccount account.name '${account.name}' not a string`)
  assert(account.name !== '', `setAccount account.name is empty string`)
  assert(typeof account.id === 'string', `setAccount account.id '${account.id}' not a string`)
  assert(account.id !== '', `setAccount account.id is empty string`)
}

export const validateAccountsActionsSetActiveAccountArguments = (accountName: any) => {
  assert(typeof accountName === 'string', `setActiveAccountName accountName '${accountName}' not a string`)
  assert(accountName !== '', `setActiveAccountName accountName argument is empty string`)
}

export const validateAccountsDatabaseGetAccountsArguments = (accountIds: any) => {
  assert(Array.isArray(accountIds), `accountsDatabase.getAccounts accountIds '${accountIds}' not an array`)
  assert(accountIds.length > 0, `accountsDatabase.getAccounts accountIds array is empty`)
  for (const accountId of accountIds) {
    assert(typeof accountId === 'string', `accountsDatabase.getAccountsaccountIds '${accountIds}' accountId '${accountId}' not a string`)
    assert(accountId !== '', `accountsDatabase.getAccounts accountIds '${accountIds}' an accountId argument is empty string`)
  }
}

export const validateAccountsProviderAccountNames = (accountNames: any) => {
  assert(Array.isArray(accountNames), `AccountsProviders accountNames '${accountNames}' not an array`)
  for (const accountName of accountNames) {
    assert(typeof accountName === 'string', `AccountsProviders accountNames '${accountNames}' accountName '${accountName}' not a string`)
  }
}

export const validateAccountsDatabaseAddAccountArguments = (account: any) => {
  assert(account && typeof account === 'object', `accountsDatabase.addAccount '${account}' not an object`)
  assert(typeof account.name === 'string', `accountsDatabase.addAccount account.name '${account.name}' not a string`)
  assert(account.name !== '', `accountsDatabase.addAccount account.name is empty string`)
  assert(typeof account.id === 'string', `accountsDatabase.addAccount account.id '${account.id}' not a string`)
  assert(account.id !== '', `accountsDatabase.addAccount account.id is empty string`)
}

export const validateUseCommentArguments = (commentCid: any, account: any) => {
  assert(typeof commentCid === 'string', `useComment commentCid '${commentCid}' not a string`)
  assert(account?.plebbit && typeof account?.plebbit === 'object', `useComment account.plebbit '${account?.plebbit}' not an object`)
}

export const validateUseCommentsArguments = (commentCids: any, account: any) => {
  assert(Array.isArray(commentCids), `useComment commentCids '${toString(commentCids)}' not an array`)
  for (const commentCid of commentCids) {
    assert(typeof commentCid === 'string', `useComments commentCids '${toString(commentCids)}' commentCid '${toString(commentCid)}' not a string`)
  }
  assert(account?.plebbit && typeof account?.plebbit === 'object', `useComments account.plebbit '${account?.plebbit}' not an object`)
}

export const validateUseSubplebbitArguments = (subplebbitAddress: any, account: any) => {
  assert(typeof subplebbitAddress === 'string', `useSubplebbit subplebbitAddress '${subplebbitAddress}' not a string`)
  assert(account?.plebbit && typeof account?.plebbit === 'object', `useSubplebbit account.plebbit '${account?.plebbit}' not an object`)
}

export const validateUseSubplebbitsArguments = (subplebbitAddresses: any, account: any) => {
  assert(Array.isArray(subplebbitAddresses), `useSubplebbit subplebbitAddresses '${toString(subplebbitAddresses)}' not an array`)
  for (const subplebbitAddress of subplebbitAddresses) {
    assert(
      typeof subplebbitAddress === 'string',
      `useSubplebbits subplebbitAddresses '${toString(subplebbitAddresses)}' subplebbitAddress '${toString(subplebbitAddress)}' not a string`
    )
  }
  assert(account?.plebbit && typeof account?.plebbit === 'object', `useSubplebbit account.plebbit '${account?.plebbit}' not an object`)
}

const feedSortTypes = new Set([
  'hot',
  'new',
  'topHour',
  'topDay',
  'topWeek',
  'topMonth',
  'topYear',
  'topAll',
  'controversialHour',
  'controversialDay',
  'controversialWeek',
  'controversialMonth',
  'controversialYear',
  'controversialAll',
])
export const validateFeedSortType = (sortType: any) => {
  assert(feedSortTypes.has(sortType), `invalid feed sort type '${sortType}'`)
}
export const validateUseFeedArguments = (subplebbitAddresses?: any, sortType?: any, accountName?: any) => {
  if (subplebbitAddresses) {
    assert(Array.isArray(subplebbitAddresses), `useFeed subplebbitAddresses argument '${toString(subplebbitAddresses)}' not an array`)
    for (const subplebbitAddress of subplebbitAddresses) {
      assert(
        typeof subplebbitAddress === 'string',
        `useFeed subplebbitAddresses argument '${toString(subplebbitAddresses)}' subplebbitAddress '${toString(subplebbitAddress)}' not a string`
      )
    }
  }
  assert(feedSortTypes.has(sortType), `useFeed sortType argument '${sortType}' invalid`)
  if (accountName) {
    assert(typeof accountName === 'string', `useFeed accountName argument '${accountName}' not a string`)
  }
}
export const validateUseBufferedFeedsArguments = (feedsOptions?: any, accountName?: any) => {
  assert(Array.isArray(feedsOptions), `useBufferedFeeds feedsOptions argument '${toString(feedsOptions)}' not an array`)
  for (const {subplebbitAddresses, sortType} of feedsOptions) {
    if (subplebbitAddresses) {
      assert(Array.isArray(subplebbitAddresses), `useBufferedFeeds feedOptions.subplebbitAddresses argument '${toString(subplebbitAddresses)}' not an array`)
      for (const subplebbitAddress of subplebbitAddresses) {
        assert(
          typeof subplebbitAddress === 'string',
          `useBufferedFeeds feedOptions.subplebbitAddresses argument '${toString(subplebbitAddresses)}' subplebbitAddress '${toString(subplebbitAddress)}' not a string`
        )
      }
    }
    if (sortType) {
      assert(feedSortTypes.has(sortType), `useBufferedFeeds feedOptions.sortType argument '${sortType}' invalid`)
    }
  }
  if (accountName) {
    assert(typeof accountName === 'string', `useBufferedFeeds accountName argument '${accountName}' not a string`)
  }
}

const validator = {
  validateAccountsActionsPublishCommentArguments,
  validateAccountsActionsPublishCommentEditArguments,
  validateAccountsActionsPublishSubplebbitEditArguments,
  validateAccountsActionsPublishVoteArguments,
  validateAccountsActionsExportAccountArguments,
  validateAccountsActionsSetAccountsOrderArguments,
  validateAccountsActionsSetAccountArguments,
  validateAccountsActionsSetActiveAccountArguments,
  validateAccountsDatabaseAddAccountArguments,
  validateAccountsDatabaseGetAccountsArguments,
  validateAccountsProviderAccountNames,
  validateUseCommentArguments,
  validateUseCommentsArguments,
  validateUseSubplebbitArguments,
  validateUseSubplebbitsArguments,
  validateFeedSortType,
  validateUseFeedArguments,
  validateUseBufferedFeedsArguments,
}

export default validator
