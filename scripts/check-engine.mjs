import { readFileSync } from "node:fs";
import { FiltersEngine } from "@ghostery/adblocker";

const filters = readFileSync("filters/cosmetic-lite.txt", "utf8");
const engine = FiltersEngine.parse(filters, {
  loadCosmeticFilters: true,
  loadNetworkFilters: false
});

const result = engine.getCosmeticsFilters({
  url: "http://example.com/test/ad-test.html",
  hostname: "example.com",
  domain: "example.com",
  ancestors: [],
  classes: ["sponsored-card", "leaderboard-ad"],
  hrefs: [],
  ids: ["google_ads_iframe_test"],
  getBaseRules: true,
  getInjectionRules: false,
  getExtendedRules: false,
  getRulesFromDOM: true,
  getRulesFromHostname: true,
  hidingStyle: "display:none!important",
  callerContext: null
});

if (!result.styles.includes(".sponsored-card")) {
  throw new Error("Ghostery engine did not match the sponsored-card cosmetic rule.");
}

console.log("engine ok");
