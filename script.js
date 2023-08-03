import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1,
  iterations: 100,
};

const BASE_URL = 'https://play.google.com/store/apps/details?id=com.example.app';
const visitedApps = new Set();

export default function () {
  crawlSimilarApps(BASE_URL);
}

function crawlSimilarApps(url) {
  if (visitedApps.size >= 100) {
    console.log('Crawling completed.');
    return;
  }

  if (visitedApps.has(url)) {
    return;
  }

  const response = http.get(url);

  check(response, {
    'is status 200': (r) => r.status === 200,
  });

  visitedApps.add(url);

  const similarApps = extractSimilarApps(response.body);
  for (const appPackage of similarApps) {
    const appUrl = `https://play.google.com/store/apps/details?id=${appPackage}`;
    if (!visitedApps.has(appUrl)) {
      crawlSimilarApps(appUrl);
    }
  }

  // Wait for a short period between requests to avoid overwhelming the server
  sleep(2);
}

function extractSimilarApps(html) {
  const regex = /<a\s+class="Rb\+Ml"\s+href="\/store\/apps\/details\?id=([\w.]+)/g;
  let match;
  const similarApps = [];

  while ((match = regex.exec(html))) {
    similarApps.push(match[1]);
  }

  return similarApps;
}
