/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 8/14/12
 * Time: 10:13 AM
 * To change this template use File | Settings | File Templates.
 */
angular.module('ui.directives').directive('uiPupload', function(){
    return{
        restrict:'E',
        link:function (scope, elm, attrs) {
            var opts = {};
            var config = {
                //runtimes : 'gears,html5,flash,silverlight,browserplus',
                runtimes:'html5',
                browse_button:'pickfiles',
                container:'container',
                max_file_size:'10mb',
                url:'/gc/api/profiles/pics/1',
                resize:{width:320, height:240, quality:90},
                flash_swf_url:'../js/plupload.flash.swf',
                silverlight_xap_url:'../js/plupload.silverlight.xap',
                filters:[
                    {title:"Image files", extensions:"jpg,gif,png"},
                    {title:"Zip files", extensions:"zip"}
                ]
            };

            if (attrs.droptarget) {
                config.drop_element = attrs.droptarget;
            }

            function $(id) {
                return document.getElementById(id);
            }

            var uploader = new plupload.Uploader(config);

            uploader.bind('FilesAdded', function (up, files) {
                for (var i in files) {
                    $('filelist').innerHTML += '<div id="' + files[i].id + '">' + files[i].name + ' (' + plupload.formatSize(files[i].size) + ') <b></b></div>';
                }

                setTimeout(function () {
                    uploader.start();
                }, 500);
            });

            uploader.bind('UploadProgress', function (up, file) {
                $(file.id).getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
            });

            uploader.bind('FileUploaded', function (uploader, file, response) {
                console.log(uploader, file, response);
                $(config.drop_element).src = response.response;
            })

            uploader.init();
        }
    }
});