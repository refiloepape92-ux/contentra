# Creator Hub Community — implementation plan

## Scope and source

Use the user's latest `creatorhub-community-updated(1).zip` as the working baseline. Keep the earlier Manus-managed project and the user's Windows VS Code folder untouched. Work in `/home/ubuntu/creatorhub-community-final` and return a clean source ZIP for local VS Code use; do not deploy or connect GitHub, Vercel, or Render as part of this change.

Preserve the existing React/Vite, Express/Mongoose, MongoDB Atlas, npm-workspace application, its editorial visual identity, viewer accounts, creator studio, likes, comments, and saved content. Extend the public homepage so the primary feature and creator's own stories feed contain only content created by the original Creator account. Add a distinct section headed **Other Content Creators** for viewer-authored stories. Viewer-submitted content remains private until the owner explicitly approves and publishes it. After approval, show it only in the community section, with the approved viewer display name; do not mix it into the owner's feed or featured story.

Add an owner-only, persisted in-app activity center with an unread badge and mark-one/mark-all-read actions. Generate events when a viewer registers, submits a post for approval, creates a like, or submits a comment. Toggling a like off does not create an extra event. Keep ordinary page views as view-count analytics rather than creating one notification per view. Notifications are in-app only; no email, SMS, browser push, or external delivery is in scope. Never expose the owner feed, pending submissions, internal notifications, or review metadata through public endpoints.

Extend the same activity system to the viewer account that authored a published community post: send that viewer a private notification when the post receives a new like, receives a comment submission, the creator approves it, or the creator rejects it. Preserve creator moderation of comments; a viewer comment alert should clearly say the comment is pending review, with a second notice when the creator approves it. Viewer inbox queries and read actions must be scoped to the authenticated viewer, and creator inbox queries must remain scoped to the creator recipient. Give each logged-in viewer a compact creator-style dashboard showing each of their posts, its moderation status, likes and approved/pending comment counts, plus a linked activity inbox and unread badge. Refresh the viewer experience with a responsive, compact profile/dashboard layout and clear navigation; avoid large decorative empty areas while retaining the existing editorial palette and typography.

## Implementation approach

