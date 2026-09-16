# VPM Web App

A plain HTML/CSS/JS replica of the "Visual Performance Management" Power App:
a sidebar-nav shell, a Summary page of pillar mini-calendars, per-pillar
detail pages (calendar + SharePoint-list-backed action table, optionally a
Power BI-style dashboard panel like the Cost page), an Accountability
tracker page, and a kiosk-style autoplay button that cycles pages.

No build step - open `index.html` directly or serve the folder statically.
It runs entirely on mock data (`data/mockData.js`) until you wire up real
Azure AD / SharePoint / Power BI credentials in `config.js`.

## Try it now (mock data)

```
cd vpm-webapp
python3 -m http.server 8080   # or any static file server
```

Open `http://localhost:8080`. All content (calendars, action tables, the
Cost page's KPI tiles and variance charts) is generated from
`data/mockData.js` - none of it is real company data.

## Going live

### 1. Azure AD app registration
Create one **Single-page application** registration in your tenant:
- Redirect URI: wherever you'll host this app (e.g. `https://intranet.example/vpm/`)
- API permissions (delegated): Microsoft Graph `Sites.Read.All`, and if
  embedding Power BI with the user's own login, Power BI Service
  `Report.Read.All`
- Grant admin consent

Put the client ID and tenant ID into `config.js` under `msal`.

### 2. SharePoint lists (via Microsoft Graph)
Find your site and list IDs with
[Graph Explorer](https://developer.microsoft.com/graph/graph-explorer):
- `GET /sites/{hostname}:/sites/{site-path}` -> site id
- `GET /sites/{site-id}/lists` -> list ids

Put these into `config.js` under `graph`. Then adjust the field-name mapping
in `js/graphService.js` (`toSafetyActions` / `toAccountabilityItems`) to
match your list's actual internal column names (Graph Explorer will show you
these under each item's `fields`).

Set `useMockData: false` in `config.js` once that's done - `app.js` will
sign the user in with MSAL and pull live list data with their own
permissions.

### 3. Power BI embedding
Two options, both supported by `js/powerbiService.js`:

- **Embed for your organization** (default, simplest): viewers use their
  own AAD login, so they need a Power BI Pro/PPU license or the report's
  workspace needs to be on Premium/Fabric capacity. Set
  `config.powerbi.enabled = true`, fill in `workspaceId`/`reportId`, leave
  `useBackendToken: false`.

- **Embed for your customers** (viewers need no Power BI license): a
  backend mints short-lived embed tokens using a service principal. A
  minimal example is in `backend/` (Express). Copy `backend/.env.example`
  to `backend/.env`, fill in your service-principal credentials, add that
  principal as a workspace member with Viewer access, then:

  ```
  cd backend
  npm install
  npm start
  ```

  Set `config.powerbi.useBackendToken = true` and point
  `backendTokenEndpoint` at that server (proxy `/api/pbi-embed-token`
  through your web host, or set the full URL).

If Power BI embedding isn't enabled for a pillar, its dashboard panel falls
back to lightweight built-in SVG bar charts (`js/charts.js`) driven by the
same mock/live data shape, so the layout still works before PBI is wired up.

## Branding
`config.js` -> `branding` controls the accent color, app name, and the
top-left logo placeholder. Swap the `#logo` div in `index.html` for an
`<img>` if you have a logo file to drop in - none is bundled here.

## Structure
```
index.html          shell: topbar, header, sidebar nav, main content mount
styles.css           all styling
config.js            tenant/site/report IDs, feature flags
data/mockData.js      demo data standing in for SharePoint/Power BI
js/calendar.js       month calendar grid renderer
js/charts.js          dependency-free SVG variance bar chart
js/auth.js            MSAL sign-in wrapper
js/graphService.js    SharePoint list reads via Microsoft Graph
js/powerbiService.js  Power BI report embedding
js/render.js          builds each page's HTML from data
js/app.js             nav wiring, autoplay, mock/live data switch
backend/               optional token-minting server for "embed for your customers"
```

## Adding your screenshots
Drop reference screenshots anywhere outside this folder (or in a `design/`
subfolder you create) and point me at them - the layout, colors, and
calendar/table/tile components are all in one place per file above, so
visual tweaks (spacing, exact colors, icon set) are quick to match up.
