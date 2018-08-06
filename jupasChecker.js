const puppeteer = require("puppeteer");
const jupasUrl = "https://app.jupas.edu.hk/JUPAS4_OFFER/";
(async () => {
  try {
    // $(".puppeteer-result-log").innerHTML.replace(/&amp;/g,"&")
    function delay(timeout) {
      return new Promise(resolve => {
        setTimeout(resolve, timeout);
      });
    }

    async function asyncForEach(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }

    const browser = await puppeteer.launch({ headless: false });
    const jupasPage = await browser.newPage();
    await jupasPage.goto(jupasUrl);
    var posted = false;
    while (!posted) {
      await jupasPage.reload();
      await jupasPage.evaluate(() => {
        try {
          return (
            !document.querySelectorAll(
              "body > div.wrapper > div > div > div.c > div > div > div > p"
            )[0].childNodes[0].nodeValue ===
            "The Main Round offer results will be announced on "
          );
        } catch (err) {
          return true;
        }
      });
      await jupasPage.waitFor(5000);
    }
    console.log("JUPAS RESULT POSTED !!!!");
  } catch (err) {
    console.error(err);
  }
})();
