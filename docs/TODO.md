- e2e test to publish to an electron sub
- async useAuthorAddress hook (because resolving ETH address synchronously is too slow)
- implement sort by active
- implement showing your own pending replies in a comment (when reloading) and your own pending posts in a sub (when reloading)
- useResolvedAuthorAddress check if public key matches resolved address
- useAuthorAvatar check if ENS has an avatar set up
- implement something like useCommentLinkTagName(commentLink?: string): 'a' | 'img' | 'video' | 'audio' to indicate how to display links (only do it after special embeds like twitter, youtube, etc are implemented)
- add nft.timetamp caching and validation, if you see them same nft signature twice, only use the latest timestamp
- make comment and subplebbit state succeeded even if fetching an update if the content was found once
- add 'pending' and 'failed' to accountVotes and accountEdits state
- implement multiple gateways in nft fetching, or possibly using the best gateway using gateway stats
- implement multiple chain providers in ens resolving, or possibly using the best provider using provider stats
