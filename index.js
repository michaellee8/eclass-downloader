const puppeteer = require("puppeteer");
const path = require("path");
const BASE_URL = "eclass.tkpss.edu.hk";
const ECLASS_USERNAME = "y7989588";
const ECLASS_PASSWORD = "mlml1026";
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
    const loginPage = await browser.newPage();
    await loginPage.goto(`http://${BASE_URL}`);
    await loginPage.type("#UserLogin", ECLASS_USERNAME);
    await loginPage.type("#UserPassword", ECLASS_PASSWORD);
    await loginPage.click("#login_btn");
    await loginPage.waitForNavigation({ waitUntil: "networkidle0" });

    await loginPage.click(".indextabclasslist");
    // await loginPage.waitForNavigation({ waitUntil: "load" });
    // await page.goto(`http://${BASE_URL}/home/eLearning/login.php`);
    await loginPage.waitFor(500);

    const runningPage = await browser.newPage();
    await runningPage.goto(
      `http://${BASE_URL}/eclass40/src/resource/eclass_files/files/tree_nav.php?course_id=203&categoryID=&attach=&attachment=&fieldname=`
    );
    // console.log("running fine here");
    // page.screenshot({ path: "./example.png" });
    await runningPage.evaluate(() => $("#jstree").jstree("open_all"));

    await delay(2000);

    const folderUrls = await runningPage.evaluate(() =>
      $("li[role=treeitem] > a.jstree-anchor")
        .map(function() {
          return (
            "http://eclass.tkpss.edu.hk/eclass40/src/resource/eclass_files/files/" +
            $(this).attr("href")
          );
        })
        .get()
    );
    var obj = {};
    // console.log(JSON.stringify(folderUrls));
    await asyncForEach(folderUrls, async folderUrl => {
      await runningPage.goto(folderUrl);
      const fileUrls = await runningPage.evaluate(() =>
        Array.from(document.querySelectorAll("a"))
          .map(e => ({
            link: e.href,
            name:
              e.childNodes && e.childNodes[1] && e.childNodes[1].nodeValue
                ? e.childNodes[1].nodeValue
                : null
          }))
          .filter(({ link }) =>
            link.match(/javascript:newWindow\('(.*)',\d*\)/)
          )
          .map(({ link, name }) => ({
            link:
              "http://eclass.tkpss.edu.hk/eclass40/src/resource/eclass_files/files/" +
              link.match(/javascript:newWindow\('(.*)',\d*\)/)[1],
            name
          }))
      );
      fileUrls.forEach(({ link, name }) => {
        obj[link] = name;
      });
    });

    // await runningPage.screenshot({ path: "example.png" });
    // await runningPage._client.send("Page.set");
    const result = Object.entries(obj);
    runningPage._client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: path.resolve("./downloaded_files")
    });
    await asyncForEach(result, async ([link, name]) => {
      await runningPage.evaluate(
        (link, name) => {
          function downloadURI(uri, name) {
            var link = document.createElement("a");
            link.download = name;
            link.href = uri;
            link.target = "_blank";
            link.click();
          }
          downloadURI(link, name);
        },
        link,
        name
      );
      await runningPage.waitFor(250);
    });

    // const downloadPage = await browser.newPage();
    // await downloadPage.goto(result[0][0]);
    // const cookies = await downloadPage.evaluate(() => document.cookie);
    // await browser.close();

    // console.log(result.length);
    // result.forEach(([link, name]) => console.log(link, name));
    // console.log(cookies);
  } catch (err) {
    console.error(err);
  }
})();
