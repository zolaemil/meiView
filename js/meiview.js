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


// the default line thickness is 2, but this renders poorly with meiView's scaling
if (typeof Vex !== 'undefined') Vex.Flow.STAVE_LINE_THICKNESS = 1;


// Constants associated with each variant (supplied part) type
cons = function(var_type) {
  if (var_type == 'reconstruction') {
    return {
      title: 'editor',
      attr: 'resp',
      el: 'rdg',
      parent: 'app',
    }
  }
  else if (var_type == 'concordance') {
    return {
      title: 'source[type="concordance"]',
      attr: 'source',
      el: 'rdg',
      parent: 'app',
    }
  }
  else {
    throw "Unsupported supplied part type";
  }
}


meiView = {};

meiView.Util = {};

meiView.Util.loadXMLDoc = function(filename) {
  if (window.XMLHttpRequest) {
    // code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp=new XMLHttpRequest();
  } else {
    // code for IE6, IE5
    xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.open("GET",filename,false);
  xmlhttp.send();
  if (!xmlhttp.responseXML) throw filename + ' cannot be loaded.';
  return xmlhttp.responseXML;
}

meiView.SelectedSuppliedPartList = function(type_name) {
  this.init(type_name);
}

meiView.SelectedSuppliedPartList.prototype.init = function (type_name){
  this.origins = {};
  this.var_type = type_name;
}

meiView.SelectedSuppliedPartList.prototype.addOrigin = function(origin) {
  if (this.origins[origin]) {
    this.origins[origin] = true;
  }
}

meiView.SelectedSuppliedPartList.prototype.removeOrigin = function(origin) {
  if (!this.origins[origin]) {
    this.origins[origin] = false;
  }
}

meiView.SelectedSuppliedPartList.prototype.toggleSuppliedPart = function(origin) {
  this.origins[origin] = !this.origins[origin];
}

meiView.SelectedSuppliedPartList.prototype.originsList = function() {
  var res = [];
  $.each(this.origins, function(i, e) {
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
  this.scoreWidth = options.width || 1200; // 1000
  this.scoreHeight = options.height || 1000;
  this.createSourceList(this.MEI.ALTs);
  
  // Create an object of supplied parts. Reconstructions, concordances,
  // and any other supplied parts can be added to this object.
  this.SuppliedPartLists = {};
  this.SuppliedPartLists['reconstruction'] =
      this.createSuppliedPartList('reconstruction');
  this.SuppliedPartLists['concordance'] =
      this.createSuppliedPartList('concordance');

  this_viewer = this;
  this.UI = new meiView.UI({
    viewer: this_viewer,
    maindiv: options.maindiv,
    title: options.title,
  });
  // Create dictionary of selected part lists, matching the
  // part lists which have been created
  this.selectedSuppliedPartLists = {};
  for (var key in this.SuppliedPartLists) {
    this.selectedSuppliedPartLists[key] = new meiView.SelectedSuppliedPartList(key)
  }
}

meiView.Viewer.prototype.toggleSuppliedPart = function(var_type, origin) {
  this.selectedSuppliedPartLists[var_type].toggleSuppliedPart(origin);
  this.selectSuppliedParts(var_type, this.selectedSuppliedPartLists);
}

meiView.Viewer.prototype.createSuppliedPartList = function(var_type) {
  var result = {};
  var origins = $(this.MEI.rich_head).find('fileDesc').find(cons(var_type)['title']);
  var me = this;
  $(origins).each(function(i) {
    var orig_id = $(this).attr('xml:id');
    if (!orig_id) {
      throw ("Origin ID is undefined");
    }
    if ($(me.MEI.rich_score).find(cons(var_type)['el'] + '[' + cons(var_type)['attr'] + '="#' + orig_id + '"]').length > 0) {
      result[orig_id] = this;
    }
  });
  return result;
}


meiView.Viewer.prototype.createSourceList = function(Apps) {
  this.Sources = {};
  this.Emendations = {};
  this.Report = {};
  for(appID in Apps) {
    var app = Apps[appID];
    var measure_n = $($(app.elem).closest('measure')[0]).attr('n');
    if (app.tagname === 'choice' || (app.tagname === 'app' && $(app.elem).attr('type') !== 'reconstruction' && $(app.elem).attr('type') !== 'concordance')) {
      if (typeof this.Report[measure_n] === 'undefined') {
        this.Report[measure_n] = [];
      }
      this.Report[measure_n].push(Apps[appID]);
    }
    var resultList;
    if (app.tagname === 'app') {
      resultList = this.Sources;
    } else if (app.tagname === 'choice') {
      resultList = this.Emendations
    }
    for(varXMLID in app.altitems) {
      var altitem = app.altitems[varXMLID];
      var tagname = altitem.tagname;
      if ((tagname === 'rdg' && $(altitem.elem).attr('type') !== 'concordance') || tagname === 'corr') {
        var source_resp;
        if (tagname === 'rdg') { 
          source_resp = altitem.source;
        } else {
          source_resp = altitem.resp
        }
        if (source_resp) {
          var srcIDs = source_resp.split(' ');
          for (var k=0; k<srcIDs.length; k++) {
            var srcID = srcIDs[k];
            if (!resultList[srcID]) {
              resultList[srcID] = [];
            }
            resultList[srcID].push( { appID:app.xmlID, measureNo:measure_n } );
          } 
        }
      } else if (tagname === 'lem' || tagname === 'sic') {
        if (!resultList[tagname]) {
          resultList[tagname] = [];
        }
        resultList[tagname].push( { appID:app.xmlID, measureNo:measure_n } );
      }
    }
  }
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

meiView.Pages = function(options) {
  options = options || {};
  if (options.pages) {
    this.pages = options.pages;
  } else {
    this.pages = [];
    var length = (typeof options.length !== 'undefined') ? options.length : 0;
    var mpp = +(typeof options.mpp !== 'undefined') ? options.mpp : 5;
    if (mpp > 0) {
      for (var i=0; i*mpp<length; ++i) {
        this.pages.push(new meiView.Page(i*mpp+1, Math.min(i*mpp+mpp, length)));
      }
    }
  }
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
  var isFirstPage = (this.pages.currentPageIndex === 0);
  this.UI.renderPage(pageXML, {
    labelMode: (isFirstPage) ? 'full' : 'abbr',
    systemLeftMar: (isFirstPage) ? 100 : 25,
    page_margin_top: 30,
    staveSpacing: 70,
    systemSpacing: 90,
    staff: {
      bottom_text_position: 8,
      fill_style: "#000000"
    },
    vexWidth:this.scoreWidth, 
    vexHeight:this.scoreHeight
  });
  this.UI.displayDots();
  this.UI.showTitle(isFirstPage);
  this.UI.fabrCanvas.calcOffset();
  this.UI.updatePageLabels(this.pages.currentPageIndex+1, this.pages.totalPages())

}

meiView.Viewer.prototype.selectSuppliedParts = function() {
  var sectionplaneUpdate = {};
  for (var var_type in this.selectedSuppliedPartLists) {
    origins = this.selectedSuppliedPartLists[var_type].origins
    var all_apps = $(this.MEI.rich_score).find(cons(var_type)['parent']);
    for (originID in origins) {
      var i;
      for (i=0; i<all_apps.length; i++) {
        var app = all_apps[i];
        var app_xml_id=$(app).attr('xml:id');
        var rdgs = $(app).find(cons(var_type)['el'] + '[' + cons(var_type)['attr'] + '="#'+originID+'"]');
        var j;
        for (j=0; j<rdgs.length; j++) {
          var rdg_xml_id = $(rdgs[j]).attr('xml:id');
          if (sectionplaneUpdate[app_xml_id] && origins[originID]) {
            sectionplaneUpdate[app_xml_id].push(rdg_xml_id);
          } else if (!sectionplaneUpdate[app_xml_id] && origins[originID]) {
            sectionplaneUpdate[app_xml_id] = [rdg_xml_id];
          } else if (!sectionplaneUpdate[app_xml_id] && !origins[originID]){
            sectionplaneUpdate[app_xml_id] = [];
          }
        }
      }
    }
  }

  this.MEI.updateSectionView(sectionplaneUpdate);
  this.displayCurrentPage();
}

meiView.Viewer.prototype.voiceNames = function(mei) {
  // Return an associative object that contains the voice names indexed
  // by staff/@n
  var result = {};
  var scoreDefs;
  if (mei.localName === 'score') {
    scoreDefs = $(mei).find('scoreDef');
  } else {
    scoreDefs = $(mei).find('score').find('scoreDef');
  }
  if (scoreDefs.length > 0) {
    var staffDefs = $(scoreDefs[0]).find('staffDef');
    $(staffDefs).each(function() {
      var staff_n = $(this).attr('n') || "1";
      result[staff_n] = $(this).attr('label') || "N/A";
    });
  }
  return result;
}

meiView.Viewer.prototype.stavesToDisplay = function(plain_mei) {
  var result = [];
  staffNs = {};
  staffDefs = $(plain_mei).find('staffDef');
  var i;
  for (i=0; i<staffDefs.length; i++) {
    sd = staffDefs[i];
    N = +$(sd).attr('n') || 1;
    if ($(plain_mei).find('staff[n="' + N + '"]').length > 0) {
      if (result.indexOf(N) === -1) {
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
