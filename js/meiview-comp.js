meiView = {};

meiView.Viewer = function(options) {
  this.init(options);
}

/**
 * Constructor of the MEI Viewer.
 * 
 * @options.param MEI the rich MEI document (XML DOM object)
 * @options.width the width of the canvas in pixels
 * @options.height the height of the canvas in pixels
 * @options.pano {Boolean} whether the display should be panoramic, or system-breaking
 * @options.rich {Boolean} whether to display rich features (grren dots, selectable staevs, etc.) or display 
 *       the lemma flat, without any interactive controls
 */
meiView.Viewer.prototype.init = function(options){

  var randomID = function() {
    return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-8)
  }

  this.id = options.id || randomID();
  this.MEI = options.MEI;
  this.MEI.initSectionView();
  if (options.pages) {
    this.pages = options.pages;
  } else {
    this.pages = new meiView.Pages();
    if (this.parsePages) {
      this.parsePages(this.MEI);
    }
  }
  console.log('pages:')
  console.log(this.pages);
  this.scoreWidth = options.width || 1000;
  this.scoreHeight = options.height || 1000;
  this.Sources = this.createSourceList(this.MEI.ALTs);
  this_viewer = this;
  this.UI = new meiView.UI({
    viewer: this_viewer,
    maindiv: options.maindiv,
    title: options.title,
  });  
}

meiView.Viewer.prototype.createSourceList = function(Apps) {
  var result = {}
  for(appID in Apps) {
    var app = Apps[appID];
    for(varXMLID in app.altitems) {
      var altitem = app.altitems[varXMLID];
      if (altitem.tagname === 'rdg') {
        if (!altitem.source) throw "meiView Error: no source specified for rdg: '" + altitem.xmlID +"'";
        var srcIDs = altitem.source.split(' ');
        for (var k=0; k<srcIDs.length; k++) {
          var srcID = srcIDs[k];
          if (!result[srcID]) {
            result[srcID] = [];
          }
          var measure_n = $($(this.MEI.rich_score).find('app[xml\\:id="'+app.xmlID+'"]').closest('measure')[0]).attr('n');
          result[srcID].push( { appID:app.xmlID, measureNo:measure_n } );
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

meiView.Viewer.prototype.selectingState = { 
  
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
  console.log('meiView.Pages.prototype.nextPage: ' + this.currentPageIndex);
}

meiView.Pages.prototype.jumpTo = function(pageNo) {
  if (0<=pageNo && pageNo<this.pages.length) {
    this.currentPageIndex = pageNo;
  }
}

meiView.Pages.prototype.jumpToMeasure = function(measureNo) {
  this.jumpTo(this.whichPage(measureNo));
}


meiView.Pages.prototype.prevPage = function() {
  if (this.currentPageIndex>0) {
    this.currentPageIndex--;
  }
}

meiView.Pages.prototype.whichPage = function(measureNo) {
  var result = -1;
  $.each(this.pages, function(i, page) {
    if (page.startMeasureN <= measureNo && measureNo <= page.endMeasureN) {
      result = i;
    }
  });
  return result;
}

meiView.Pages.prototype.currentPage = function() {
  return this.pages[this.currentPageIndex];
}

meiView.Pages.prototype.totalPages = function() {
  return this.pages.length;
}

meiView.Viewer.prototype.nextPage = function(){
  this.pages.nextPage();
  this.displayCurrentPage();
  this.UI.dlg && this.UI.dlg.hide();
  // this.updateHistory();
  // console.log(this.UI.fabrCanvas);
  // setTimeout(function(){this.UI.fabrCanvas.renderAll()}, 0);
}

meiView.Viewer.prototype.prevPage = function(){
  this.pages.prevPage();
  this.displayCurrentPage();
  this.UI.dlg && this.UI.dlg.hide();
  // this.updateHistory();
  // setTimeout(function(){this.UI.fabrCanvas.renderAll()}, 0);
}

meiView.Viewer.prototype.jumpTo = function(i) {
  this.pages.jumpTo(i);
  this.displayCurrentPage();
}

meiView.Viewer.prototype.jumpToMeasure = function(i) {
  this.pages.jumpToMeasure(i);
  this.displayCurrentPage();
}

meiView.Viewer.prototype.displayCurrentPage = function() {
  var pageXML = this.getPageXML(this.pages.currentPage());
  this.UI.renderPage(pageXML, {vexWidth:this.scoreWidth, vexHeight:this.scoreHeight});
  this.UI.displayDots();
  this.UI.showTitle(this.pages.currentPageIndex === 0);
  this.UI.fabrCanvas.calcOffset();
  this.UI.updatePageLabels(this.pages.currentPageIndex+1, this.pages.totalPages())
}

meiView.Viewer.prototype.selectVariant = function(varXmlID) {
  /* assuming meiView.selectingState.on === true */
  this.selectingState.select(varXmlID);

  /* update variant path according to new selection */
  var sectionplaneUpdate = {};
  sectionplaneUpdate[this.selectingState.appID] = varXmlID;
  this.MEI.updateSectionView(sectionplaneUpdate);
}

/**
 * @param page {mewView.Page} to specify measure numbers.
 * @return XML {XML DOM object}
 */
meiView.Viewer.prototype.getPageXML = function(page) {
  var noMeter = (page.startMeasureN !== 1);
  return this.MEI.getSectionViewSlice({start_n:page.startMeasureN, end_n:page.endMeasureN, noMeter:noMeter});
}

meiView.Viewer.prototype.loadXMLString = function(txt) {
  var xmlDoc;
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
