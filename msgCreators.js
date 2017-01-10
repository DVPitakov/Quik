var userRows = "uid, uusername, uabout, uname, uemail, uisAnonymous, usubscription_id";
var forumRows = "fid, fname, fshort_name, fuser";
var threadRows = "tid, DATE_FORMAT(tdate, '%Y-%m-%d %H:%i:%s') AS ttdate, tdate, tforum, tisClosed, tisDeleted, tmessage, tslug, ttitle, tuser, tlikes, tdislikes, tpoints, tposts";
var postRows = "pparent, pisApproved, pisHighlighted, pisEdited, pisSpam, pisDeleted, pid, DATE_FORMAT(pdate, '%Y-%m-%d %H:%i:%s') AS ppdate, pdate, pthread, pmessage, puser, pforum, plikes, pdislikes, ppoints";

function relatedOrder(related, enable) {
    if (enable.length < related.length) {
        return false;
    }
    return related.every(el => {
        var counter = 0;
        enable.forEach(sm => {
            if (sm == el) counter++;
        });
        return counter == 1;
    });
}

function UserCrateOut(user) {
    return {
        code: user.code || 0,
        response: {
            about: user.uabout,
            email: user.uemail,
            id: user.uid,
            isAnonymous: user.uisAnonymous || false,
            name: user.uname,
            username: user.uusername
        }
    };
}

function find(arr, str) {
    var i = 0;
    if (arr === str) return true;
    while (null != arr[i]) {
        if (arr[i] == str) return true;
        i++;
    }
    return false;
}

function ForumCreateOut(forum) {
    return {
        code: 0,
        response: {
            id: forum.fid,
            name: forum.fname,
            short_name: forum.fshort_name,
            user: forum.fuser
        }
    };
}
function ErrorOut(code, response) {
    return {
        code: code || 4,
        response: response || "error message"
    };
}

function ShowThread(thread, connection, callback, related) {
    if (null != related) {
        var counter = 0;
        var withUser = find(related, 'user');
        if (withUser) counter++;
        var withForum = find(related, 'forum');
        if (withForum) counter++;
    }
    var sql = `SELECT *, DATE_FORMAT(tdate, '%Y-%m-%d %H:%i:%s') AS ttdate FROM threads`;
    if (withUser) sql += ` INNER JOIN users ON users.uemail = threads.tuser`;
    if (withForum) sql += ` INNER JOIN forums ON forums.fshort_name = threads.tforum`;
    sql += ' WHERE (tid = ?)';
    sql += ' LIMIT 1';
    connection.query(sql,
        [thread],
        function (err, ans) {
            if (!err) {
                if (null != ans[0]) {
                    ans[0].tdate = ans[0].date;
                    var curThread = ans[0];
                    if (null != ans[0]) {
                        ans[0].tdate = ans[0].date;
                        if (withUser) {
                            ans[0].tuser = UserDetailsOut(ans[0]).response;
                        }
                        if (withForum) {
                            ans[0].tforum = ForumDetailsOut(ans[0]).response;
                        }
                        callback(ThreadDetailsOut(ans[0]));
                    }
                    else {
                        callback(ErrorOut(1));
                    }
                }
                else {
                    callback(ErrorOut(4));
                }
            }
            else {
                console.log("err 182332");
                callback(ErrorOut(4));
            }
        });
}
function ShowPost(post, connection, callback, related) {
    var counter = 0;
    if (null != related) {
        var withUser = find(related, 'user');
        var withThread = find(related, 'thread');
        var withForum = find(related, 'forum');
    }
    var sql = `SELECT *`;
    if (withThread) sql += `, DATE_FORMAT(tdate, '%Y-%m-%d %H:%i:%s') AS ttdate`;
    sql += `, DATE_FORMAT(pdate, '%Y-%m-%d %H:%i:%s') AS ppdate FROM posts`;
    if (withUser) sql += ` INNER JOIN users ON users.uid = posts.puser_id`;
    if (withThread) sql += ` INNER JOIN threads ON threads.tid = posts.pthread`;
    if (withForum) sql += ` INNER JOIN forums ON forums.fshort_name = posts.pforum`;
    sql += ' WHERE (pid = ?)';
    sql += ' LIMIT 1';
    connection.query(sql, [post], function (err, ans) {
        if (!err) {
            if (null != ans[0]) {
                ans[0].tdate = ans[0].ttdate;
                ans[0].pdate = ans[0].ppdate;
                if (withUser) {
                    ans[0].puser = UserDetailsOut(ans[0]).response;
                }
                if (withThread) {
                    ans[0].pthread = ThreadDetailsOut(ans[0]).response;
                }
                if (withForum) {
                    ans[0].pforum = ForumDetailsOut(ans[0]).response;
                }
                callback(PostDetailsOut(ans[0]));
            }
            else {
                callback(ErrorOut(1));
            }
        }
        else {
            callback(ErrorOut(4));
        }
    });
}

