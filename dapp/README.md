# Useful commands

* **/solidity -> rm build/contracts/*.json && truffle compile**: compile contracts with truffle
* **/ -> redis-cli SET catAddr <address>**: set redis-server's 'catAddr' key to address of catalog
* **/contractsInjectors -> nodejs createCatalog.js**: create catalog instance
* **/ --> ganache-cli -l 10000000000000000 -g 2000 -e 1000**: starts ethereum test net
* **/ --> npm start --prefix dapp/ $(redis-cli GET catAddr)**: starts application




# Topic data model

## main -> render

**addresses** : giving all registered addresses for this the node
```json
{}
```
---
**newBalance** : contains new balance of user
```json
{"balance":"Number"}
```
---
**userInfo** : contains requested/updated informations of user
```json
{"status":"success/error",
 "reason":"reason of error",
 "balance":"ether",
 "isPremium":"bool"}
```







## render -> main

**quitDapp** : ...
```json
{}
```
---
**getAddresses** : request of addresses
```json
{}
```
---
**userInfo** : request of user informations
```json
{"address":"hex",
 "username":"string"}
```
---