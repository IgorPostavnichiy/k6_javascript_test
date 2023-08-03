import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  iterations: 100,
};

export default function () {
  crawlSimilarApps('com.example.app');
}

async function crawlSimilarApps(packageName) {
  const BASE_URL = `https://play.google.com/store/apps/details?id=${packageName}`;
  const response = http.get(BASE_URL);

  check(response, {
    'is status 200': (r) => r.status === 200,
  });

  const context = new BrowserContext();
  const page = context.newPage();

  await page.goto(BASE_URL);

  const similarGamesLink = page.locator('.WHE7ib a');
  await Promise.all([page.waitForNavigation(), similarGamesLink.click()]);

  const captchaElement = page.locator('.captcha');
  if (await captchaElement.isVisible()) {
    console.log('Captcha detected');
    return;
  }

  const similarApps = await extractSimilarApps(page);
  for (const appPackage of similarApps) {
    if (appPackage !== packageName) {
      crawlSimilarApps(appPackage);
    }
  }

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
