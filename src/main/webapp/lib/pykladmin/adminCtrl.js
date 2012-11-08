'use strict';

function AdminCtrl($rootScope, $scope, $routeParams, $http, $log, $location, Profile) {
    /*var url = 'api/admin/users';
    var backup = {};

    setupScope();
    loadContent();

    function setupScope() {
        $scope.pageType = "users";
        $scope.isLoaded = false;
    }

    function loadContent() {
        $http.get(url).success(function (data) {
            $scope.users = data.content;
            $scope.isLoaded = true;
        });
    }

    $scope.saveEdits = function(user) {
        $http.put(url, user).success(function (data) {
            user.editing = false;
        });
    }

    $scope.editUser = function(user) {
        backup = angular.copy(user);

        user.editing = true;
    }

    $scope.cancelEdit = function(user) {
        user.name = backup.name;
        user.workHistory = backup.workHistory;
        user.accountEmail = backup.accountEmail;

        user.editing = false;
    }

    $scope.resetPassword = function() {
        var data = {
            token: "token"
        };

        $http.post('/gc/api/utility/resetpassword/', data).success(function(data){
            alert("Password reset successful.");
        });
    }

    $scope.banUser = function(user) {
        if(confirm("Are you sure you want to ban "+user.name.fullName+"?")) {
            alert("User is banned");
        }
    }*/
}

function adminUsersList($rootScope, $scope, $routeParams, $http, $log, $location, Profile){
    $scope.adminUsers = true;
    $scope.adminArticles = false;

    $rootScope.banner = 'none';
    $rootScope.about = 'none';

    /*Profile.query(function(profiles){
        $scope.profiles = profiles.content;
    });*/

    $http.get('/gc/api/profiles/admin').
        success(function(data, status, headers, config){
            console.log(data);
            $scope.profiles = data.content;
            $scope.facets = data.facets;

            // create a scope object for each facet term
            for(var facet in $scope.facets){
                //var term =
                $scope.facets[facet].selected = false;
            }
        }).
        error(function(data, status, headers, config){

        });

    $scope.filtered = function(checked, id){
        var status = [];

        $scope.allTypes = false;
        console.log('search ' + id + ' is ' + checked);

        for(var facet in $scope.facets){
            if($scope.facets[facet].selected === true){
                status.push($scope.facets[facet].term);
            }
        }

        status = status.join(' ');

        var data = {
            status: status
        };

        //dataType = [];
        $http.post('api/profiles/admin/status/', data)
            .success(function(response){
                console.log('Success! Search request was successful');
                $scope.profiles = response.content;
            })
            .error(function(){
                console.log('Error! Search request was successful');
            });
    };
}

