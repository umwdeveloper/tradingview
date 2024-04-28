const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000; // Use the PORT environment variable if available, otherwise use port 3000

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchOnTradingView(query) {
    // Launch a headless browser
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] }); // Change to headless: true for production
    const page = await browser.newPage();

    try {
        await page.setDefaultNavigationTimeout(0);
        // Navigate to TradingView screener page
        await page.goto('https://www.tradingview.com/screener/', { waitUntil: 'networkidle0' });

        await page.click('.tv-header-search-container');

        await page.waitForSelector('.input-KLRTYDjH');

        // Type the query into the search input
        await page.type('.input-KLRTYDjH', query);

        // Wait for a brief period for results to load
        // await page.waitForTimeout(1000);
        // await page.waitForNavigation({ waitUntil: 'networkidle0' });
        // await sleep(1000);
        await page.waitForSelector('.listContainer-dlewR1s1 .description-oRSs8UQo');

        // Extract symbol from the first item
        const symbol = await page.$eval('.listContainer-dlewR1s1 .description-oRSs8UQo', el => el.innerText.trim());

        // Create TradingView search URL
        const searchUrl = "https://www.tradingview.com/chart/?symbol=" + symbol;

        console.log("Search URL:", searchUrl);

        return searchUrl;
    } catch (error) {
        console.error("Error:", error);
        return null;
    } finally {
        // Close the browser
        await browser.close();
    }
}

app.get('/', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter' });
    }

    const searchUrl = await searchOnTradingView(query);
    if (!searchUrl) {
        return res.status(500).json({ error: 'Failed to fetch search URL' });
    }

    res.json({ searchUrl });
});

app.listen(port, () => {
    console.log(`Server is listening at Port:${port}`);
});
