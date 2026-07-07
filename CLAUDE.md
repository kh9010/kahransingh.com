# kahransingh.com — working notes for Claude

This is a **public** GitHub Pages repo (custom domain kahransingh.com, plain HTML/CSS/JS, no build step). Anything committed — including **commit messages and git history** — is world-readable forever.

## Privacy rules (load-bearing)

- **Never put other people's names in commit messages.** Use neutral phrasing like "roster corrections" or "update reunion list" instead of naming who was added, removed, or merged. Commit messages are indexed by GitHub search and cannot be un-published without a history rewrite.
- **Keep third-party PII off the pages** — no home addresses, personal phone numbers, personal emails, or maiden-name/identity linkages for anyone but Kahran. Business/venue contact info is fine. The reunion roster is first-name + last-name only, no provenance notes in the source.
- Private-ish sections (`/reunion/`, `/40/`, `/winter/`, `/wedding/`) use `<meta name="robots" content="noindex, nofollow">` to stay out of search. Rely on that meta tag — do **not** also add a `robots.txt` Disallow for the same path (a Disallow stops crawlers from ever reading the noindex, which backfires).

## Conventions

- Serve media at web-appropriate sizes: photos ≤ ~2400px long edge / ≤ ~1MB; loop videos re-encoded small (see `video-poems/` at 540px). GitHub Pages can't serve Git LFS, so keep assets in the repo but small — don't move served media to LFS.
- Every top-level page carries `<title>`, meta description, canonical, and OG/Twitter card tags. New poem pages should mirror `og:description` into a `<meta name="description">` and include an `og:image`.
