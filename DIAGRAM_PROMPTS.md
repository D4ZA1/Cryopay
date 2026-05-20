# CryoPay / EcoVault — Diagram Generation Prompts

Use these prompts with any AI image generation tool (ChatGPT, Gemini, Midjourney, DALL-E, etc.) to generate architecture diagrams similar to the reference images.

---

## Prompt 1 — High Level Design (HLD) Flow Diagram

> Recreate the reference image style: light blue rounded rectangles on a white background, bold black labels, thin gray borders, arrows connecting boxes in a flow pattern. Professional, clean, presentation-ready.

```
Create a professional High-Level Design (HLD) flow diagram for a cryptocurrency + recycling incentive web app called CryoPay / EcoVault. Use light blue rounded rectangles with bold black text labels and thin gray borders on a white background, connected by black directional arrows. Arrange boxes in a 3-column, 3-row grid layout similar to a system flowchart.

Boxes and their subtitle text (place subtitle below the bold title in smaller regular font):
Row 1 (left to right):
1. "User Input" → subtitle: "Web browser / React 19"
2. "Authentication" → subtitle: "Email + MetaMask · TOTP MFA · JWT"
3. "Wallet & Keys" → subtitle: "ECDSA P-256 · AES-GCM · PBKDF2"

Row 2 (right to left, arrows going left):
4. "Smart Contract Bridge" → subtitle: "viem writeContract · Solidity 0.8.28"
5. "Database Storage" → subtitle: "Cloudflare D1 · SQLite · 10 Tables"
6. "Transaction Layer" → subtitle: "Validate · Prepare · Record"

Row 3 (left to right):
7. "Ethereum Contract" → subtitle: "Sepolia Testnet · TransactionRecorder.sol"
8. "Confirmation & Proof" → subtitle: "History · Etherscan · Receipts"

Also add a separate box below Row 1 branching from "Wallet & Keys":
9. "Recycling Engine" → subtitle: "QR Scan · AMM Price · Token Credit · Leaderboard"

Arrow flow:
- User Input → Authentication → Wallet & Keys
- Wallet & Keys → Transaction Layer (down)
- Recycling Engine → Database Storage (branch from Wallet & Keys)
- Transaction Layer → Database Storage (left)
- Database Storage → Smart Contract Bridge (left)
- Smart Contract Bridge → Ethereum Contract (down)
- Ethereum Contract → Confirmation & Proof (right)

Style: clean white background, professional SaaS documentation style, no 3D effects, flat design, suitable for a technical document.
```

---

## Prompt 2 — System Architecture Diagram

