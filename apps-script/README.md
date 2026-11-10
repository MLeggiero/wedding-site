# Guest photos & song requests — 10-minute setup

The site's **Share a photo** and **Songs** pages send to a small Google Apps Script.
Photos go into a private Drive folder only you two can see; everything is logged in a Sheet.
Nothing is stored in this public repo.

1. **Make a Drive folder** called e.g. "Wedding — guest photos". Open it and copy the ID
   from the address bar (the long code after `/folders/`).
2. **Make a Google Sheet** called e.g. "Wedding — guests". (The script adds `Photos` and
   `Songs` tabs by itself.)
3. In the Sheet: **Extensions → Apps Script**. Replace the editor's contents with
   [`Code.gs`](Code.gs). In **Project Settings**, tick "Show appsscript.json" and paste
   [`appsscript.json`](appsscript.json).
4. Still in Project Settings → **Script properties** → add `PHOTO_FOLDER_ID` = the folder ID.
5. **Deploy → New deployment → Web app**: *Execute as* **Me**, *Who has access* **Anyone**.
   Approve the permissions, then copy the **Web app URL**.
6. In this repo, paste that URL into `guestEndpoint` in `src/config.ts` and commit.
   For the Songs page, also paste your Spotify playlist link into `spotifyPlaylistUrl`.

Song requests arrive in the `Songs` tab with a "Find on Spotify" link for each, so adding
them to your playlist is one tap. (Spotify only lets apps add songs automatically for
Premium accounts.)

After editing `Code.gs` later: **Deploy → Manage deployments → Edit → New version**
(the URL stays the same).
