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

    const keypress = async () => {
      process.stdin.setRawMode(true);
      return new Promise(resolve =>
        process.stdin.once("data", data => {
          const byteArray = [...data];
          if (byteArray.length > 0 && byteArray[0] === 3) {
            console.log("^C");
            process.exit(1);
          }
          process.stdin.setRawMode(false);
          resolve();
        })
      );
    };
    async function asyncForEach(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }

    function dumpFrameTree(frame, indent) {
      console.log(indent + frame.url());
      for (let child of frame.childFrames())
        dumpFrameTree(child, indent + "  ");
    }

    const browser = await puppeteer.launch({ headless: false, timeout: 0 });
    const loginPage = await browser.newPage();
    await loginPage.goto(`http://${BASE_URL}`);
    console.log(`Goto ${`http://${BASE_URL}`}`);
    await loginPage.type("#UserLogin", ECLASS_USERNAME);
    await loginPage.type("#UserPassword", ECLASS_PASSWORD);
    await loginPage.click("#login_btn");
    await loginPage.waitForNavigation({ waitUntil: "networkidle0" });

    await loginPage.click(".indextabclasslist");
    console.log(`Clicked cookie obtaining link`);
    // await loginPage.waitForNavigation({ waitUntil: "load" });
    // await page.goto(`http://${BASE_URL}/home/eLearning/login.php`);
    await loginPage.waitFor(1000);
    await loginPage.goto(
      `http://${BASE_URL}/eclass40/src/resource/eclass_files/eclass_files.php`
    );
    console.log(
      `Goto tree page at ${loginPage
        .mainFrame()
        .childFrames()[0]
        .childFrames()[1]
        .url()}`
    );
    await loginPage.goto(
      loginPage
        .mainFrame()
        .childFrames()[0]
        .childFrames()[1]
        .url()
    );
    const classrooms = await loginPage.evaluate(() =>
      Array.from($("select[name=course_id]")[0]).map(({ value, text }) => ({
        value,
        text
      }))
    );
    console.log(classrooms);
    // return;

    const runningPage = await browser.newPage();
    await asyncForEach(
      classrooms.slice(9, classrooms.length),
      async ({ value: classValue, text: classText }) => {
        await runningPage.goto(
          `http://${BASE_URL}/eclass40/src/resource/eclass_files/files/tree_nav.php?course_id=${classValue}&categoryID=&attach=&attachment=&fieldname=`
        );
        // console.log("running fine here");
        // page.screenshot({ path: "./example.png" });
        await runningPage.evaluate(() => $("#jstree").jstree("open_all"));
        console.log(`Fetched folder structure of ${classText}`);

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
        console.log(`Got File URL results`);
        runningPage._client.send("Page.setDownloadBehavior", {
          behavior: "allow",
          downloadPath: path.resolve(`./downloaded_files_2/${classText}`)
        });
        await asyncForEach(result, async ([link, name], index) => {
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
          console.log(
            `Initiated download at ${classText} of ${name}, ${index + 1}/${
              result.length
            } triggered`
          );
        });
        console.log(
          `Press any key expect Crtl+C to start downloading next classroom`
        );
        await keypress();
      }
    );

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
