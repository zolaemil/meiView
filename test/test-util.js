/*
 * test-util.js 
 *
 * Helper functions for tests
 *
 */

meiView.Test = (function () {
  
  test = {
    
    loadMEIDoc: function(filename, options) {
      var loadedXML = meiView.Util.loadXMLDoc(filename);
      var filteredXml = meiView.filterMei(loadedXML, options);
      var meiDoc = new MeiLib.MeiDoc(filteredXml);
      return meiDoc;
    },

    LayedoutTest: function(tc) {
      var meiDoc = this.loadMEIDoc(tc.filename);
      var testdiv = $('<div/>', {
        class: "test-div",
        text: tc.title + ' - Layout View',
      });
      testdiv.appendTo(tc.div);
      testdiv.append('<div class="viewer"></div>');
      if (typeof tc.pagination === 'number') {
        tc.pagination = new meiView.Pages({
          length: $(meiDoc.rich_score).find('measure').length,
          mpp: tc.pagination,
        });
      }
      viewer = new meiView.Viewer({
        maindiv: $(testdiv).find('.viewer'),
        MEI: meiDoc,
        pages: tc.pagination,
        title: tc.title,
      });
      viewer.nextPage();
      return viewer;
    },

    CompactTest: function(tc) {
      var meiDoc = this.loadMEIDoc(tc.filename, { noSysBreak:true });
      var testdiv = $('<div/>', {
        class: "test-div",
        text: tc.title + ' - Layout View',
      });
      testdiv.appendTo(tc.div);
      testdiv.append('<div class="viewer"></div>');
      if (typeof tc.pagination === 'number') {
        tc.pagination = new meiView.Pages({
          length: $(meiDoc.rich_score).find('measure').length,
          mpp: tc.pagination,
        });
      }
      viewer = new meiView.CompactViewer({
        maindiv: $(testdiv).find('.viewer'),
        MEI: meiDoc,
        pages: tc.pagination,
        title: tc.title,
        displayFirstPage: true,
        mode: tc.mode,
        pxpMeasure: tc.pxpMeasure,
      });
      return viewer;
    },

  }

  return test;
  
})();

