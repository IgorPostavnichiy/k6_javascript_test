import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

export let options = {
  vus: 1,
  iterations: 1, // Мы будем запускать только одну итерацию в функции crawlSimilarApps
};

let appsVisited = new Counter('apps_visited');
let similarAppsFound = new Counter('similar_apps_found');

export default function () {
  const baseAppId = 'com.zeptolab.ctr.ads';

  crawlSimilarApps(baseAppId, 0);
  console.log(`Found ${similarAppsFound.value} similar apps after 100 clicks.`);
}

function crawlSimilarApps(packageName, attempts) {
  if (attempts >= 100) {
    console.log('Reached 100 clicks. Stopping...');
    return;
  }

  const BASE_URL = `https://play.google.com/store/apps/details?id=${packageName}`;
  const response = http.get(BASE_URL);

  check(response, {
    'is status 200': (r) => r.status === 200,
  });

  const similarApps = extractSimilarApps(response.body);

  if (similarApps.length === 0) {
    console.log(`No similar apps found for ${packageName}`);
    return;
  }

  appsVisited.add(1);

  for (const appPackage of similarApps) {
    if (appPackage !== packageName) {
      sleep(5);
      similarAppsFound.add(1);
      crawlSimilarApps(appPackage, attempts + 1);
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