- **Toolchain and baseline:** Keep the uploaded JavaScript React/Vite frontend, Express backend, npm workspaces and lockfile. Maintain the existing `frontend/` and `backend/` folders, `.env` ignore behavior and placeholder-only `.env.example`. Do not restore pnpm or move changes into the old project.
- **Content model and authorization:** Preserve viewer ownership and creator ownership. Public creator-feed APIs return only owner-authored items with status `Published` and `publishedAt` no later than the current time. A separate community endpoint returns only viewer-authored, owner-approved `Published` items whose publication time has arrived, with an approved author name. Viewer submissions enter a non-public pending-review state; only creator-authenticated management actions may approve/publish them. Viewer content must never be returned by the creator-only feed, selected as its featured item, or counted as its cards.
- **Homepage:** Keep the existing creator introduction and featured story sourced only from creator-owned posts. Keep the owner search, category filters, counts and cards scoped to that owner feed. Add a separate, clearly labeled **Other Content Creators** section for published viewer posts; show author bylines on every card and detail page. If the community has no published items, use a helpful empty state that explains posts appear after creator approval.
- **Activity/notification system:** Use the Notification model and MongoDB collection with explicit recipient type and, for viewer recipients, viewer ID. Keep creator events (registration, submissions, likes and comments) scoped to the creator. Add viewer events for approval/rejection of that viewer's own post, a new like on that post, a comment submission, and subsequent comment approval. Protect viewer list/count/read endpoints by viewer JWT and owner list/count/read endpoints by creator JWT; every item mutation must also match the authenticated recipient. Keep bounded retrieval and concise safe messages; do not store credentials or comment body text in event records.
- **Viewer workspace:** Add an authenticated viewer posts API that returns only the requesting viewer's posts with status, likes, approved-comment and pending-comment counts. Make the profile page a dense, responsive dashboard with activity summary, post cards and clear create/saved/activity navigation. Add an activity inbox route with unread badge, mark-one/mark-all-read actions, timestamps, and links to the affected published post or the viewer's workspace.
- **Viewer posting and owner moderation:** Retain the viewer sign-up/sign-in and post form. A viewer post has no public URL/appearance until the owner approves it. The owner can distinguish pending viewer submissions, approve/publish or reject them, and delete them; owner-authored drafts and publishing controls remain separate. Ensure only creator-authenticated requests can set public status.
- **Device media uploads:** Add an authenticated multipart upload endpoint shared by owner and viewer post forms. Accept JPEG, PNG, WebP or GIF images up to 8 MiB and MP4 or WebM videos up to 100 MiB. Verify detected file signatures server-side, generate opaque UUID filenames rather than trusting device filenames, and return a relative `/uploads/...` path. Store uploads under `backend/uploads/`, keep that directory out of Git/source ZIPs, and serve only that directory. Forms preview selected files, clearly show upload progress/error state, block saving until uploads finish, put image files into media and thumbnail fields (or a separately selected cover), and set the appropriate Image/Video content type. Media is publicly served only when a referencing post is Published and due; before then, direct public requests fail while the creator or that viewer-author may fetch it with their authenticated session. Public story details render uploaded videos in a controlled `<video>` player and images as images. Local Vite proxies `/uploads` to Express; deployed builds combine relative media paths with `VITE_API_BASE_URL` and must allow the frontend origin in backend CORS. On-disk uploads are suitable for this local VS Code flow; a future Render deployment must configure durable object storage or a persistent disk separately.
- **Validation and delivery:** Update the route manifest to match all actual public, viewer and creator routes. Update README and TODO for Windows PowerShell using `npm.cmd install` and `npm.cmd start`. Exclude `.env`, node_modules and build artifacts from the ZIP. Run backend syntax and frontend build checks, validate public-filter/notification-route logic, and avoid claiming Atlas persistence until the user's private Atlas connection is configured and `/health` succeeds.

## Project structure

```text
creatorhub-community-final/
├── frontend/
│   ├── public/                 # Brand mark and complete page-route manifest
│   └── src/
│       ├── components/         # Public shell, creator navigation, content cards
│       ├── context/            # Creator and viewer session state
│       ├── lib/                # API client and shared formatting
│       └── pages/              # Homepage, story detail, viewer posts dashboard/activity inbox, creator studio
├── backend/
│   ├── scripts/                # Backend syntax check and creator bootstrap
│   ├── uploads/                # Local device-upload storage; ignored by Git and ZIPs
│   └── src/
│       ├── config/             # MongoDB Atlas connection/readiness
│       ├── middleware/         # Creator/viewer auth, database guard, errors
│       ├── models/             # Creator, viewer, content, engagement, notification records
│       ├── routes/             # Public feeds, viewer actions, uploads, moderation, notifications
│       └── utils/              # Validation, errors, scheduled publication, activity creation
├── .env.example                # Placeholder variable names only
├── package.json                # npm workspace scripts
├── package-lock.json
├── README.md                   # Local VS Code, Atlas, approval and notification guide
├── plan.md
└── TODO.md
```

## Design and interaction direction

Retain the uploaded editorial reading-room and Creator Studio aesthetic: warm paper surfaces, dark ink, persimmon accents, serif editorial headings, clean sans-serif controls, and restrained transitions. The owner's feed and community section should be visibly separate and clearly labeled. Notifications should read as a calm creator activity inbox rather than a noisy generic social feed; unread state must be obvious and operable by keyboard and touch. Submitted post status and owner approval must be stated plainly. Logged-in viewer screens should use the available viewport with a compact profile rail, post activity cards, and clear actions instead of a narrow centered card surrounded by empty space.

## Material constraints

The user supplies their own private MongoDB Atlas URI and network-access configuration in `.env`. Do not include real credentials in source, logs, plans or the downloadable ZIP. The app currently provides in-app notification UI only; no background service or external alert channel is introduced. Do not claim Atlas is connected or that data persists across restarts until the user verifies `/health` on their local machine.
