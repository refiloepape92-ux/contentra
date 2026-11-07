# Creator Hub Community — delivery checklist

This checklist tracks work in the separate copy made from the user's latest uploaded ZIP. The previous Manus project and the user's local VS Code folder remain untouched. Delivery is a clean source ZIP for local development; no deployment is included.

## Public homepage and creator separation
- [x] The public homepage's creator introduction, featured item, search/filter results, story list and owner-content count show only content created by the original Creator account; viewer-authored posts never appear in the owner's feed or featured slot. The backend creator feed excludes viewer-authored records, and the homepage derives its feature only from that result.
- [x] The homepage has a distinct section titled “Other Content Creators” for viewer-authored posts; it shows only posts the owner approved and published whose publication time has arrived, with each post shown under its approved viewer display name.
- [x] Public story details, likes, comments, views and bookmarks work for published owner and published viewer content; drafts, pending/unapproved, rejected, hidden, or future-dated posts are inaccessible through public content, detail, engagement and bookmark endpoints.
- [x] The public portal retains the creator profile/introduction, creator featured content, search and category filters for the creator feed, responsive cards/details, and a clear empty state for an empty community section.

## Viewer accounts and member posts
- [x] Viewers can register and sign in with a display name, email and password; viewer accounts remain distinct from the single owner Creator account, and registration never grants owner privileges.
- [x] A signed-in viewer can submit a post containing title, description, category, content type, thumbnail URL, media URL or article body; a newly submitted viewer post is private and pending until owner approval.
- [x] A viewer's submission never appears in the public creator feed, the community section, or public details, likes, comments, views or bookmarks unless the owner approves/publishes it.
- [x] The owner can review viewer-submitted items and approve/publish or reject them; only owner-authenticated API actions can change a viewer post to a public status.
- [x] After approval, a viewer post appears under its approved author name only in “Other Content Creators,” not among the owner's featured or authored stories.

## Owner activity notifications
- [x] The application writes owner-only in-app notifications to the MongoDB `notifications` collection for viewer registration, viewer post submission, newly created likes, and submitted comments; removing a like does not generate a new notification, and page views remain view-count analytics rather than one alert per view.
- [x] Only the authenticated creator can list notifications, read the unread count, mark one notification read, or mark all notifications read; viewer sessions and public endpoints cannot access the activity feed.
- [x] The creator studio displays a visible unread count/badge and a notifications page with event type/message and date; the owner can mark one or all notifications as read and see an empty state when there are none.
- [x] Notification records and messages do not contain passwords, access tokens, or sensitive account credentials; user-supplied text is safely rendered as text.

## Viewer creator workspace and activity notifications
- [x] When a logged-in viewer's community post receives a new like, the app saves a notification for that post's author; toggling/removing a like does not create another notification.
- [x] When a logged-in viewer's community post receives a comment submission, the app saves a notification for that post's author that identifies the post and makes clear the comment is waiting for Creator review; after the Creator approves that comment, the post author receives a comment-approved notification.
- [x] When the Creator approves or rejects a viewer's submitted post, only that post's author receives a notification stating the decision; approval links to the published story, while rejection remains private to the author. Repeating the same approval/rejection request does not generate a duplicate notification.
- [x] A signed-in viewer can access only their own notification list, unread count, and read-state actions; viewer A cannot retrieve or change viewer B's notifications, and the Creator inbox remains separately scoped to creator notifications.
- [x] The logged-in viewer workspace shows the viewer's own posts with each post's moderation status, like count, approved-comment count, and pending-comment count; it excludes posts owned by other viewers and the Creator.
- [x] Logged-in viewer navigation exposes the viewer activity inbox and unread count; the inbox displays concise event messages and dates and supports marking one or all items read.
- [x] Logged-in viewer screens use a compact, responsive layout with a clear profile identity, post/engagement overview, activity link, and create/saved-story actions; avoid large empty whitespace on desktop and mobile while preserving the existing editorial colors and typography.

## Backend, data, and local handoff
- [x] The creator content form and signed-in viewer post form let a user choose a picture or video from their device, preview the selection, upload it with clear loading/error feedback, and keep the saved media URL in the correct content field; uploaded images can be used as both the image content and its card thumbnail, a separate cover image may be selected, and form submission waits for uploads to finish.
- [x] Accept JPEG, PNG, WebP, or GIF images up to 8 MiB and MP4 or WebM videos up to 100 MiB; reject unsupported types, mismatched file signatures, and oversized files on the server with a clear response.
- [x] Only an authenticated Creator or authenticated Viewer may upload; store files with opaque generated names under `backend/uploads/`, never trust a device filename as a path, and serve no files outside the configured upload directory. A raw URL must not reveal an unattached, pending, rejected, or hidden post's asset; only the owner or that viewer-author can fetch private media with an authenticated request.
- [x] Relative uploaded-media URLs work through the local Vite `/uploads` proxy and the configured production API base URL; published story details display images and play videos with browser controls, while the upload flow does not change owner approval rules for viewer posts. Files remain private until an associated post is Published and its publication time has arrived.
- [x] Keep local uploaded files out of Git and source ZIPs; document that this VS Code iteration stores files on the local backend disk, and that a future Render deployment needs durable disk or object storage.
- [x] Preserve the uploaded npm workspaces and `package-lock.json`; keep `.env` ignored and `.env.example` placeholder-only; update the README with Windows PowerShell `npm.cmd install` / `npm.cmd start`, local Atlas setup, viewer approval flow, and notification behavior.
- [x] Keep backend validation, creator/viewer authentication separation, owner-only moderation/notification routes, rate limits, public visibility checks and safe error handling; no actual secret value is included in the source archive.
- [x] Update `frontend/public/manus-routes.json` to declare every actual public, viewer and creator page route, excluding API and assets routes.
- [x] The source ZIP opens at the project root in VS Code, includes both frontend and backend source plus the npm lockfile, and excludes `.env`, `node_modules`, generated build output and unrelated temporary files.
- [ ] The user's own Atlas URI is configured privately in `.env`; only claim Atlas persistence after their local `/health` endpoint reports a connected database. Do not include credentials in the ZIP.
- [x] Do not claim GitHub, Render, Vercel or public deployment is complete; those external publishing steps are outside this local source update.
