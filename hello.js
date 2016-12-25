var express = require('express');
var bodyParser = require("body-parser");
var app = express();
var mysql = require('mysql');
var url = require('url');
var pool = mysql.createPool({
    connectionLimit: 1000,
    acquireTimeout: 1000,
    multipleStatements: true,
    host: 'localhost',
    user: 'root',
    password: 'admin',
    charset: 'UTF8_GENERAL_CI'
});

//
pool.getConnection(function (err, connection) {

    connection.query('USE forum;', function (err, data, fields) {
    });

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
    var ShowForum = require('./msgCreators').ShowForum;
    var find = require('./msgCreators').find;
    var PostDetailsOut = require('./msgCreators').PostDetailsOut;
    var relatedOrder = require('./msgCreators').relatedOrder;
    var userRows = require('./msgCreators').userRows;
    var forumRows = require('./msgCreators').forumRows;
    var threadRows = require('./msgCreators').threadRows;
    var postRows = require('./msgCreators').postRows;
    var ThreadDetailsOut = require('./msgCreators').ThreadDetailsOut;

    app.use(bodyParser.json());
    function addDetailsInUserArray(ans, callback) {
        let promises = [];
        ans.forEach(obj => {
            promises.push(new Promise(function (resolve, reject) {
                connection.query("SELECT secondUser FROM followers WHERE firstUser = ?", [obj.uemail], function (err, mas) {
                    if (err) {
                        console.log("111");
                        reject();
                    }
                    else {
                        obj.followers = mas.map(el => {
                                return el.secondUser
                            }
                        );
                        resolve();
                    }
                })
            }.bind(obj)));
            promises.push(new Promise(function (resolve, reject) {
                connection.query("SELECT firstUser FROM followers WHERE secondUser = ?", [obj.uemail], function (err, mas) {
                    if (err) {
                        console.log("222");
                        reject();
                    }
                    else {
                        obj.following = mas.map(el => {
                                return el.firstUser
                            }
                        );
                        resolve();
                    }
                });
            }.bind(obj)));
            promises.push(new Promise(function (resolve, reject) {
                connection.query("SELECT sthread FROM subscriptions  WHERE suser = ?", [obj.uemail], function (err, mas) {
                    if (err) {
                        console.log("333");
                        reject();
                    }
                    else {
                        obj.subscriptions = mas.map(el => {
                                return el.sthread
                            }
                        );
                        resolve();
                    }
                });
            }.bind(obj)));
        });
        Promise.all(promises).then(() => {
                callback(ans);
            },
            () => {
                console.log("err230232")
            }
        );

    }

    app.get('/db/api/status/', function (req, res) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        var sql = 'SELECT * FROM (SELECT COUNT(*) AS user FROM users) AS user,' +
            '(SELECT COUNT(*) AS thread FROM threads) AS  thread,' +
            '(SELECT COUNT(*) AS forum FROM forums) AS forum,' +
            '(SELECT COUNT(*) AS post FROM posts) AS post;';
        connection.query(sql, function (err, ans) {
            if (!err) {
                res.send(
                    {
                        code: 0,
                        response: {
                            users: ans[0].user,
                            threads: ans[0].thread,
                            forums: ans[0].forum,
                            posts: ans[0].post
                        }
                    });
            }
            else {
                console.log("err 201436");
                res.send(ErrorOut(4));
            }
        });
    });

    app.post('/db/api/clear/', function (req, res) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        connection.query(
 `DELETE FROM followers; DELETE FROM tree; 
 DELETE FROM posts; DELETE FROM threads; 
 DELETE FROM forums; DELETE FROM users;
 DELETE FROM subscriptions;`
            , function (err, ans) {
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
        if (null != data.date && null != data.thread && null != data.message && null != data.user && null != data.forum) {
            connection.query('INSERT INTO posts (pparent, pisApproved, pisHighlighted, pisEdited, pisSpam, pisDeleted, pdate, pthread, pmessage, puser, pforum) VALUES (?,?,?,?,?,?,?,?,?,?,?);',
                [data.parent, data.isApproved || false, data.isHighlighted || false, data.isEdited || false, data.isSpam || false, data.isDeleted || false, data.date, data.thread, data.message, data.user, data.forum],
                function (err, ans) {
                    if (!err) {
                        var query = connection.query(`SELECT *, DATE_FORMAT(pdate, '%Y-%m-%d %H:%i:%s') AS date FROM posts WHERE posts.pid = ?`, [ans.insertId], function (err, ans2) {
                            if (!err) {
                                res.send(JSON.stringify(PostsCreateOut(ans2[0])));
                            }
                            else {
                                console.log("err 181804");
                                console.log(ErrorOut(4));
                                res.send(ErrorOut(4));
                            }
                        });
                    }
                    else {
                        res.send(ErrorOut(5));
                    }
                });
        }
        else {
            console.log("WRONG DATA");
            res.send(ErrorOut(4));
        }
    });

    app.get('/db/api/post/details/', function (req, res) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        var data = req.query;
        if (null != data.post) {
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
        if (null != data.post && null != data.message) {
            connection.query('UPDATE posts SET pmessage = ? WHERE pid = ?',
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
        if (null != data.post) {
            connection.query(`UPDATE posts SET pisDeleted = 1 WHERE  pid = ?`, [data.post], function (err, ans) {
                if (!err) {
                    res.send(PostRemoveOut({post: data.post}));
                }
                else {
                    console.log('err 051603');
                    console.log(err);
                }
            });
        }
        else {
            console.log(ErrorOut(4));
            res.send(ErrorOut(4));
        }
    });

    app.post('/db/api/post/restore/', function (req, res) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        var data = req.body;
        if (null != data.post) {
                        connection.query(`UPDATE posts SET pisDeleted = 0 WHERE  pid = ?`, [data.post], function (err, ans) {
                            if (!err) {
                                res.send(PostRemoveOut({post: data.post}));
                            }
                            else {
                                console.log('err 051603');
                                console.log(err);
                            }
                        });
        }
        else {
            console.log(ErrorOut(4));
            res.send(ErrorOut(4));
        }
    });

    app.post('/db/api/post/vote/', function (req, res) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        var data = req.body;
        if (null != data.post && null != data.vote) {
            connection.query('SELECT * FROM posts WHERE pid = ? AND pisDeleted = 1',
                [data.post],
                function (err, ans) {
                    if (!err) {
                        if (data.vote == 1) {
                            sql = `CALL votePost(?, 1)`
                        }
                        else if (data.vote == -1) {
                            sql = `CALL votePost(?, 0)`
                        }
                        else {
                            return res.send(ErrorOut(3));
                        }
                        connection.query(sql, [data.post], function (err, ans) {
                            if (!err) {
                                res.send(PostDetailsOut(ans[0]));
                            }
                            else {
                                console.log('err 051708');
                                console.log(err);
                            }
                        });
                    }
                    else {
                        console.log('err 051709');
                    }
                });

        }
        else {
            console.log(ErrorOut(4));
            res.send(ErrorOut(4));
        }
    });

    app.get('/db/api/post/list/', function (req, res) {

        var forum = req.query.forum;
        var thread = req.query.thread;
        if (forum == null && thread == null) {
            return res.send(ErrorOut(3));
        }
        var post = req.query.post;
        var since = req.query.since;
        var limit = req.query.limit;
        var order = (req.query.order == 'asc') ? 'ASC' : 'DESC';
        var sql = "";
        if (forum != null) {
            sql = `SELECT DISTINCT ${postRows} FROM posts WHERE  pforum =  '${forum}'`;
        }
        else {
            sql = `SELECT DISTINCT ${postRows} FROM posts WHERE  pthread =  ${thread}`;
        }
        if (null != since) sql += ` AND (posts.pdate >= STR_TO_DATE('${since}', '%Y-%m-%d %H:%i:%s'))`;
        sql += ` ORDER BY pdate ${order}`;
        if (null != limit) sql += ` LIMIT ${limit}`;
        connection.query(sql, function (err, ans) {
            if (!err) {
                if (ans[0] == null) {
                    return res.send({code: 0, response: []})
                }
                return res.send({
                    code: 0, response: ans.map(el => {
                        return PostDetailsOut(el).response
                    })
                })
                    ;
            }
            else {
                console.log("err 180000");
            }
        });
    });

//THREAD

    app.post('/db/api/thread/close/', function (req, res) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        var thread = req.body.thread;
        if (null != thread) {
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
        if (null != data.forum && null != data.title && null != data.isClosed && null != data.user && null != data.message && null != data.slug && null != data.date) {
            connection.query('INSERT INTO threads (tdate, tforum, ttitle, tisClosed, tisDeleted, tuser, tmessage, tslug) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [data.date, data.forum, data.title, data.isClosed, data.isDeleted || false, data.user, data.message, data.slug], function (err, ans) {
                    if (!err) {
                        var tvar = ans.insertId;
                        connection.query('SELECT * FROM threads WHERE tid = ?', [ans.insertId], function (err, ans2) {
                            if (!err) {
                                res.send(ThreadCreateOut(ans2[0]));
                            } else {
                                console.log("err 181752");
                                res.send(ErrorOut(4));
                            }
                        });
                    }
                    else {
                        res.send(ErrorOut(5));
                    }
                });
        }
        else {
            res.send(ErrorOut(3));
        }
    });

    app.get('/db/api/thread/details/', function (req, res) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        var data = req.query;
        if (data.related != null) {
            if (!Array.isArray(data.related)) data.related = [data.related];
            if (!relatedOrder(data.related, ['user', 'forum'])) {
                return res.send(ErrorOut(3));
            }
        }
        if (null != data.thread) {
            ShowThread(data.thread, connection, function (out) {
                return res.send(out)
            }, data.related)
        }
        else {
            return es.send(ErrorOut(3));
        }
    });

    app.get('/db/api/thread/list/', function (req, res) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        let forum = req.query.forum;
        let user = req.query.user;
        if (forum == null && user == null) {
            return res.send(ErrorOut(3));
        }
        let since = req.query.since;
        var order = (req.query.order == "asc") ? "ASC" : "DESC";
        var limit = req.query.limit;
        let userOrForum = (user != null) ? `tuser = ?` : `tforum = ?`;
        let myLimit = '';
        let mySince = '';
        if (since != null) {
            mySince = ` AND (threads.tdate >= STR_TO_DATE('${since}', '%Y-%m-%d %H:%i:%s'))`;
        }
        if (limit != null) {
            myLimit = `LIMIT ${limit}`
        }
        let sql = `SELECT DISTINCT ${threadRows} FROM threads WHERE ${userOrForum} ${mySince} ORDER BY tdate ${order} ${myLimit}`;
        connection.query(sql, [user || forum], function (err, ans) {
            if (!err) {
                var resp = {
                        code: 0,
                        response: ans.map(el => {
                            return ThreadDetailsOut(el).response;
                        })
                    }
                    ;
                res.send(JSON.stringify(resp));
            }
            else {
                console.log('err 172349');
                console.log(err);
                console.log("SQL: " + sql)
            }
        });


    });

    app.get('/db/api/thread/listPosts/', function (req, res) {
        let val = "";
        let sql = "";
        res.set('Content-Type', 'application/json; charset=utf-8');
        let thread = req.query.thread;
        let since = req.query.since;
        let limit = req.query.limit;
        let sort = req.query.sort;
        let order = req.query.order;
        if (sort == null) sort = 'flat';
        if (sort != 'flat' && sort != 'tree' && sort != 'parent_tree') {
            return res.send(ErrorOut(3));
        }
        if (thread == null) {
            return res.send(ErrorOut(3));
        }
        if (order != null) {
            if (order == 'asc') {
                order = 'ASC';
                val = 'postpath';
            }
            else if (order == 'desc') {
                order = "DESC";
                val = 'ipath';
            }
            else {
                res.send(ErrorOut(3));
            }
        }
        else {
            order = "DESC";
            val = 'ipath';
        }
        if (sort == 'flat') {
            sql = `SELECT ${postRows} FROM posts WHERE posts.pthread = ${thread}`;
            if (null != since) {
                sql += ` AND (posts.pdate >= STR_TO_DATE('${since}', '%Y-%m-%d %H:%i:%s'))`;
            }
            sql += ` ORDER BY pdate ${order} `;
            if (null != limit) sql += ` LIMIT ${limit} `
        }
        else if (sort == 'tree') {
            var mysince = "";
            if (since != null) {
                mysince = ` AND (posts.pdate >= STR_TO_DATE('${since}', '%Y-%m-%d %H:%i:%s'))`;
            }
            var myLimit = '';
            if (limit != null) {
                myLimit = `LIMIT ${limit}`;
            }
            sql = `SELECT ${postRows} FROM tree INNER JOIN posts ON posts.pid = tree.postid WHERE posts.pthread = ${thread} ${mysince} ORDER BY ${val} ${myLimit}`;
        }
        else if (sort == 'parent_tree') {
            var mysince = '';
            if (since != null) {
                mysince = `AND (posts.pdate >= STR_TO_DATE('${since}', '%Y-%m-%d %H:%i:%s'))`;
            }
            var myLimit = '';
            if (limit != null) {
                myLimit = `LIMIT ${limit}`;
            }
            sql = `SELECT ${postRows} FROM
        (SELECT tree.${val} AS p FROM tree INNER JOIN posts ON tree.postid = posts.pid WHERE posts.pparent IS NULL AND posts.pthread = ${thread} ${mysince}  ORDER BY ${val}  ${myLimit} ) AS paths
        INNER JOIN  tree ON POSITION(paths.p IN tree.${val}) = 1
        INNER JOIN posts ON posts.pid = tree.postid
        ORDER BY ${val}`;
        }
        else {
            return res.send(ErrorOut(3));
        }
        connection.query(sql, function (err, ans) {
            if (err) {
                console.log("err 052236");
                console.log(sql);
                console.log(err);
            }
            else {
                res.send({
                    code: 0,
                    response: ans.map(el => {
                        return PostDetailsOut(el).response;
                    })
                })
                ;
            }
        })
    });

    app.post('/db/api/thread/open/', function (req, res) {
        let thread = req.body.thread;
        let sql = 'UPDATE threads SET tisClosed = 0 WHERE tid = ?';
        if (thread == null) {
            return res.send(ErrorOut(3));
        }
        connection.query(sql, [thread], function (err, ans) {
            if (err) {
                console.log("err 082010");
                return res.send(ErrorOut(4));
            }
            res.send({
                code: 0,
                response: thread
            });
        })
    });

    app.post('/db/api/thread/subscribe/', function (req, res) {
        let thread = req.body.thread;
        let user = req.body.user;
        res.set('Content-Type', 'application/json; charset=utf-8');
        if (thread == null || user == null) {
            console.log("err err err err");
            return res.send(ErrorOut(3));
        }
        let sql = `INSERT INTO subscriptions (suser, sthread) VALUES (?, ?)`;
        connection.query(sql, [user, thread], function (err, ans) {
            if (err) {
                console.log("err 061548");
                console.log(err);
                console.log(sql);
            }
            else {
                res.send({
                    code: 0,
                    response: {
                        thread: thread,
                        user: user
                    }
                });
            }
        });

    });

    app.post('/db/api/thread/unsubscribe/', function (req, res) {
        let thread = req.body.thread;
        let user = req.body.user;
        res.set('Content-Type', 'application/json; charset=utf-8');
        if (thread == null || user == null) {
            console.log("err err err err");
            return res.send(ErrorOut(3));
        }
        let sql = `DELETE FROM subscriptions WHERE suser = ? AND sthread = ?`;
        connection.query(sql, [user, thread], function (err, ans) {
            if (err) {
                console.log("err 082057");
                console.log(err);
                console.log(sql);
            }
            else {
                res.send({
                    code: 0,
                    response: {
                        thread: thread,
                        user: user
                    }
                });
            }
        });

    });

    app.post('/db/api/thread/remove/', function (req, res) {
        var thread = req.body.thread;
        res.set('Content-Type', 'application/json; charset=utf-8');
        if (thread == null) {
            console.log("err err err err");
            return res.send(ErrorOut(3));
        }
        let sql = `UPDATE threads SET tisDeleted = 1 WHERE tid = ?`;
        connection.query(sql, [thread], function (err, ans) {
            if (err) {
                console.log("err 061548");
                console.log(err);
                console.log(sql);
            }
            else {
                sql = 'UPDATE posts SET pisDeleted = 1 WHERE pthread = ?';
                connection.query(sql, [thread], function (err, ans) {
                    if (err) {
                        console.log("err 080805");
                        console.log(err);
                        console.log(sql);
                    }
                    else {
                        return res.send({
                            code: 0,
                            response: thread
                        })
                    }
                });
            }
        });

    });

    app.post('/db/api/thread/restore/', function (req, res) {
        var thread = req.body.thread;
        res.set('Content-Type', 'application/json; charset=utf-8');
        if (thread == null) {
            console.log("err err err err");
            return res.send(ErrorOut(3));
        }
        let sql = `UPDATE threads SET tisDeleted = 0 WHERE tid = ?`;
        connection.query(sql, [thread], function (err, ans) {
            if (err) {
                console.log("err 061548");
                console.log(err);
                console.log(sql);
            }
            else {
                sql = 'UPDATE posts SET pisDeleted = 0 WHERE pthread = ?';
                connection.query(sql, [thread], function (err, ans) {
                    if (err) {
                        console.log("err 080805");
                        console.log(err);
                        console.log(sql);
                    }
                    else {
                        return res.send({
                            code: 0,
                            response: thread
                        })
                    }
                });
            }
        });

    });

    app.post('/db/api/thread/update/', function (req, res) {
        let thread = req.body.thread;
        let slug = req.body.slug;
        let message = req.body.message;
        res.set('Content-Type', 'application/json; charset=utf-8');
        if (thread == null || slug == null || message == null) {
            return res.send(ErrorOut(3));
        }
        let sql = 'UPDATE threads SET tmessage = ?, tslug = ? WHERE tid = ?';
        connection.query(sql, [message, slug, thread], function (err, ans) {
            if (err) {
                console.log("err 082049");
                res.send(ErrorOut(4));
            }
            connection.query(`SELECT ${threadRows} FROM threads WHERE tid = ?`, [thread], function (err, ans) {
                if (err) {
                    console.log("err 082053");
                    res.send(ErrorOut(4));
                }
                res.send(ThreadDetailsOut(ans));
            });
        })

    });

    app.post('/db/api/thread/vote/', function (req, res) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        var data = req.body;
        if (null != data.thread && null != data.vote) {
            if (data.vote == 1) {
                sql = `CALL voteThread(?, 1)`
            }
            else if (data.vote == -1) {
                sql = `CALL voteThread(?, 0)`
            }
            else {
                return res.send(ErrorOut(3));
            }
            connection.query(sql, [data.thread], function (err, ans) {
                if (!err) {
                    res.send(ThreadDetailsOut(ans[0]));
                }
                else {
                    console.log('err 051708');
                    console.log(err);
                }
            });

        }
        else {
            console.log(ErrorOut(4));
            res.send(ErrorOut(4));
        }
    });

