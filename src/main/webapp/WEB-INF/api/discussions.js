//todo: replace image links with something less hardcoded
var discussions = [{
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
    blogtitle: "article-title-2",
    title: "SECURE ARTICLE TITLE #2",
    content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco" +
        "laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, " +
        "sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "abstract": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. FOR MORE ARTICLE LOGIN"
},{
    id: 3,
    blogtitle: "article-title-3",
    title: "SUPER SECURER ARTICLE TITLE #3",
    content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco" +
        "laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, " +
        "sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "abstract": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. FOR MORE ARTICLE LOGIN"
}];

var getDiscussion = function(id) {
    if(id == "new")
    {
        return {
            id: 0,
            title: "NEW DISCUSSION",
            posts: []
        }
    }
    return discussions[id-1];
}

export('getDiscussion');