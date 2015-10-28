define([
  'cdf/Dashboard.Clean',
  'cde/components/Map/ControlPanel/ControlPanel',
  'cdf/lib/jquery'
], function (Dashboard, ControlPanel, $) {

  describe('NewMapComponent/ControlPanel', function () {
    var cp, $div;
    beforeEach(function () {
      $div = $('<div />').appendTo($('body'));
      cp = new ControlPanel($div, {});
    });

    afterEach(function(){
      $div.remove();
    });

    describe('correctly sets the mode to', function () {
      it('"pan"', function () {
        cp.setPanningMode();
        expect(cp.getMode()).toBe('pan');
        expect(cp.isPanningMode()).toBe(true);
        expect(cp.isZoomBoxMode()).toBe(false);
        expect(cp.isSelectionMode()).toBe(false);
      });
      it('"zoombox"', function () {
        cp.setZoomBoxMode();
        expect(cp.getMode()).toBe('zoombox');
        expect(cp.isPanningMode()).toBe(false);
        expect(cp.isZoomBoxMode()).toBe(true);
        expect(cp.isSelectionMode()).toBe(false);
      });
      it('"selection"', function () {
        cp.setSelectionMode();
        expect(cp.getMode()).toBe('selection');
        expect(cp.isPanningMode()).toBe(false);
        expect(cp.isZoomBoxMode()).toBe(false);
        expect(cp.isSelectionMode()).toBe(true);
      });
    });

    xdescribe('triggers an event when clicking on the button', function () {
      var eventMapping = {
        '.map-control-zoom-in': 'zoom:in'
      };
      var selector;
      for (selector in eventMapping) {
        it('"' + selector + '"', function (done) {
          var f = function () {
            expect(1).toBe(1);
            done();
          };

          cp.on(eventMapping[selector], f);
          $div.find(selector).click();

        });
      }
    });

  });

});