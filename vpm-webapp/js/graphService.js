// Reads SharePoint list items via Microsoft Graph, using the signed-in
// user's delegated permissions (so normal SharePoint list permissions apply).
const VPMGraph = (function () {
  async function getListItems(listId, fieldNames) {
    const token = await VPMAuth.getToken(window.VPM_CONFIG.graphScopes);
    const siteId = window.VPM_CONFIG.graph.siteId;
    const select = fieldNames && fieldNames.length ? `?$expand=fields($select=${fieldNames.join(",")})` : "?$expand=fields";
    const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items${select}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Graph request failed: ${res.status} ${res.statusText}`);
    const body = await res.json();
    return body.value.map(item => item.fields);
  }

  // Maps a SharePoint "Safety Actions" list to the shape render.js expects.
  // Adjust the internal column names on the right to match your real list.
  function toSafetyActions(fields) {
    return fields.map(f => ({
      personResponsible: f.PersonResponsible,
      actionNo: f.ActionNo,
      location: f.Location,
      actionRequired: f.ActionRequired,
      dueDate: f.DueDate
    }));
  }

  // Maps a SharePoint "Accountability" list to the shape render.js expects.
  function toAccountabilityItems(fields) {
    return fields.map(f => ({
      dateDue: f.DateDue,
      status: f.Status,
      created: f.Created,
      id: f.id || f.ID,
      personAssigned: f.PersonAssigned,
      action: f.Title,
      actionFrom: f.ActionFrom,
      tracking: f.Tracking
    }));
  }

  return { getListItems, toSafetyActions, toAccountabilityItems };
})();
