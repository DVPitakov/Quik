var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'myServer',
  password : 'djangoAdmin'
});
connection.connect();

connection.query('USE myFirst;', function(err, data, fields){  
  console.log(data);  
});  
connection.query('SELECT * FROM users;', function(err, qwer){
  console.log(qwer)
});
  
connection.end();  
