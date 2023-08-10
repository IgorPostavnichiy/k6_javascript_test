import http from 'k6/http';
import { sleep } from 'k6';

const MAX_CLICKS = 100; // Максимальное количество кликов
let clickCounter = 0;

export let options = {
  vus: 1,
  duration: '10m',
};

const BASE_URL = 'https://play.google.com/store/games';

export default function () {
  clickCounter = 0; // Сбрасываем счетчик кликов перед каждой новой итерацией
  crawl(BASE_URL);
}

function crawl(url) {
  if (clickCounter >= MAX_CLICKS) {
    console.log('Reached 100 clicks. Stopping the script.');
    return;
  }

  console.log('Crawling URL:', url);

  try {
    const response = http.get(url);

    if (response.status === 200) {
      const body = response.body;

      // Проверяем, что страница содержит информацию об игре
      if (body.includes('class="oocvOe">Install</button>')) {
        clickCounter++; // Увеличиваем счетчик кликов

        // Находим ссылку на следующую игру
        const nextGameLink = body.match(/href="\/store\/apps\/details[^"]+/);
        if (nextGameLink) {
          const nextGameURL = `https://play.google.com${nextGameLink[0].substring(6)}`;
          crawl(nextGameURL);
        }
      }
    }
  } catch (error) {
    console.error('Error occurred while crawling URL:', url, '- Error:', error.message);
  }

  // Ждем некоторое время перед переходом к следующей итерации
  sleep(3);
}
