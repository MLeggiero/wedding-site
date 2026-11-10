# Guest photos, song requests and robot gift claims: 5-minute setup

The site's **Share a photo** and **Songs** pages, and the "I'm getting this" buttons in the
robot room, send to a small Google Apps Script.
Photos go into a private Drive folder only you two can see; everything is logged in a Sheet.
Nothing is stored in this public repo.

1. **Open the Sheet** for the site (e.g. "Wedding site: guest photos and songs"; any Google
   Sheet works). The script adds the `Photos`, `Songs` and `RobotClaims` tabs if they're missing.
2. In the Sheet: **Extensions → Apps Script**. Replace the editor's contents with
   [`Code.gs`](Code.gs). Then **Project Settings** (gear icon) → tick **Show "appsscript.json"
   manifest file in editor**, open `appsscript.json` and replace it with
   [`appsscript.json`](appsscript.json). Save.
3. **Deploy → New deployment →** gear icon → **Web app**. *Execute as* **Me**, *Who has access*
   **Anyone**. Deploy, approve the permissions (Google warns that the app isn't verified, since
   it's your own: **Advanced → Go to … (unsafe)**), then copy the **Web app URL**.
4. In this repo, paste that URL into `guestEndpoint` in `src/config.ts` and commit.
   For the Songs page, also paste your Spotify playlist link into `spotifyPlaylistUrl`.

**What the script can reach.** The manifest limits it to this one Sheet and to Drive files it
made itself: the permission screen says "only the specific Google Drive files you use with this
app". It can't see or change anything else in your Drive, and visitors can only send a photo, a
song or a gift claim. Uploads must be real images (checked from the file itself), at most 10 MB
each and 3 GB in all, and the script takes at most 40 requests a minute.

Photos go to a private Drive folder the script makes on the first upload, called **Wedding site:
guest photos**.

**Updating it later** (new `Code.gs` or `appsscript.json`): paste the new files, then **Deploy →
Manage deployments →** pencil → *Version* **New version** → **Deploy**. The URL stays the same.
If the permissions changed, select `doGet` and click **Run** once to approve them.

**If you set it up before November 10, 2026** (when the script asked for your whole Drive):
update it as above, then remove the old, broader permission at
[myaccount.google.com/connections](https://myaccount.google.com/connections) (the project, then
**Delete all connections**) and click **Run** once to approve the new, smaller one.

Song requests arrive in the `Songs` tab with a "Find on Spotify" link for each, so adding
them to your playlist is one tap. (Spotify only lets apps add songs automatically for
Premium accounts.)

Robot gift claims land in the `RobotClaims` tab, and the robot room marks those items
"Claimed". To undo a claim (a mistake or a prank), delete its row. To hear about new rows,
use the Sheet's **Tools → Notification settings**.
