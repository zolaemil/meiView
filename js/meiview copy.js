/***
* meiview.js
* Author: Zoltan Komives
* Contributor: Raffaele Viglianti
* 
* Copyright © 2013 Zoltan Komives, Raffaele Viglianti
* University of Maryland
* 
* Licensed under the Apache License, Version 2.0 (the "License"); you
* may not use this file except in compliance with the License.  You may
* obtain a copy of the License at
* 
*    http://www.apache.org/licenses/LICENSE-2.0
* 
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
* implied.  See the License for the specific language governing
* permissions and limitations under the License.
***/

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

meiView.updateHistory = function(){
  $.bbq.pushState({
    pg : meiView.pages.currentPageIndex + 1
  });
}

meiView.nextPage = function(){
  this.pages.nextPage();
  this.displayCurrentPage();
  this.UI.dlg && this.UI.dlg.hide();
  this.updateHistory();
  setTimeout(function(){meiView.UI.fabrCanvas.renderAll()}, 0);
}

meiView.prevPage = function(){
  this.pages.prevPage();
  this.displayCurrentPage();
  this.UI.dlg && this.UI.dlg.hide();
  this.updateHistory();
  setTimeout(function(){meiView.UI.fabrCanvas.renderAll()}, 0);
}

meiView.jumpTo = function(i) {
  this.pages.jumpTo(i);
  this.displayCurrentPage();
}

meiView.pages = new meiView.Pages();
meiView.scoreWidth = 1000;
meiView.scoreHeight = 1000;

meiView.displayCurrentPage = function() {
  var pageXML = meiView.getPageXML(meiView.pages.currentPage());
  this.UI.renderPage(pageXML, {vexWidth:meiView.scoreWidth, vexHeight:meiView.scoreHeight});
  this.UI.displayDots();
  meiView.UI.showTitle(meiView.pages.currentPageIndex === 0);
  meiView.UI.fabrCanvas.calcOffset();
  meiView.UI.updatePageLabels(meiView.pages.currentPageIndex+1, meiView.pages.totalPages());
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
 * @param page {mewView.Page} to specify measure numbers.
 * @return XML {XML DOM object}
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
