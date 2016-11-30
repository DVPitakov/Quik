var userRows = "uid, uusername, uabout, uname, uemail, uisAnonymous, usubscription_id";
var forumRows = "fid, fname, fshort_name, fuser";
var threadRows = "tid, DATE_FORMAT(tdate, '%Y-%m-%d %H:%i:%s') AS tdate, tforum, tisClosed, tisDeleted, tmessage, tslug, ttitle, tuser, tlikes, tdislikes, tpoints, tposts";
var postRows = "pparent, pisApproved, pisHighlighted, pisEdited, pisSpam, pisDeleted, pid, DATE_FORMAT(pdate, '%Y-%m-%d %H:%i:%s') AS pdate, pthread, pmessage, puser, pforum, plikes, pdislikes, ppoints";

function relatedOrder(related, enable) {
    if (enable.length < related.length) {
        return false;
    }
    return related.every(el => {
        var counter = 0;
        enable.forEach(sm => {if (sm == el) counter++;});
        return counter == 1;
    });
}

function showDetails(target, id, connection, callback, related) {
    var rows = '';
    var from = '';
    var where = '';
    var msgFormat;
    if (target == "user") {
        from = "users";
        rows = userRows;
        where = "(uemail = ?)";
        msgFormat = UserDetailsOut;
        if (related[0] != null) {
            return callback(ErrorOut(4));
        }
    }
    else if (target == "forum") {
        from = "forums";
        rows = forumRows;
        where = "(fshort_name = ?)";
        msgFormat = ForumDetailsOut;
        if (related[0] != null) {
            if (related[0] == 'user') {
                where += " && (fuser = uemail)";
                rows += ", " + userRows;
            }
            else {
                return callback(ErrOut(4));
            }
        }
    }
    else if (target == "thread") {
        from = "threads";
        rows = threadRows;
        where = "(tid = ?)";
        msgFormat = ThreadDetailsOut;
        if (relatedOrder(related, ['user', 'forum'])) {
            if (related.indexOf('user') >= 0) {
                where += " && (tuser = uemail)"
                rows += ", " + userRows;
            }
            if (related.indexOf('forum') >= 0) {
                where += " && (tforum = fshort_name)"
                rows += ", " + forumRows;
            }
        }
        else {
            return callback(ErrOut(4));
        }
    }
    else if (target == 'post') {
        from = "posts";
        rows = postRows;
        where = "(pid = ?)";
        msgFormat = PostDetailsOut;
        if (relatedOrder(related, ['user', 'forum', 'thread'])) {
            if (related.indexOf('user') >= 0) {
                where += " && (tuser = uemail)";
                rows += ", " + userRows;
            }
            if (related.indexOf('forum') >= 0) {
                where += " && (tforum = fshort_name)";
                rows += ", " + forumRows;
            }
            if (related.indexOf('thread') >= 0) {
                where += " && (pthread = tid)";
                rows += ", " + forumRows;
            }
        }
        else {
            return callback(ErrOut(4));
        }
    }
    var sql = 'SELECT ' + rows + ' FROM ' + from + ' WHERE ' + where + ';';
    connection.query(sql, [id], function(err, ans){
        if(!err) {
            if(ans[0] != null) {
                var out = msgFormat(ans[0]);
                if (related.indexOf('user') >= 0) {
                    out.user = UserDetailsOut(ans[0]).response;
                }
                if (related.indexOf('forum') >= 0) {
                    out.forum = ForumDetailsOut(ans[0]).response;
                }
                if (related.indexOf('thread') >= 0) {
                    out.thread = ThreadDetailsOut(ans[0]).response;
                }
                callback(out);
            }
            else {
                callback(ErrorOut(4));
            }
        }
        else {
            console.log('err 042300');
        }
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
};

function ShowThread(thread, connection, callback, related) {
    if (null != related) {
        var counter = 0;
        var withUser = find(related, 'user');
        if (withUser) counter++;
        var withForum = find(related, 'forum');
        if (withForum) counter++;



    }
    var sql = `SELECT *, DATE_FORMAT(tdate, '%Y-%m-%d %H:%i:%s') AS date FROM threads`;
    if (withUser) sql += `, users`;
    if (withForum) sql += `, forums`;
    sql += ' WHERE (tid = ?)';
    if (withUser) sql += ` AND (users.uemail = threads.tuser)`;
    if (withForum) sql += ` AND (forums.fshort_name = threads.tforum)`;
    connection.query(sql,
        [thread],
        function (err, ans) {
            if (!err) {
                if(null != ans[0]) {
                    ans[0].tdate = ans[0].date;
                    var curThread = ans[0];
                    if (null !=ans[0]) {
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
    if (null !=related) {
        var withUser = find(related, 'user');
        if (withUser) counter++;
        var withThread = find(related, 'thread');
        if (withThread) counter++;
        var withForum = find(related, 'forum');
        if (withForum) counter++;
    }
    var sql = `SELECT *`;
    if(withThread) sql += `, DATE_FORMAT(tdate, '%Y-%m-%d %H:%i:%s') AS ttdate`;
    sql += `, DATE_FORMAT(pdate, '%Y-%m-%d %H:%i:%s') AS ppdate FROM posts`;
    if (withUser) sql += `, users`;
    if (withThread) sql += `, threads`;
    if (withForum) sql += `, forums`;
    sql += ' WHERE (pid = ?)'
    if (withUser) sql += ` AND (users.uemail = posts.puser)`;
    if (withThread) sql += ` AND (threads.tid = posts.pthread)`;
    if (withForum) sql += ` AND (forums.fshort_name = posts.pforum)`;
    connection.query(sql, [post], function (err, ans) {
        if (!err) {
            if (null !=ans[0]) {
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
    connection.query('SELECT * FROM users WHERE users.uemail = ?', [email], function (err, ans) {
        if (!err) {
            var curUser = ans[0];
            if (null != curUser) {
                connection.query('SELECT * FROM followers, users WHERE (firstUser = ?) AND secondUser = users.uemail', [email], function (err, ans) {
                    if (err) {
                        console.log("err 180138");
                        return callback(ErrorOut(4));
                    }
                    curUser.followers = ans.map(el => {
                        return el.secondUser;
                    });
                    connection.query('SELECT * FROM followers, users WHERE (firstUser = users.uemail) AND secondUser = ?', [email], function (err, ans) {
                        if (err) {
                            console.log('err 082237');
                            return callback(ErrorOut(4));
                        }
                        curUser.following = ans.map(el => {
                            return el.firstUser;
                        });
                        connection.query('SELECT sthread FROM subscriptions WHERE suser = ?', [email], function(err, ans){
                            if(err) {
                                console.log('err 082231');
                                return callback(ErrorOut(4));
                            }
                            curUser.subscriptions = ans.map(el => {
                                return el.sthread;
                            });
                            return callback(UserDetailsOut(curUser));
                            });
                        });
                });
            }
            else {
                return callback(ErrorOut(3));
            }
        }
        else {
            console.log("err 180133");
        }

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
            if (null !=ans[0]) {
                if(withUser) ans[0].fuser = UserDetailsOut(ans[0]).response;
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
            date: thread.tdate,
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
            date: thread.tdate,
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
            date: post.date || post.pdate,
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
            date: post.pdate,
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