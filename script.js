import http from 'k6/http';
import { check, sleep, Counter } from 'k6';

export let options = {
  vus: 1,
  iterations: 100,
};

let appsVisited = 0;
let similarAppsFound = new Counter('similar_apps_found');

export default function () {
  const baseUrl = 'https://play.google.com/store/games';

  // Запускаем краулер, начиная с раздела игр
  crawlSimilarApps(baseUrl);
}

function crawlSimilarApps(packageUrl) {
  if (appsVisited >= 100) {
    console.log('Reached 100 apps. Stopping...');
    return;
  }

  const response = http.get(packageUrl);

  check(response, {
    'is status 200': (r) => r.status === 200,
  });

  const similarApps = extractSimilarApps(response.body);

  if (similarApps.length === 0) {
    console.log(`No similar apps found for ${packageUrl}`);
    return;
  }

  appsVisited++;
  similarAppsFound.add(similarApps.length);

  for (const appPackage of similarApps) {
    if (appPackage !== packageUrl) {
      sleep(2); // Добавим задержку в 2 секунды между запросами
      const appUrl = `https://play.google.com${appPackage}`;
      crawlSimilarApps(appUrl);
    }

    if (appsVisited >= 100) {
      console.log('Reached 100 apps. Stopping...');
      return;
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
