// VPM web app configuration.
// Fill these in with your tenant's real values when you're ready to go live.
// Everything works against mock data out of the box (useMockData: true).
window.VPM_CONFIG = {
  // Flip to false once auth + Graph + Power BI are wired up.
  useMockData: true,

  branding: {
    appName: "VPM - Visual Performance Management",
    accentColor: "#a6192e", // swap for your org's brand color
    logoText: "LOGO" // replace with an <img> in index.html if you have a logo file
  },

  // Azure AD app registration (Single-page application platform).
  msal: {
    clientId: "<AZURE_AD_APP_CLIENT_ID>",
    authority: "https://login.microsoftonline.com/<AZURE_AD_TENANT_ID>",
    redirectUri: window.location.origin + window.location.pathname
  },

  // Microsoft Graph scopes needed to read SharePoint lists with the signed-in user's permissions.
  graphScopes: ["Sites.Read.All"],

  // SharePoint site + list identifiers (get these from Graph Explorer, see README).
  graph: {
    siteId: "<SHAREPOINT_SITE_ID>",
    lists: {
      safetyActions: "<SAFETY_ACTIONS_LIST_ID>",
      accountability: "<ACCOUNTABILITY_LIST_ID>"
    }
  },

  // Power BI "embed for your organization" settings (user's own AAD token + PBI license).
  // For distributing to users without a Power BI license, use the backend/ token-minting
  // example instead (App Owns Data pattern) and set powerbi.useBackendToken = true.
  powerbi: {
    enabled: false,
    useBackendToken: false,
    backendTokenEndpoint: "/api/pbi-embed-token",
    scopes: ["https://analysis.windows.net/powerbi/api/Report.Read.All"],
    workspaceId: "<POWERBI_WORKSPACE_ID>",
    reportId: "<POWERBI_REPORT_ID>",
    embedUrlBase: "https://app.powerbi.com/reportEmbed"
  }
};
