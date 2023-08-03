import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { sleep } from 'k6';

let numIterations = 100;
let appCounter = 0;
let clickCounter = 0;

export let options = {
  vus: 1,
  iterations: numIterations, // Устанавливаем количество итераций прямо здесь
  duration: null, // Убираем указание длительности, чтобы использовать только количество итераций
};

export let successfulLoads = new Counter('Successful Loads');

export default function () {
  const baseAppId = 'com.sinyee.babybus.world';
  crawlSimilarApps(baseAppId);
}

function crawlSimilarApps(packageName) {
  const BASE_URL = `https://play.google.com/store/apps/details?id=${packageName}`;
  sleep(Math.random() * 5 + 5);

  const response = http.get(BASE_URL, { timeout: '30s' });
  successfulLoads.add(1);

  appCounter++;
  console.log(`Проверено приложение: ${packageName}, Всего проверено приложений: ${appCounter}`);

  const similarApps = extractSimilarApps(response.body);

  if (similarApps.length === 0 || clickCounter >= 100) {
    console.log('Завершение проверки приложений.');
    return;
  }

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
