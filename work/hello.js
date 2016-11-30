var express = require('express');
var bodyParser = require("body-parser");
var app = express();
var mysql = require('mysql');
var url = require('url');
var connection = mysql.createConnection({
    multipleStatements: true,
    host: 'localhost',
    user: 'dmitry',
    password: 'admin',
    charset: 'UTF8_GENERAL_CI'
});

connection.connect();
connection.query('USE forum;', function (err, data, fields) {
    //connection.query('TRUNCATE forums; TRUNCATE users; TRUNCATE threads; TRUNCATE posts; TRUNCATE table followers;');
});



function addFollowers(arr, connection, callback) {
    function getUser() {
        if (!!arr && !!arr[i]) {
            connection.query("SELECT secondUser FROM followers WHERE firstUser = ?", [arr[i].uemail], function (err, ans) {
                if (err) {
                    console.log("err 182124");
                }
                else {
                    followersCore(ans);
                }
            });
        }
        else {
            callback(arr);
        }
    }

    function followersCore(obj) {
        arr[i].followers = obj.map(el=> {return el.secondUser});
        i++;
        getUser();
    }
    var i = 0;
    getUser();

}

function addFollowing(arr, connection, callback) {
    function getUser() {
        if (!!arr && !!arr[i]) {
            connection.query("SELECT firstUser FROM followers WHERE secondUser = ?", [arr[i].uemail], function (err, ans) {
                if (err) {
                    console.log("err 181902");
                }
                else {
                    followingCore(ans);
                }
            });
        }
        else {
            callback(arr);
        }
    }

    function followingCore(obj) {
        arr[i].following = obj.map(el=> {return el.firstUser});
        i++;
        getUser();

    }
    var i = 0;
    getUser();

}

function sqlTail(data, order) {
    if(!!data.order && data.order == "asc")  {
        data.order = "ASC"
    }
    else {
        data.order = "DESC"
    }
    sql += `ORDER BY ${order}`
    if(!!data.limit) {
        sql += ` LIMIT ${data.limit}`
    }
}


var ForumCreateOut = require('./msgCreators').ForumCreateOut;
var ClearOut = require('./msgCreators').ClearOut;
var ErrorOut = require('./msgCreators').ErrorOut;
var UserDetailsOut = require('./msgCreators').UserDetailsOut;
var UserCrateOut = require('./msgCreators').UserCrateOut;
var ForumDetailsOut = require('./msgCreators').ForumDetailsOut;
var ThreadCreateOut = require('./msgCreators').ThreadCreateOut;
var PostsCreateOut = require('./msgCreators').PostsCreateOut;
var ShowUser = require('./msgCreators').ShowUser;
var PostRemoveOut = require('./msgCreators').PostRemoveOut;
var ShowPost = require('./msgCreators').ShowPost;
var ShowThread = require('./msgCreators').ShowThread;
var ShowPost = require('./msgCreators').ShowPost;
var ShowForum = require('./msgCreators').ShowForum;
var find = require('./msgCreators').find;

app.use(bodyParser.json());

app.get('/db/api/status/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var sql = 'SELECT * FROM (SELECT COUNT(*) AS user FROM users) AS user,' +
        '(SELECT COUNT(*) AS thread FROM threads) AS  thread,' +
        '(SELECT COUNT(*) AS forum FROM forums) AS forum,' +
        '(SELECT COUNT(*) AS post FROM posts) AS post;';
    //console.log(sql);
    connection.query(sql, function (err, ans) {
        if (!err) {
            res.send(StatusOut(ans[0].user, ans[0].thread, ans[0].forum, ans[0].post));
        }
        else {
            res.send(ErrorOut(4));
        }
    });
});

app.post('/db/api/clear/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    connection.query('TRUNCATE forums; TRUNCATE users; TRUNCATE threads; TRUNCATE posts; TRUNCATE table followers;', function (err, ans) {
        if (!err) {
            res.send(ClearOut());
        }
        else {
            res.send(ErrorOut(4));
        }
    });
});

//POST

