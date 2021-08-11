# Documentation

- [Database](#api)
    - [Subscriptions](#subscriptions)
    - [Tags](#tags)
    - [Blocks and transactions](#blocks-and-transactions)
    - [Globals](#globals)
    - [Keys](#keys)
    - [Accounts](#accounts)
    - [Authority / validation](#authority--validation)
    - [Votes](#votes)
    - [Content](#content)
    - [Witnesses](#witnesses)
- [Login](#login)
- [Follow](#follow-api)
- [Worker](#worker-api)
- [Market](#market)
- [UIA](#uia-examples)
- [Broadcast API](#broadcast-api)
- [Broadcast](#broadcast)
- [Auth](#auth)
- [Private Messages](#private-messages)
- [Formatter](#formatter)
- [Utils](#utils)

# Install
```
$ npm install golos-classic-js --save
```

or

```
$ npm install git+https://github.com/golos-blockchain/golos-lib-js.git --save
```

# Browser 
Online library minify js available in [jsDelivr CND](https://cdn.jsdelivr.net/npm/golos-classic-js@latest/dist/golos.min.js) and [Unpkg CDN](https://unpkg.com/golos-classic-js@latest/dist/golos.min.js).

```html 
<script src="./golos.min.js"></script>
<script>
golos.api.getAccounts(['ned', 'dan'], function(err, response){
    console.log(err, response);
});
</script>
```

## WebSockets and HTTP transport

Library support 2 transport types: ws, wss for websocket and http, https for pure HTTP JSONRPC.

wss://api-golos.blckchnd.com/ws<br/>
wss://api.aleksw.space/ws<br/>
wss://golos.lexai.host/ws<br/>

https://api-golos.blckchnd.com/<br/>
https://api.aleksw.space/<br/>
https://golos.lexai.host/<br/>

```js
golos.config.set('websocket','wss://golos.lexai.host/ws');
```
or
```js
golos.config.set('websocket','https://golos.lexai.host/');
```

# API

## Subscriptions

### Set Subscribe Callback
```
golos.api.setSubscribeCallback(callback, clearFilter, function(err, result) {
  console.log(err, result);
});
```
### Set Pending Transaction Callback
```
golos.api.setPendingTransactionCallback(cb, function(err, result) {
  console.log(err, result);
});
```
### Set Block Applied Callback
```
golos.api.setBlockAppliedCallback(cb, function(err, result) {
  console.log(err, result);
});
```
### Cancel All Subscriptions
```
golos.api.cancelAllSubscriptions(function(err, result) {
  console.log(err, result);
});
```

## Tags

### Get Trending Tags
```
golos.api.getTrendingTags(afterTag, limit, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Trending
```
golos.api.getDiscussionsByTrending(query, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
/**
 * getDiscussionsByTrending() receiving posts by tags
 * @param {Object} query - A search object that includes tags and a limit or authors username and url-address of post
*/
var query = {
  select_tags: ['dev', 'test'],
  limit: 100,
  //start_author: 'epexa',
  //start_permlink: 'test-url'
};
golos.api.getDiscussionsByTrending(query, function(err, result) {
  //console.log(err, result);
  if (!err) {
    result.forEach(function(item) {
      console.log('getDiscussionsByTrending', item.title);
    });
  }
  else console.error(err);
});
```
### Get Discussions By Created
```
golos.api.getDiscussionsByCreated(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Active
```
golos.api.getDiscussionsByActive(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Cashout
```
golos.api.getDiscussionsByCashout(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Payout
```
golos.api.getDiscussionsByPayout(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Votes
```
golos.api.getDiscussionsByVotes(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Children
```
golos.api.getDiscussionsByChildren(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Hot
```
golos.api.getDiscussionsByHot(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Feed
```
golos.api.getDiscussionsByFeed(query, function(err, result) {
  console.log(err, result);
});
```
### Get Discussions By Blog
```
golos.api.getDiscussionsByBlog(query, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
/**
 * getDiscussionsByBlog() receiving posts by author and tag
 * @param {Object} query - search object that includes the author, tag, limit
*/
var query = {
  select_authors: ['epexa'],
  select_tags: ['dev'],
  limit: 100
};
golos.api.getDiscussionsByBlog(query, function(err, result) {
  //console.log(err, result);
  if (!err) {
    result.forEach(function(item) {
      console.log('getDiscussionsByBlog', item.title);
    });
  }
  else console.error(err);
});
```
### Get Discussions By Comments
```
golos.api.getDiscussionsByComments(query, function(err, result) {
  console.log(err, result);
});
```

## Blocks and transactions

### Get Block Header
```
golos.api.getBlockHeader(blockNum, function(err, result) {
  console.log(err, result);
});
```
### Get Block
```
golos.api.getBlock(blockNum, function(err, result) {
  console.log(err, result);
});
```
### Get State
```
golos.api.getState(path, function(err, result) {
  console.log(err, result);
});
```

## Globals

### Get Config
```
golos.api.getConfig(function(err, result) {
  console.log(err, result);
});
```
### Get Dynamic Global Properties
```
golos.api.getDynamicGlobalProperties(function(err, result) {
  console.log(err, result);
});
```
### Get Chain Properties
```
golos.api.getChainProperties(function(err, result) {
  console.log(err, result);
});
```
### Get Current Median History Price
```
golos.api.getCurrentMedianHistoryPrice(function(err, result) {
  console.log(err, result);
});
```
### Get Hardfork Version
```
golos.api.getHardforkVersion(function(err, result) {
  console.log(err, result);
});
```

## Keys

### Get Key References
```
golos.api.getKeyReferences(key, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
var publicKeys = ['GLS6...', 'GLS6...'];
golos.api.getKeyReferences(publicKeys, function(err, result) {
  //console.log(err, result);
  if (!err) {
    result.forEach(function(item) {
      console.log('getKeyReferences', 'username: [', item[0], ']');
    });
  }
  else console.error(err);
});
```

## Accounts

### Get Accounts
```
golos.api.getAccounts(names, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
var accounts = [ 'epexa', 'epexa2' ];
golos.api.getAccounts(accounts, function(err, result) {
  //console.log(err, result);
  if (!err) {
    result.forEach(function(item) {
      console.log('getAccounts', 'username: [', item.name, '] id: [', item.id, ']');
    });
  }
  else console.error(err);
});
```
### Get Accounts Balances
```
golos.api.getAccountsBalances(accounts, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
var accounts = [ 'epexa', 'epexa2' ];
golos.api.getAccountsBalances(accounts, function(err, result) {
  //console.log(err, result);
  if (!err) {
    result.forEach(function(item) {
        console.log('Account\'s UIAs', item);
    });
  }
  else console.error(err);
});
```
### Lookup Account Names
```
golos.api.lookupAccountNames(accountNames, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
var usernames = ['epexa', 'epexa2'];
golos.api.lookupAccountNames(usernames, function(err, result) {
  //console.log(err, result);
  if (!err) {
    result.forEach(function(item) {
    if (item) console.log('lookupAccountNames', 'username: [', item.name, '] id: [', item.id, ']');
    else console.log('lookupAccountNames', 'account not found!');
    });
  }
  else console.error(err);
});
```
### Lookup Accounts
```
golos.api.lookupAccounts(lowerBoundName, limit, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
var searchAccountsQuery = 'epe';
var limitResults = 10;
golos.api.lookupAccounts(searchAccountsQuery, limitResults, function(err, result) {
  //console.log(err, result);
  if (!err) {
    result.forEach(function(item) {
      console.log('lookupAccounts', 'username: [', item, ']');
    });
  }
  else console.error(err);
});
```
### Get Account Count
```
golos.api.getAccountCount(function(err, result) {
  console.log(err, result);
});
```
### Get Conversion Requests
```
golos.api.getConversionRequests(accountName, function(err, result) {
  console.log(err, result);
});
```
### Get Account History
```
golos.api.getAccountHistory(account, from, limit, function(err, result) {
  console.log(err, result);
});
```
### Get Owner History
```
golos.api.getOwnerHistory(account, function(err, result) {
  console.log(err, result);
});
```
### Get Recovery Request
```
golos.api.getRecoveryRequest(account, function(err, result) {
  console.log(err, result);
});
```

## Authority / validation

### Get Transaction Hex
```
golos.api.getTransactionHex(trx, function(err, result) {
  console.log(err, result);
});
```
### Get Transaction
```
golos.api.getTransaction(trxId, function(err, result) {
  console.log(err, result);
});
```
### Get Required Signatures
```
golos.api.getRequiredSignatures(trx, availableKeys, function(err, result) {
  console.log(err, result);
});
```
### Get Potential Signatures
```
golos.api.getPotentialSignatures(trx, function(err, result) {
  console.log(err, result);
});
```
### Verify Authority
```
golos.api.verifyAuthority(trx, function(err, result) {
  console.log(err, result);
});
```
### Verify Account Authority
```
golos.api.verifyAccountAuthority(nameOrId, signers, function(err, result) {
  console.log(err, result);
});
```

## Votes

### Get Active Votes
```
golos.api.getActiveVotes(author, permlink, function(err, result) {
  console.log(err, result);
});
```
### Get Account Votes
```
golos.api.getAccountVotes(voter, function(err, result) {
  console.log(err, result);
});
```

## Content


### Get Content
```
golos.api.getContent(author, permlink, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
/**
 * getContent() receiving a post
 * @param {String} author - author of the post
 * @param {String} permlink - url-address of the post
*/
var author = 'epexa';
var permlink = 'test-url';
golos.api.getContent(author, permlink, function(err, result) {
  //console.log(err, result);
  if (!err) {
    console.log('getContent', result.title);
  }
  else console.error(err);
});
```
### Get Content Replies
```
golos.api.getContentReplies(parent, parentPermlink, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
/**
 * getContentReplies() receiving a comments
 * @param {String} parent - author of the post
 * @param {String} parentPermlink - url-address of the post
*/
var parent = 'epexa';
var parentPermlink = 'test-url';
golos.api.getContentReplies(parent, parentPermlink, function(err, result) {
  //console.log(err, result);
  if (!err) {
    result.forEach(function(item) {
      console.log('getContentReplies', item.body);
    });
  }
  else console.error(err);
});
```
### Get Discussions By Author Before Date
```
golos.api.getDiscussionsByAuthorBeforeDate(author, startPermlink, beforeDate, limit, function(err, result) {
  console.log(err, result);
});
```
### Get Replies By Last Update
```
golos.api.getRepliesByLastUpdate(startAuthor, startPermlink, limit, function(err, result) {
  console.log(err, result);
});
```

## Witnesses


### Get Witnesses
```
golos.api.getWitnesses(witnessIds, function(err, result) {
  console.log(err, result);
});
```
### Get Witness By Account
```
golos.api.getWitnessByAccount(accountName, function(err, result) {
  console.log(err, result);
});
```
### Get Witnesses By Vote
```
golos.api.getWitnessesByVote(from, limit, function(err, result) {
  console.log(err, result);
});
```
### Lookup Witness Accounts
```
golos.api.lookupWitnessAccounts(lowerBoundName, limit, function(err, result) {
  console.log(err, result);
});
```
### Get Active Witnesses
```
golos.api.getActiveWitnesses(function(err, result) {
  console.log(err, result);
});
```

## Login API

### Login

/!\ It's **not safe** to use this method with your username and password. This method always return `true` and is only used in intern with empty values to enable broadcast.

```
golos.api.login('', '', function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
/**
 * login() authorization
 * @param {String} username - user username
 * @param {String} password - user password
*/
var username = 'epexa';
var password = 'qwerty12345';
golos.api.login(username, password, function(err, result) {
  //console.log(err, result);
  if (!err) {
    console.log('login', result);
  }
  else console.error(err);
});
```

### Get Api By Name
```
golos.api.getApiByName(apiName, function(err, result) {
  console.log(err, result);
});
```

## Follow API

### Get Followers
```
golos.api.getFollowers(following, startFollower, followType, limit, function(err, result) {
  console.log(err, result);
});
```
#### Example
```js
/**
 * getFollowers() returns subscribers
 * @param {String} following - username whom return subscribers
 * @param {String} startFollower - position from which item to return result
 * @param {String} followType - subscription type, value: 'blog' or null
 * @param {Integer} limit - how many records to return, the maximum value: 100
*/
var following = 'epexa';
var startFollower = '';
var followType = null;
var limit = 100;
golos.api.getFollowers(following, startFollower, followType, limit, function(err, result) {
  //console.log(err, result);
  if ( ! err) {
    result.forEach(function(item) {
      console.log('getFollowers', item);
    });
  }
  else console.error(err);
});
```
### Get Following
```
golos.api.getFollowing(follower, startFollowing, followType, limit, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
/**
 * getFollowing() returns subscriptions
 * @param {String} follower - username subscriber
 * @param {String} startFollower - position from which item to return result
 * @param {String} followType - subscription type, value: 'blog' или null
 * @param {Integer} limit - how many records to return, the maximum value: 100
*/
var follower = 'epexa';
var startFollower = '';
var followType = null;
var limit = 100;
golos.api.getFollowing(follower, startFollower, followType, limit, function(err, result) {
  //console.log(err, result);
  if ( ! err) {
    result.forEach(function(item) {
      console.log('getFollowing', item);
    });
  }
  else console.error(err);
});
```
### Get Follow Count
```
golos.api.getFollowCount(account, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
/**
 * getFollowCount() returns count of subscribers and subscriptions
 * @param {String} account - username of the user to return data
*/
var account = 'epexa';
golos.api.getFollowCount(account, function(err, result) {
  console.log(err, result);
  if (!err) {
    console.log('getFollowCount', result);
  }
  else console.error(err);
});
```
## Worker API

### Get Worker Requests
```
// query: limit, start_author, start_permlink, select_authors, select_states
// sort: by_created, by_net_rshares, by_upvotes, by_downvotes
// state: created, payment, payment_complete, closed_by_author, closed_by_expiration, closed_by_voters
golos.api.getWorkerRequests(query, sort, fillPosts, function(err, result) {
  console.log(err, result);
});
```
### Get Worker Request Votes
```
golos.api.getWorkerRequestVotes(author, permlink, startVoter, limit, function(err, result) {
  console.log(err, result);
});
```

## Market

### Get Ticker
```js
/**
 * getTicker() receive statistic values of the internal GBG:GOLOS market for the last 24 hours
 * Market pair is optional. If omitted - will be equal to ["GOLOS", "GBG"].
*/
golos.api.getTicker(["GOLOS", "GBG"], function(err, result) {
  console.log(err, result);
});
```
### Get Order Book
```js
/**
 * Market pair is optional. If omitted - will be equal to ["GOLOS", "GBG"].
*/
golos.api.getOrderBook(limit, ["GOLOS", "GBG"], function(err, result) {
  console.log(err, result);
});
```
### Get Open Orders
```js
/**
 * Market pair is optional. If omitted - will be equal to ["GOLOS", "GBG"].
*/
golos.api.getOpenOrders(owner, ["GOLOS", "GBG"], function(err, result) {
  console.log(err, result);
});
```

### Limit Order Create
```
golos.broadcast.limitOrderCreate(wif, owner, orderid, amountToSell, minToReceive, fillOrKill, expiration, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
let wif = '5JVFFWRLwz6JoP9kguuRFfytToGU6cLgBVTL9t6NB3D3BQLbUBS'; // active private key

let orderid = Math.floor(Date.now() / 1000); // it is golos-ui way and it is preferred

let expiration = new Date();
expiration.setHours(expiration.getHours() + 1);
expiration = expiration.toISOString().substr(0, 19); // i.e. 2020-09-07T11:33:00

golos.broadcast.limitOrderCreate(wif, 'cyberfounder', orderid, '1000.000000 AAA', '1000.000 BBB', false, expiration, function(err, res) {
  if (err) {
    console.log(err);
    alert(err);
    return;
  }
  alert('order created');
});
```
Hint: to detect what order is filled you can:  
a) create order with fillOrKill = true, which will fail order creation if not filled instantly,  
b) or use callbacks to wait until order is filled,  
c) or repeative call `getAccountHistory` to wait until order is filled: 
```js
// 1st argument is owner of one of two orders in pair
golos.api.getAccountHistory('cyberfounder', -1, 1000, {select_ops: [ 'fill_order']}, function(err, result) {
  // repeat call if still not filled
});
```
### Limit Order Cancel
```
golos.broadcast.limitOrderCancel(wif, owner, orderid, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
let wif = '5JVFFWRLwz6JoP9kguuRFfytToGU6cLgBVTL9t6NB3D3BQLbUBS'; // active private key

golos.broadcast.limitOrderCancel(wif, 'cyberfounder', orderid, function(err, res) {
  if (err) {
    console.log(err);
    alert(err);
    return;
  }
  alert('order canceled');
});
```
### Fill Order
```
golos.broadcast.fillOrder(wif, currentOwner, currentOrderid, currentPays, openOwner, openOrderid, openPays, function(err, result) {
  console.log(err, result);
});
```

## UIA Examples

### Asset Create
```
  golos.broadcast.assetCreate(
    '5JVFFWRLwz6JoP9kguuRFfytToGU6cLgBVTL9t6NB3D3BQLbUBS',
    'cyberfounder', '1000.000 SUPER', true, true, "{\"image_url\":\"https://market.rudex.org/asset-symbols/rudex.golos.png\",\"description\":\"https://golos.id/\"}",
    [], function(err, result) {
  console.log(err, result);
});
```
### Asset Update
```
  golos.broadcast.assetUpdate(
    '5JVFFWRLwz6JoP9kguuRFfytToGU6cLgBVTL9t6NB3D3BQLbUBS',
    'cyberfounder', 'SUPER', ['GOLOS'], 10000, "{\"image_url\":\"https://market.rudex.org/asset-symbols/rudex.golos.png\",\"description\":\"http://golos.id/\"}",
    [], function(err, result) {
  console.log(err, result);
});
```
### Asset Issue
```
  golos.broadcast.assetIssue(
    '5JVFFWRLwz6JoP9kguuRFfytToGU6cLgBVTL9t6NB3D3BQLbUBS',
    'cyberfounder', '1000.000 SUPER', '',
    [], function(err, result) {
  console.log(err, result);
});
```
### Override Transfer
```
  golos.broadcast.overrideTransfer(
    '5JVFFWRLwz6JoP9kguuRFfytToGU6cLgBVTL9t6NB3D3BQLbUBS',
    'cyberfounder', 'test', 'test2', '1.000 SUPER', 'Hello world!',
    [], function(err, result) {
  console.log(err, result);
});
```
### Asset Transfer
```
  golos.broadcast.assetTransfer(
    '5JVFFWRLwz6JoP9kguuRFfytToGU6cLgBVTL9t6NB3D3BQLbUBS',
    'cyberfounder', 'SUPER', 'test',
    [], function(err, result) {
  console.log(err, result);
});
```

## Broadcast API

### Broadcast Transaction
```
golos.api.broadcastTransaction(trx, function(err, result) {
  console.log(err, result);
});
```
### Broadcast Transaction Synchronous
```
golos.api.broadcastTransactionSynchronous(trx, function(err, result) {
  console.log(err, result);
});
```
### Broadcast Block
```
golos.api.broadcastBlock(b, function(err, result) {
  console.log(err, result);
});
```
### Broadcast Transaction With Callback
```
golos.api.broadcastTransactionWithCallback(confirmationCallback, trx, function(err, result) {
  console.log(err, result);
});
```
# Broadcast

### Account Create
```
golos.broadcast.accountCreate(wif, fee, creator, newAccountName, owner, active, posting, memoKey, jsonMetadata, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
/**
 * accountCreate() new account registration
 * @param {Base58} wif - private active key
 * @param {String} fee - the cost of creating an account. It will be listed by virtue of the voice of the new account
 * @param {String} creator - name of user who registers an account
 * @param {String} newAccountName - new account username
 * @param {Object} owner - object containing a new owner key
 * @param {Object} active - object containing a active key
 * @param {Object} posting - object containing a posting key
 * @param {String} memoKey - new memo key
 * @param {String} jsonMetadata - additional data for a new account (avatar, location, etc.)
*/
var wif = '5K...';
var fee = '90.000 GOLOS';
var creator = 'epexa';
var newAccountName = name;
var owner = {
  weight_threshold: 1,
  account_auths: [],
  key_auths: [[newKeys.owner, 1]]
};
var active = {
  weight_threshold: 1,
  account_auths: [],
  key_auths: [[newKeys.active, 1]]
};
var posting = {
  weight_threshold: 1,
  account_auths: [],
  key_auths: [[newKeys.posting, 1]]
};
var memoKey = newKeys.memo;
var jsonMetadata = '{}';
golos.broadcast.accountCreate(wif, fee, creator, newAccountName, owner, active, posting, memoKey, jsonMetadata, function(err, result) {
  //console.log(err, result);
  if (!err) {
    console.log('accountCreate', result);
  }
  else console.error(err);
});
```
### Account Create With Delegation
```
golos.broadcast.accountCreateWithDelegation(wif, fee, delegation, creator, newAccountName, owner, active, posting, memoKey, jsonMetadata, extensions, function(err, result) {
  console.log(err, result);
});
```
### Delegate Vesting Shares
```
golos.broadcast.delegateVestingShares(wif, delegator, delegatee, vesting_shares, function(err, result) {
  console.log(err, result);
});
```
### Account Update
```
golos.broadcast.accountUpdate(wif, account, owner, active, posting, memoKey, jsonMetadata, function(err, result) {
  console.log(err, result);
});
```
### Account Witness Proxy
```
golos.broadcast.accountWitnessProxy(wif, account, proxy, function(err, result) {
  console.log(err, result);
});
```
### Account Witness Vote
```
golos.broadcast.accountWitnessVote(wif, account, witness, approve, function(err, result) {
  console.log(err, result);
});
```
### Challenge Authority
```
golos.broadcast.challengeAuthority(wif, challenger, challenged, requireOwner, function(err, result) {
  console.log(err, result);
});
```
### Change Recovery Account
```
golos.broadcast.changeRecoveryAccount(wif, accountToRecover, newRecoveryAccount, extensions, function(err, result) {
  console.log(err, result);
});
```
### Comment
```
golos.broadcast.comment(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, function(err, result) {
  console.log(err, result);
});
```
#### Example add a post:
```js
/**
 * comment() add a post
 * @param {Base58} wif - private posting key
 * @param {String} parentAuthor - for add a post, empty field
 * @param {String} parentPermlink - main tag
 * @param {String} author - author of the post
 * @param {String} permlink - url-address of the post
 * @param {String} title - header of the post
 * @param {String} body - text of the post
 * @param {String} jsonMetadata - meta-data of the post (images etc.)
*/
var wif = '5K...';
var parentAuthor = '';
var parentPermlink = 'dev';
var author = 'epexa';
var permlink = 'test-url';
var title = 'test';
var body = 'test2';
var jsonMetadata = '{}';
golos.broadcast.comment(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, function(err, result) {
  //console.log(err, result);
  if (!err) {
    console.log('comment', result);
  }
  else console.error(err);
});
```
#### Example add a comment:
```js
/**
 * comment() add a comment
 * @param {Base58} wif - private posting key
 * @param {String} parentAuthor - for add a comment, author of the post
 * @param {String} parentPermlink - for add a comment, url-address of the post
 * @param {String} author - author of the comment
 * @param {String} permlink - unique url-address of the comment
 * @param {String} title - for create a comment, empty field
 * @param {String} body - text of the comment
 * @param {String} jsonMetadata - meta-data of the post (images etc.)
*/
var wif = '5K...';
var parentAuthor = 'epexa';
var parentPermlink = 'test-url';
var author = 'epexa';
var permlink = 're-' + parentAuthor + '-' + parentPermlink + '-' + Date.now(); // re-epexa-test-url-1517333064308
var title = '';
var body = 'hi!';
var jsonMetadata = '{}';
golos.broadcast.comment(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, function(err, result) {
  //console.log(err, result);
  if (!err) {
    console.log('comment', result);
  }
  else console.error(err);
});
```
### Comment Options
```
golos.broadcast.commentOptions(wif, author, permlink, maxAcceptedPayout, percentGolosDollars, allowVotes, allowCurationRewards, extensions, function(err, result) {
  console.log(err, result);
});
```
### Comment Reward
```
golos.broadcast.commentReward(wif, author, permlink, sbdPayout, vestingPayout, function(err, result) {
  console.log(err, result);
});
```
### Convert
```
golos.broadcast.convert(wif, owner, requestid, amount, function(err, result) {
  console.log(err, result);
});
```
### Custom
```
golos.broadcast.custom(wif, requiredAuths, id, data, function(err, result) {
  console.log(err, result);
});
```
### Custom Binary
```
golos.broadcast.customBinary(wif, id, data, function(err, result) {
  console.log(err, result);
});
```
### Custom Json
```
golos.broadcast.customJson(wif, requiredAuths, requiredPostingAuths, id, json, function(err, result) {
  console.log(err, result);
});
```
### Delete Comment
```
golos.broadcast.deleteComment(wif, author, permlink, function(err, result) {
  console.log(err, result);
});
```
### Escrow Dispute
```
golos.broadcast.escrowDispute(wif, from, to, agent, who, escrowId, function(err, result) {
  console.log(err, result);
});
```
### Escrow Release
```
golos.broadcast.escrowRelease(wif, from, to, agent, who, receiver, escrowId, sbdAmount, golosAmount, function(err, result) {
  console.log(err, result);
});
```
### Escrow Transfer
```
golos.broadcast.escrowTransfer(wif, from, to, agent, escrowId, sbdAmount, golosAmount, fee, ratificationDeadline, escrowExpiration, jsonMeta, function(err, result) {
  console.log(err, result);
});
```
### Escrow Approve
```
golos.broadcast.escrowApprove(wif, from, to, agent, who, escrowId, approve, function(err, result) {
  console.log(err, result);
});
```
### Feed Publish
```
golos.broadcast.feedPublish(wif, publisher, exchangeRate, function(err, result) {
  console.log(err, result);
});
```
### Fill Convert Request
```
golos.broadcast.fillConvertRequest(wif, owner, requestid, amountIn, amountOut, function(err, result) {
  console.log(err, result);
});
```
### Fill Vesting Withdraw
```
golos.broadcast.fillVestingWithdraw(wif, fromAccount, toAccount, withdrawn, deposited, function(err, result) {
  console.log(err, result);
});
```
### Interest
```
golos.broadcast.interest(wif, owner, interest, function(err, result) {
  console.log(err, result);
});
```
### Prove Authority
```
golos.broadcast.proveAuthority(wif, challenged, requireOwner, function(err, result) {
  console.log(err, result);
});
```
### Recover Account
```
golos.broadcast.recoverAccount(wif, accountToRecover, newOwnerAuthority, recentOwnerAuthority, extensions, function(err, result) {
  console.log(err, result);
});
```
### Request Account Recovery
```
golos.broadcast.requestAccountRecovery(wif, recoveryAccount, accountToRecover, newOwnerAuthority, extensions, function(err, result) {
  console.log(err, result);
});
```
### Set Withdraw Vesting Route
```
golos.broadcast.setWithdrawVestingRoute(wif, fromAccount, toAccount, percent, autoVest, function(err, result) {
  console.log(err, result);
});
```
### Transfer
```
golos.broadcast.transfer(wif, from, to, amount, memo, function(err, result) {
  console.log(err, result);
});
```
#### Example:
```js
/**
 * transfer() transfer golos or golos gold
 * @param {Base58} wif - private owner key
 * @param {String} from - username who send, whose owner key
 * @param {String} to - username who get
 * @param {String} amount - number of coins in the format: 0.001 GOLOS
 * @param {String} memo - a comment
*/
var wif = '5J...';
var from = 'epexa';
var to = 'melnikaite';
var amount = '0.001 GOLOS';
var memo = 'gift';
golos.broadcast.transfer(wif, from, to, amount, memo, function(err, result) {
  //console.log(err, result);
  if (!err) {
    console.log('transfer', result);
  }
  else console.error(err);
});
```
### Transfer To Vesting
```
golos.broadcast.transferToVesting(wif, from, to, amount, function(err, result) {
  console.log(err, result);
});
```
### Vote
```
golos.broadcast.vote(wif, voter, author, permlink, weight, function(err, result) {
  console.log(err, result);
});
```
### Withdraw Vesting
```
golos.broadcast.withdrawVesting(wif, account, vestingShares, function(err, result) {
  console.log(err, result);
});
```
### Witness Update
```
golos.broadcast.witnessUpdate(wif, owner, url, blockSigningKey, props, fee, function(err, result) {
  console.log(err, result);
});
```
### Fill Transfer From Savings
```
golos.broadcast.fillTransferFromSavings(wif, from, to, amount, requestId, memo, function(err, result) {
  console.log(err, result);
});
```
### Transfer To Savings
```
golos.broadcast.transferToSavings(wif, from, to, amount, memo, function(err, result) {
  console.log(err, result);
});
```
### Transfer From Savings
```
golos.broadcast.transferFromSavings(wif, from, requestId, to, amount, memo, function(err, result) {
  console.log(err, result);
});
```
### Cancel Transfer From Savings
```
golos.broadcast.cancelTransferFromSavings(wif, from, requestId, function(err, result) {
  console.log(err, result);
});
```
### Transfer To Tip
```
  golos.broadcast.transferToTip(
    '5JVFFWRLwz6JoP9kguuRFfytToGU6cLgBVTL9t6NB3D3BQLbUBS',
    'cyberfounder', '', '1.000 SUPER', 'Hello world!',
    [], function(err, result) {
  console.log(err, result);
});
```
### Donate
```
golos.broadcast.donate(wif, 'alice', 'bob', '1.000 GOLOS', {app: 'golos-blog', version: 1, comment: 'Hello', target: {author: 'bob', permlink: 'test'}}, [], function(err, result) {
  console.log(err, result);
});
```
### Invite
```
  golos.broadcast.invite(
    '5JVFFWRLwz6JoP9kguuRFfytToGU6cLgBVTL9t6NB3D3BQLbUBS',
    'cyberfounder', '11.000 SUPER', 'GLS7Pbawjjr71ybgT6L2yni3B3LXYiJqEGnuFSq1MV9cjnV24dMG3',
    [], function(err, result) {
  console.log(err, result);
});
```
### Invite Claim
```
  golos.broadcast.inviteClaim(
    '5JVFFWRLwz6JoP9kguuRFfytToGU6cLgBVTL9t6NB3D3BQLbUBS',
    'cyberfounder', 'cyberfounder', '5JFZC7AtEe1wF2ce6vPAUxDeevzYkPgmtR14z9ZVgvCCtrFAaLw',
    [], function(err, result) {
  console.log(err, result);
});
```

# Auth

### Verify
```
golos.auth.verify(name, password, auths);
```
#### Example:
```js
var username = 'epexa';
var password = 'P5...';  // master password
// object in which the key type public key (active, memo, owner, posting), and the value of the array in the array itself is the public key
var auths = {
  posting: [['GLS6...']]
};
var verifyResult = golos.auth.verify(username, password, auths);
console.log('verify', verifyResult);
```

### Generate Keys
```
golos.auth.generateKeys(name, password, roles);
```
#### Example:
```js
/**
 * generateKeys() generating new keys for a new account
 * @param {String} name - new account username
 * @param {String} password - master-password for a new account
*/
var name = 'epexa4';
var password = 'qwerty12345';
var newKeys = golos.auth.generateKeys(name, password, ['owner', 'active', 'posting', 'memo']);
console.log('newKeys', newKeys);
```

### Get Private Keys
```
golos.auth.getPrivateKeys(name, password, roles);
```
#### Example:
```js
var username = 'epexa';
var password = 'P5H...'; // master password
var roles = ['owner', 'active', 'posting', 'memo']; // optional parameter, if not specify, then all keys will return
var keys = golos.auth.getPrivateKeys(username, password, roles);
console.log('getPrivateKeys', keys);
```

### Is Wif
```
golos.auth.isWif(privWif);
```
#### Example:
```js
var privWif = '5J...';
var resultIsWif = golos.auth.isWif(privWif);
console.log('isWif', resultIsWif);
```

### Login Form Validation
```
golos.auth.login(name, privWifOrPassword, callback);
```
Recommended for usage in login forms in dApps on Golos Blockchain.
Obtains specified account (using `getAccounts` API), compares each of account keys with specified string, and returns object with WIFs (private keys) which this string provides and which should be used to authorize operations. Object has fields: `active`, `posting`, `owner`, and `memo`. Each field is `true` if string provides this role, or `false` otherwise. Also, it has field `password`. If provided string is a password (not key) and this password provides `posting` role, field `password` has password's value.
#### Example:
```js
var name = 'alice';
var privWifOrPassword = '5J...'; // or 'P5J...'
golos.auth.login(name, privWifOrPassword, function(err, response) {
  console.log(response); // Object { owner: '5J...', active: null, posting: '5J...', memo: '5J...' }
  if (response.active && !response.password) {
    console.log('Login failed! It is not recommended to authorize users with active key (or key which can be used as active), except case if it is also the password!');
    return;
  }
  if (!response.posting) {
    console.log('Login failed! Incorrect password');
    return;
  }
  console.log('Login OK! To authorize most of operations, use following WIF: ' + response.posting)
});
```

### To Wif
```
golos.auth.toWif(name, password, role);
```
#### Example:
```js
var username = 'epexa';
var password = 'P5H...'; // master password
var role = 'posting'; // private key type, one of owner, active, posting, memo
var privateKey = golos.auth.toWif(username, password, role);
console.log('toWif', privateKey);
```

### Wif Is Valid
```
golos.auth.wifIsValid(privWif, pubWif);
```
#### Example:
```js
var privWif = '5J...'; // private key
var pubWif = 'GLS6...'; // public key
var resultWifIsValid = golos.auth.wifIsValid(privWif, pubWif);
console.log('wifIsValid', resultWifIsValid);
```

### Wif To Public
```
golos.auth.wifToPublic(privWif);
```
#### Example:
```js
var privWif = '5J...'; // private key
var resultWifToPublic = golos.auth.wifToPublic(privWif, pubWif);
console.log('wifToPublic', resultWifToPublic);
```

### Sign Transaction
```
golos.auth.signTransaction(trx, keys);
```

# Private Messages

Golos Blockchain provides instant messages subsystem, which allows users communicate with encrypted private messages. Messages are encrypting on client-side (using sender's private memo key and recipient's public memo key), sending to blockchain via `private_message_operation`, and next can be obtained from DB with `private_message` API, and decrypted on client-side (using private memo key of from/to and public memo key of another user).

### Encrypt and send

Messages are JSON objects. If you want they showing in Golos Messenger (in blogs, forums), you should use JSON objects with `body` field which containing string with text of message, and also, with `app` and `version` fields which are describing your client app. Also, you can add any custom fields. But if you using only `body`, we recommend you set `app` as `'golos-messenger'` and `version` as `1`.

To create a message, you should use the `golos.messages.newTextMsg` function.

Message should correspond to the following rules:
- `app` field should be a string with length from 1 to 16;
- `version` field should be an integer, beginning from 1;
- `body` should be a string.

Next, message object should be JSON-stringified, enciphered (uses SHA-512 with nonce, which is a UNIX timestamp-based unique identifier, and AES), and converted to HEX string (`encrypted_message`). You can do it easy with `golos.messages.encode` function.

Full example:

```js
let data = golos.messages.encode('alice private memo key', 'bob public memo key', golos.messages.newTextMsg('Hello world', 'golos-messenger', 1));

const json = JSON.stringify(['private_message', {
    from: 'alice',
    to: 'bob',
    nonce: data.nonce,
    from_memo_key: 'alice PUBLIC memo key',
    to_memo_key: 'bob public memo key',
    checksum: data.checksum,
    update: false,
    encrypted_message: data.encrypted_message,
}]);
golos.broadcast.customJson('alice private posting key', [], ['alice'], 'private_message', json, (err, result) => {
    alert(err);
    alert(JSON.stringify(result));
});
```

### Edit message

Messages are identifying by from+to+nonce, so when you updating message, you should encode it with same nonce as in its previous version.

```js
data = golos.messages.encode('alice private memo key', 'bob public memo key', golos.messages.newTextMsg('Goodbye world', 'golos-messenger', 1), data.nonce);
```

Next, this data should be sent with `private_message` operation, same as in previous case, but with `update` = `true`.

### Image messages

Image messages, same as text messages, are JSON objects. Besides `app` and `version` fields, these messages should contain following fields:
- `body` field, which should be a string, containing an Internet URL of the image (its full version);
- `type` field, which should be equal to `'image'`. It identifies the message as an image message;
- `previewWidth` and `previewHeight` fields, which are the integers, computed by fitting an image to the preview area (600x300px). (See this algorithm in `fitImageToSize` function in the source code of this repository).

You should create image messages with `golos.messages.newImageMsgAsync` and `golos.messages.newImageMsg` functions. (These functions return an image message with computed `previewWidth` and `previewHeight`).

**Warning:** Golos Blockchain willn't download this image and store its content. It will just store the URL. Thefore, you should provide an URL of image, storing in some reliable image hosting, which will never delete this message.

**Also, it is strongly recommended to use the `https://`**. Some clients (incl. our official ones) may not support the `http://` in the Content Security Policy, they willn't show such images.

Full example (asynchronous, should run in `async function`):

```js
let msg;
try {
    msg = await golos.messages.newImageMsgAsync('https://site.com/https-is-recommended.jpg', (progress, extra_data) => {
        console.log('Progress: %i%', progress);
        // also, if error occured, you can get error in extra_data.error
    }, 'golos-messenger', 1);
} catch (err) {
    alert(err);
    console.error(err);
}
if (msg) {
    let data = golos.messages.encode('alice private memo key', 'bob public memo key', msg);
    // ...and send it same as a text message
}
```

Full example #2 (synchronous):

```js
golos.messages.newImageMsg('https://site.com/https-is-recommended.jpg', (err, msg) => {
        if (err) {
            alert(err);
            console.error(err);
        } else {
            let data = golos.messages.encode('alice private memo key', 'bob public memo key', msg);
            // ...and send it same as a text message
        }
    }, (progress, extra_data) => {
        console.log('Progress: %i%', progress);
        // also, if error occured, you can get error in extra_data.error
    }, 'golos-messenger', 1);
```

### Obtain and decrypt

Message can be obtained with `golos.api.getThread`, each message is object with `from_memo_key`, `to_memo_key`, `nonce`, `checksum`, `encrypted_message` and another fields. Next, message can be decrypted with `golos.messages.decode` which supports batch processing (can decrypt few messages at once) and provides good performance.

```js
golos.api.getThread('alice', 'bob', {}, (err, results) => {
    results = golos.messages.decode('alice private key', 'bob public memo key', results);
    alert(results[0].message.body);
});
```

**Note:** it also validates messages to correspond to the following rules:
- message should be a correct JSON object, with fields conforming to the next rules;
- `app` field should be a string with length from 1 to 16;
- `version` field should be an integer, beginning from 1;
- `body` should be a string;
- for image messages: `previewWidth` and `previewHeight` should be the integers, which are result of fitting an image to 600x300 px area. 

**Note:** if message cannot be decoded, parsed as JSON and/or validated, it still adding to result, but has `message: null` (if cannot be parsed as JSON, or validated), and `raw_message: null` (if cannot be decoded at all). Such behaviour allows client to mark this message as read, but not display it to user. If you want to change this behaviour, you can use `on_error` parameter in `golos.messages.decode` (see the source code for more details).

### Mark Messages Read & Delete Messages

Blockchain provides `private_mark_message` operation for marking messages as read, and `private_delete_message` to delete them.
Each of these operations can be used by one of two cases:
- to process 1 message: set `nonce` to message nonce,
- to process range of few messages: set `start_date` to (1st message's create_date minus 1 sec), and `stop-date` to last message's create_date.
Also, you can process multiple ranges of messages by combining few operations in single transaction.

**Note: you should not use case with `nonce` if processing 2 or more sequential messages.**

To make ranges, you can use `golos.messages.makeDatedGroups`, which builds such ranges by a condition, and can wrap them into real operations in-place.

It accepts decoded messages from `golos.messages.decode`.

**Note: function should iterate messages from end to start.**

```js
let operations = golos.messages.makeDatedGroups(messages, (message_object, idx) => {
    return message_object.read_date.startsWith('19') && message_object.from !== 'bob'; // unread and not by bob
}, (group) => {
    const json = JSON.stringify(['private_mark_message', { // or 'private_delete_message'
        from: 'alice',
        to: 'bob',
        //requester: 'bob', // add it for delete case
        ...group,
    }]);
    return ['custom_json',
        {
            id: 'private_message',
            required_posting_auths: ['bob'],
            json,
        }
    ];
}, 0, messages.length); // specify right direction of iterating

golos.broadcast.send({
        operations,
        extensions: []
    }, ['bob private posting key'], (err, result) => {
    alert(err);
    alert(JSON.stringify(result));
});
```

### Replying

Starting from 0.8.3, library supports replying to messages. For user, it works as following:
- alice sends some message to bob;
- bob clicks this message, then clicks "Reply", and writes some reply message;
- messenger UI should display the quote of alice message on top of the bob message.

**Note:** also, alice can reply bob message, which already contains his reply to her message. In this case, quotes should not be nested (we are not supporting it), alice just quotes body of bob message, without re-quoting her first message quote.

You can reply messages of any type (text, image and any other), and your reply can be a message of any type, too.

As a regular message, reply message is a JSON object, which has `app`, `version`, `body` and etc. But it also contains `quote` field. `quote` field is an object, and should contain the following fields:
- `from` field is a nickname of "alice" (who wrote original message);
- `nonce` field is a nonce of original message;
- `type` field is a type of original message (for image message it should be `"image"`, and for text message it should be omitted);
- `body` is a **truncated** text of original message. If it is image message, `body` should have length <= 2000. In any another case, it is <= 200. If it is image message and its URL is too long, `type` should be omitted, and `body` should be truncated to 200.

This library provides `golos.messages.makeQuoteMsg` function, which can (and should) be used to easily construct reply messages, conforming to rules above. This function automatically truncates messages, so it works with any **valid** messages from `golos.messages.decode`.

It can be used by 2 different approaches. You can choose any of them, which is more convenient for your architecture.

#### Approach #1: Construct your message, and add a quote to it

```js
let msgOriginal = messages[0]; // messages is result returned from `golos.messages.decode`, with `from`, `nonce` and `message` field. It should be a valid (!) message object, otherwise makeQuoteMsg will throw

let msg = golos.messages.newTextMsg('Bob!'); // let! not const, because makeQuoteMsg changes it
golos.messages.makeQuoteMsg(msg, msgOriginal);
// now encode msg as usually, and send it
```

#### Approach #2: Pre-construct quote, and then construct your message with quote

```js
let msgOriginal = messages[0];
let quote = golos.messages.makeQuoteMsg({}, msgOriginal);
...
let msg = golos.messages.newTextMsg('Bob!'); // let! not const, because we will add quote here
msg = {...msg, ...quote}; // add quote to message
// now encode msg as usually, and send it
```

#### Obtaining messages with quotes

`golos.messages.decode` supports messages with quotes. Each such message has `quote` field in its `message` field. But, if `quote` of message is wrong (message composed with some wrong UI, which don't uses `makeQuoteMsg`, and composes quotes wrong), **the whole message object will be invalid**, and `message` field will be `null`.


#### Editing messages with quotes

To edit a message with quote, you should re-construct it with `newTextMsg`/`newImageMsg`/..., add the `quote` field (just get it from existing decoded message, not re-construct), and encode+send it as usually (see "Edit message" chapter).

# Formatter

### Create Suggested Password
```
var password = golos.formatter.createSuggestedPassword();
console.log(password);
// => 'GAz3GYFvvQvgm7t2fQmwMDuXEzDqTzn9'
```

### Comment Permlink
```
var parentAuthor = 'ned';
var parentPermlink = 'a-selfie';
var commentPermlink = golos.formatter.commentPermlink(parentAuthor, parentPermlink);
console.log(commentPermlink);
// => 're-ned-a-selfie-20170621t080403765z'
```

### Estimate Account Value
```
var golosPower = golos.formatter.estimateAccountValue(account);
```

### Reputation
```
var reputation = golos.formatter.reputation(3512485230915);
console.log(reputation);
// => 56
```

### Vest To Golos
```
var golosPower = golos.formatter.vestToGolos(vestingShares, totalVestingShares, totalVestingFundGolos);
console.log(golosPower);
```

# Utils

### Validate Username
```js
var nameRes = golos.utils.validateAccountName('test1234');
console.log(nameRes.error); // => 'null'
console.log(nameRes.msg); // => ''

var nameRes = golos.utils.validateAccountName('a1');
if (nameRes.error) {
  console.log(nameRes.error); // => 'account_name_should_be_longer'
  console.log(nameRes.msg); // => 'Account name should be longer.'
}
```
All possible errors:
```
{ error: "account_name_should_not_be_empty", msg: "Account name should not be empty." }
{ error: "account_name_should_be_longer", msg: "Account name should be longer." }
{ error: "account_name_should_be_shorter", msg: "Account name should be shorter." }
{ error: "each_account_segment_should_start_with_a_letter", msg: "Each account segment should start with a letter." }
{ error: "each_account_segment_should_have_only_letters_digits_or_dashes", msg: "Each account segment should have only letters, digits, or dashes." }
{ error: "each_account_segment_should_have_only_one_dash_in_a_row", msg: "Each account segment should have only one dash in a row." }
{ error: "each_account_segment_should_end_with_a_letter_or_digit", msg: "Each account segment should end with a letter or digit." }
{ error: "each_account_segment_should_be_longer", msg: "Each account segment should be longer" }
```

### Work With GOLOS Assets

There is `golos.utils.Asset` class which allows parsing asset strings, received from blockchain (g.e. '99.999 GOLOS'), as well as constructing such strings from data entered by user. Also, it supports arithmetic and Math.* operations on asset's amount.

```js
let asset = golos.utils.Asset('99.999 GOLOS');  // or golos.utils.Asset(99999, 3, 'GOLOS')
console.log(asset.amount); // => 99999
console.log(asset.amountFloat); // => 99.999
console.log(asset.precision); // => 3
console.log(asset.symbol); // => 'GOLOS'
console.log(asset.toString()); // => '99.999 GOLOS'
console.log(asset.toString(0)); // => '99 GOLOS'

// amount and amountFloat supports all arithmetic and Math.* operations
asset.amount += 1; // it will be '100.000 GOLOS'
asset.amountFloat -= 1; // it will be 99.000 GOLOS
```
