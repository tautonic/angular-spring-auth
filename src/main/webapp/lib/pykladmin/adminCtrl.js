'use strict';

function adminUsersList($rootScope, $scope, $routeParams, $http, $log, $location, Profile){
    $scope.adminUsers = true;
    $scope.adminArticles = false;

    $scope.location = $location;

    $rootScope.banner = 'none';
    $rootScope.about = 'none';

    /*Profile.query(function(profiles){
        $scope.profiles = profiles.content;
    });*/

    $http.get('api/profiles/admin').
        success(function(data, status, headers, config){
            $log.info(data);
            $scope.profiles = data.content;
            $scope.statusFacets = data.facets.status.terms;
            $scope.roleFacets = data.facets.types.terms;

            // create a scope object for each status facet term
            for(var facets in $scope.statusFacets){
                $scope.statusFacets[facets].selected = false;
            }

            // create a scope object for each role facet term
            for(var facets in $scope.roleFacets){
                $scope.roleFacets[facets].selected = false;
            }
        }).
        error(function(data, status, headers, config){

        });

    $scope.filtered = function(filter){
        var status = [];
        var roles = [];
        var data = {};
        var terms = '';

        //$scope.allTypes = false;

        if(filter === 'status'){
            filterByStatus();
        }else{
            filterByRole();
        }

        data = {
            field: filter,
            terms: terms
        };

        $http.post('api/profiles/admin/filter/', data)
            .success(function(response){
                $log.info('Success! Search request was successful');
                $scope.profiles = response.content;
            })
            .error(function(){
                $log.info('Error! Search request was successful');
            });

        function filterByRole(){
            for(var facet in $scope.roleFacets){
                if($scope.roleFacets[facet].selected === true){
                    roles.push($scope.roleFacets[facet].term);
                }
            }

            terms = roles.join(' ');

            if(terms === ''){
                // we should check and see of any options for filtering by status
                // have been selected
                terms = 'ROLE_USER ROLE_PREMIUM ROLE_EDITOR ROLE_ADMIN';
            }
        }

        function filterByStatus(){
            for(var facet in $scope.statusFacets){
                if($scope.statusFacets[facet].selected === true){
                    status.push($scope.statusFacets[facet].term);
                }
            }

            terms = status.join(' ');

            if(terms === ''){
                // we should check and see of any options for filtering by role
                // have been selected
                terms = 'verfied candidate';
            }
        }
    };

    $scope.activateUser = function(element, attr) {
        attr.user.status = "verified";

        Profile.update({profileId:attr.user._id}, attr.user, function(){
            element.parents('.btn-group-border').removeClass('btn-group-border').html("<p>"+attr.user.name.fullName+"'s account has been activated.</p>");
        });
    };

    $scope.deactivateUser = function(element, attr) {
        attr.user.status = "unverified";

        Profile.update({profileId:attr.user._id}, attr.user, function(){
            element.parents('.btn-group-border').removeClass('btn-group-border').html("<p>"+attr.user.name.fullName+"'s account has been deactivated.</p>");
        });
    };

    $scope.deleteUser = function(element, attr) {
        var profile = Profile['delete']({"profileId": attr.user._id}, function(){
            element.parents('.profile-list-item.profile').fadeOut('slow', function(){
                $(this).remove();
            });
        });
    };
}

function adminUsersNew($rootScope, $scope, $routeParams, $http, $log, $location, Profile){
    $log.info('Current path is: ' + $location.path());

    $scope.isDisabled = true;

    $scope.adminUsers = false;
    $scope.adminArticles = false;

    $scope.location = $location;

    $rootScope.banner = 'none';
    $rootScope.about = 'none';

    $scope.profile = {};

    $scope.profile.name = {
        given: '',
        surname: ''
    }

    $scope.userCanEdit = true;
    $scope.profile.thumbnail = 'images/GCEE_image_defaultMale.jpeg';
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

    $scope.profile.password = '';
    $scope.profile.passRepeat = '';

    $scope.save = function(profile){
        if(profile.thumbnail === 'images/GCEE_image_defaultMale.jpeg'){
            profile.thumbnail = 'images/GCEE_image_profileMale_135x135.jpeg';
        }else if(profile.thumbnail === 'images/GCEE_image_defaultFemale.jpeg'){
            profile.thumbnail = 'images/GCEE_image_profileFemale_135x135.jpeg';
        }

        $scope.newProfile = new Profile(profile);

        $scope.newProfile.$save(function(response){
            var data = {
                profileId: response.content._id
            }

            $http.post('api/utility/verifyprofile/', data)
                .success(function(data, status, headers, config){

                })
                .error(function(data, status, headers, config){
                    $location.path("error/500");
                });

            $location.path('/profiles/view/' + response.content._id);
        }, function(response){
            //$log.info('POST ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
            $location.path("error/500");
        });
    };

    $scope.$on('togglePortrait', function(){
        if($scope.profile.thumbnail === 'images/GCEE_image_defaultMale.jpeg'){
            $scope.profile.thumbnail = 'images/GCEE_image_defaultFemale.jpeg';
        }else if($scope.profile.thumbnail === 'images/GCEE_image_defaultFemale.jpeg'){
            $scope.profile.thumbnail = 'images/GCEE_image_defaultMale.jpeg';
        }
    });

    $scope.cancel = function(){
        $location.path('/admin/users');
    }
}