app.post('/db/api/post/create/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var data = req.body;
    if (!!data.date && !!data.thread && !!data.message && !!data.user && !!data.forum) {
        connection.query('SELECT * FROM users, forums, threads WHERE (users.uemail = ?) AND (forums.fshort_name = ?) AND (threads.tid = ?)',
            [data.user, data.forum, data.thread],
            function (err, ans) {
                if (!err) {
                    if (ans && ans[0]) {
                        connection.query('INSERT INTO posts (pparent, pisApproved, pisHighlighted, pisEdited, pisSpam, pisDeleted, pdate, pthread, pmessage, puser, pforum) VALUES (?,?,?,?,?,?,?,?,?,?,?);',
                            [data.parent, data.isApproved || false, data.isHighlighted || false, data.isEdited || false, data.isSpam || false, data.isDeleted || false, data.date, data.thread, data.message, data.user, data.forum],
                            function (err, ans) {
                                if (!err) {
                                    var query = connection.query('SELECT posts.* FROM posts WHERE posts.pid = ?', [ans.insertId], function (err, ans) {
                                        if (!err) {
                                            res.send(JSON.stringify(PostsCreateOut(ans[0])));

                                        }
                                        else {
                                            console.log("err 181804");
                                            console.log(ErrorOut(4));
                                            res.send(ErrorOut(4));
                                        }
                                    });
                                }
                                else {
                                    console.log("err 180148");
                                }
                            });
                    }
                    else {
                        res.send(ErrorOut(4));
                    }
                }
                else {
                    console.log("err 180131");
                }

            }
        );
    }
    else {
        res.send(ErrorOut(4));
    }
});

app.get('/db/api/post/details/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var data = req.query;
    if (!!data.post) {
        ShowPost(data.post, connection, function (out) {
            res.send(out)
        }, data.related)
    }
    else {
        res.send(ErrorOut(3));
    }
});

app.post('/db/api/post/update/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var data = req.body;
    if (!!data.post && !!data.message) {
        connection.query('UPDATE posts SET pmessage = ? WHERE posts.pid = ?',
            [data.message, data.post],
            function (err, ans) {
                if (!err) {
                    ShowPost(data.post, connection, function (data) {
                        res.send(data)
                    });
                }
                else {
                    console.log("err 180136");
                }
            });

    }
    else {
        res.send(ErrorOut(4));
    }
});

app.post('/db/api/post/remove/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var data = req.body;
    if (!!data.post) {
        connection.query('SELECT * FROM posts WHERE pid = ?',
            [data.post],
            function (err, ans) {
                if (!err) {
                    connection.query(`UPDATE posts SET pisDeleted = true WHERE pid = ${data.post}`, function (err, ans) {
                        if (!err) {
                            res.send(PostRemoveOut({post: data.post}));
                        }
                        else {
                            console.log('ERROR PR2');
                        }
                    });
                }
                else {
                    console.log('err 180135');
                }
            });

    }
    else {
        console.log(ErrorOut(4));
        res.send(ErrorOut(4));
    }
});

//THREAD

app.post('/db/api/thread/close/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var thread = req.body.thread;
    if (!!thread) {
        var sql = connection.query(`UPDATE threads SET tisClosed = 1 WHERE tid = ?`,
            [thread],
            function (err, ans) {
                if (!err) {
                  res.send(
                      JSON.stringify({
                          code: 0,
                          response: {
                              thread: thread
                          }
                      })
                  );
                }
                else {
                    console.log("err 182138");
                    res.send(ErrorOut(4));
                }
            });
    }
    else {
        res.send(ErrorOut(3));
    }
});

