var meiView = {};

meiView.selectingState = { 
  
  enter: function(appID, selectedvarXmlID) {
    this.ON = true;
    this.appID = appID;
    this.selectedVarXmlID = selectedvarXmlID;
  },
  
  select: function(xmlID) {
    this.selectedVarXmlID = xmlID;
  },
  
  exit: function() {
    this.ON = false;
  },
  
  
};

meiView.createSourceList = function(Apps) {
  var result = {}
  for(appID in Apps) {
    var app = Apps[appID];
    for(varXMLID in app.variants) {
      var variantItem = app.variants[varXMLID];
      if (variantItem.tagname === 'rdg') {
        if (!variantItem.source) throw "meiView Error: no source specified for rdg: '" + variantItem.xmlID +"'";
        var srcIDs = variantItem.source.split(' ');
        for (var k=0; k<srcIDs.length; k++) {
          var srcID = srcIDs[k];
          if (!result[srcID]) {
            result[srcID] = [];
          }
          result[srcID].push( { appID:app.xmlID } );
        } 
      } else {
        if (!result['lem']) {
          result['lem'] = [];
        }
        result['lem'].push( { appID:app.xmlID } );
      }
    }
  }
  return result;
}


meiView.Page = function(start, end) {
  this.startMeasureN = start;
  this.endMeasureN = end;
}

meiView.Pages = function() {
  this.pages = [];
  this.currentPageIndex = -1;
}

meiView.Pages.prototype.AddPage = function(start, end) {
  this.pages.push(new meiView.Page(start, end));
}

meiView.Pages.prototype.nextPage = function() {
  if (this.currentPageIndex<this.pages.length-1) {
    this.currentPageIndex++;
  }
}

meiView.Pages.prototype.jumpTo = function(pageno) {
  if (0<=pageno && pageno<this.pages.length) {
    this.currentPageIndex = pageno;
  }
}

meiView.Pages.prototype.prevPage = function() {
  if (this.currentPageIndex>0) {
    this.currentPageIndex--;
  }
}

meiView.Pages.prototype.currentPage = function() {
  return this.pages[this.currentPageIndex];
}

meiView.Pages.prototype.totalPages = function() {
  return this.pages.length;
}

meiView.nextPage = function(){
  this.pages.nextPage();
  this.displayCurrentPage();
  this.UI.dlg && this.UI.dlg.hide();
}

meiView.prevPage = function(){
  this.pages.prevPage();
  this.displayCurrentPage();
  this.UI.dlg && this.UI.dlg.hide();
}

meiView.jumpTo = function(i) {
  this.pages.jumpTo(i);
  this.displayCurrentPage();
}


meiView.pages = new meiView.Pages();
meiView.scoreWidth = 1000;
meiView.scoreHeight = 1000;

meiView.displayCurrentPage = function() {

  // var variant_page_xmlDoc = loadXMLDoc('xml/Rogamus.xml');
  // var single_path_score = MeiLib.createSingleVariantPathScore(meiView.appReplacements, variant_page_xmlDoc);  

  var pageXML = meiView.getPageXML(meiView.pages.currentPage());
  /* pageXML is singleVariantScore, therefore can be displayed. */
  meiView.UI.renderPage(pageXML, {vexWidth:meiView.scoreWidth, vexHeight:meiView.scoreHeight});
  meiView.UI.displayDots();
  if (meiView.pages.currentPageIndex === 0) {
    $('#title').show();
  } else {
    $('#title').hide();
  }
  $('#pageNumber-top, #pageNumber-bottom').html((meiView.pages.currentPageIndex+1).toString() + '/' + meiView.pages.totalPages());
}

meiView.selectVariant = function(varXmlID) {
  /* assuming meiView.selectingState.on === true */
  meiView.selectingState.select(varXmlID);

  /* update variant path according to new selection */
  var variantPathUpdate = {};
  variantPathUpdate[meiView.selectingState.appID] = varXmlID;
  meiView.currentScore.updateVariantPath(variantPathUpdate);
}

/**
 * Call web service to get xml containing measures from
 * page.startMeasure to page.endMeasure
 * 
 * @param page {mewView.Page} to specify measure numbers.
 * @return xml string
 */
meiView.getPageXML = function(page) {
  var noMeter = (page.startMeasureN !== 1);
  return meiView.currentScore.getSlice({start_n:page.startMeasureN, end_n:page.endMeasureN, noMeter:noMeter});
}

meiView.loadXMLString = function(txt) {
  if (window.DOMParser)
  {
    parser=new DOMParser();
    xmlDoc=parser.parseFromString(txt,"text/xml");
  }
  else // Internet Explorer
  {
    xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async=false;
    xmlDoc.loadXML(txt); 
  }
  return xmlDoc;
}


meiView.displayVariantInstances = function(appID) {
  
}

