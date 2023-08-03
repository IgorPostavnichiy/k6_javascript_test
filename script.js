import http from 'k6/http';
import { parseHTML } from 'k6/html';
import { Counter } from 'k6/metrics';
import { sleep } from 'k6';

const allErrors = new Counter('error_counter');
const successfulPagesCounter = new Counter('successful_pages');

export let options = {
  vus: 1,
  duration: '10m', // Adjust the duration to 10 minutes
  thresholds: {
    'error_counter': [
      'count < 10', // 10 or fewer total errors are tolerated
    ],
  },
};

const BASE_URL = 'https://play.google.com/store/games';
const MAX_PAGES = 100;
let crawledPages = 0;

export default function () {
  crawledPages = 0; // Reset the crawledPages counter for each new iteration
  crawl(BASE_URL, 0);
}

function crawl(url, depth) {
  if (crawledPages >= MAX_PAGES) {
    return;
  }

  console.log('Crawling URL:', url);

  try {
    const response = http.get(url);

    if (response.status === 200) {
      successfulPagesCounter.add(1); // Increase the counter for successfully loaded pages
      crawledPages++; // Increase the crawledPages counter

      const body = response.body;
      const parsedHTML = parseHTML(body);

      // Find the block "Similar Apps"
      const similarAppsBlock = parsedHTML.find('.LkLjZd.ScJHi.HPiPcc').first();

      if (similarAppsBlock) {
        // Find the first link in the "Similar Apps" block
        const firstSimilarAppLink = similarAppsBlock.find('a').first();

        if (firstSimilarAppLink) {
          const similarAppURL = firstSimilarAppLink.attr('href');

          // Make a request to the URL of the first similar app
          http.get(similarAppURL);

          // Check if there's an element with the class "captcha" on the page
          const captchaElement = parsedHTML.find('.captcha').first();

          if (captchaElement) {
            allErrors.add(1); // Increase the error counter (captcha detected)
            console.log('Captcha detected on URL:', url);
          }
        }
      }

      // Recursively crawl the next pages
      const nextPageLink = parsedHTML.find('a.RDPZE').last();
      if (nextPageLink) {
        const nextPageURL = nextPageLink.attr('href');

        // Check that nextPageURL is not empty and does not contain "#<nil>"
        if (nextPageURL && nextPageURL !== '#<nil>') {
          crawl(nextPageURL, depth + 1);
        }
      }
    } else {
      allErrors.add(1); // Increase the error counter (failed to load the page)
      console.error('Failed to load URL:', url, '- Status:', response.status);
    }
  } catch (error) {
    allErrors.add(1);
    console.error('Error occurred while crawling URL:', url, '- Error:', error.message);
  }

  // Wait for a moment before proceeding to the next iteration
  sleep(3);
}
<<<<<<< HEAD
<<<<<<< HEAD


=======
>>>>>>> f38e2b6 (add changes file)
=======


>>>>>>> eaba1f1 (add changes file)
