var http = require("http");
var fs = require("fs");

var download = function(url, dest, cookie, cb) {
  const { hostname, pathname: path, port } = new URL(url);

  var file = fs.createWriteStream(dest);
  var request = http.get(
    { hostname, path, port: 80, headers: { Cookie: cookie } },
    function(response) {
      response.pipe(file);
      file.on("finish", function() {
        file.close(cb);
      });
    }
  );
};

download(
  "http://eclass.tkpss.edu.hk/eclass40/src/resource/eclass_files/files/open.php?courseID=203&categoryID=1&folderID=1313&isImageOnly=&fromPage=&isFromFck=&fid=1313&courseID=203",
  "./1718s6a_ict2_q.pdf",
  "ck_memberType_classB=S; ck_current_cid=203; ck_user_email_client=ckmichac18%40gmail.com; PHPSESSID=e1fi18bgkroee28flf28voppf4",
  () => {}
);
