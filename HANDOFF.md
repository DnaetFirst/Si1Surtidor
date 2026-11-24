# HANDOFF - Public demo login selector

## Completed
- Added configurable demo-account cards to the login, showing role/email/password and filling the form without automatic submission.
- Added VITE_DEMO_ACCOUNTS Docker build argument; values are public demo configuration stored on Render, never source secrets.
- User explicitly authorized public access for every actor, including ASU. Existing ASU/ATI credentials reused; created separate GG/GS/Employee demo accounts through audited API.
- Verified successful login/logout for all five actors. Production frontend build passed before final copy encoding correction.
- Render target: srv-dc2ai1p7lnhs73a6pkqg, https://si1-surtidor.onrender.com, free, main.

## Modified Files
- apps/web/src/modules/security/auth/presentation/Login.tsx
- apps/web/src/shared/styles/login.css
- infrastructure/demo.Dockerfile
- HANDOFF.md

## Next Step / Pending
- Push selected files; monitor automatic Render deploy and verify demo cards in deployed assets.
- Preserve unrelated untracked scripts/query-user.mjs and scripts/test-pwd.mjs; do not commit them or private .local files.
