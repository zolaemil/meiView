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

meiView = {};

meiView.SelectedEditors = function() {
  this.init();
}

meiView.SelectedEditors.prototype.init = function (){
  this.editors = {};
}

meiView.SelectedEditors.prototype.addEditor = function(editor) {
  if (this.editors[editor]) {
    this.editors[editor] = false;
  }
}

meiView.SelectedEditors.prototype.removeEditor = function(editor) {
  if (!this.editors[editor]) {
    this.editors[editor] = true;
  }
}

meiView.SelectedEditors.prototype.toggleReconstructor = function(editor) {
  if (this.editors[editor]) {
    this.editors[editor] = false;
  } else {
    this.editors[editor] = true;
  }
}

meiView.SelectedEditors.prototype.editorsList = function() {
  var res = [];
  $.each(this.editors, function(i, e) {
    if (e) {
      res.push(i);
    }
  });
  return res;
}

meiView.Viewer = function(options) {
  this.init(options);
}

meiView.DISPLAY_MEASURE_NUMBERS = {
  NONE: 0,
  ALL: 1,
/*TODO:  
  EVERY_5: 5,
  EVERY_10: 5,
  SYSTEM: 'SYSTEM',
*/
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
  this.display_measure_numbers = options.display_measure_numbers;
  if (options.pages) {
    this.pages = options.pages;
  } else {
    this.pages = new meiView.Pages();
    if (this.parsePages) {
      this.parsePages(this.MEI);
    }
  }
  this.scoreWidth = options.width || 1000;
  this.scoreHeight = options.height || 1000;
  this.Sources = this.createSourceList(this.MEI.ALTs);
  this.Editors = this.createEditorList();
  this.Reconstructors = this.createReconstructorList();
  this_viewer = this;
  this.UI = new meiView.UI({
    viewer: this_viewer,
    maindiv: options.maindiv,
    title: options.title,
  });
  this.selectedReconstructors = new meiView.SelectedEditors();
}

meiView.Viewer.prototype.toggleReconstruction = function(editor) {
  this.selectedReconstructors.toggleReconstructor(editor);
  this.selectReconstructions(this.selectedReconstructors.editors);
}

meiView.Viewer.prototype.createReconstructorList = function() {
  var result = {};
  var editors = $(this.MEI.rich_head).find('fileDesc').find('editor');
  var me = this;
  $(editors).each(function(i) {
    var edid = $(this).attr('xml:id');
    if (!edid) throw "Editor ID is undefined";
    if ($(me.MEI.rich_score).find('app[type="reconstruction"]').find('rdg[resp="#' + edid + '"]').length > 0) {
      result[edid] = this;
    }
  });  
  return result;
}

meiView.Viewer.prototype.createEditorList = function() {
  var result = {};
  var editors = $(this.MEI.rich_head).find('fileDesc').find('editor');
  var me = this;
  $(editors).each(function() {
    var edid = $(this).attr('xml:id');
    if (!edid) throw "Editor ID is undefined";
    if ($(me.MEI.rich_score).find('sic[resp="#' + edid + '"]').length > 0) {
      result[edid] = this;
    }
  });  
  return result;
}

meiView.Viewer.prototype.createSourceList = function(Apps) {
  var result = {}
  for(appID in Apps) {
    var app = Apps[appID];
    for(varXMLID in app.altitems) {
      var altitem = app.altitems[varXMLID];
      if (altitem.tagname === 'rdg') {
        if (altitem.source) {
          var srcIDs = altitem.source.split(' ');
          for (var k=0; k<srcIDs.length; k++) {
            var srcID = srcIDs[k];
            if (!result[srcID]) {
              result[srcID] = [];
            }
            var measure_n = $($(this.MEI.rich_score).find('app[xml\\:id="'+app.xmlID+'"]').closest('measure')[0]).attr('n');
            result[srcID].push( { appID:app.xmlID, measureNo:measure_n } );
          } 
        }
      } else if (altitem.tagname === 'lem') {
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
  // setTimeout(function(){this.UI.fabrCanvas.renderAll()}, 0);
}

meiView.Viewer.prototype.prevPage = function(){
  this.pages.prevPage();
  this.displayCurrentPage();
  this.UI.dlg && this.UI.dlg.hide();
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

meiView.Viewer.prototype.selectReconstructions = function(editors) {
  var sectionplaneUpdate = {};

  var apps = $(this.MEI.rich_score).find('app[type="reconstruction"]');
  for (editorID in editors) {
    var i;
    for (i=0; i<apps.length; i++) {
      var app = apps[i];
      var app_xml_id=$(app).attr('xml:id');
      var rdgs = $(app).find('rdg[resp="#'+editorID+'"]');
      var j;
      for (j=0; j<rdgs.length; j++) {
        var rdg_xml_id = $(rdgs[j]).attr('xml:id');
        if (sectionplaneUpdate[app_xml_id] && editors[editorID]) {
          sectionplaneUpdate[app_xml_id].push(rdg_xml_id);
        } else if (!sectionplaneUpdate[app_xml_id] && editors[editorID]) {
          sectionplaneUpdate[app_xml_id] = [rdg_xml_id];
        } else if (!sectionplaneUpdate[app_xml_id] && !editors[editorID]){
          sectionplaneUpdate[app_xml_id] = [];
        }
      };
    };
  }

  this.MEI.updateSectionView(sectionplaneUpdate);
  this.displayCurrentPage();
}

meiView.Viewer.prototype.selectReconstruction = function(editor) {
  var sectionplaneUpdate = {};
  var apps = $(this.MEI.rich_score).find('app[type="reconstruction"]');
  var i;
  for (i=0; i<apps.length; i++) {
    var app = apps[i];
    var app_xml_id=$(app).attr('xml:id');
    var rdgs = $(app).find('rdg[resp="#'+editor+'"]');
    var j;
    for (j=0; j<rdgs.length; j++) {
      var rdg_xml_id = $(rdgs[j]).attr('xml:id');
      sectionplaneUpdate[app_xml_id] = [rdg_xml_id];
    }
  }
  this.MEI.updateSectionView(sectionplaneUpdate);
  this.displayCurrentPage();
}

meiView.Viewer.prototype.stavesToDisplay = function(plain_mei) {
  var result = [];
  staffNs = {};
  staffDefs = $(plain_mei).find('staffDef');
  var i;
  for (i=0; i<staffDefs.length; i++) {
    sd = staffDefs[i];
    N = $(sd).attr('n') || '1';
    if ($(plain_mei).find('staff[n="' + N + '"]').length > 0) {
      is_N = function(item) { return item === N };
      if (!result.any(is_N)) {
        result.push(Number(N));
      }
    }
  }  
  return result;
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
  staves = this.stavesToDisplay(this.MEI.sectionview_score);
  return this.MEI.getSectionViewSlice({start_n:page.startMeasureN, end_n:page.endMeasureN, noMeter:noMeter, staves:staves});
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