function adminUsersNew($rootScope, $scope, $routeParams, $http, $log, $location, Profile){
    $scope.adminUsers = false;
    $scope.adminArticles = false;

    $rootScope.banner = 'none';
    $rootScope.about = 'none';

    $scope.profile = {};

    $scope.profile.name = {
        given: '',
        surname: ''
    }

    $scope.userCanEdit = true;
    $scope.profile.thumbnail = 'images/GCEE_image_profileMale_135x135.jpeg';
    $scope.profile.accountEmail = {
        address: ''
    };

    $scope.profile.websites = [{
        title: '',
        url: ''
    }];

    $scope.profile.educationHistory = [{
        schoolName: '',
        fieldOfStudy: '',
        country: '',
        degree: '',
        edNotes: '',
        yearFrom: {
            hijri: '',
            preference: 'gregorian',
            gregorian: ''
        },
        yearTo: {
            hijri: '',
            preference: 'gregorian',
            gregorian: ''
        }
    }];

    $scope.profile.workHistory = [{
        title: '',
        businessName: '',
        location: '',
        workNotes: '',
        yearStarted: {
            hijri: '',
            preference: 'gregorian',
            gregorian: ''
        },
        yearFinished: {
            hijri: '',
            preference: 'gregorian',
            gregorian: ''
        }
    }];

    $scope.save = function(profile){
        $scope.newProfile = new Profile(profile);

        $scope.newProfile.$save(function(response){
            var data = {
                profileId: response.content._id
            }

            $http.post('/gc/api/utility/verifyprofile/', data)
                .success(function(data, status, headers, config){

                })
                .error(function(data, status, headers, config){
                    console.log('POST VERIFY PROFILE ERROR!!!');
                });

            $location.path('/profiles/view/' + response.content._id);
        }, function(response){
            console.log('POST ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
        });
    };

    $scope.cancel = function(){
        $location.path('/admin/users');
    }
}

function adminArticlesUpdate($rootScope, $scope, $routeParams, $http, $log, $location, Article){
    $rootScope.banner = 'none';
    $rootScope.about = 'none';

    $scope.tinyMCEConfig = {
        width: '100%',
        height: '600px',
        mode: 'textareas',
        theme: 'advanced',

        plugins : "autolink,lists,spellchecker,pagebreak,style,layer,table,save,advhr,advimage,advlink,emotions,iespell,inlinepopups,insertdatetime,preview,media,searchreplace,print,contextmenu,paste,directionality,fullscreen,noneditable,visualchars,nonbreaking,xhtmlxtras,template",
        theme_advanced_buttons1 : "save,newdocument,|,bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,cut,copy,paste,pastetext,pasteword",
        theme_advanced_buttons2 : "styleselect,formatselect,fontselect,fontsizeselect",
        theme_advanced_buttons3 : "search,replace,|,bullist,numlist,|,outdent,indent,blockquote,|,undo,redo,|,link,unlink,anchor,image,cleanup,help,code",
        theme_advanced_buttons4 : "tablecontrols,|,hr,removeformat,visualaid,|,sub,sup",
        theme_advanced_buttons5 : "charmap,emotions,iespell,media,advhr,|,print,|,ltr,rtl,|,fullscreen,|,insertdate,inserttime,preview,|,forecolor,backcolor",
        theme_advanced_toolbar_location : "top",

        file_browser_callback: bgcFileBrowser
    };

    /*var article = Article.get({articleId:$routeParams.articleId},
        function(){
            if(article.status === 400){
                $location.path('/error/404');
            }else{
                $scope.article = article.content;
            }
        }
    );*/
    $http.get( 'api/article/' + $routeParams.articleId )
        .success( function (data) {
            console.log("ARTICLE RETURNED: ",data);
            $scope.article = data;
        })
        .error(function(data, status) {
            $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
        });

    $scope.update = function(article){
        var date = new Date();

        delete article.doctype;
        delete article.premium;

        //article.lastModifiedDate = ISODateString(date);
        article.description = generateDescription(article.content.replace(/<(?:.|\n)*?>/gm, ''));

        Article.update({articleId: article._id}, article, function(response){
            $location.path('/content/' + article._id);
        }, function(response){
            console.log('UPDATE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
        });
    }

    $scope.cancel = function(){
        $location.path('/admin/articles');
    };

    function generateDescription(content){
        var result = content;
        var resultArray = result.split(" ");
        if(resultArray.length > 40){
            resultArray = resultArray.slice(0, 40);
            result = resultArray.join(" ") + " ...";
        }
        return result;
    };

    function ISODateString(d){
        function pad(n){return n<10 ? '0'+n : n}
        return d.getUTCFullYear()+'-'
            + pad(d.getUTCMonth()+1)+'-'
            + pad(d.getUTCDate())+'T'
            + pad(d.getUTCHours())+':'
            + pad(d.getUTCMinutes())+':'
            + pad(d.getUTCSeconds())+'Z'
    }

    function bgcFileBrowser(field_name, url, type, win){

        //alert("Field_Name: " + field_name + " nURL: " + url + " nType: " + type + " nWin: " + win); // debug/testing

        tinyMCE.activeEditor.windowManager.open({
            file : '../../../../../gc/partials/tinymceuploads.html',
            title : 'Babson GCEE Insert/Upload',
            width : 600,  // Your dimensions may differ - toy around with them!
            height : 220,
            resizable : "yes",
            inline : "yes",  // This parameter only has an effect if you use the inlinepopups plugin!
            close_previous : "no"
        }, {
            window : win,
            input : field_name
        });
        return false;
    }
}

function adminArticlesCreate($rootScope, $scope, $routeParams, $http, $log, $location, Article){
    $rootScope.banner = 'none';
    $rootScope.about = 'none';

    $scope.tinyMCEConfig = {
        width: '100%',
        height: '600px',
        mode: 'textareas',
        theme: 'advanced',

        plugins : "autolink,lists,spellchecker,pagebreak,style,layer,table,save,advhr,advimage,advlink,emotions,iespell,inlinepopups,insertdatetime,preview,media,searchreplace,print,contextmenu,paste,directionality,fullscreen,noneditable,visualchars,nonbreaking,xhtmlxtras,template",
        theme_advanced_buttons1 : "save,newdocument,|,bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,cut,copy,paste,pastetext,pasteword",
        theme_advanced_buttons2 : "styleselect,formatselect,fontselect,fontsizeselect",
        theme_advanced_buttons3 : "search,replace,|,bullist,numlist,|,outdent,indent,blockquote,|,undo,redo,|,link,unlink,anchor,image,cleanup,help,code",
        theme_advanced_buttons4 : "tablecontrols,|,hr,removeformat,visualaid,|,sub,sup",
        theme_advanced_buttons5 : "charmap,emotions,iespell,media,advhr,|,print,|,ltr,rtl,|,fullscreen,|,insertdate,inserttime,preview,|,forecolor,backcolor",
        theme_advanced_toolbar_location : "top",

        file_browser_callback: bgcFileBrowser
    }

    $scope.article = {
        title: '',
        content: '',
        author: 'James Hines',
        key: '',
        thumbnail: '',
        lastModifiedDate: '',
        dateCreated: '',
        likes: 0,
        comments: 0,
        views: 0,
        rating: 0
    }

    //dateCreated: "2011-01-17T23:07:32.000Z"

    $scope.save = function(article){
        $scope.newArticle = new Article(article);

        var date = new Date();

        $scope.newArticle.lastModifiedDate = ISODateString(date);
        $scope.newArticle.dateCreated = ISODateString(date);

        var utc_timestamp = Date.UTC(date.getFullYear(),date.getMonth(), date.getDate() ,
            date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());

        $scope.newArticle.key = 'article-key-' + utc_timestamp;

        $scope.newArticle.description = generateDescription(article.content.replace(/<(?:.|\n)*?>/gm, ''));
        //console.log('Content with stripped tags' + article.content.replace(/<(?:.|\n)*?>/gm, ''));

        var thumbnail = /<\s*img [^\>]*src\s*=\s*(["\'])(.*?)\1/.exec(article.content);
        console.log(thumbnail);

        $scope.newArticle.thumbnail = thumbnail[2];

        $scope.newArticle.$save(
            function(response){
                $location.path('/content/' + response.content._id);
                console.log('ARTICLE SUCCESSFULLY SAVED!!!', 'STATUS CODE: ' + response.status);
            },
            function(response){
                console.log('ARTICLE SAVE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
            }
        );
    }

    $scope.cancel = function(){
        $location.path('/admin/articles');
    }

    function ISODateString(d){
        function pad(n){return n<10 ? '0'+n : n}
        return d.getUTCFullYear()+'-'
            + pad(d.getUTCMonth()+1)+'-'
            + pad(d.getUTCDate())+'T'
            + pad(d.getUTCHours())+':'
            + pad(d.getUTCMinutes())+':'
            + pad(d.getUTCSeconds())+'Z'
    }

    function generateDescription(content){
        var result = content;
        var resultArray = result.split(" ");
        if(resultArray.length > 40){
            resultArray = resultArray.slice(0, 40);
            result = resultArray.join(" ") + " ...";
        }
        return result;
    }

    function bgcFileBrowser(field_name, url, type, win){

        //alert("Field_Name: " + field_name + " nURL: " + url + " nType: " + type + " nWin: " + win); // debug/testing

        tinyMCE.activeEditor.windowManager.open({
            file : '../../../../../gc/partials/tinymceuploads.html',
            title : 'Babson GCEE Insert/Upload',
            width : 600,  // Your dimensions may differ - toy around with them!
            height : 220,
            resizable : "yes",
            inline : "yes",  // This parameter only has an effect if you use the inlinepopups plugin!
            close_previous : "no"
        }, {
            window : win,
            input : field_name
        });
        return false;
    }
}

