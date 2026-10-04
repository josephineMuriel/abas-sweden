# ABAS website v14

Responsive multilingual ABAS website based on the approved clean homepage mockup.

## Languages
- SV (default)
- EN
- FR
- NG

The Ngemba wording included here is carried over from the approved design mockup and should be validated by an Ngemba speaker before public publication.

## Hero/background assets
- Swedish + Ngemba: `assets/scene-sv-ng2.svg`
- French + English: `assets/scene-fr-en2.svg`

The same language-specific artwork is also used on secondary-page hero banners.

## Architecture
- `index.html` — clean homepage: hero, Aktuellt / What's on, membership CTA, footer
- `association.html` — Who we are, Vision, Board
- `activities.html` — YoY Activities, 2026 Highlights, 2027 Initiatives
- `members.html` — member gateway to Governance and Meeting Protocols
- `join.html` — membership/contact form
- `donate.html` — donation/Swish page
- `governance.html` — governance information
- `protocols.html` — meeting protocol document
- `login.html` — placeholder member authentication interface

## Contact form privacy
The Join form uses Netlify form markup and does **not** include a private recipient email in browser-facing HTML/JavaScript. Configure form notifications in the hosting provider dashboard to deliver submissions to the desired private mailbox. The public address remains `contact@abbassweden.com`.

## Cache busting
Pages load `styles.css?v=14` and `app.js?v=14`. Increment the version query after future deployments if browsers keep older assets cached.