app.post('/db/api/thread/create/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var data = req.body;
    if (!!data.forum && !!data.title && !!data.isClosed && !!data.user && !!data.message && !!data.slug && !!data.date) {
        connection.query(`SELECT users.uemail FROM users, forums WHERE users.uemail = ? AND forums.fshort_name = ?`,
            [data.user, data.forum],
            function (err, ans) {
                if (!err) {
                    if (!!ans[0]) {
                        connection.query('INSERT INTO threads (tdate, tforum, ttitle, tisClosed, tisDeleted, tuser, tmessage, tslug) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                            [data.date, data.forum, data.title, data.isClosed, data.isDeleted || false, data.user, data.message, data.slug], function (err, ans) {
                                if (!err) {
                                    var tvar = ans.insertId;
                                    connection.query('SELECT * FROM threads WHERE tid = ?', [ans.insertId], function (err, ans) {
                                        if (!err) {
                                            res.send(ThreadCreateOut(ans[0]));
                                        } else {
                                            console.log("err 181752");
                                            res.send(ErrorOut(4));
                                        }
                                    });
                                }
                                else {
                                    console.log("err 181757");
                                }
                            });
                    }
                    else {
                        console.log("err 181705");
                        res.send(ErrorOut(2));
                    }
                }
                else {
                    console.log("err 181704");
                    res.send(ErrorOut(4));
                }
            });
    }
    else {
        res.send(ErrorOut(3));
    }
});

app.get('/db/api/thread/details/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    console.log("thread/details " + req.query.thread);
    var data = req.query;
    if (!!data.thread) {
        ShowThread(data.thread, connection, function (out) {
            res.send(out)
        }, data.related)
    }
    else {
        res.send(ErrorOut(3));
    }
});

app.get('/db/api/thread/list/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var forum = req.query.forum;
    var related = req.query.related;
    var since = req.query.since;
    if (!!req.query.related) {
        var withForum = find(req.query.related, 'forum');
        var withUser = find(req.query.related, 'user');
    }
    var order = (req.query.order == "asc") ? "ASC" : "DESC";
    var limit = req.query.limit;
    var select = "SELECT DISTINCT * FROM threads ";
    if (withForum) select += ",forums ";
    if (withUser) select += ",users "
    select += `WHERE (threads.tforum = '${forum}') `;
    if (withForum) select += " AND (threads.tforum = forums.fshort_name)";
    if (withUser) select += " AND (threads.tuser = users.uemail)"
    if (!!since) select += ` AND (threads.tdate > STR_TO_DATE('${since}', '%Y-%m-%d %H:%i:%s'))`
    select += ` ORDER BY tdate ${order} `
    if (!!limit) select += `LIMIT ${limit} `
    connection.query(select, function (err, ans) {
        if (!err) {
            var resp = {
                code: 0,
                response: []
            }
            resp.response = ans.map(el=> {
                var out;
                if (withForum) {
                    el.forum = ForumDetailsOut(el).response
                }
                ;
                if (withUser) {
                    el.user = UserDetailsOut(el).response
                }
                ;
                return el;
            });
            res.send(JSON.stringify(resp));
        }
        else {
            console.log('err 172349');
            console.log(err);
        }
    });


});

//FORUM

app.post('/db/api/forum/create/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var data = req.body;
    if (!!data.name && !!data.short_name && !!data.user) {
        connection.query('SELECT * FROM users WHERE users.uemail = ?', [data.user], function (err, ans) {
            if (!err) {
                if (!!ans[0]) {
                    var ans = connection.query('INSERT INTO forums (fname, fshort_name, fuser) VALUES (?, ?, ?)',
                        [data.name, data.short_name, ans[0].uemail],
                        function (err, ans) {
                            if (!err) {
                                connection.query(`SELECT * FROM forums WHERE fshort_name = '${data.short_name}'`, function (err, ans2) {
                                    if (!err) {
                                        res.send(ForumCreateOut(ans2[0]));
                                    }
                                    else {
                                        console.log("err 180145");
                                    }
                                });
                            } else {
                                console.log("err 180152");
                                console.log(err);
                                res.send(ErrorOut(4));
                            }
                        });
                }
                else {
                    res.send(ErrorOut(2));
                }
            }
            else {
                console.log("err 180153");
                res.send(ErrorOut(4));
            }
        });
    }
    else {
        res.send(ErrorOut(3));
    }

});

app.get('/db/api/forum/details/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    if (!!req.query.forum) {
        ShowForum(req.query.forum, connection, out=> {
            res.send(out)
        }, req.query.related);
    }
    else {
        res.send(ErrorOut(3));
    }
});

