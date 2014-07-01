meiView.CompactUI = function(options) {
  this.init(options);
}

meiView.Inherit(meiView.CompactUI, meiView.UI, {

  init: function(options) {
    this.options = options || {};
    this.viewer = options.viewer;
    this.maindiv = options.maindiv;
    this.canvas_id = 'meiview-canvas-' + this.viewer.id;
    this.canvas_clef_id = 'meiview-canvas-clef-' + this.viewer.id;
    $(this.maindiv).attr('id', this.viewer.id);
    $(this.maindiv).addClass('meiview-main');
    $(this.maindiv).addClass('ui-widget-content');

    var pageTurnButton = function(dir, id) {
      return '<button class="ui-widget-content ui-corner-all" onclick="meiView.UI.callback(\''
        + id + '\', \'' + dir + 'Page\')">\
        <span class="ui-icon ui-icon-triangle-1-'
        + ((dir !== 'next') ? ((dir !== 'prev') ? '' : 'w') : 'e')
        + '"/></button>';
    }
    this.base_html = '\
    <div class="main-area">\
      <div class="pagination-div" align="center">'
        + pageTurnButton('prev', this.viewer.id)
        + '<span id="pageNumber-top" width="10">0/0</span>'
        + pageTurnButton('next', this.viewer.id)
      + '</div>\
      <div class="meiview-canvas-container">\
        <div class="clef-canvas-div">\
          <canvas class="clef-canvas" id="' + this.canvas_clef_id + '"></canvas>\
        </div>\
        <div class="main-canvas-div" onscroll="meiView.UI.callback(\'' 
          + this.viewer.id + '-ui\', \'onScrollMainCanvas\', {})">\
          <canvas class="main-canvas" id="' + this.canvas_id + '"></canvas>\
        </div>\
      </div>\
      <div class="critrep-div ui-widget-content ui-corner-top" onclick="toggleCritRep()">\
      </div>\
      <div class="pagination-div" align="center">'
        + pageTurnButton('prev', this.viewer.id)
        + '<span id="pageNumber-top" width="10">0/0</span>'
        + pageTurnButton('next', this.viewer.id)
      + '</div>\
      <div class="sidebar ui-widget-content ui-corner-left" id="sidebar">\
        <div id="accordion">\
        </div>\
      </div>\
    </div>\
    '
    $(this.maindiv).append(this.base_html);
    this.options.sidebar_ratio = (typeof this.options.sidebar_ratio == 'undefined') ? 0.2 : this.options.sidebar_ratio;
    this.titleDiv = $(this.maindiv).find('.titlediv');
    this.dots = {};
    this.measure_n_texts = {};
    meiView.UI.addObject(this.viewer.id, this.viewer);
    meiView.UI.addObject(this.viewer.id + '-ui', this);
  
    var titleElem = $(this.maindiv).find('span.title')[0];
    $(titleElem).html(options.title);

    this.fillSideBar($(this.maindiv).find('#accordion'), 'meiview-sidebar');
    $(this.maindiv).find('#accordion').accordion({
      collapsible: true,
      heightStyle: "fill",
      active: false
    });
    if ($(this.maindiv).find('#accordion h3').length === 0) {
      this.hideSideBar();
    }

    this.fillCritReport();

    this.scale = options.scale || 1.0;

    this.fabrCanvas = this.initCanvas(this.canvas_id);
    this.canvasClef = $(this.maindiv).find('.clef-canvas').get();
    var dimensions = { width: $(this.canvasClef).width(), height: $(this.canvasClef).height() }
    this.fabrCanvasClef = new fabric.StaticCanvas(this.canvas_clef_id);
    this.fabrCanvasClef.setDimensions(dimensions)
    this.initSidebarHighlight();

    var me = this;
    $(window).on('resize', function(event){
      console.log('window resized');
      me.resizeElements();
    });

  },

  updateMainHeight: function() {
    var h3s = $(this.maindiv).find('#accordion h3');
    var sidebar = $(this.maindiv).find('.sidebar');
    var minSidebarContentHeight = 100;
    var minSidebarDivHeight = h3s.length * h3s.height() + minSidebarContentHeight;

    //150 is an ugly constant to accommodate selector panels that may pop up
    var main_height = Math.max((this.content_dims.height + 150) * this.scale, minSidebarDivHeight);
    $(this.maindiv).find('.main-canvas-div').height(main_height);
    this.fabrCanvas.setDimensions({height: main_height});
    this.fabrCanvasClef.setDimensions({height: main_height});
     this.resizeElements();
  },

  maxCritRep: function() {
    $(this.maindiv).find('.critrep-div').removeClass('critrep-min');
    $(this.maindiv).find('.critrep-div').addClass('critrep-max');
    this.resizeElements();
  },

  minCritRep: function() {
    $(this.maindiv).find('.critrep-div').removeClass('critrep-max');
    $(this.maindiv).find('.critrep-div').addClass('critrep-min');
    this.resizeElements();
  },

  critRepState: function () {
    if ($(this.maindiv).find('critrep-div').hasClass('critrep-min')) {
      return "critrep-min";
    } else if ($(this.maindiv).find('critrep-div').hasClass('critrep-max')){
      return "critrep-max";
    }
    ;
  },

  showCritRep: function() {
    $(this.maindiv).find('.critrep-div').css('display', 'block');
    this.resizeElements();
  },

  hideCritRep: function() {
    $(this.maindiv).find('.critrep-div').css('display', 'none');
    this.resizeElements();
  },

  critRepOn: function () {
    return $(this.maindiv).find('.critrep-div').css('display') !== 'none';
  },

  showPagination: function() {
    $(this.maindiv).find('.pagination-div').css('display', 'block');
    this.resizeElements();
  },

  hidePagination: function() {
    $(this.maindiv).find('.pagination-div').css('display', 'none');
    this.resizeElements();
  },

  paginationOn: function () {
    return $(this.maindiv).find('.pagination-div').css('display') !== 'none';
  },

  onScrollMainCanvas: function() {
    this.fabrCanvas.calcOffset();
  },

  showSideBar: function() {
    $(this.maindiv).find('.sidebar').css('display', 'block');
    this.resizeElements();
  },

  hideSideBar: function() {
    $(this.maindiv).find('.sidebar').css('display', 'none');
    this.resizeElements();
  },

  sideBarLength: function() {
    return $(this.maindiv).find('.sidebar').find('h3.meiview-sidebar').length;
  },

  sideBarOn: function () {
    return $(this.maindiv).find('.sidebar').css('display') !== 'none';
  },

  renderContentPart: function(pageXML, options) {
    options = options || {};
    //TODO: set left padding and left margin to 0
    options.page_margin_left = 0;
    options.page_margin_right = 20;
    options.vexWidth = options.vexWidth || $(this.fabrCanvas.getElement()).attr('width');
    options.vexHeight = options.vexHeight || $(this.fabrCanvas.getElement()).attr('height');
    var img = this.renderMei2Img(pageXML, options);
    if (this.scoreImg) {
       this.fabrCanvas.remove(this.scoreImg);    
    }
    this.fabrCanvas.setDimensions({width:options.vexWidth * this.scale});
    var W = options.vexWidth * this.scale;
    var H = options.vexHeight * this.scale;
    this.scoreImg = new fabric.Image(img, {
      width:W,height:H, left:W/2, top:H/2,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      hasControls: false,
      hasBorders: false,
      selectable: false,
    });
    this.fabrCanvas.add(this.scoreImg);
    if (this.viewer.display_measure_numbers) {
      this.displayMeasureNos();
    }
    this.fabrCanvas.renderAll_Hack();
  },

  renderClefMei: function(staticCanvas, score, options) {
    options = options || {};

    options.vexWidth = options.vexWidth || $(this.fabrCanvas.getElement()).attr('width');
    options.vexHeight = options.vexHeight || $(this.fabrCanvas.getElement()).attr('height');
    options.scale = options.scale || 1.0;
    var score_width = options.vexWidth;
    var score_height = options.vexHeight;
    staticCanvas.setDimensions({width:options.vexWidth, height:options.vexHeight});
    this.L('Rendering clef part MEI... ');
    MEI2VF.render_notation(score, staticCanvas.getElement(), score_width, score_height, null, options);
    this.L('Done rendering clef part MEI');

  },

  alignCanvases: function () {
    $(this.maindiv).find('.main-canvas-div').position({
       my: 'left top',
       at: 'right top',
       of: $(this.maindiv).find('.clef-canvas-div'),
       collision: 'none'
     });
   },

  alignSidebar: function() {
    $(this.maindiv).find('.sidebar').position({
      my: 'left top',
      at: 'right top',
      of: $(this.maindiv).find('.meiview-canvas-container'),
      collision: 'none'
    });
  },

  resizeElements: function () {
      var viewerObj = this.viewer;
      var maindiv = this.maindiv;
      var view_main_width = $(maindiv).width();
      var main_canvas_div_height = $(maindiv).find('.main-canvas-div').height();
      canvas_container_width = view_main_width * (1 - this.options.sidebar_ratio);
      if ($(maindiv).find('.sidebar').css('display') === 'none') {
        canvas_container_width = view_main_width;
      }
      var canvas_container_height = main_canvas_div_height;
      var clef_canvas_height = main_canvas_div_height;
      var sidebar_width = view_main_width - canvas_container_width;
      var sidebar_height = main_canvas_div_height;
      var clef_canvas_div_width = $(maindiv).find('.clef-canvas-div').width();
      var main_canvas_div_width = canvas_container_width - clef_canvas_div_width;
      var pagination_heigh = (this.paginationOn()) ? $(maindiv).find('.pagination-div').height() : 0;
      var critrep_heigh = (this.critRepOn()) ? $(maindiv).find('.critrep-div').height() : 0;
      var main_area_height = main_canvas_div_height + 2 * pagination_heigh + critrep_heigh;
      $(maindiv).find('.clef-canvas-div').css('height', main_canvas_div_height);
      $(maindiv).find('.view').css('width', view_main_width);
      $(maindiv).find('.main-area').css('width', view_main_width);
      $(maindiv).find('.main-area').css('height', main_area_height);
      $(maindiv).find('.meiview-canvas-container').css('width', canvas_container_width);
      $(maindiv).find('.meiview-canvas-container').css('height', canvas_container_height);
      $(maindiv).find('.sidebar').css('width', sidebar_width);
      $(maindiv).find('.sidebar').css('height', sidebar_height);
      $(maindiv).find('.main-canvas-div').css('width', main_canvas_div_width);
      this.alignCanvases();
      this.alignSidebar();
      $(maindiv).find('#accordion').accordion('refresh');
    },


  renderClefPart: function(clefxml, options) {
    options = options || {};
    options.scale = options.scale || 1.0;
    options.vexWidth = options.vexWidth || $(this.canvasClef).attr('width');
    options.vexHeight = options.vexHeight || $(this.canvasClef).attr('height');

    var tempCanvas = this.renderClefMei(this.fabrCanvasClef, clefxml, options);
    var img = new Image;
    var vexStaffs = MEI2VF.rendered_measures[1];
    var w_max = 0;
    if (vexStaffs) {
      var i;
      $(vexStaffs).each(function(){
        if (this.getModifierXShift) {
          var w = this.getModifierXShift();
          if (w > w_max) {
            w_max = w;
          }
        }
      });
    }
    console.log('max measure width: ' + w_max.toString());
    console.log('scale: ' + options.scale.toString());
  
    $(this.maindiv).find('.clef-canvas-div').css('width', w_max * options.scale);
    $(this.canvasClef).css('width', $(this.canvasClef).width() * options.scale);
    $(this.canvasClef).css('height', $(this.canvasClef).height() * options.scale);

  },
  
  displayVoiceNames: function(score, base_offset) {
    base_offset.x = (typeof base_offset.x !== 'undefined') ? base_offset.x : 0;
    base_offset.y = (typeof base_offset.y !== 'undefined') ? base_offset.y : 10;
    var voiceNames = this.viewer.voiceNames(score);
    var this_UI = this;
    //1. Hide all voicename-divs
    $(this.maindiv).find('.voicename-div').hide();
    for (staff_n in voiceNames) {
      //2. display voiceNames[staff_n] in a voicename-div
      //corresponding to staff_n
      var voicename_div = this_UI.getVoiceNameDiv(staff_n);
      //3. position them according layout logic
      var measure = $(score).find('measure')[0];
      if (measure) {
        var measure_n = $(measure).attr('n') || "1";
        var vexStaffs = this.rendered_clefmeasures[measure_n];
        if (vexStaffs) {
          var vexStaff = vexStaffs[staff_n];
          if (vexStaff) {
            var canvas_offset = $(this.maindiv).find('canvas.clef-canvas').offset();
            $(voicename_div).show();
            $(voicename_div).css('top', vexStaff.y * this_UI.scale + canvas_offset.top + base_offset.y);
            $(voicename_div).css('left', vexStaff.x * this_UI.scale + canvas_offset.left + base_offset.x);
            $(voicename_div).find('span').html(voiceNames[staff_n]);
          }
        }
      }
    }
  },

  getVoiceNameDiv: function() {
    var voicename_div = $(this.maindiv).find('.voicename-div.staff-n-' + staff_n);
    if (voicename_div.length === 0) {
      $(this.maindiv).append('<div class="voicename-div staff-n-' + staff_n +'">' 
        + '<span></span></div>');
      return $(this.maindiv).find('.voicename-div.staff-n-' + staff_n);
    } else {
      return voicename_div;
    }
  },

  onSelectorSelect: function(args) {

    if (this.viewer.selectingState.ON) {

      var oldVarID = this.viewer.selectingState.selectedVarXmlID;
      this.viewer.selectVariant(args.varXmlID);

      /* re-draw current page [TODO: only re-draw if the change happened on the current page] */

      this.viewer.displayCurrentPage_TwoParts();
      if (this.dlg) { 
        this.dlg.bringToFront();
      }
    
      this.updateSidebar(this.viewer.selectingState.appID, oldVarID);
    }
  },


  displayDotForAPP: function(appID) {

    // In order to know what coordiantes to display the dot at, we have to
    // get the coordinates of the VexFlow staff object. VexFlow staff objects are 
    // exposed by MEI2VF via the MEI2VF.rendered_measures:
    // MEI2VF.rendered_measures is indexed by the measure number and staff number.
    // so, in order to retreive the right measure we have to know the measure number and the 
    // staff number:

    // get the meausure number first,
    var app = this.viewer.MEI.ALTs[appID].elem; 
    var parent_measure = $(app).parents('measure');
    var measure_n = parent_measure.attr('n');

    // then the staff number...
    var parent_staff = $(app).parents('staff');
    var staff_n;
    if (parent_staff.length === 0) {
      var child = $(app).find('[staff]')
      staff_n = $(child).attr('staff');
    } else {
      staff_n = parent_staff.attr('n');
    }

    // ...then display the dot at the coordinates specified by the
    // properties of MEI2VF.rendered_measures[measure_n][staff_n];
    var vexStaffs = this.rendered_measures[measure_n];
    if (vexStaffs) {
      var vexStaff = vexStaffs[staff_n];
      if (vexStaff) {
        var dotInfo = {
          appXmlID: appID, 
          measure_n: Number(measure_n),
          measure_top: vexStaff.y,
          measure_left: vexStaff.x,
          measure_width: vexStaff.width,
          staff_n: Number(staff_n),
        }
        return { circle:this.displayDotForMeasure(vexStaff), info:dotInfo };
      }
    }
  },
  
  fillCritReport: function() {

    var getTableBody = function(maindiv) {
      var table = $(maindiv).find('.critrep-div table.critrep tbody');
      if (table.length === 0) {
        $(maindiv).find('.critrep-div').append('<table class="critrep">'
          + '<tbody>'
            + '<tr>'
              + '<th>Measure</th>'
              + '<th>Voice</th>'
              + '<th>Type</th>'
              + '<th>Source/Responsibility</th>'
            + '</tr>'
          + '</tbody></table>');
        return $(maindiv).find('.critrep-div table.critrep tbody');
      } else {
        return table;
      }
    }

    // measure by measure
    var me = this;
    console.log("Critical Report:")
    console.log(this.viewer.Report);
    var tbody = getTableBody(this.maindiv);
    for (measure_n in this.viewer.Report) {
      var altlist = this.viewer.Report[measure_n];
      var i, j;
      for (i=0, j=altlist.length; i<j; ++i) {
        var alt = altlist[i];
        var measure_n = $(alt.elem).closest('measure').attr('n');
        var comma = '';
        var sourceresp = (alt.tagname == 'app') ? 'in ' : 'by ';
        for (altid in alt.altitems) {
          var listitem = '';
          if (alt.altitems[altid].tagname == 'rdg') {
             listitem = alt.altitems[altid].source;
          } else if (alt.altitems[altid].tagname == 'corr') {
            listitem = alt.altitems[altid].resp;
          }
          if (listitem) {
            sourceresp += comma + listitem.replace(/#/g, '').replace(/ /g, ', ');
            if (comma == '') comma = ', ';
          }
        }
        $(me.maindiv).find('.critrep-div ul').append('<li>' + alt.xmlID + '</li>');
        $(tbody).append('<tr class="meiview-sidebar-item meiview-critrep-item"' 
          + me.onClickSideBarMarkup(me, measure_n, alt.xmlID) + '>'
          + '<td class="critrep-field critrep-measureno">' + 'M' + measure_n.toString() + '</td>'
          + '<td class="critrep-field critrep-voice">' + this.shortVoiceLabel(alt.elem) + '</td>'
          + '<td class="critrep-field critrep-type">' + ((alt.tagname == 'app') ? 'Variant' : 'Emendation') + '</td>'
          + '<td class="critrep-field critrep-sources">' + sourceresp +'</td>'
        + '</tr>');
      }
    }
    if ($(tbody).find('.meiview-critrep-item').length == 0) {
      this.hideCritRep();
    }
  },

});


