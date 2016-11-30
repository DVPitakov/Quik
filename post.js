var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'myServer',
  password : 'djangoAdmin'
});
connection.connect();

connection.query('USE myFirst;', function(err, data, fields){});  
function UserCreator() {
    return {
    	code: 0,
    	response: {
       	 	about: "",
        	email: "",
        	id: 0,
			isAnonymous: false,
        	name: "",
        	username: ""
    	}
	}
};
function ErrorMessage() {
	return {
		code: 4,
		response: "error message"
	}
}

var http = require('http');
 
var port = 8081;
 
var s = http.createServer();
s.on('request', function(request, response) {
    response.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
    var method = request.method;
    var headers = request.headers;
    var url = request.url;
 
    var data = '';

    request.on('data', function(chunk) {
        data += chunk.toString();
    });

    request.on('end', function() {
        var insert = `INSERT INTO users (username, about, name, email) VALUES ('${data.username}', '${data.about}', '${data.name}', '${data.email}');`;
		var select = `SELECT about, email, id, isAnonymous, name, username FROM users WHERE email='${data.email}';`;
        if (method == "POST" && url == "/db/api/user/create/") {
        data = JSON.parse(data);
		var counter = 0;
        connection.query(insert, function(err, ans) {});
  		connection.query(select, function(err, ans) {
			if(ans && ans[0] && (out.code == 0)) {
  			out.response.about = ans[0].about;
  			out.response.email = ans[0].email;
  			out.response.id = ans[0].id;
  			out.response.isAnonymous = ans[0].isAnonymous;
  			out.response.name = ans[0].name;
  			out.response.username = ans[0].username;
    		} 
            response.write(JSON.stringify(out));
  			response.end();
  		});
		}
        else response.end();
    });
 
});
 
s.listen(port);
console.log('Browse to http://127.0.0.1:' + port);