app.get('/db/api/forum/listPosts/', function (req, res) {
    var forum = req.query.forum;
    var since = req.query.since;
    var limit = req.query.limit;
    var order = (req.query.order == 'asc') ? 'ASC' : 'DESC';
    var related = req.query.related;
    if (related) {
        var withTread = find(related, 'thread');
        var withForum = find(related, 'forum');
        var withUser = find(related, 'user');
    }
    if (!!forum) {
        connection.query('SELECT * FROM forums WHERE  forums.fshort_name = ?', [forum], function (err, ans) {
            if (!err) {
                if (!!ans[0]) {
                    var curForum = ans[0];
                    var select = "SELECT DISTINCT * FROM posts";
                    if (withTread) select += ", threads";
                    if (withForum) select += ", forums";
                    if (withUser) select += ", users";
                    select += ` WHERE (posts.pforum = '${forum}') `;
                    if (withTread) select += " AND (posts.pthread = threads.tid)";
                    if (withForum) select += " AND (posts.pforum = forums.fshort_name)";
                    if (withUser) select += " AND (posts.puser = users.uemail) ";
                    if (!!since) select += ` AND (posts.pdate >= STR_TO_DATE('${since}', '%Y-%m-%d %H:%i:%s'))`;
                    select += ` ORDER BY pdate ${order}`;
                    if (!!limit) select += ` LIMIT ${limit}`;
                    connection.query(select, function (err, ans) {
                        if (!err) {
                            var resp = {
                                code: 0,
                                response: []
                            }
                            resp.response = ans.map(function (el) {
                                if (withTread) el.thread = ThreadCreateOut(el).response;
                                if (withForum) el.forum = ForumDetailsOut(el).response;
                                if (withUser) el.user = UserDetailsOut(el).response;
                                return el;
                            });
                            res.send(resp);
                        }
                        else {
                            console.log('err 172319');
                            console.log(err);
                        }
                    });

                }
                else {
                    res.send(ErrorOut(1));
                }
            }
            else {
                console.log("err 180000");
            }
        });
    }
    else {
        es.send(ErrorOut(3));
    }

});

app.get('/db/api/forum/listThreads/', function (req, res) {
    var forum = req.query.forum;
    var related = req.query.related;
    var since = req.query.since;
    if (!!req.query.related) {
        var withForum = find(req.query.related, 'forum');
        var withUser = find(req.query.related, 'user');
    }
    var order = (req.query.order == "asc") ? "ASC" : "DESC";
    var limit = req.query.limit;
    if (!!forum) {
        connection.query('SELECT * FROM forums WHERE  forums.fshort_name = ?', [forum], function (err, ans) {
            if (!err) {
                if (!!ans[0]) {
                    var curForum = ans[0];
                    var select = "SELECT DISTINCT * FROM threads ";
                    if (withForum) select += ",forums ";
                    if (withUser) select += ",users "
                    select += `WHERE (threads.tforum = '${forum}') `;
                    if (withForum) select += " AND (threads.tforum = forums.fshort_name)";
                    if (withUser) select += " AND (threads.tuser = users.uemail)"
                    if (!!since) select += ` AND (threads.tdate > STR_TO_DATE('${since}', '%Y-%m-%d %H:%i:%s'))`
                    select += ` ORDER BY tdate ${order} `
                    if (!!limit) select += `LIMIT ${limit} `
                    connection.query(select, function (err, ans) {
                        if (!err) {
                            var resp = {
                                code: 0,
                                response: []
                            }
                            resp.response = ans.map(el=> {
                                var out;
                                if (withForum) {
                                    el.forum = ForumDetailsOut(el).response
                                }
                                ;
                                if (withUser) {
                                    el.user = UserDetailsOut(el).response
                                }
                                ;
                                return el;
                            });
                            res.send(JSON.stringify(resp));
                        }
                        else {
                            console.log('err 172349');
                            console.log(err);
                        }
                    });

                }
                else {
                    res.send(ErrorOut(1));
                }
            }
            else {
                console.log("err 172332");
                console.log(err);
            }

        });

    }
    else {
        res.send(ErrorOut(4));
    }

});

