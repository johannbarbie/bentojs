# bento.js

Helper library for bentobox.

## Overview of the API

### Setup

```
import Bento from '@bentobox/bentojs';

const bento = new Bento(provider, 1);

await bento.scanEvents();

const lendingPair = bento.getPair(tokenA, tokenB); // '0x1234'
```

### exports

```
default - Bento
abi
```

### Bento Interface


```
scanEvents()
```

Scans for all LendingPair deployment events since BentoBox creation.

```
getPair(address: string, address: string) => address
```

Returns the LendingPair for 2 assets.

```
getMaster(address: string) => address
```

Returns the master contract address for any deployed contract.