function ShowUser(email, connection, callback) {
    connection.query(`SELECT * FROM users WHERE uemail = ?`, [email], function(err, ans1){
        connection.query(`SELECT * FROM followers INNER JOIN users ON secondUser_id = users.uid WHERE (firstUser_id = ?);` +
            'SELECT * FROM followers, users WHERE (firstUser_id = users.uid) AND secondUser_id = ?;' +
            'SELECT sthread FROM subscriptions WHERE suser = ?;'
            , [ans1[0].uid, ans1[0].uid, email], function (err, ans) {
                if (!err) {
                    var curUser = ans1[0];
                    if (null != curUser) {
                        curUser.followers = ans[0].map(el => {
                            return el.secondUser;
                        });
                        curUser.following = ans[1].map(el => {
                            return el.firstUser;
                        });
                        curUser.subscriptions = ans[2].map(el => {
                            return el.sthread;
                        });
                        return callback(UserDetailsOut(curUser));
                    }
                    else {
                        return callback(ErrorOut(3));
                    }
                }
                else {
                    console.log("err 180133");
                }
        });
    });

}

function PostRemoveOut(post) {
    return {
        code: post.code || 0,
        response: {
            post: post.pid
        }
    };
}

function ShowForum(forum, connection, callback, related) {
    if (related) {
        var withUser = find(related, 'user');
    }
    var sql = `SELECT * FROM forums`;
    if (withUser) sql += `, users`;
    sql += ` WHERE (fshort_name = ?)`;
    if (withUser) sql += ` AND (users.uemail = forums.fuser)`;
    connection.query(sql, [forum], function (err, ans) {
        if (!err) {
            if (null != ans[0]) {
                if (withUser) ans[0].fuser = UserDetailsOut(ans[0]).response;
                callback(ForumDetailsOut(ans[0]));
            }
            else {
                callback(ErrorOut(1));
            }
        }
        else {
            console.log("err 182350");
            callback(ErrorOut(4))
        }
    });

}


function UserDetailsOut(user) {
    return {
        code: 0,
        response: {
            about: user.uabout,
            email: user.uemail,
            followers: user.followers || [],
            following: user.following || [],
            id: user.uid,
            isAnonymous: user.uisAnonymous || false,
            name: user.uname,
            subscriptions: user.subscriptions || [],
            username: user.uusername
        }
    };
}
function ClearOut() {
    return {
        code: 0,
        response: "OK"
    };
};
function ForumDetailsOut(forum) {
    return {
        code: forum.fcode || 0,
        response: {
            id: forum.fid,
            name: forum.fname,
            short_name: forum.fshort_name,
            user: forum.fuser
        }
    };
}
function ThreadCreateOut(thread) {
    return {
        code: 0,
        response: {
            date: thread.ttdate || thread.tdate,
            forum: thread.tforum,
            id: thread.tid,
            isClosed: thread.tisClosed,
            isDeleted: thread.tisDeleted,
            message: thread.tmessage,
            slug: thread.tslug,
            title: thread.ttitle,
            user: thread.tuser
        }
    };
}
function ThreadDetailsOut(thread) {
    return {
        code: 0,
        response: {
            date: thread.ttdate || thread.tdate,
            forum: thread.tforum,
            id: thread.tid,
            isClosed: thread.tisClosed,
            isDeleted: thread.tisDeleted,
            message: thread.tmessage,
            slug: thread.tslug,
            title: thread.ttitle,
            user: thread.tuser,
            likes: thread.tlikes,
            dislikes: thread.tdislikes,
            points: thread.tpoints,
            posts: thread.tposts
        }
    };
}
function PostsCreateOut(post) {
    return {
        code: 0,
        response: {
            date: post.ppdate || post.pdate,
            forum: post.pforum,
            id: post.pid,
            isApproved: post.pisApproved,
            isDeleted: post.pisDeleted,
            isEdited: post.pisEdited,
            isHighlighted: post.pisHighlighted,
            isSpam: post.pisSpam,
            message: post.pmessage,
            parent: post.pparent,
            thread: post.pthread,
            user: post.puser
        }
    };
}
function PostDetailsOut(post) {
    return {
        code: 0,
        response: {
            date: post.ppdate || post.pdate,
            dislikes: post.pdislikes,
            forum: post.pforum,
            id: post.pid,
            isApproved: post.pisApproved,
            isDeleted: post.pisDeleted,
            isEdited: post.pisEdited,
            isHighlighted: post.pisHighlighted,
            isSpam: post.pisSpam,
            likes: post.plikes,
            message: post.pmessage,
            parent: post.pparent,
            points: post.ppoints,
            thread: post.pthread,
            user: post.puser
        }
    };
}

exports.PostDetailsOut = PostDetailsOut;
exports.ShowUser = ShowUser;
exports.ErrorOut = ErrorOut;
exports.ShowForum = ShowForum;
exports.ForumCreateOut = ForumCreateOut;
exports.ClearOut = ClearOut;
exports.UserDetailsOut = UserDetailsOut;
exports.UserCrateOut = UserCrateOut;
exports.ForumDetailsOut = ForumDetailsOut;
exports.ThreadCreateOut = ThreadCreateOut;
exports.PostsCreateOut = PostsCreateOut;
exports.PostRemoveOut = PostRemoveOut;
exports.ShowPost = ShowPost;
exports.ShowThread = ShowThread;
exports.find = find;
exports.relatedOrder = relatedOrder;
exports.ThreadDetailsOut = ThreadDetailsOut;
exports.userRows = userRows;
exports.forumRows = forumRows;
exports.threadRows = threadRows;
exports.postRows = postRows;