app.get('/db/api/forum/listUsers/', function (req, res) {
    var forum = req.query.forum;
    var limit = req.query.limit;
    var order = (req.query.order == 'asc') ? 'ASC' : 'DESC';
    var since_id;
    if (req.query.since_id && req.query.since_id[0] && req.query.since_id[1]) {
        since_id = [req.query.since_id[0], req.query.since_id[1]]
    }
    if (!!forum) {
        connection.query('SELECT * from forums WHERE forums.fshort_name = ?',
            [forum],
            function (err, ans) {
                if (!!ans[0]) {
                    var select = `SELECT DISTINCT users.* from users, posts WHERE (users.uemail = posts.puser) && (posts.pforum = '${forum}') `
                    if (!!since_id) select += `AND (users.uid >= ${since_id[0]}) AND (users.uid <= ${since_id[1]}) `
                    select += `ORDER BY users.uname ${order} `
                    if (!!limit) select += `LIMIT 0,${limit}`
                    connection.query(select,
                        [],
                        function (err, ans) {
                            if (!err) {
                                var out = {
                                    code: 0,
                                    response: []
                                }
                                ans.forEach(el => {
                                    out.response.push(UserDetailsOut(el).response)
                                });
                                res.send(JSON.stringify(out));
                            }
                            else {
                                console.log("err 172351");
                            }
                        });
                }
                else {
                    res.send(ErrorOut(1));
                }
            });

    }
    else {
        res.send(ErrorOut(3));
    }

});



//USER

app.use(bodyParser.json());

app.post('/db/api/user/create/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var data = req.body;
    if (!data.isAnonymous) data.isAnonymous = false;
    if ((!!data.username && !!data.about && !!data.name && !!data.email) || (!!data.isAnonymous && !!data.email)) {
        var insert = `INSERT INTO users (uusername, uabout, uname, uemail, uisAnonymous) 
					  VALUES (?,?,?,?,?);`;
        connection.query(insert, [data.username, data.about, data.name, data.email, data.isAnonymous], function (err, ans) {
            if (err && (err.code == 'ER_DUP_ENTRY')) {
                res.send(ErrorOut(4));
            }
            else {
                var select = `SELECT * FROM users WHERE uemail = '${data.email}';`;
                connection.query(select, function (err, ans) {
                    if (!err) {
                        UserCrateOut(ans[0]);
                        res.send(UserCrateOut(ans[0]));
                    }
                    else {
                        res.send(JSON.stringify(ErrorOut(4)));
                    }
                });
            }
        });
    }
    else {
        res.send(JSON.stringify(ErrorOut(3)));
    }

});

app.get('/db/api/user/details/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    ShowUser(req.query.user, connection, function (out) {
        res.send(out)
    });
});

app.post('/db/api/user/follow/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var data = req.body;
    if (!!data.follower && !!data.followee) {
        connection.query('SELECT * FROM users AS first, users AS second WHERE (first.uemail = ?) AND (second.uemail = ?)',
            [data.followee, data.follower],
            function (err, ans) {
                if (!err) {
                    connection.query("INSERT INTO followers (firstUser, secondUser) VALUES (?, ?);"
                        , [data.followee, data.follower], function (err, ans) {
                            if (!err) {
                                ShowUser(data.follower, connection, function (out) {
                                    res.send(out)
                                });
                            }
                            else {
                                console.log("err 181758");
                            }
                        });
                }
                else {
                    console.log("err 181759");
                    res.send(ErrorOut(4));

                }
            });
    }
    else {
        res.send(ErrorOut(3));
    }

});

app.get('/db/api/user/listFollowers/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var data = req.query;
    var limit = data.limit;
    var order = (data.order == 'asc')?'ASC':'DESC';
    //TODO
    var since_id = data.since_id;
    //
    if (!!data.user) {
        var sql = `SELECT * FROM followers, users WHERE (firstUser = '${data.user}') AND (uemail = secondUser)`;
        sql += ` ORDER BY uname ${order}`;
        if (!!limit) sql += ` LIMIT ${limit}`;
        connection.query(sql, function(err, ans) {
            if (!!ans) {
                addFollowers(ans, connection, function (arr) {
                    addFollowing(ans, connection, function (arr) {
                            var outMas = arr.map(el => {return UserDetailsOut(el).response});
                        var out = {
                            code: 0,
                            response: outMas
                        }
                        res.send(out);
                    });
                });
            }
            else {
                console.log("err 181845");
            }
        });
    }
    else {
        res.send(ErrorOut(3));
    }

});

