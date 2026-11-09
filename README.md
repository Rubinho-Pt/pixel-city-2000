# Pixel City 2000 · Alpha 0.1

An original retro isometric social web game inspired by early-2000s virtual hangouts: a playable room, controllable avatars, an NPC, chat, cosmetics and moderation tools.

**Local development prototype. No real-money payments. Requires Node.js 22 or later.** The game interface is currently in Portuguese; this documentation is in English.

![The Frequency room, avatar and cosmetics shop](docs/preview.png)

## About the project

Pixel City 2000 is a small virtual place to meet, explore and express yourself. Its original design combines a soft retro palette, arcade cabinets, pixel characters and an isometric perspective. Meet Lia, collect a welcome gift and customize your avatar using fictional coins.

The long-term goal is a sustainable social world supported by optional cosmetics without competitive advantages. This repository delivers the first executable foundation: browser interface, authoritative server, local accounts, persistence, moderation and integration tests. Public hosting and payments remain future work requiring the infrastructure and validation described below.

## Quick start

Download or clone this repository, open its folder in a terminal and run:

```sh
npm start
```

Open **http://localhost:3000**. No dependency installation is required. You can also run `node server.mjs`. On Windows, double-click `JOGAR.cmd` to start the server and open your browser. Keep the server window open while playing.

- Move using WASD, arrow keys, mobile direction buttons or a click on the floor. Furniture blocks movement.
- Walk close to Lia and click **Falar com a Lia** for a one-time gift of 100 coins.
- Start with 500 fictional coins. Buy and equip jackets or a crown.
- Without an account, the demo is temporary; reloading resets it.
- Create an account with a name and a password of at least 12 characters to save progress. Do not reuse a password from another service for this prototype.
- To try two players, use separate browser profiles and two accounts on the same server. State and chat update every 1.5 seconds. Simulated users are not presented as real people.
- The server listens locally by default. Publishing source on GitHub does not host the running game.

## Administration and moderation

1. Create your account through the game.
2. Stop the server with Ctrl+C.
3. Run `node admin.mjs "Your account name"`.
4. Restart, sign in, open **A minha conta**, then **Painel administrativo**.

Promotion requires access to the machine and its files. There is no bundled administrator password or browser-accessible promotion endpoint. Do not run the promotion tool while the server is running.

Players can report another account's chat message. Reports preserve the message and reason. Administrators can issue a warning, a 30-minute mute, a 24-hour suspension or lift restrictions. Each action requires a reason and is recorded. Players review measures under **Comunidade** and can appeal even while suspended. Administrators accept or reject appeals with a written explanation.

Accepting an appeal currently lifts all active restrictions on that account; future versions should revoke individual measures. The small three-term profanity filter and link filter are demonstrations, not comprehensive abuse detection. They do not automatically ban players. Personal blocking, assigned report queues and permanent bans are not implemented.

## Tests

```sh
npm test
```

Integration tests use an isolated server and temporary data. They cover registration/login, administrator authorization, Origin and CSRF checks, invalid movement, concurrent purchases without duplicate charges, persistence, reports, mutes, suspensions, appeals, restoration and logout. GitHub Actions runs the same suite on Node.js 24.

## Architecture and limits

| Component | Responsibility |
| --- | --- |
| `public/` | Dependency-free interface, Canvas room, styles and catalog. Clients submit movement/item intents, never authoritative balances or prices. |
| `server.mjs` | Authoritative HTTP API validating movement, collisions, rates, balances, inventory, rewards and sanctions. State uses polling, without P2P/WebRTC. |
| `data/state.json` | Accounts, inventory and moderation. Created on first use and excluded from Git. Serialized writes replace the file by rename. One process per file; not a production transactional database. |
| `admin.mjs` | Local administrator provisioning with the server stopped. |
| `test/` | Integration tests with isolated temporary data. |

Sessions live in memory, expire after 24 hours and use HttpOnly/SameSite=Strict cookies, CSRF tokens and Origin validation. Restarting ends sessions. Passwords use asynchronous scrypt with individual salts, not plaintext. Recovery, MFA and email verification are not included.

The last 100 chat messages are held in memory and lost on restart; reports preserve evidence. Positions are saved, but disconnected accounts are not shown as online. Authentication attempts are limited by connection address; movement, chat, reports and appeals have per-account limits. Global account/storage quotas are not implemented and are required before public exposure.

Public state exposes necessary avatar fields only. Players do not receive each other's IP addresses. The server and hosting provider still see connection addresses. This is not anonymity or an absolute security guarantee.

## Roadmap to a public service

Migrate to PostgreSQL with transactions, a unique normalized account-name index, a wallet ledger and idempotency keys. Add tested backups, shared sessions, retention/deletion jobs, global and per-room quotas, restricted minimal logs, monitoring, security review and load tests. Current storage is for local development, not multiple instances.

Separate identity, rooms, wallets and moderation as scale requires. Replace polling with WebSockets with verified origins/sessions, validated message schemas, sequence checks and per-player limits. Keep simulation and collisions authoritative; add client interpolation. Distribute rooms across processes and share session/sanction storage. Never expose player IPs to other clients.

Use managed OIDC authentication with Authorization Code + PKCE or an audited identity service. Add recovery, session revocation and mandatory administrator MFA. Keep roles server-controlled. HTTPS is mandatory: set `NODE_ENV=production` for Secure cookies and `PUBLIC_ORIGIN=https://your-domain` to the exact origin. `HOST` and `PORT` control the listener; `DATA_DIR` overrides storage. Do not expose the service merely by changing HOST. Configure trusted proxies and gateway rate limits explicitly; never trust arbitrary X-Forwarded-For headers.

### Future payments

`/api/checkout` always returns HTTP 503. No provider, keys or real charges are configured.

Use a specialized provider's hosted checkout. Keep secrets server-side; verify webhook signatures, product, amount and currency; deduplicate events; and credit wallets transactionally. Never grant coins based on the browser's success redirect. Plan refunds, chargebacks and reconciliation. Do not collect card details in the game.

### Community operations

Define community rules, human escalation, response times, appeal review and child-safety processes before public launch. Review applicable privacy, age, consumer and payment requirements with appropriate professionals. No software can promise absolute security.
