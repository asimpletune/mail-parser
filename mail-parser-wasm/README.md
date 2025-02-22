# @mail-parser/wasm-bindings

This package provides wasm bindings for Stalwart Lab's excellent mail_parser. Currently it targets `web` and `node`.

*If you need to add a target, just add a build script for that target in this workspace's [package.json](./package.json), and update any of the conditional exports in the same package.json file. *

## How to Build/Install/Use

To build you can run `npm run build` from within [this workspace](./), *or* you can run `npm run build:wasm` from within the [parent project](../). Additionally, for local testing you can pack by running `npm run pack:wasm` from the parent project (note that `npm pack` within this workspace will not do the same).

To install you just `npm install @mail-parser/wasm-bindings`. If you're testing locally then you can copy the tar file that's packages from `npm run pack:wasm` to your project and then `npm install <tar-file>`, e.g. (from within your project) `npm install mail-parser-wasm-bindings-0.9.1.tgz`.

To use this code will depend on the environment that it's being used in.

For node environments, `parse_email` is loaded synchronously and ready to go before any of the other code:

```ts
import { parse_email } from '@mail-parser/wasm-bindings'
// ... your code ...
parse_email(email_bytes)
// ... or if you're parsing a string ...
parse_email(new TextEncoder().encode(email_as_a_string))
```

For web environments where internal dependencies can be fetch via a URL (e.g. the browser)

```ts
import init, { initSync, parse_email } from '@mail-parser/wasm-bindings'
await init()
// ... your code ...
parse_email(email_bytes)
// ... or if you're parsing a string ...
parse_email(new TextEncoder().encode(email_as_a_string))
/*
  You can also run init() asynchronously as a guard before using `parse_email`.
*/
init().then(_ => {
  // ... your code ...
  parse_email(email_bytes)
})
```

For web environments where internal dependencies can not be fetched via a URL (e.g. Cloudflare Workers) the compiled wasm has to be passed in to the initialization functions. You can use init or initSync.

```ts
import init, { initSync, parse_email } from '@mail-parser/wasm-bindings'
import wasmData from './node_modules/@mail-parser/wasm-bindings/dist/web/mail_parser_bg.wasm'
let initOutput = initSync({ module: wasmData }) // also `await init({ module_or_path: wasmData }) works`
console.debug(`Loaded mail-parser wasm bindings: ${JSON.stringify(initOuput)}`)
// ... your code ...
parse_email(email_bytes)
// ... or if you're parsing a string ...
parse_email(new TextEncoder().encode(email_as_a_string))
/*
  You can also run init() asynchronously as a guard before using `parse_email`.
  It will fail if the module wasn't initialized
*/
init().then(_ => {
  // ... your code ...
  parse_email(email_bytes)
})
```

Probably a good idea if you're using this library for anything important is to wrap access to `parse_email` function in some kind of universal loader that will guarantee it's initialized no matter what and will handle any of the details, like passing in the compiled wasm manually to the initialization function(s). For example:

```js
// wasm-init.ts:

import init, { initSync, parse_email as _parse_email } from 'mail-parser';
import wasmData from '../wasm-bindings_backup/dist/web/mail_parser_bg.wasm';

type ParseEmail = typeof _parse_email;

let initialized = false;
let parse_email: ParseEmail;

const initializeWasm = () => {
  if (!initialized) {
    try {
      initSync({ module: wasmData });
      parse_email = _parse_email;
    } catch {
      init({ module: wasmData }).then(() => {
        parse_email = _parse_email;
      });
    }
    initialized = true;
  }
};

// Queue initialization at module load time
initializeWasm();

// Safe export with initialization check
export const parseEmail = (input: Uint8Array) => {
  if (!parse_email) throw new Error('WASM module not initialized yet');
  return parse_email(input);
};
```

Then you can use the module anywhere like this:

```ts
import { parse_email } from './wasm-init';

// parse_email is guaranteed to be initialized
const result = parse_email(rawEmail);
```

This will work in sync preferred environments (like node and Cloudflare Workers), but also uses async as a fallback where non-blocking operations are preferred, like in the browser. However, the choice is up to the user to decide best how to initialize wasm for their needs, with just a brief explanation included here to help them make the best decision.