app.get('/db/api/user/listFollowing/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var data = req.query;
    var limit = data.limit;
    var order = (data.order == 'asc')?'ASC':'DESC';
    //TODO
    var since_id = data.since_id;
    //
    if (!!data.user) {
        var sql = `SELECT * FROM followers, users WHERE (secondUser = '${data.user}') AND (uemail = firstUser)`;
        sql += ` ORDER BY uname ${order}`;
        if (!!limit) sql += ` LIMIT ${limit}`;
        connection.query(sql, function(err, ans) {
            if (!!ans) {
                addFollowers(ans, connection, function (arr) {
                    addFollowing(ans, connection, function (arr) {
                        var outMas = arr.map(el => {return UserDetailsOut(el).response});;
                        var out = {
                            code: 0,
                            response: outMas
                        }
                        res.send(out);
                    });
                });
            }
            else {
                console.log("err 181845");
            }
        });
    }
    else {
        res.send(ErrorOut(3));
    }

});

app.get('/db/api/user/listPosts/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var user = req.query.user;
    var since = req.query.since;
    var limit = req.query.limit;
    var order = (req.query.order == 'asc')?'ASC':'DESC';

    if (!!user) {
        var sql = `SELECT * FROM posts WHERE (puser = '${user}')`;
        if (!!since) sql += ` AND (pdate > STR_TO_DATE('${since}', '%Y-%m-%d %H:%i:%s'))`
        sql += ` ORDER BY pdate ${order}`;
        if (!!limit) sql += ` LIMIT ${limit}`;
        connection.query(sql, function(err, ans) {
            if (!!ans) {
                var outArr = ans.map(el=>{return PostsCreateOut(el).response});
                var out = {
                    code: 0,
                    response: outArr
                }
                res.send(out);
            }
            else {
                console.log("err 182049");
            }
        });
    }
    else {
        res.send(ErrorOut(3));
    }

});

app.post('/db/api/user/unfollow/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var data = req.body;
    if (!!data.follower && !!data.followee) {
        connection.query('SELECT * FROM users AS first, users AS second WHERE (first.uemail = ?) AND (second.uemail = ?)',
            [data.followee, data.follower],
            function (err, ans) {
                if (!err) {
                    connection.query("DELETE FROM followers WHERE  firstUser = ? AND secondUser =  ?;"
                        , [data.followee, data.follower], function (err, ans) {
                            if (!err) {
                                ShowUser(data.follower, connection, function (out) {
                                    res.send(out)
                                });
                            }
                            else {
                                console.log("err 181800");
                            }
                        });
                }
                else {
                    console.log("err 181801");
                    res.send(ErrorOut(4));

                }
            });
    }
    else {
        res.send(ErrorOut(3));
    }

});

app.post('/db/api/user/updateProfile/', function (req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    var data = req.body;

    if (!!data.about && !!data.user && !!data.name) {
        connection.query(`SELECT * FROM users WHERE (uemail = ?)`,
            [data.user],
            function (err, ans) {
                if (!err) {
                    connection.query('UPDATE users SET uname = ?, uabout = ? WHERE users.uemail = ?'
                        , [data.name, data.about, data.user]
                        , function (err, ans) {
                            if (!err) {
                                ShowUser(data.user, connection, function (hoho) {
                                    res.send(JSON.stringify(hoho))
                                });
                            }
                            else {
                                console.log('err 180127');
                            }
                        });
                }
                else {
                    console.log('err 180128');
                }
            });
    }
    else {
        res.send(ErrorOut(3));
    }

});

app.listen(4000, function () {

    console.log('listening on port 4000!');
});
