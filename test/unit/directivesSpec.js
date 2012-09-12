'use strict';

/* jasmine specs for directives go here */

describe('directives', function() {
    beforeEach(module('bgc.directives'));

    describe('doc-viewer directive', function () {
        var $scope, $compile;

        beforeEach(inject(function (_$rootScope_, _$compile_) {
            $scope = _$rootScope_.$new();
            $compile = _$compile_;
        }));

        it('should create an iframe element', function () {
            var element = $compile('<doc-viewer></doc-viewer>')($scope);

            expect(element[0].firstChild.tagName).toEqual('IFRAME');
        });

        it('should create an iframe element with a src value identical to its url attribute', function(){
            var url = "http://pykl.rowboatweb.com/Git-branching-model.pdf";

            var element = $compile('<doc-viewer url=' + url + ' google-doc=false></doc-viewer>')($scope);

            expect(element[0].firstChild.src).toEqual('http://docs.google.com/viewer?url=' + url + '&embedded=true');
        });
    });
});
