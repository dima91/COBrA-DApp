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