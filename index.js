var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

var handle = {}
handle["/db/api/user/create/"] = requestHandlers.userCreate;
console.log(handle);
server.start(router.route, handle);

