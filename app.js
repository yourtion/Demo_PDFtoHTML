/**
 * Module dependencies.
 */

var express = require("express");
var routes = require("./routes");
var http = require("http");
var path = require("path");
var fs = require("fs");
var exec = require("child_process").exec;
var bodyParser = require("body-parser")

var app = express();

// all environments
app.set("port", process.env.PORT || 3000);
app.set("views", __dirname + "/views");
app.set("view engine", "jade");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "pdf")));
app.use(bodyParser.urlencoded({ extended: true, uploadDir: "/upload" }));
//PDF转换
function getData(file, callback) {
  //PDF文件转换为HTML
  last = exec("pdftohtml -p -noframes " + file);
  last.stdout.on("data", function(data) {
    //console.log('标准输出：' + data);
    callback(file.replace(".pdf", ".html"));
  });
}
//转换文件处理
function proData(file, opt, callback) {
  getData(file, function(file2) {
    console.log(file2);
    fs.readFile(file2, "utf8", function(err, data) {
      //console.log(data);
      var data2 = data;
      if (opt["nsp"] == "on") {
        data2 = data2.replace(/\s+/g, ""); //去空格
        //去掉特定空格
        data2 = data2.replace(/&#160;/gi, "");
      }
      if (opt["n"] == "on") {
        //去换行符
        data2 = data2.replace(/\n/gi, "");
      }
      if (opt["br"] == "on") {
        //保留。！？的br标签
        data2 = data2.replace(/。<br\/>/gi, "。<br/></p><p>");
        data2 = data2.replace(/！<br\/>/gi, "！<br/></p><p>");
        data2 = data2.replace(/？<br\/>',/gi, "？<br/></p><p>");
        //去br标签
        data2 = data2.replace(/<br\/>/gi, "");
        //image标签处理
        data2 = data2.replace(/<img/gi, "</p><p><img");
        data2 = data2.replace(/"\/>/gi, '" /></p><p>');
        data2 = data2.replace(/<imgsrc/gi, "<img src");
        data2 = data2.replace(/src=".\/pdf\//gi, 'src="');
      }
      if (opt["html"] == "on") {
        //去除除img和p外的所有标签
        data2 = data2.replace(/<(?!img|p|\/p).*?>/gi, "");
        //补齐p标签
        data2 = "<p>" + data2 + "</p>";
        //去除多余的p标签
        data2 = data2.replace(/<p><\/p>/gi, "");
      }
      //覆盖写文件
      fs.writeFile(file2, data2, function(err) {
        if (err) throw err;
        console.log("It's saved!");
        callback("OK!");
      });
    });
  });
}

app.get("/", routes.index);
app.get("/pdf/:img", function(req, res) {
  res.redirect(req.params.img);
});
app.post("/upload", function(req, res) {
  // 获得文件的临时路径
  var date = new Date();
  var tmp_path = req.files.pdf.path;
  console.log(tmp_path);
  // 指定文件上传后的目录 - 示例为"pdf"目录。
  var target_path = "./pdf/" + req.files.pdf.name;
  console.log(target_path);
  // 移动文件
  fs.rename(tmp_path, target_path, function(err) {
    if (err) throw err;
    // 删除临时文件夹文件,
    fs.unlink(tmp_path, function() {
      if (err) throw err;
      //            console.log(req.body.pro);
      //            opt= req.body.pro;
      //res.send('File uploaded to: ' + target_path + ' - ' + req.files.pdf.size + ' bytes');
      proData(target_path, req.body.pro, function call(data) {
        //跳转到转换文件
        res.redirect("/" + req.files.pdf.name.replace("pdf", "html"));
      });
    });
  });
});

http.createServer(app).listen(app.get("port"), function() {
  console.log("Express server listening on port " + app.get("port"));
});
