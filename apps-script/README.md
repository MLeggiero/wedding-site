# Guest photos, song requests and robot gift claims: 5-minute setup

The site's **Share a photo** and **Songs** pages, and the "I'm getting this" buttons in the
robot room, send to a small Google Apps Script.
Photos go into a private Drive folder only you two can see; everything is logged in a Sheet.
Nothing is stored in this public repo.

1. **Open the Sheet** for the site (e.g. "Wedding site: guest photos and songs"; any Google
   Sheet works). The script adds the `Photos`, `Songs` and `RobotClaims` tabs if they're missing.
2. In the Sheet: **Extensions → Apps Script**. Replace the editor's contents with
   [`Code.gs`](Code.gs) and save.
3. **Deploy → New deployment →** gear icon → **Web app**. *Execute as* **Me**, *Who has access*
   **Anyone**. Deploy, approve the permissions (Google warns that the app isn't verified, since
   it's your own: **Advanced → Go to … (unsafe)**), then copy the **Web app URL**.
4. In this repo, paste that URL into `guestEndpoint` in `src/config.ts` and commit.
   For the Songs page, also paste your Spotify playlist link into `spotifyPlaylistUrl`.

Photos are saved to a private Drive folder called **Wedding site: guest photos** (made on the
first upload if it isn't there). To use a different folder, add a script property
`PHOTO_FOLDER_ID` (Project Settings → Script properties) with that folder's ID.

Song requests arrive in the `Songs` tab with a "Find on Spotify" link for each, so adding
them to your playlist is one tap. (Spotify only lets apps add songs automatically for
Premium accounts.)

Robot gift claims land in the `RobotClaims` tab, and the robot room marks those items
"Claimed". To undo a claim (a mistake or a prank), delete its row. To hear about new rows,
use the Sheet's **Tools → Notification settings**.

After editing `Code.gs` later: **Deploy → Manage deployments → Edit → New version**
(the URL stays the same).
