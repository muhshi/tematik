const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set a realistic User-Agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
  
  console.log("Navigating to BPS Jateng...");
  try {
    await page.goto('https://jateng.bps.go.id/id/statistics-table/1/MjIwNSMx/jumlah-penduduk-menurut-kabupaten-kota-dan-jenis-kelamin-di-provinsi-jawa-tengah.html', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for the table to load
    await page.waitForSelector('#table-data', { timeout: 10000 }).catch(() => console.log("Table not found in 10s"));
    
    const html = await page.content();
    if (html.includes("Jawa Tengah")) {
      console.log("SUCCESS: Found 'Jawa Tengah' in HTML!");
      const title = await page.title();
      console.log("Page Title:", title);
    } else {
      console.log("FAILED to find data. HTML snippet:");
      console.log(html.substring(0, 500));
    }
  } catch (err) {
    console.error("Puppeteer Error:", err);
  } finally {
    await browser.close();
  }
})();
