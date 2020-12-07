# bento.js

Helper library for bentobox.

## Overview of the API

### Setup

```
import Bento, { getBentoAddress } from '@bentobox/bentojs'



const bento = new Bento({ provider, bentoAddress: getBentoAddress('3') })

bento.getTotalShare('0x1234') // 123400000000
```

### exports

```
default - Bento
abi
getBentoAddress
```

### Bento Interface

```
getTotalShare(assetAddress: String) => BN
```

Returns the total shares of the asset managed by Bentobox.