var discussionList = module.singleton("discussionList", function() {
    //todo: replace image links with something less hardcoded
    return [{
        id: 1,
        title: "DISCUSSION TITLE 1",
        posts: [{
            owner: {
                username: "bob101",
                picture: "http://localhost:8080/gc/images/40x40.gif"
            },
            content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco" +
                "laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, " +
                "sunt in culpa qui officia deserunt mollit anim id est laborum."
        }]
    },{
        id: 2,
        title: "DISCUSSION TITLE 2",
        posts: [{
            owner: {
                username: "bob202",
                picture: "http://localhost:8080/gc/images/40x40.gif"
            },
            content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco" +
                "laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, " +
                "sunt in culpa qui officia deserunt mollit anim id est laborum."
        }]
    },{
        id: 3,
        title: "DISCUSSION TITLE 3",
        posts: [{
            owner: {
                username: "bob303",
                picture: "http://localhost:8080/gc/images/40x40.gif"
            },
            content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco" +
                "laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, " +
                "sunt in culpa qui officia deserunt mollit anim id est laborum."
        }]
    }];
});

var getDiscussion = function(id) {
    if(id == "new")
    {
        return {
            id: 0,
            title: "",
            posts: []
        }
    }
    return discussionList[id-1];
}

var addReply = function(id, reply) {
    discussionList[id-1].posts.push(reply);
}

var createDiscussion = function(firstPost) {
    discussionList.push(firstPost);
    return discussionList.length;
}

export('getDiscussion', 'addReply', 'createDiscussion');