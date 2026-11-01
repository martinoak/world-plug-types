# World Plug Map

An interactive world map that shows which electrical plug types (A–O) each country uses.

- Hover over a country to see its plug types, voltage and frequency (tap on phones)
- Click a country for details about each plug type
- Search countries by name (aliases like "USA", "UK" or "Czech Republic" work too); press Enter to jump to the first match
- Filter by plug type to highlight every country that uses it
- Zoom and pan with the mouse wheel, drag, or the + / − buttons

It's a static site (plain HTML, CSS and JavaScript) with no build step.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page layout |
| `style.css` | Styles, with light and dark mode |
| `app.js` | Map, tooltip, search and filtering |
| `data.js` | Plug types, voltage and frequency per country (keyed by ISO 3166-1 numeric code) |
| `plugs.js` | Plug type descriptions and SVG icons |

D3, topojson-client and the world map (world-atlas, Natural Earth 1:50m) load from the jsDelivr CDN.

## Publish on GitHub Pages

1. Create a new repository on GitHub, e.g. `plug-map`.
2. Upload these files to the repository root (or push them with git):
   ```bash
   git init
   git add index.html style.css app.js data.js plugs.js README.md
   git commit -m "World plug map"
   git branch -M main
   git remote add origin https://github.com/<your-user>/plug-map.git
   git push -u origin main
   ```
3. In the repository, go to **Settings → Pages**, set **Source** to *Deploy from a branch*, choose `main` and `/ (root)`, and save.
4. After a minute the site is live at `https://<your-user>.github.io/plug-map/`.

## Run locally

The page fetches the map data, so open it through a local web server rather than double-clicking the file:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Editing the data

Each entry in `data.js` looks like:

```js
"203": ["Czechia|Czech Republic", "CE", 230, 50],
```

That's the ISO numeric code, the name with optional search aliases separated by `|`, the plug type letters, the voltage and the frequency in Hz.

Plug data was compiled from IEC World Plugs and WorldStandards. Many countries have mixed sockets, so check before you travel.
