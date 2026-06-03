const https = require("https");
const { URL } = require("url");

const API_URL = "https://ios.prod.ftl.netflix.com/iosui/user/15.48";

const QUERY_PARAMS = new URLSearchParams({
  appVersion: "15.48.1",
  config: '{"gamesInTrailersEnabled":"false","isTrailersEvidenceEnabled":"false","cdsMyListSortEnabled":"true","kidsBillboardEnabled":"true","addHorizontalBoxArtToVideoSummariesEnabled":"false","skOverlayTestEnabled":"false","homeFeedTestTVMovieListsEnabled":"false","baselineOnIpadEnabled":"true","trailersVideoIdLoggingFixEnabled":"true","postPlayPreviewsEnabled":"false","bypassContextualAssetsEnabled":"false","roarEnabled":"false","useSeason1AltLabelEnabled":"false","disableCDSSearchPaginationSectionKinds":["searchVideoCarousel"],"cdsSearchHorizontalPaginationEnabled":"true","searchPreQueryGamesEnabled":"true","kidsMyListEnabled":"true","billboardEnabled":"true","useCDSGalleryEnabled":"true","contentWarningEnabled":"true","videosInPopularGamesEnabled":"true","avifFormatEnabled":"false","sharksEnabled":"true"}',
  device_type: "NFAPPL-02-",
  esn: "NFAPPL-02-IPHONE8%3D1-PXA-02026U9VV5O8AUKEAEO8PUJETCGDD4PQRI9DEB3MDLEMD0EACM4CS78LMD334MN3MQ3NMJ8SU9O9MVGS6BJCURM1PH1MUTGDPF4S4200",
  idiom: "phone",
  iosVersion: "15.8.5",
  isTablet: "false",
  languages: "en-US",
  locale: "en-US",
  maxDeviceWidth: "375",
  model: "saget",
  modelType: "IPHONE8-1",
  odpAware: "true",
  path: '["account","token","default"]',
  pathFormat: "graph",
  pixelDensity: "2.0",
  progressive: "false",
  responseFormat: "json",
});

const BASE_HEADERS = {
  "User-Agent": "Argo/15.48.1 (iPhone; iOS 15.8.5; Scale/2.00)",
  "x-netflix.request.attempt": "1",
  "x-netflix.request.client.user.guid": "A4CS633D7VCBPE2GPK2HL4EKOE",
  "x-netflix.context.profile-guid": "A4CS633D7VCBPE2GPK2HL4EKOE",
  "x-netflix.request.routing": '{"path":"/nq/mobile/nqios/~15.48.0/user","control_tag":"iosui_argo"}',
  "x-netflix.context.app-version": "15.48.1",
  "x-netflix.argo.translated": "true",
  "x-netflix.context.form-factor": "phone",
  "x-netflix.context.sdk-version": "2012.4",
  "x-netflix.client.appversion": "15.48.1",
  "x-netflix.context.max-device-width": "375",
  "x-netflix.context.ab-tests": "",
  "x-netflix.tracing.cl.useractionid": "4DC655F2-9C3C-4343-8229-CA1B003C3053",
  "x-netflix.client.type": "argo",
  "x-netflix.client.ftl.esn": "NFAPPL-02-IPHONE8=1-PXA-02026U9VV5O8AUKEAEO8PUJETCGDD4PQRI9DEB3MDLEMD0EACM4CS78LMD334MN3MQ3NMJ8SU9O9MVGS6BJCURM1PH1MUTGDPF4S4200",
  "x-netflix.context.locales": "en-US",
  "x-netflix.context.top-level-uuid": "90AFE39F-ADF1-4D8A-B33E-528730990FE3",
  "x-netflix.client.iosversion": "15.8.5",
  "accept-language": "en-US;q=1",
  "x-netflix.argo.abtests": "",
  "x-netflix.context.os-version": "15.8.5",
  "x-netflix.request.client.context": '{"appState":"foreground"}',
  "x-netflix.context.ui-flavor": "argo",
  "x-netflix.argo.nfnsm": "9",
  "x-netflix.context.pixel-density": "2.0",
  "x-netflix.request.toplevel.uuid": "90AFE39F-ADF1-4D8A-B33E-528730990FE3",
  "x-netflix.request.client.timezoneid": "Asia/Dhaka",
};

const COOKIE_KEYS = ["NetflixId", "SecureNetflixId", "nfvdid", "OptanonConsent"];

function decodeVal(v) {
  if (typeof v === "string" && v.includes("%")) {
    try { return decodeURIComponent(v); } catch { return v; }
  }
  return v;
}

function extractCookies(text) {
  const dict = {};

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split("\t");
    if (parts.length >= 7) dict[parts[5]] = parts[6];
  }

  let parsed = null;
  try { parsed = JSON.parse(text); } catch {}

  if (Array.isArray(parsed)) {
    for (const c of parsed) {
      if (COOKIE_KEYS.includes(c.name) && typeof c.value === "string")
        dict[c.name] = decodeVal(c.value);
    }
  } else if (parsed && typeof parsed === "object") {
    if (COOKIE_KEYS.some((k) => k in parsed)) {
      for (const k of COOKIE_KEYS) {
        if (typeof parsed[k] === "string") dict[k] = decodeVal(parsed[k]);
      }
    } else if (Array.isArray(parsed.cookies)) {
      for (const c of parsed.cookies) {
        if (COOKIE_KEYS.includes(c.name) && typeof c.value === "string")
          dict[c.name] = decodeVal(c.value);
      }
    }
  }

  for (const key of COOKIE_KEYS) {
    if (dict[key]) continue;
    const m = text.match(new RegExp(`(?<!\\w)${key}=([^;,\\s]+)`));
    if (m) dict[key] = decodeVal(m[1]);
  }

  return dict;
}

function httpsGet(urlStr, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(urlStr, { headers, rejectUnauthorized: false }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
        } else {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error("Invalid JSON response")); }
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("Request timeout")); });
  });
}

function formatExpiry(ts) {
  if (typeof ts !== "number") return "Unknown";
  if (String(ts).length === 13) ts = Math.floor(ts / 1000);
  try {
    return new Date(ts * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC";
  } catch {
    return String(ts);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) }; }

  const rawCookie = (body.cookie || "").trim();
  if (!rawCookie) {
    return { statusCode: 400, body: JSON.stringify({ error: "Please provide a cookie." }) };
  }

  const cookies = extractCookies(rawCookie);
  const netflixId = cookies["NetflixId"];
  if (!netflixId) {
    return { statusCode: 400, body: JSON.stringify({ error: "NetflixId not found in the provided cookie." }) };
  }

  const fullUrl = `${API_URL}?${QUERY_PARAMS.toString()}`;
  const headers = { ...BASE_HEADERS, Cookie: `NetflixId=${netflixId}` };

  try {
    const data = await httpsGet(fullUrl, headers);
    const tokenData = data?.value?.account?.token?.default ?? {};
    const token = tokenData.token;
    const expires = tokenData.expires;

    if (!token) {
      return { statusCode: 400, body: JSON.stringify({ error: "No token found in Netflix response." }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://netflix.com/unsupported?nftoken=" + token,
        expires: formatExpiry(expires),
      }),
    };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: "Request failed: " + err.message }) };
  }
};
