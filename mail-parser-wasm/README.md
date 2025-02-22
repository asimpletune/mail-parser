# @mail-parser/wasm-bindings

This package provides wasm bindings for Stalwart Lab's excellent mail_parser. Currently it targets `web` and `node`.

*If you need to add a target, just add a build script for that target in this workspace's [package.json](./package.json), and update any of the conditional exports in the same package.json file. *

## How to Build/Install/Use

To build you can run `npm run build` from within [this workspace](./), *or* you can run `npm run build:wasm` from within the [parent project](../). Additionally, for local testing you can pack by running `npm pack` from the mail-parser-wasm workspace (note that `npm pack -w mail-parser-wasm` will not do the same from the root workspace).

To install you just `npm install @mail-parser/wasm-bindings/{node,web}`. If you're testing locally then you can copy the tar file that's packaged from `npm pack` to your project and then `npm install <tar-file>`, e.g. (from within your project) `npm install mail-parser-wasm-bindings-0.9.1.tgz`.

To use this code will depend on the environment that it's being used in.

For node environments, `parse_email` is loaded synchronously and ready to go before any of the other code:

```ts
import { parse_email } from '@mail-parser/wasm-bindings/node'
// ... your code ...
parse_email(email_bytes)
// ... or if you're parsing a string ...
parse_email(new TextEncoder().encode(email_as_a_string))
```

For web environments where internal dependencies can be fetch via a URL (e.g. the browser)

```ts
import init, { initSync, parse_email } from '@mail-parser/wasm-bindings/web'
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
import init, { initSync, parse_email } from '@mail-parser/wasm-bindings/web'
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

Probably a good idea if you need to handle different environments is to wrap access to `parse_email` function in some kind of universal loader that will guarantee it's initialized no matter what and will handle any of the details, like passing in the compiled wasm manually to the initialization function(s). For example:

```ts
import init, { parse_email as parse_email_web } from '@mail-parser/wasm-bindings/web'
const wasmDataPromise = import('../node_modules/@mail-parser/wasm-bindings/dist/web/mail_parser_bg.wasm')
const parse_email_node = import('@mail-parser/wasm-bindings/node')
let parse_email = await wasmDataPromise.then(wasmData => init({ module_or_path: wasmData })).then(_ => parse_email_web).catch(_ => parse_email_node.then(module => module.parse_email))
```

Since `@mail-parser/wasm-bindings/node`'s `parse_email` is inherently sync you should load it dynamically to avoid causing an faults. The same goes for directly importing the compiled wasm. This way, you can import everything, start by first attempting the async, browser-friendly wasm module initialization, while falling back to the synchronous version, that's suitable for node.