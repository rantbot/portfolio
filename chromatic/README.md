# Chromatic

A Chrome extension that sorts the tabs in a window into rainbow order by the color of each site's icon. Published on the Chrome Web Store under Ran's name. It began as Rainbow Tabs on thoughtbot's experiments catalog, and this copy has no tracking, no catalog update notice and no site permissions.

Its page on the site is https://rancraycraft.com/chromatic/, from `src/chromatic/index.md`, and the extension's homepage link points there.

- `extension/` is the source. Load it unpacked from `chrome://extensions` to try it.
- `store/` has the listing text and promo images for the Chrome Web Store dashboard.
- The privacy policy is a page on the site, `src/chromatic/privacy.md`, at /chromatic/privacy/.

## Making a new version

1. Edit the files in `extension/`.
2. Raise `version` in `extension/manifest.json` and `extension/package.json`. It has to be higher than the version on the store.
3. Build the zip from inside `extension/`.

   ```sh
   cd chromatic/extension
   zip -r ../chromatic-v1.1.0.zip manifest.json background.js offscreen.html offscreen.js confirm.html confirm.js lib icons -x '.*'
   ```

4. Upload it in the Chrome Web Store developer dashboard. Zips are ignored by git. The `dev/` folder (a page for comparing sorts) is left out of the zip on purpose.
