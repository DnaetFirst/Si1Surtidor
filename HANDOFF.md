# HANDOFF - Compact demo login layout

## Completed
- Moved demo access controls beside the login form on desktop; compact actor grid on smaller screens.
- Shows credentials only for the selected actor and fills both fields when selected.
- Anchored the original fuel illustration to the viewport bottom/right so content cannot push it below the screen.
- Preserved existing mobile illustration visibility rules and public demo-account configuration.
- Production frontend build passed. Browser inspection blocked by browser attachment network-policy requirement.

## Modified Files
- apps/web/src/modules/security/auth/presentation/Login.tsx
- apps/web/src/shared/styles/login.css
- HANDOFF.md

## Next Step / Pending
- Monitor automatic Render deploy and verify the new served assets.
- Preserve all unrelated untracked scripts and private .local files.