function adminArticlesUpdate($rootScope, $scope, $routeParams, $http, $log, $location, Article){
    $rootScope.banner = 'none';
    $rootScope.about = 'none';
    $scope.resetStatus = "none";
    $scope.attachments = [];

    $scope.location = $location;

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

    $http.get( 'api/article/' + $routeParams.articleId )
        .success( function (data) {
            $log.info("ARTICLE RETURNED: ",data);
            $scope.article = data;
            var tags = [];
            if($scope.article.taggable){
                $scope.article.taggable.forEach(function(tag) {
                    tags.push({ "text": tag });
                });
                $scope.article.taggable = tags;
            }
        })
        .error(function(data, status) {
            $log.info("ERROR retrieving protected resource: "+data+" status: "+status);
        });

    // we need to get the resources attached to this article for updating/removal as well
    $http.get('api')


    $scope.save = function(article){
        if($scope.attachments.length > 0){
            $scope.$broadcast('saveArticle');

            $scope.$on('attachmentUploadComplete', function(){
                saveArticle(article);
            });
        }else{
            saveArticle(article);
        }
    };

    function saveArticle(article){
        article.roles = ['ROLE_ANONYMOUS'];

        delete article._index;
        delete article._score;
        delete article._type;
        delete article._version;

        if(article.premium) {
            article.roles.push('ROLE_PREMIUM');
        }

        //article.lastModifiedDate = ISODateString(new Date());
        article.description = generateDescription(article.content.replace(/<(?:.|\n)*?>/gm, ''));

        var thumbnail = /<\s*img [^\>]*src\s*=\s*(["\'])(.*?)\1/.exec(article.content);

        if(thumbnail){
            article.thumbnail = thumbnail[2];
        }

        var tags = [];
        if($scope.article.taggable){
            $scope.article.taggable.forEach(function(tag) {
                if(tag.text !== '') {
                    tags.push(tag.text);
                }
            });

            $scope.article.taggable = tags;
        }

        Article.update({articleId: article._id}, article, function(response){
            $scope.resetStatus = (response.success) ? "success" : "error";

            var tags = [];
            if($scope.article.taggable){
                $scope.article.taggable.forEach(function(tag) {
                    tags.push({ "text": tag });
                });
                $scope.article.taggable = tags;
            }

            $location.path('/content/view/' + article._id);

        }, function(response){
            $log.info('UPDATE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
        });
    }

    $scope.addTag = function() {
        $scope.article.taggable.push({"text": ""});
    };

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

    function bgcFileBrowser(field_name, url, type, win){

        //alert("Field_Name: " + field_name + " nURL: " + url + " nType: " + type + " nWin: " + win); // debug/testing

        tinyMCE.activeEditor.windowManager.open({
            file : baseUrl + 'partials/tinymceuploads.html',
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

function adminArticlesCreate($rootScope, $scope, $routeParams, $http, $log, $location, Article, $auth){
    $rootScope.banner = 'none';
    $rootScope.about = 'none';

    $scope.location = $location;

    $scope.attachments = [];
    $scope.showUploadBtn = false;

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

    $scope.article = {
        title: '',
        content: '',
        author: $rootScope.auth.username,
        key: '',
        thumbnail: '',
        lastModifiedDate: '',
        dateCreated: '',
        likes: 0,
        comments: 0,
        views: 0,
        rating: 0,
        attachments: [],
        premium: false
    };

    //dateCreated: "2011-01-17T23:07:32.000Z"

    $scope.save = function(article){
        if($scope.attachments.length > 0){
            $scope.$broadcast('saveArticle');

            $scope.$on('attachmentUploadComplete', function(){
                saveArticle(article);
            });
        }else{
            saveArticle(article);
        }
    };

    function saveArticle(article){
        $scope.newArticle = new Article(article);

        var date = new Date();

        $scope.newArticle.lastModifiedDate = ISODateString(date);
        $scope.newArticle.dateCreated = ISODateString(date);

        var utc_timestamp = Date.UTC(date.getFullYear(),date.getMonth(), date.getDate() ,
            date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());

        $scope.newArticle.key = 'article-key-' + utc_timestamp;

        $scope.newArticle.description = generateDescription(article.content.replace(/<(?:.|\n)*?>/gm, ''));

        var thumbnail = /<\s*img [^\>]*src\s*=\s*(["\'])(.*?)\1/.exec(article.content);

        if(thumbnail){
            $scope.newArticle.thumbnail = thumbnail[2];
        }else{
            $scope.newArticle.thumbnail = 'images/row-of-columns.jpg'
        }

        $scope.newArticle.roles = ['ROLE_ANONYMOUS'];

        if(article.premium) {
            $scope.newArticle.roles.push('ROLE_PREMIUM');
            delete article.premium;
        }

        $scope.newArticle.$save(
            function(response){
                $location.path('/content/view/' + response.content._id);
                $log.info('ARTICLE SUCCESSFULLY SAVED!!!', 'STATUS CODE: ' + response.status);
            },
            function(response){
                $log.info('ARTICLE SAVE ERROR HANDLER!!!', 'STATUS CODE: ' + response.status);
            }
        );
    }

    $scope.cancel = function(){
        $location.path('/admin/articles');
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
            file : baseUrl + 'partials/tinymceuploads.html',
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