//FORUM

    app.post('/db/api/forum/create/', function (req, res) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        var data = req.body;
        if (null != data.name && null != data.short_name && null != data.user) {
            var ans = connection.query('INSERT INTO forums (fname, fshort_name, fuser) VALUES (?, ?, ?)',
                [data.name, data.short_name, data.user],
                function (err, ans) {
                    if (!err) {
                        connection.query(`SELECT * FROM forums WHERE fshort_name = ?`, [data.short_name], function (err, ans2) {
                            if (!err) {
                                res.send(ForumCreateOut(ans2[0]));
                            }
                            else {
                                console.log("err 180145");
                            }
                        });
                    }
                    else {
                        res.send(ErrorOut(5));
                    }
                });
        }
        else {
            res.send(ErrorOut(3));
        }

    });

    app.get('/db/api/forum/details/', function (req, res) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        var data = req.query;
        if (data.related != 0) {
            if (!Array.isArray(data.related)) data.related = [data.related];
            if (!relatedOrder(data.related, ['user'])) {
                return res.send(ErrorOut(3));
            }
        }
        if (null != data.forum) {
            ShowForum(data.forum, connection, out => {
                    res.send(out)
                },
                data.related
            )
            ;
        }
        else {
            res.send(ErrorOut(3));
        }
    });

    app.get('/db/api/forum/listPosts/', function (req, res) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        var forum = req.query.forum;
        var since = req.query.since;
        var limit = req.query.limit;
        var order = (req.query.order == 'asc') ? 'ASC' : 'DESC';
        var related = req.query.related;
        let withThread = false;
        let withForum = false;
        let withUser = false;
        if (related != null) {
            withUser = find(related, 'user');
            withForum = find(related, 'forum');
            withThread = find(related, 'thread');
        }
        if (null != forum) {
            let tables = 'posts';
            let targets = `${postRows}`;
            if (withUser) {
                tables += ' INNER JOIN users ON users.uemail = posts.puser';
                targets += `, ${userRows}`;
            }
            if (withForum) {
                tables += ' INNER JOIN forums ON forums.fshort_name = posts.pforum';
                targets += `, ${forumRows}`;
            }
            if (withThread) {
                tables += ' INNER JOIN threads ON threads.tid = posts.pthread';
                targets += `, ${threadRows}`;
            }
            var sql = `SELECT ${targets} FROM ${tables} WHERE (pforum = '${forum}')`;
            if (null != since) sql += ` AND (pdate >= STR_TO_DATE('${since}', '%Y-%m-%d %H:%i:%s'))`;
            sql += ` ORDER BY pdate ${order}`;
            if (null != limit) sql += ` LIMIT ${limit}`;
            connection.query(sql, function (err, ans) {
                if (err) {
                    console.log("err 182049");
                }
                return res.send({
                    code: 0,
                    response: ans.map(el => {
                        if (withUser) {
                            el.puser = UserDetailsOut(el).response;
                        }
                        if (withForum) {
                            el.pforum = ForumDetailsOut(el).response;
                        }
                        if (withThread) {
                            el.pthread = ThreadDetailsOut(el).response;
                        }
                        return PostDetailsOut(el).response;
                    })
                })
                    ;
            });
        }
        else {
            console.log("err 092022");
            res.send(ErrorOut(3));
        }

    });

    app.get('/db/api/forum/listThreads/', function (req, res) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        var forum = req.query.forum;
        var since = req.query.since;
        var limit = req.query.limit;
        var order = (req.query.order == 'asc') ? 'ASC' : 'DESC';
        var related = req.query.related;
        let withForum = false;
        let withUser = false;
        if (related != null) {
            withUser = find(related, 'user');
            withForum = find(related, 'forum');
        }
        if (null != forum) {
            let tables = 'threads';
            let targets = `${threadRows}`;
            if (withUser) {
                tables += ' INNER JOIN users ON users.uemail = threads.tuser';
                targets += `, ${userRows}`;
            }
            if (withForum) {
                tables += ' INNER JOIN forums ON forums.fshort_name = threads.tforum';
                targets += `, ${forumRows}`;
            }
            let sql = `SELECT ${targets} FROM ${tables} WHERE (tforum = '${forum}')`;
            if (null != since) sql += ` AND (tdate >= STR_TO_DATE('${since}', '%Y-%m-%d %H:%i:%s'))`;
            sql += ` ORDER BY tdate ${order}`;
            if (null != limit) sql += ` LIMIT ${limit}`;
            connection.query(sql, function (err, ansArr) {
                if (err) {
                    return console.log("err 092042");
                }
                if (withForum) {
                    ansArr.forEach(el => {
                        el.tforum = ForumDetailsOut(el).response;
                    })
                    ;
                }
                let counter = 0;
                if (withUser) {
                    if (ansArr.length == 0) {
                        return res.send({
                            code: 0,
                            response: []
                        });
                    }
                    addDetailsInUserArray(ansArr, data => {
                        data.forEach(el => {
                            el.tuser = UserDetailsOut(el).response;
                        })
                        ;
                        return res.send({
                            code: 0,
                            response: ansArr.map(el => {
                                return ThreadDetailsOut(el).response
                            })
                        })
                            ;

                    })
                    ;
                }
                else {
                    return res.send({
                        code: 0,
                        response: ansArr.map(el => {
                            return ThreadDetailsOut(el).response
                        })
                    })
                        ;
                }
            });
        }
        else {
            console.log("err 092022");
            res.send(ErrorOut(3));
        }

    });

    app.get('/db/api/forum/listUsers/', function (req, res) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        var data = req.query;
        var limit = data.limit;
        var order = (data.order == 'asc') ? 'ASC' : 'DESC';
        var since_id = data.since_id;
        //
        if (null != data.forum) {
            var sql = `SELECT DISTINCT ${userRows} FROM users, posts WHERE (users.uemail = posts.puser AND posts.pforum = '${data.forum}')`;
            if (since_id) {
                sql += ` AND users.uid >= ${since_id}`
            }
            sql += ` ORDER BY uname ${order}`;
            if (null != limit) sql += ` LIMIT ${limit}`;
            connection.query(sql, function (err, ans) {
                if (null != ans) {
                    let counter = 0;
                    addDetailsInUserArray(ans, (data) => {
                        var outMas = data.map(el => {
                                return UserDetailsOut(el).response
                            }
                            )
                            ;
                        var out = {
                            code: 0,
                            response: outMas
                        };
                        res.send(out)
                    })
                    ;
                }
                else {
                    console.log("err 092058");
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
        if ((null != data.username && null != data.about && null != data.name && null != data.email) || (data.isAnonymous && null != data.email)) {
            var insert = `INSERT INTO users (uusername, uabout, uname, uemail, uisAnonymous) 
					  VALUES (?,?,?,?,?);`;
            connection.query(insert, [data.username, data.about, data.name, data.email, data.isAnonymous], function (err, ans) {
                if (err) {
                    res.send(ErrorOut(5));
                }
                else {
                    var select = 'SELECT * FROM users WHERE uemail = ?';
                    connection.query(select, [data.email], function (err, ans2) {
                        if (!err) {
                            res.send(UserCrateOut(ans2[0]));
                        }
                        else {
                            res.send(ErrorOut(4));
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
        if (null != data.follower && null != data.followee) {
            connection.query("INSERT INTO followers (firstUser, secondUser) VALUES (?, ?);"
                , [data.followee, data.follower], function (err, ans) {
                    if (!err) {
                        ShowUser(data.follower, connection, function (out) {
                            res.send(out)
                        });
                    }
                    else {
                        console.log("err 181758");
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
        var order = (data.order == 'asc') ? 'ASC' : 'DESC';
        //TODO
        var since_id = data.since_id;
        //
        if (null != data.user) {
            var sql = `SELECT * FROM followers, users WHERE (firstUser = '${data.user}') AND (uemail = secondUser)`;
            sql += ` ORDER BY uname ${order}`;
            if (null != limit) sql += ` LIMIT ${limit}`;
            connection.query(sql, function (err, ans) {
                if (null != ans) {
                    addDetailsInUserArray(ans, data => {
                        var outMas = data.map(el => {
                                return UserDetailsOut(el).response
                            }
                            )
                            ;
                        var out = {
                            code: 0,
                            response: outMas
                        };
                        res.send(out)
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
        var order = (data.order == 'asc') ? 'ASC' : 'DESC';
        //TODO
        var since_id = data.since_id;
        //
        if (null != data.user) {
            var sql = `SELECT * FROM followers, users WHERE (secondUser = '${data.user}') AND (uemail = firstUser)`;
            sql += ` ORDER BY uname ${order}`;
            if (null != limit) sql += ` LIMIT ${limit}`;
            connection.query(sql, function (err, ans) {
                if (null != ans) {
                    addDetailsInUserArray(ans, data => {
                        var outMas = data.map(el => {
                                return UserDetailsOut(el).response
                            }
                            )
                            ;
                        var out = {
                            code: 0,
                            response: outMas
                        };
                        res.send(out)
                    })
                    ;
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
        var order = (req.query.order == 'asc') ? 'ASC' : 'DESC';

        if (null != user) {
            var sql = `SELECT ${postRows} FROM posts WHERE (puser = '${user}')`;
            if (null != since) sql += ` AND (pdate > STR_TO_DATE('${since}', '%Y-%m-%d %H:%i:%s'))`;
            sql += ` ORDER BY pdate ${order}`;
            if (null != limit) sql += ` LIMIT ${limit}`;
            connection.query(sql, function (err, ans) {
                if (null != ans) {
                    var outArr = ans.map(el => {
                            return PostDetailsOut(el).response
                        }
                        )
                        ;
                    var out = {
                        code: 0,
                        response: outArr
                    };
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
        if (null != data.follower && null != data.followee) {
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

        if (null != data.about && null != data.user && null != data.name) {
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

});

app.listen(4000, function () {

    console.log('listening on port 4000!');
});
