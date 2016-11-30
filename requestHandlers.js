var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'myServer',
  password : 'djangoAdmin'
});
connection.connect();

connection.query('USE myFirst;', function(err, data, fields){});  


function userCreate(response) {
  var UserCreator = function() {
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
  }};
  response.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
//  connection.query(`
//		INSERT INTO users (username, about, name, email)
//		VALUES ('dmitry', 'dmitry is admin', 'dmitry', 'dvputakov@gmail.com');`
//  , function(err, qwer){
//});
var email = 'dvpitakov@gmail.com';
var insert = `INSERT INTO users (username, about, name, email) VALUES ('dmitry', 'dmitry is admin', 'dmitry', 'dvpitakov@gmail.com')`;
var select = `SELECT about, email, id, isAnonymous, name, username FROM users WHERE email='${email}'`;
var out = UserCreator();
  connection.query()
  connection.query(text, function(err, ans) {
  out.code = 0;
  out.response.about = ans[0].about;
  out.response.email = ans[0].email;
  out.response.id = ans[0].id;
  out.response.isAnonymous = ans[0].isAnonymous;
  out.response.name = ans[0].name;
  out.response.username = ans[0].username;
  response.write(JSON.stringify(out));
  response.end();
  });
  
}

exports.userCreate = userCreate;
