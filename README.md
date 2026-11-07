# Creator Hub Community

Creator Hub Community lets viewers register and submit their own content while the original creator keeps publishing control. The homepage separates **your creator stories** from **Other Content Creators**. A viewer's post stays private until you approve and publish it; when published it appears only in the community section under the viewer's name, never in your featured story or creator feed.

The creator dashboard also has a private in-app activity inbox. It records new viewer registrations, new post submissions, newly added likes, and submitted comments. It has an unread badge plus mark-one and mark-all-read controls. Removing a like does not create a new notification. Page views remain view-count analytics, not a separate alert per view. Notifications are in-app only; this package does not send email, SMS, or browser push notifications.

## Stack

- Frontend: React and Vite
- Backend: Node.js and Express
- Database: MongoDB Atlas through Mongoose
- Authentication: separate creator and viewer accounts; bcrypt password hashes and JWTs
- Package manager: npm workspaces (`package-lock.json`)

## Run in VS Code on Windows

1. Extract this ZIP and open its root folder in VS Code—the folder containing this README, `package.json`, `frontend`, and `backend`.
2. Install Node.js 20 or newer if needed. Open **Terminal → New Terminal** in VS Code.
3. Create a private environment file in this root:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Edit `.env` with your own Atlas URI and private secrets (see below). Do not share `.env` or include it in a ZIP or Git repository.
5. Install dependencies from the project root:

   ```powershell
   npm.cmd install
   ```

6. Start the backend and website together:

   ```powershell
   npm.cmd start
   ```

   Keep this terminal running. Open `http://localhost:3000` for the website. The API listens on `http://localhost:4000`. If PowerShell says `npm.ps1` is blocked, keep using `npm.cmd`; do not change Windows execution policy. Press `Ctrl+C` in the running terminal to stop the services.

If a port is already in use, stop the other process using port 3000 or 4000 before starting another copy. To run one side only, use `npm.cmd run dev:backend` or `npm.cmd run dev:frontend` in a separate terminal from the project root.

## Connect MongoDB Atlas

1. In Atlas, create/select a cluster and create a **Database Access** user.
2. Under **Network Access**, allow your current public IP for local development.
3. In **Connect → Drivers → Node.js**, copy the connection string. Set its database name to `ContentCreatorDB`, for example:

   ```text
   mongodb+srv://USERNAME:PASSWORD@CLUSTER-HOST/ContentCreatorDB?retryWrites=true&w=majority
   ```

4. If your database password includes reserved characters such as `@`, `#`, `/`, `:`, or `%`, URL-encode them in the URI.
5. In the root `.env`, set `MONGODB_URI` to the completed URI. Replace `JWT_SECRET` and `OWNER_SETUP_KEY` with long, unique values. For local development keep `PORT=4000`, `ALLOWED_ORIGINS=http://localhost:3000`, and leave `VITE_API_BASE_URL` empty.
6. Restart `npm.cmd start` after changing `.env`.

Check `http://localhost:4000/health`. A successful response has HTTP 200 with `ok: true` and `database: "connected"`. If it returns `database: "unavailable"`, check the URI, Atlas database-user credentials, the Atlas IP allowlist, and whether the backend was restarted. Do not paste your Atlas URI into chat or screenshots.

## Create the original creator account

1. With the app running, open `http://localhost:3000/creator/setup`.
2. Enter the creator display name, email, a password of at least 10 characters, and the `OWNER_SETUP_KEY` from `.env`.
3. After the first account is created, remove `OWNER_SETUP_KEY` from `.env` and restart the backend; the one-time setup endpoint will then be disabled.
4. Sign in at `http://localhost:3000/creator/login`.

Viewers register separately at `/viewer/register`; this never gives them creator privileges.

## Viewer post review

A viewer signs in and chooses **Share a post with the community** from their reader profile. New submissions are private and appear in the creator's content manager with `Pending` status. They do not appear on any public feed or story page while pending. In the creator studio, open **Your content** and approve or reject a viewer submission. Once approved and published, it appears under **Other Content Creators** with the viewer's display name. It is not included in the creator's featured story or creator-owned feed.

## Upload a picture or video from your device

Both the creator editor and signed-in viewer post form have a **Main image or video** file picker. Choose a file from your computer or phone; the form previews it, uploads it to the backend, and fills in the content media URL. An image is also used as the story-card cover unless you choose a separate **Cover image**. Selecting a video sets the content type to Video, and published story pages play uploaded MP4 or WebM files with controls.

Supported files are JPEG, PNG, WebP, or GIF images up to 8 MiB, and MP4 or WebM videos up to 100 MiB. The API checks the file signature as well as the submitted MIME type; unsupported or oversized files are rejected. Files are written under `backend/uploads/` with generated names; original filenames are not used as storage paths. This directory is ignored by Git and is not included in source ZIPs. An asset is publicly readable only after its referencing post is Published and due; until then, only the creator or the post's signed-in viewer-author can fetch it through the authenticated media endpoint.

For this local VS Code version, uploaded files stay on the computer running the backend; MongoDB stores the media URL, not the binary file. If you later move the backend to Render, configure persistent disk or cloud object storage before relying on uploaded media—ordinary ephemeral server storage is not durable. For a frontend hosted on a different origin, set the frontend build variable `VITE_API_BASE_URL` to the backend's base URL so uploaded images/videos load from the API host, and set backend `ALLOWED_ORIGINS` to the exact frontend origin (for example, `https://creatorhub.vercel.app`, with no trailing slash); leave `VITE_API_BASE_URL` blank for local Vite development, which proxies `/uploads` to Express.

## Your posts and engagement (viewer account)

When signed in, open **My creator space** to see only posts you authored, their review/publication status, view counts, likes, approved comments, and comments waiting for creator review. Your own posts appear here even if they are not public yet; posts from other viewers remain private to their respective authors. The dashboard has shortcuts to share a post, open saved stories, and view your activity. Update your display name and creator introduction in the **Profile details** panel.

The **Activity** link and unread badge show private updates for your account. You receive an alert when your post is liked, when someone submits a comment (the notice says it is pending creator review), when that comment is approved and becomes visible, and when the creator approves or rejects your post. Approved-post alerts open the published story. A rejected post remains private; its notice takes you back to your own posts. Use **Mark read** for one event or **Mark all read**. Each notification API checks the signed-in viewer ID, so one viewer cannot read or change another viewer's activity.

Likes and comments can be made by readers without an account; an author still receives the engagement notification. The content owner retains comment moderation and must approve posts before public publication.

## Creator notifications

Open **Notifications** from the creator studio. The page lists viewer registrations, viewer-post submissions, new likes, and submitted comments with an actor label and timestamp. The unread number appears beside the navigation item and refreshes while the studio is open. Use **Mark read** for one item or **Mark all read** to clear the unread count. Notification routes require the creator JWT and do not expose the inbox to viewers or the public.

Notifications are stored in the MongoDB `notifications` collection alongside `users`, `viewers`, `contents`, `comments`, `likes`, and `bookmarks`. The app does not store credentials in notifications. The user's Atlas connection is private to their `.env`; this source package contains only placeholder values.

## Useful commands

From the project root:

```powershell
npm.cmd run check
npm.cmd run build
```

`check` syntax-checks backend JavaScript and creates a production build of the frontend.

## Scope of this handoff

This is source code for local development in VS Code. It does not include your `.env` values and does not deploy to GitHub, Render, or Vercel. Those hosting steps are separate from this update.
