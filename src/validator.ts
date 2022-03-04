import assert from 'assert'

export const validateAccountsActionsPublishCommentArguments = ({publishCommentOptions, accountName, activeAccountName, account}: any) => {
  assert(!accountName || typeof accountName === 'string', `publishComment accountName '${accountName}' not a string`)
  assert(accountName !== '', `publishComment accountName argument is empty string`)
  assert(account, `publishComment no account with name '${accountName || activeAccountName}' in AccountsContext`)
  assert(publishCommentOptions && typeof publishCommentOptions === 'object', 'publishComment publishCommentOptions not an object')
  assert(typeof publishCommentOptions.onChallenge === 'function', 'publishComment publishCommentOptions.onChallenge not a function')
  assert(typeof publishCommentOptions.onChallengeVerification === 'function', 'publishComment publishCommentOptions.onChallengeVerification not a function')
  assert(typeof publishCommentOptions.subplebbitAddress === 'string', 'publishComment publishCommentOptions.subplebbitAddress not a string')
  assert(publishCommentOptions && typeof publishCommentOptions.parentCommentCid === 'string', 'publishComment publishCommentOptions.parentCommentCid not a string')
  assert(typeof publishCommentOptions.content === 'string', 'publishComment publishCommentOptions.content not a string')
  assert(publishCommentOptions.content !== '', 'publishComment publishCommentOptions.content is an empty string')
  assert(!publishCommentOptions.timestamp || typeof publishCommentOptions.timestamp === 'number', 'publishComment publishCommentOptions.timestamp is not a number')
}

export const validateAccountsActionsExportAccountArguments = (accountName: any) => {
  assert(typeof accountName === 'string', `exportAccount accountName '${accountName}' not a string` )
  assert(accountName !== '', `exportAccount accountName argument is empty string` )
}

export const validateAccountsActionsCreateAccountArguments = (accountName: any, accountNames: any) => {
  assert(typeof accountName === 'string', `createAccount accountName '${accountName}' not a string`)
  assert(accountName !== '', `createAccount accountName argument is empty string`)
  assert(
    !accountNames.includes(accountName),
    `createAccount accountName '${accountName}' already exists in database`
  )
}

export const validateAccountsActionsSetAccountsOrderArguments = (newOrderedAccountNames: any, accountNames: any) => {
  assert(
    JSON.stringify([...accountNames].sort()) === JSON.stringify([...newOrderedAccountNames].sort()),
    `previous account names '${accountNames} contain different account names than argument newOrderedAccountNames '${newOrderedAccountNames}'`
  )
}

export const validateAccountsActionsSetAccountArguments = (accountNameToSet: any, account: any) => {
  assert(typeof accountNameToSet === 'string', `setAccount accountNameToSet '${accountNameToSet}' not a string`)
  assert(accountNameToSet !== '', `setAccount accountNameToSet argument is empty string`)
  assert(account && typeof account === 'object', `setAccount account '${account}' not an object`)
}

export const validateAccountsActionsSetActiveAccountArguments = (accountName: any) => {
  assert(typeof accountName === 'string', `setActiveAccountName accountName '${accountName}' not a string`)
  assert(accountName !== '', `setActiveAccountName accountName argument is empty string`)
}

export const validateAccountsProviderGetAccountsFromDatabaseArguments = (accountNames: any) => {
  assert(Array.isArray(accountNames), `AccountsProvider getAccountsFromDatabase accountNames '${accountNames}' not an array`)
  assert(accountNames.length > 0, `AccountsProvider getAccountsFromDatabase accountNames '${accountNames}' is empty`)
  for (const accountName of accountNames) {
    assert(
      typeof accountName === 'string',
      `AccountsProvider getAccountsFromDatabase accountNames '${accountNames}' accountName '${accountName}' not a string`
    )
    assert(
      accountName !== '',
      `AccountsProvider getAccountsFromDatabase accountNames '${accountNames}' an accountName argument is empty string`
    )
  }
}

export const validateAccountsProviderAccountNames = (accountNames: any) => {
  assert(Array.isArray(accountNames), `AccountsProviders accountNames '${accountNames}' not an array`)
  for (const accountName of accountNames) {
    assert(
      typeof accountName === 'string',
      `AccountsProviders accountNames '${accountNames}' accountName '${accountName}' not a string`
    )
  }
}

export const validateAccountsProviderAddAccountToDatabaseArguments = (account: any) => {
  assert(account && typeof account === 'object', `AccountsProvider addAccountToDatabase account '${account}' not an object`)
  assert(typeof account.name === 'string', `AccountsProvider addAccountToDatabase account.name '${account.name}' not a string`)
}

const validator = {
  validateAccountsActionsPublishCommentArguments,
  validateAccountsActionsExportAccountArguments,
  validateAccountsActionsCreateAccountArguments,
  validateAccountsActionsSetAccountsOrderArguments,
  validateAccountsActionsSetAccountArguments,
  validateAccountsActionsSetActiveAccountArguments,
  validateAccountsProviderGetAccountsFromDatabaseArguments,
  validateAccountsProviderAddAccountToDatabaseArguments,
  validateAccountsProviderAccountNames
}

export default validator
