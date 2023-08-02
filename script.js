import http from 'k6/http';
import { exec } from 'k6/execution';

export let options = {
  vus: 10, // Количество виртуальных пользователей
  iterations: 100, // Общее количество итераций
};

export default function () {
  crawlSimilarApps('com.example.app'); // Замените 'com.example.app' на начальный пакет вашего приложения на Google Play Store
}

async function crawlSimilarApps(packageName) {
  const BASE_URL = `https://play.google.com/store/apps/details?id=${packageName}`;
  const response = http.get(BASE_URL);

  check(response, {
    'is status 200': (r) => r.status === 200,
  });

  // Вместо использования chromium, мы будем использовать k6 как браузер.
  const k6Browser = new exec.Browser();
  const context = k6Browser.newContext();
  const page = context.newPage();

  // Загружаем страницу для обработки динамических элементов
  await page.goto(BASE_URL);

  // Найдите блок "Похожие игры" и кликните по первой ссылке.
  const similarGamesLink = page.locator('.WHE7ib a');
  await Promise.all([page.waitForNavigation(), similarGamesLink.click()]);

  // Проверьте, появляется ли на странице элемент с классом "captcha".
  const captchaElement = page.locator('.captcha');
  if (await captchaElement.isVisible()) {
    console.log('Captcha detected');
    return;
  }

  // Если captcha не обнаружена, получим пакеты похожих приложений на этой странице
  const similarApps = await extractSimilarApps(page);
  for (const appPackage of similarApps) {
    if (appPackage !== packageName) {
      crawlSimilarApps(appPackage); // Рекурсивно вызываем crawlSimilarApps для каждого похожего приложения
    }
  }

  // Закрыть страницу и браузер после завершения обхода текущей страницы
  page.close();
  context.close();
}

async function extractSimilarApps(page) {
  await page.waitForSelector('.WHE7ib a');
  const similarAppsLinks = page.locatorAll('.WHE7ib a');
  const similarApps = [];
  for (const link of similarAppsLinks) {
    const href = await link.getAttribute('href');
    const match = href.match(/id=([\w.]+)/);
    if (match && match[1]) {
      similarApps.push(match[1]);
    }
  }
  return similarApps;
}
