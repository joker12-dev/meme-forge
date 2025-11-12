How to add token logos

- Place logo files into this folder (backend/uploads/logos).
- Name files using the token address in lowercase, e.g. `0xabc123...def.png` or `0xabc123...def.svg`.
- Frontend will first try the token's `logoURL` property (if present), then `/uploads/logos/{address}.png`, then `.svg`, then finally the default (`/uploads/logos/default.svg`).
- Supported formats: .png, .svg
- If you add new files while the server is running, static serving should pick them up immediately.