> Recreate the reference image style: dark background (#0d1117 near black), colored border boxes (blue for frontend, teal/green for smart contract, orange/yellow for external), white and light-colored monospace text, subtle box-in-box component layout. Professional engineering diagram style.

```
Create a professional System Architecture diagram for a cryptocurrency + eco-incentive platform called CryoPay / EcoVault. Use a dark background (#0d1117), colored borders around major sections, white monospace text, and nested boxes inside each section. Title at top: "CryoPay / EcoVault — system architecture".

Layout: 4 major horizontal bands stacked vertically:

--- BAND 1: FRONTEND (blue border #3b82f6) ---
Stack label top-left: "React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS · Vercel"
Six inner dark boxes in a row:
1. "Landing Page & Leaderboard"
2. "Dashboard & Coupons"
3. "Auth UI — Email + MetaMask + TOTP MFA"
4. "Client-Side Crypto — WebCrypto ECDSA/AES"
5. "QR Engine — html5-qrcode / qrcode.react"
6. "State — TanStack Query"

--- CONNECTOR: "HTTPS / JWT Bearer" label on arrow pointing down from Frontend to Backend ---
--- CONNECTOR: "MetaMask sign / send" dashed arrow on right side going to External ---

--- BAND 2: BACKEND — API LAYER (blue/teal border #2563eb) ---
Stack label top-left: "Cloudflare Workers · Hono 4.4.5 · TypeScript · Zod Validation"
Six inner dark boxes in two rows:
Row 1:
1. "Auth Service — Email · TOTP MFA · MetaMask EIP-191 · JWT"
2. "Profile & Wallet Service — Key management · Encrypted store"
3. "Transaction Service — Send · Buy/Sell · Blocks · History"

Row 2:
4. "Recycle Service — QR validation · Token crediting · Voucher redeem"
5. "Bin Service — CRUD · QR generation · Material prices"
6. "AMM Service — Dynamic pricing · History snapshots"
7. "Blockchain Bridge — On-chain sync · viem writeContract"
8. "Ethereum Gateway — RPC · Etherscan API proxy"

--- CONNECTORS below Backend to 3 bottom sections ---
Left arrow labeled "D1 SQL" → DATABASE
Center arrow labeled "viem writeContract" → SMART CONTRACT
Right arrow labeled "HTTP / JSON-RPC" → EXTERNAL

--- BAND 3 (three side-by-side sections) ---

LEFT: DATABASE (purple border #7c3aed)
Title: "Cloudflare D1 · SQLite · 10 Tables"
5 inner dark boxes stacked:
1. "Users & Profiles — accounts · mfa · sessions"
2. "Wallets & Keys — eth_address · ECDSA JWK · ciphertext"
3. "Transactions & Blocks — kind · status · tx_hash"
4. "Contacts & OTP Tokens — address book · MFA"
5. "Bins & Recycling — deposits · AMM history"

CENTER: SMART CONTRACT (green border #16a34a)
Title: "Solidity 0.8.28 · Sepolia Testnet · Hardhat"
2 inner dark boxes:
1. "CryoPay TransactionRecorder.sol"
2. "Methods: record · batchRecord · query · verify · event TxRecorded"

RIGHT: EXTERNAL (orange/amber border #d97706)
Title: "Third-party APIs & Ethereum Network"
2 inner dark boxes:
1. "Ethereum Sepolia RPC — eth_call · sendRawTx"
2. "Etherscan API — tx history · receipts · gas oracle"

--- LEGEND at bottom ---
Show colored square legend items:
- Blue square: "Frontend (client)"
- Teal square: "Backend API layer"
- Purple square: "Database (D1)"
- Green square: "Smart contract"
- Orange square: "External / on-chain"
- Solid arrow: "Unidirectional call"
- Bidirectional arrow: "Bidirectional"
- Dashed arrow: "Direct wallet → chain"

Style: dark engineering diagram, monospace font (JetBrains Mono or Fira Code style), professional technical documentation, no shadows or gradients, crisp borders, suitable for a README or architecture doc.
```

---

## Prompt 3 — LLD Component Diagram (Bonus)

```
Create a Low-Level Design component diagram for a web3 + recycling app called CryoPay. Use a white background with colored component boxes connected by labeled arrows. Show the internal structure of the React frontend with these grouped sections:

Section 1 — "Pages" (light blue background):
Boxes: LandingPage · BinsAdmin · TestQr · Leaderboard · Coupons

Section 2 — "Components" (light green background):
Boxes: Navbar · HeroSection · ConfirmationModal · EmailOtpModal · TransactionPasswordForm · UnlockTransactionModal · AnimatedBackground

Section 3 — "Libraries" (light yellow background):
Boxes: api.ts (30+ endpoints) · crypto.ts (WebCrypto ECDSA/AES/PBKDF2) · currency.ts · symmetricSession.ts

Section 4 — "Types & Constants" (light purple background):
Boxes: schemas.ts (Zod) · constants/index.ts (enums + routes) · blockchain.ts

Section 5 — "External" (light orange background):
Boxes: Cloudflare Workers API · Ethereum Sepolia · Etherscan

Connect with labeled arrows:
- Pages → Components (uses)
- Pages → Libraries (calls)
- Libraries → External (HTTP/RPC)
- Types/Constants → Pages and Libraries (imported by)

Style: clean, flat, white background, pastel section colors, small labeled boxes, thin connecting arrows, suitable for a technical spec document.
```

---

## Tips for Best Results

- For **ChatGPT / DALL-E**: Paste Prompt 1 or 2 directly. Add "high resolution, 1600x1000px" at the end.
- For **Gemini**: Use Prompt 1 or 2. Gemini renders architectural diagrams well with dark backgrounds.
- For **Mermaid.js** (code-based): The HLD flow maps directly to a `graph TD` diagram. Ask any LLM to convert Prompt 1 into Mermaid syntax.
- For **Excalidraw / Whimsical**: Use the text descriptions in HLD.md and SYS_ARCH.md as a guide to manually recreate with drag-and-drop components.
- For **draw.io**: Import the Mermaid output or use the XML description to build it.
