import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1,
  iterations: 100,
};

let appsVisited = 0;
let similarAppsFound = 0; // Счетчик найденных похожих приложений

export default function () {
  const baseAppId = 'https://play.google.com/store/apps/details?id=com.roblox.client';

  crawlSimilarApps(baseAppId);
  console.log(`Found ${similarAppsFound} similar apps in 100 iterations.`);
}

function crawlSimilarApps(packageName) {
  if (appsVisited >= 100) {
    console.log('Reached 100 apps. Stopping...');
    return;
  }

  const BASE_URL = `https://play.google.com/store/games/details?id=${packageName}`;
  const response = http.get(BASE_URL);

  check(response, {
    'is status 200': (r) => r.status === 200,
  });

  const similarApps = extractSimilarApps(response.body);

  if (similarApps.length === 0) {
    console.log(`No similar apps found for ${packageName}`);
    return;
  }

  for (const appPackage of similarApps) {
    if (appPackage !== packageName) {
      sleep(5);
      appsVisited++;
      similarAppsFound++; // Увеличиваем счетчик найденных похожих приложений
      crawlSimilarApps(appPackage);
    }
  }
}

function extractSimilarApps(responseBody) {
  const regex = /\/store\/apps\/details\?id=([\w.]+)/g;
  const similarApps = [];
  let match;

  while ((match = regex.exec(responseBody)) !== null) {
    if (match[1]) {
      similarApps.push(match[1]);
    }
  }

  return similarApps;
}
