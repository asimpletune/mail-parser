import { appendFileSync } from 'fs'

// Append the necessary declarations... not sure how to get wasm-pack to do this but it's required if you want to import the *.wasm file
const patchContent = `
// This module declarations was added automatically by patch-declarations.js
declare module '*.wasm' {
  const url: string;
  export default url;
}

// This module declarations was added automatically by patch-declarations.js
declare module '@mail-parser/wasm-bindings/mail_parser_bg.wasm' {
  const url: string;
  export default url;
}
`

appendFileSync('mail_parser_bg.wasm.d.ts', patchContent)