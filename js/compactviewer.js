meiView.Mode = {
  SINGLE_PAGE: 0,
  PLAIN: 1,
  SIDEBAR_ONLY: 2,
  CRITREP_ONLY: 3,
  FULL: 4,
}

meiView.Merge = function(destination, source) {
    for (var property in source)
        destination[property] = source[property];
    return destination;
};

meiView.Inherit = (function () {
  var F = function () {};
  return function (C, P, O) {
    F.prototype = P.prototype;
    C.prototype = new F();
    C.superclass = P.prototype;
    C.prototype.constructor = C;
    meiView.Merge(C.prototype, O);
    return C;
  };
}());

meiView.CompactViewer = function(options) {
  this.init(options);
}

meiView.Inherit(meiView.CompactViewer, meiView.Viewer, {
  init: function(options) {

    var randomID = function() {
      return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-8)
    }

    this.mode = (typeof options.mode === 'undefined') ? meiView.Mode.FULL : options.mode;
    this.id = (typeof $(options.maindiv).attr('id') == 'undefined') ? randomID() : $(options.maindiv).attr('id');
    this.MEI = options.MEI;
    this.MEI.initSectionView();
    this.display_measure_numbers = (typeof options.display_measure_numbers == 'undefined') ? 
      1 : options.display_measure_numbers;
    if (options.pages) {
      this.pages = options.pages;
    } else {
      this.pages = new meiView.Pages();
      if (this.parsePages) {
        this.parsePages(this.MEI);
      }
    }
    if (options.pxpMeasure) {
      this.pxpMeasure = options.pxpMeasure;
    } else {
      this.scoreWidth = options.width || 1200;
    }
    this.scoreHeight = options.height || 1000;
    this.createSourceList(this.MEI.ALTs);
    
    // Create an object of supplied parts. Reconstructions, concordances,
    // and any other supplied parts can be added to this object.
    this.SuppliedPartLists = {}
    for (var var_type in var_type_list)
      this.SuppliedPartLists[var_type] = this.createSuppliedPartList(var_type);

    // Create dictionary of selected part lists, matching the
    // part lists which have been created
    this.selectedSuppliedPartLists = {};
    for (var var_type in meiView.var_type_list) {
      this.selectedSuppliedPartLists[var_type] = new meiView.SelectedSuppliedPartList(var_type);
    }

    this_viewer = this;
    this.UI = new meiView.CompactUI({
      viewer: this_viewer,
      maindiv: options.maindiv,
      title: options.title,
      scale: options.scale,
    });

    if (this.mode == meiView.Mode.FULL) {
      // this.UI.showCritRep();
      // this.UI.showSideBar();
    } else if (this.mode == meiView.Mode.CRITREP_ONLY) {
      this.UI.hideSideBar();
    } else if (this.mode == meiView.Mode.SIDEBAR_ONLY) {
      this.UI.hideCritRep();
    } else if(this.mode == meiView.Mode.PLAIN) {
      this.UI.hideSideBar();
      this.UI.hideCritRep();
    } else if (this.mode == meiView.Mode.SINGLE_PAGE) {
      this.UI.hideSideBar();
      this.UI.hideCritRep();
      this.UI.hidePagination();
    }

    if (this.UI.sideBarLength() == 0) {
      this.UI.hideSideBar();
    }

    if (options.displayFirstPage) {
      this.nextPage();
    }

  },

  getScoreWidth: function(score) {
    if (this.pxpMeasure) {
      var no_of_measures = $(score).find('measure').length;
      return this.pxpMeasure * no_of_measures;
    } else {
      return this.scoreWidth;
    }
  },

  toggleCritRep: function() {
    if (this.UI.critRepOn()) {
      this.UI.hideCritRep();
    } else {
      this.UI.showCritRep();
    }
  },

  getPageXML_ContentPart: function(page) {
    var noMeter = (page.startMeasureN !== 1);
    var staves = this.stavesToDisplay(this.MEI.sectionview_score);
    var contentxml = this.MEI.getSectionViewSlice({
      start_n:page.startMeasureN,
      end_n:page.endMeasureN,
      noMeter:noMeter,
      noKey:true,
      noClef:true,
      staves:staves
    });
    // Remove stave connectors
    var scoredefs = $(contentxml).find('scoreDef');
    if (scoredefs[0]) {
      $(scoredefs[0]).find('staffGrp').attr('symbol', 'none');
    }
    return contentxml;
  },

  getPageXML_ClefPart: function(page) {
    var me = this, staves, clefxml, score,
        scoredefs, scoredef, section, measure, staff_n;
    console.log('getPageXML_ClefPart() {start}');
    staves = me.stavesToDisplay(this.MEI.sectionview_score);
    clefxml = me.MEI.getSectionViewSlice({
      start_n:'-1',
      noMeter:true,
      noKey:false,
      noClef:false,
      staves:staves
    });
    score = clefxml;
    if (score) {
      console.log('getPageXML_ClefPart() {I}');
    
      scoredefs = $(score).find('scoreDef');
      scoredef = scoredefs[0];

      section = $(score).find('section').get(0);

      // in some browsers JQuery.append() didn't seem to work,
      // the measure wouldn't get inserted to the section; using
      // native XML DOM methods instead.
      measure = me.MEI.xmlDoc.createElementNS("http://www.music-encoding.org/ns/mei", "measure");
      measure.setAttribute('n', '1');
      measure.setAttribute('right', 'invis');
      if (scoredef) {
        $(scoredefs[0]).find('staffDef').each(function(i, std) {
          var staff, layer;
          if (section) {
            staff_n = $(std).attr('n');
              staff = me.MEI.xmlDoc.createElementNS("http://www.music-encoding.org/ns/mei", "staff");
              staff.setAttribute('n', staff_n);
              layer = me.MEI.xmlDoc.createElementNS("http://www.music-encoding.org/ns/mei", "layer");
              staff.appendChild(layer);
              measure.appendChild(staff);
          }
        });
        section.appendChild(measure);
      }
    }
    return clefxml;
  },

  displayCurrentPage: function () {
    this.displayCurrentPage_TwoParts();
  },

  displayCurrentPage_TwoParts: function() {
    var pageXML_ContentPart = this.getPageXML_ContentPart(this.pages.currentPage());
    var pageXML_ClefPart = this.getPageXML_ClefPart(this.pages.currentPage());
    this.UI.renderContentPart(pageXML_ContentPart, {vexWidth:this.getScoreWidth(pageXML_ContentPart), vexHeight:this.scoreHeight});
    this.UI.rendered_measures = MEI2VF.rendered_measures;
    this.UI.content_dims = MEI2VF.Converter.getStaffArea();
    this.UI.updateMainHeight();
    var clefoptions = {}
    clefoptions.page_margin_right = 0;
    clefoptions.page_margin_left = 10;
    clefoptions.scale = this.UI.scale;
    clefoptions.vexHeight = this.scoreHeight;
    this.UI.renderClefPart(pageXML_ClefPart, clefoptions);
    this.UI.rendered_clefmeasures = MEI2VF.rendered_measures;
    this.UI.resizeElements();
    this.UI.displayDots();
    this.UI.showTitle(this.pages.currentPageIndex === 0);
    this.UI.updatePageLabels(this.pages.currentPageIndex+1, this.pages.totalPages())
    this.UI.displayVoiceNames(pageXML_ClefPart, { x: clefoptions.page_margin_left + 20});
    this.UI.fabrCanvas.calcOffset();
  },

  nextPage: function(){
    this.pages.nextPage();
    this.displayCurrentPage_TwoParts();
    this.UI.dlg && this.UI.dlg.hide();
    // setTimeout(function(){this.UI.fabrCanvas.renderAll()}, 0);
  },

  prevPage: function(){
    this.pages.prevPage();
    this.displayCurrentPage_TwoParts();
    this.UI.dlg && this.UI.dlg.hide();
    // setTimeout(function(){this.UI.fabrCanvas.renderAll()}, 0);
  },

  jumpTo: function(i) {
    this.pages.jumpTo(i);
    this.displayCurrentPage_TwoParts();
    this.UI.dlg && this.UI.dlg.hide();
  },

  jumpToMeasure: function(i) {
    this.pages.jumpToMeasure(i);
    this.displayCurrentPage_TwoParts();
    this.UI.dlg && this.UI.dlg.hide();
  },
});
