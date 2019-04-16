var http = require("http"),
  exec = require("child_process").exec;
//last = exec('pdftohtml -stdout ~/Downloads/vim/vim.pdf');
function getData(callback) {
  var out = "";
  last = exec("pdftohtml -stdout ~/Downloads/vim/vim.pdf");
  last.stdout.on("data", function(data) {
    //console.log('标准输出：' + data);
    out = data;
    //out.replace("<head")
    callback(out);
  });
}
http
  .createServer(function(req, res) {
    console.log("start");
    res.writeHead(200, { "Content-Type": "text/html" });
    //res.setHeader('content-type','text/html; charset=UTF-8');
    getData(function(data) {
      //console.log(data);
      res.write(data);
      console.log("end");
    });
  })
  .listen(1337, "127.0.0.1");
console.log("Server running at http://127.0.0.1:1337/");
