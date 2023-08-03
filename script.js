import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

let numIterations = 100;

export let options = {
  vus: 1,
  iterations: 1,
  duration: '10m',
};

export let successfulLoads = new Counter('Successful Loads');

export default function () {
  const baseAppId = 'com.sinyee.babybus.world';
  let appsVisited = 0;

  crawlSimilarApps(baseAppId, appsVisited);
}

function crawlSimilarApps(packageName, appsVisited) {
  if (appsVisited >= numIterations) {
    console.log(`Reached ${numIterations} apps. Stopping...`);
    return;
  }

  const BASE_URL = `https://play.google.com/store/apps/details?id=${packageName}`;

  // Используем ожидание между запросами с помощью sleep
  sleep(Math.random() * 5 + 5); // Ожидание от 5 до 10 секунд

  const response = http.get(BASE_URL, { timeout: '30s' }); // Увеличиваем время ожидания для запроса

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
      appsVisited++;
      crawlSimilarApps(appPackage, appsVisited);

      if (appsVisited >= numIterations) {
        console.log(`Reached ${numIterations} apps. Stopping...`);
        return;
      }
    }
  }

  successfulLoads.add(1);
}

function extractSimilarApps(responseBody) {
  const regex = /\/store\/apps\/details\?id=([\w.]+)/g;
  const similarApps = [];
  let match;

  while ((match = regex.exec(responseBody)) !== null) {
    if (match[1]) {
      similarApps.push(match[1]);
      console.log(`Found similar app: ${match[1]}`);
    }
  }

  return similarApps;
}

