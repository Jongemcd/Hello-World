// Minimal example backend for Power BI "embed for your customers".
// Mints a short-lived embed token using a service-principal (client credentials)
// login, so front-end viewers don't need their own Power BI license.
//
// Requires an Azure AD app registration with an admin-consented application
// permission for the Power BI Service API, and the service principal added
// as a member (with Viewer access) of the target Power BI workspace.
//
// Never expose AZURE_AD_CLIENT_SECRET to the browser - it belongs here only.
require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");

const {
  AZURE_AD_TENANT_ID,
  AZURE_AD_CLIENT_ID,
  AZURE_AD_CLIENT_SECRET,
  POWERBI_WORKSPACE_ID,
  POWERBI_REPORT_ID,
  PORT = 4000
} = process.env;

const app = express();

async function getAadToken() {
  const url = `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: AZURE_AD_CLIENT_ID,
    client_secret: AZURE_AD_CLIENT_SECRET,
    scope: "https://analysis.windows.net/powerbi/api/.default"
  });

  const res = await fetch(url, { method: "POST", body });
  if (!res.ok) throw new Error(`AAD token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

app.get("/api/pbi-embed-token", async (req, res) => {
  try {
    const aadToken = await getAadToken();

    const reportRes = await fetch(
      `https://api.powerbi.com/v1.0/myorg/groups/${POWERBI_WORKSPACE_ID}/reports/${POWERBI_REPORT_ID}`,
      { headers: { Authorization: `Bearer ${aadToken}` } }
    );
    if (!reportRes.ok) throw new Error(`Report lookup failed: ${reportRes.status} ${await reportRes.text()}`);
    const report = await reportRes.json();

    const tokenRes = await fetch(
      `https://api.powerbi.com/v1.0/myorg/groups/${POWERBI_WORKSPACE_ID}/reports/${POWERBI_REPORT_ID}/GenerateToken`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${aadToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ accessLevel: "View" })
      }
    );
    if (!tokenRes.ok) throw new Error(`GenerateToken failed: ${tokenRes.status} ${await tokenRes.text()}`);
    const embedToken = await tokenRes.json();

    res.json({
      token: embedToken.token,
      embedUrl: report.embedUrl,
      reportId: POWERBI_REPORT_ID
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mint Power BI embed token." });
  }
});

app.listen(PORT, () => console.log(`PBI token backend listening on :${PORT}`));
