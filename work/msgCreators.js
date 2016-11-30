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
    while (!!arr[i]) {
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
    connection.query(`SELECT DATE_FORMAT(tdate, '%Y-%m-%d %H:%i:%s') AS date, threads.* FROM threads WHERE tid = ?`,
        [thread],
        function (err, ans) {
            if (!err) {
                var curThread = ans[0];
                if (!!ans[0]) {
                    ans[0].tdate = ans[0].date;
                    callback(ThreadCreateOut(ans[0]));
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
function ShowPost(post, connection, callback, related) {
    var withUser = find(related, 'user');
    var withThread = find(related, 'thread');
    var withForum = find(related, 'forum');
    var sql = `SELECT posts.*, DATE_FORMAT(pdate, '%Y-%m-%d %H:%i:%s') AS pdate FROM posts`;
    if (withUser) sql += `, users`;
    if (withThread) sql += `, treads`;
    if (withForum) sql += `, forums`;
    connection.query(`SELECT posts.*, DATE_FORMAT(pdate, '%Y-%m-%d %H:%i:%s') AS pdate FROM posts WHERE pid = ?`, [post], function (err, ans) {
        if (!err) {
            if (!!ans[0]) {
                if (withUser) ans = ans.map(el=>{UserDetailsOut(el).details});
                if (withThread) ans = ans.map(el=>{ThreadCreateOut(el).details});
                if (withForum) ans = ans.map(el=>{ForumDetailsOut(el).details});
                callback(PostsCreateOut(ans[0]));
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

//correct
function ShowUser(email, connection, callback) {
    connection.query('SELECT * FROM users WHERE users.uemail = ?', [email], function (err, ans) {
        if (!err) {
            var curUser = ans[0];
            if (!!curUser) {
                connection.query('SELECT * FROM followers, users WHERE (firstUser = ?) AND secondUser = users.uemail', [email], function (err, ans) {
                    if (!err) {
                        curUser['followers'] = ans;
                        connection.query('SELECT * FROM followers, users WHERE (firstUser = users.uemail) AND secondUser = ?', [email], function (err, ans) {
                            if (!err) {
                                curUser['following'] = ans;
                                callback(UserDetailsOut(curUser));
                            }
                            else {
                                console.log("err 180138")
                                callback(ErrorOut(4));
                            }
                        });
                    }
                    else {
                        console.log("err 180137")
                        callback(ErrorOut(4));
                    }
                });
            }
            else {
                callback(ErrorOut(1));
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
    connection.query(`SELECT * FROM forums WHERE fshort_name = ?`, [forum], function (err, ans) {
        if (!err) {
            curForum = ans[0];
            if (!!curForum) {
                if (related) {
                    connection.query('SELECT * FROM users WHERE uemail = ?', [curForum.user], function (err, ans) {
                        if (!err && !!ans[0]) {
                            curForum.user = UserDetailsOut(ans[0]);
                            callback(ForumDetailsOut(curForum));
                        }
                        else {
                            callback(ForumDetailsOut(curForum));
                        }
                    });
                }
                else {
                    callback(ForumDetailsOut(curForum));
                }
            }
            else {
                res.send(ErrorOut(1))
            }
        }
        else {
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
function PostsCreateOut(post) {
    return {
        code: 0,
        response: {
            date: post.pdate,
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