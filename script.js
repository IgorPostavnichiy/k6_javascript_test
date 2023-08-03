import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

export let options = {
  vus: 1,
  iterations: 100, // Указываем, что нужно выполнить 100 итераций
};

// Создаем счетчик для успешных кликов
export let successfulLoads = new Counter('Successful Loads');

export default function () {
  const baseAppId = 'com.sinyee.babybus.world';
  let appsVisited = 0; // Счетчик для общего количества кликов

  crawlSimilarApps(baseAppId, appsVisited);
}

function crawlSimilarApps(packageName, appsVisited) {
  if (appsVisited >= options.iterations) {
    console.log(`Reached ${options.iterations} apps. Stopping...`);
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

  for (const appPackage of similarApps) {
    if (appPackage !== packageName) {
      sleep(5);
      appsVisited++;
      crawlSimilarApps(appPackage, appsVisited);

      // Проверяем, достигнуто ли максимальное количество кликов
      if (appsVisited >= options.iterations) {
        console.log(`Reached ${options.iterations} apps. Stopping...`);
        return;
      }
    }
  }

  // Увеличиваем счетчик успешных кликов при успешной загрузке страницы
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
