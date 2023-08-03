import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { sleep } from 'k6';

let numIterations = 100;
let appCounter = 0;
let clickCounter = 0;

export let options = {
  vus: 1,
  duration: '20m', // Устанавливаем длительность выполнения теста
};

export let successfulLoads = new Counter('Successful Loads');

export default function () {
  const baseAppId = 'com.sinyee.babybus.world';
  crawlSimilarApps(baseAppId);
}

function crawlSimilarApps(packageName) {
  if (successfulLoads.value >= 100) {
    console.log('Достигнуто 100 успешных проверок. Завершение теста.');
    return;
  }

  const BASE_URL = `https://play.google.com/store/apps/details?id=${packageName}`;
  sleep(Math.random() * 5 + 5);

  const response = http.get(BASE_URL, { timeout: '30s' });
  successfulLoads.add(1);

  appCounter++;
  console.log(`Проверено приложение: ${packageName}, Всего проверено приложений: ${appCounter}`);

  const similarApps = extractSimilarApps(response.body);

  for (const appPackage of similarApps) {
    if (appPackage !== packageName && clickCounter < 100) {
      clickCounter++;
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
