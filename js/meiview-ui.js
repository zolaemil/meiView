/***
* meiview-ui.js
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

meiView.UI = function(options) {
  this.init(options);
};

meiView.UI.prototype.init = function(options) {
  this.viewer = options.viewer;
  this.maindiv = options.maindiv;
  this.main_id = 'meiview-main-' + this.viewer.id;
  this.canvas_id = 'meiview-canvas-' + this.viewer.id;
  this.score_id = 'meiview-score-' + this.viewer.id;
  this.base_html = '<div class="meiview-main" id="' + this.main_id + '" style="margin: 10px 20px auto">\
    <div id="' + this.score_id + '" align="center" class="ui-widget-content meiview-scorediv meiview-sized-scorediv">\
    	<button class="ui-widget-content ui-corner-all"onclick="meiView.UI.callback(\'' + this.viewer.id + '\', \'prevPage\')"><span class="ui-icon ui-icon-triangle-1-w"/></button>\
    	<span id="pageNumber-top" width="10">0/0</span>\
    	<button class="ui-widget-content ui-corner-all" onclick="meiView.UI.callback(\'' + this.viewer.id + '\', \'nextPage\')"><span class="ui-icon ui-icon-triangle-1-e"/></button>\
    	<div id="titlediv"><h4><span id="title" class="title" property="dc:title"></span></h4></div>\
    	<canvas class="canvas" id="' + this.canvas_id + '" width="780" height="700"></canvas>\
    	<button class="ui-widget-content ui-corner-all"onclick="meiView.UI.callback(\'' + this.viewer.id + '\', \'prevPage\')"><span class="ui-icon ui-icon-triangle-1-w"/></button>\
    	<span id="pageNumber-bottom" width="10">0/0</span>\
    	<button class="ui-widget-content ui-corner-all" onclick="meiView.UI.callback(\'' + this.viewer.id + '\', \'nextPage\')"><span class="ui-icon ui-icon-triangle-1-e"/></button>\
    </div>\
    <div id="sidebar">\
    	<div id="accordion"> \
    	</div>\
    	<div id="legend" >\
    		<p>\
    			<ul>\
    				<li><h5>Click on the green dots to view the differences between the sources!</h5></li>\
    				<li class=".meiview-source-has-variant-on">\
    					When a  <text style="color: rgb(190,0,0)">Source is highlighted</text> it means some of its \
    					variants are currently displayed in the score.\
    				</li>\
    				<li>\
    					When a <text style="color: rgb(185,0,0);">Variant is highlighted</text> it means that variant is currently \
    					displayed in the score.\
    				</li>\
    			</ul>\
    		</p>\
    	</div>\
    </div> \
  </div>';
  $(this.maindiv).append(this.base_html);
  this.titleDiv = $(this.maindiv).find('.titlediv');
  this.dots = {};
  this.measure_n_texts = {};
  meiView.UI.addObject(this.viewer.id, this.viewer);
  meiView.UI.addObject(this.viewer.id + '-ui', this);
  // console.log($(this.maindiv).find('#' + this.score_id))

  // attach the sidebar to the score div
  // NOTE: aligning the 'top' property is buggy in jquery-ui, so it has to be done manually
  //       TODO: padding is hard-coded
	$(this.maindiv).find('#sidebar').position({
		my: 'left',
		at: 'right+10',
		of: $('#' + this.score_id)
	});
	var sH = $('#' + this.score_id).height();
	var H = Number(sH)
	$(this.maindiv).find('#sidebar').css('top', -1*H-20);
  $(this.maindiv).css('height', this.maxHeight() + 20);
  $('#' + this.main_id).css('height', this.maxHeight() + 20);
  
  var titleElem = $(this.maindiv).find('span.title')[0];
	$(titleElem).html(options.title);

	this.fillSideBar($(this.maindiv).find('#accordion'), 'meiview-sidebar');
	$(this.maindiv).find('#accordion').accordion({
		collapsible: true,
		heightStyle: "content",
		active: false
	});
				
	this.fabrCanvas = this.initCanvas(this.canvas_id);
  this.initSidebarHighlight();
  
}

meiView.UI.prototype.maxHeight = function() {
  //TODO: calculate max height of accordion/sidebar
	var str_scoreH = $('#' + this.score_id).height();
	var scoreH = Number(str_scoreH);
	var sideH = 0;
  var side = $(this.maindiv).find('#sidebar')[0];
  if (side) {
    str_sideH = $(side).height();
  	sideH = Number(str_sideH);
  }
  
  return Math.max(scoreH, sideH);
}

meiView.UI.prototype.toCSSId = function(identifierString) {
  return identifierString.replace(/#/g, '').replace(/\./g, '_');
}

meiView.UI.prototype.liID = function(sourceID, appID) {
  return this.toCSSId(sourceID) + '-' + this.toCSSId(appID);
}

meiView.UI.prototype.srcID2srcLabel = function(src) {
  if (src === 'lem') {
    return 'Base text'
  } else {
    return 'Source ' + src.replace(/^#/, '');
  }
}

meiView.UI.prototype.originID2originLabel = function(src) {
  if (src === 'sic') {
    return 'Sic (mistakes in base text)'
  } else {
    return 'Corrected by ' + src.replace(/^#/, '');
  }
}


meiView.UI.prototype.choiceItem2choiceItemLabel = function(altitem) {
  var label = '';
  if (altitem.localName === 'sic') {
    label = 'sic';
  } else  if (altitem.localName === 'corr') {
    label = 'corr. by ' + $(altitem).attr('resp').replace(/^#/, '');
  }
  return label;
}

meiView.UI.prototype.shortVoiceLabel = function(elem) {
  var staff_l = '';
  var staff = $(elem).closest('staff');
  if (staff.length>0) {
    var staff_n = staff.attr('n') || '1';
    var staffDefs = $(elem).closest('score').find('staffDef[n="' + staff_n + '"]');
    var i;
    for (i=0; i<staffDefs.length; ++i) {
      staff_l = $(staffDefs[i]).attr('label.abbr') || $(staffDefs[i]).attr('label') || staff_l;
    }
    if (staff_l.length > 4) staff_l = staff_l.substr(0,1);
  }
  return staff_l;
}

meiView.UI.prototype.appID2appLabel = function(appID) {
  var app = $(this.viewer.MEI.rich_score).find('app[xml\\:id="' 
    + appID + '"], choice[xml\\:id="' + appID + '"]');
  var measure = app.closest('measure');

  var label = 'M' + measure.attr('n');
  var staff = app.closest('staff');
  if (staff.length>0) {
    var staff_n = staff.attr('n') || '1';
    var staffDefs = app.closest('score').find('staffDef[n="' + staff_n + '"]');
    var i;
    var staff_l = '';
    for (i=0; i<staffDefs.length; ++i) {
      staff_l = $(staffDefs[i]).attr('label.abbr') || $(staffDefs[i]).attr('label') || staff_l;
    }
    if (staff_l.length > 4) staff_l = staff_l.substr(0,1);
  }
  label += '.' + this.shortVoiceLabel(app);
  return label;
}

meiView.UI.prototype.showTitle = function(show) {
  if (this.titleDiv && this.titleElem) {
    if (show) {
      $(this.titleDiv).append(this.titleElem);
    } else {
      $(this.titleElem).remove();
    }  
  }
}

meiView.UI.prototype.updatePageLabels = function(current, total) {
  $(this.maindiv).find('#pageNumber-top, #pageNumber-bottom')
    .html((current).toString() + '/' + total);
}

meiView.UI.prototype.onClickSideBarMarkup = function(me, measure_n, altID) {
  var result = 'onclick="meiView.UI.callback('
    + '\'' + me.viewer.id + '-ui\', \'onClickSidebarItem\', { measure_n: '
    + measure_n + ', altID: \'' +  altID
    + '\'})"';
  return result;
}

meiView.UI.prototype.fillSideBar = function(sidebardiv, sidebar_class) {
  // Create a capitalized, plural form of a var name
  // e.g. 'reconstruction' -> 'Reconstructions'
  cap_plural = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1) + 's';
  }
  // Supplied part lists: reconstructions and concordances
  for (var var_type in this.viewer.SuppliedPartLists) {
    for (originID in this.viewer.SuppliedPartLists[var_type]) {
      var listElem = sidebardiv.find('ul[id="' + var_type + '"]');
      if (listElem.length === 0) {
        sidebardiv.append('<h3 class="' + sidebar_class + 
            '">' + cap_plural(var_type) + '</h3><div class="' + sidebar_class +
            '"><ul id="' + var_type + '"></ul></div>');
        listElem = sidebardiv.find('ul[id="' + var_type + '"]');
      }
      listElem.append('<li class="meiview-sidebar-item"\
          onclick="meiView.UI.callback(\'' + 
          this.viewer.id + '-ui\', \'onSuppliedPartClick\', { ' +
          'originID: \'' + originID + '\',' +
          'var_type: \'' + var_type + '\',' +
          '})">' + originID + '</li>');
    }
  }

  var emendations = this.viewer.Emendations;
  var choices = $(this.viewer.MEI.rich_score).find('choice');
  if (choices.length > 0) {
    sidebardiv.append('<h3 class="' + sidebar_class 
      + '">Emendations</h3>\
        <div class="' + sidebar_class + '">\
          <ul class="emendations-list"></ul>\
        </div>');
    var emendListElem = sidebardiv.find('ul.emendations-list');
    var i=0;
    for (var i;i<choices.length; i++) {
      var choice = choices[i]
      var measure_n = $($(choice).closest('measure')[0]).attr('n');
      var choiceID = $(choice).attr('xml:id');
      var liID = this.toCSSId(choiceID);

      // resplist <- list of editors who have entered corrections
      var resplist = '';
      var corrs = $(choice).find('corr');
      var altlabel_open = '(corr. by ';
      var altlabel_close = ')';
      var j = 0;
      for (var j; j<corrs.length; j++) {
        var corr = corrs[j];
        resplist += ( j > 0 ? ', ' : '') + $(corr).attr('resp').replace(/^#/, '');
      }

      emendListElem.append('<li id="' + liID + '" class="meiview-sidebar-item" '
        + this.onClickSideBarMarkup(this, measure_n, choiceID) + '>'
        + this.appID2appLabel(choiceID) + altlabel_open + resplist + altlabel_close
        + '</li>'
      );
      var liItem = $(emendListElem).find('li#' + liID);
    }
  }

  var sources = this.viewer.Sources;
  for(src in sources){
    var source = sources[src];
    sidebardiv.append('<h3 class="' + sidebar_class + '">'
      + this.srcID2srcLabel(src)
      + '</h3><div class="'
      + sidebar_class
      + '"><ul id="' + src + '"></ul></div>'
    );
    var listElem = sidebardiv.find('ul[id="'+src+'"]');
    for (var i=0; i<source.length; i++) {
      var appID = source[i].appID;
      var measure_n = source[i].measureNo;
      listElem.append('<li id="' + this.liID(src, appID)
        + '" class="' +  this.toCSSId(appID)
        + ' meiview-sidebar-item" '
        + this.onClickSideBarMarkup(this, measure_n, appID) + '>'
        + this.appID2appLabel(appID)
        + '</li>'
      );
    }
  }

}

meiView.UI.callback = function(id, fname, params) {
  meiView.UI.objects[id][fname](params);
}

meiView.UI.prototype.onSuppliedPartClick = function(params) {
  this.viewer.toggleSuppliedPart(params.var_type, params.originID);
}

meiView.UI.objects = {};
meiView.UI.addObject = function(id, obj) {
  meiView.UI.objects[id] = obj;
};

meiView.UI.prototype.onClickSidebarItem = function(params) {
  this.viewer.jumpToMeasure(params.measure_n);
  this.ShowSelectorPanel(this.dots[params.altID].info);
}

meiView.UI.prototype.renderMei2Canvas = function(score, options) {
  options = options || {};
  var paddingX = options.paddingX || 0;
  var paddingY = options.paddingY || 0;

  var tempCanvas = new fabric.StaticCanvas();
  tempCanvas.setDimensions({width:options.vexWidth, height:options.vexHeight});
  var score_width = options.vexWidth;
  var score_height = options.vexHeight;
  this.L('Rendering MEI... ');
  MEI2VF.render_notation(score, tempCanvas.getElement(), score_width, score_height, null, options);
  this.rendered_measures = MEI2VF.rendered_measures;
  this.L('Done rendering MEI');
  return tempCanvas;  
}

meiView.UI.prototype.displayDots = function() {
  for (appID in this.dots) {
    if (this.dots[appID])
    { 
      this.fabrCanvas.remove(this.dots[appID].circle);
      delete this.dots[appID];
    }
  }
  for (appID in this.viewer.MEI.ALTs) {
    this.dots[appID] = this.displayDotForAPP(appID);
  }
}

meiView.UI.prototype.displayDotForAPP = function(appID) {

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
  var vexStaffs = MEI2VF.rendered_measures[measure_n];
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
}

meiView.UI.prototype.displayDotForMeasure = function(vexStaff) { 
  if (vexStaff) {
    var left = (vexStaff.x + vexStaff.width - 12) * this.scale;
    // var top = (vexStaff.y + 30) * this.scale;
    var top = (vexStaff.y + 25) * this.scale;

    var circle = new fabric.Circle({
      radius: 5, 
      fill: 'green', 
      left:left, 
      top:top, 
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      hasControls: false,
      hasBorders: false,
    });
    circle.meiViewID = appID;
    this.fabrCanvas.add(circle);
    return circle;
  }
}



meiView.UI.prototype.displayMeasureNos = function() {
  console.log('meiView.UI.prototype.displayMeasureNos()')
  for (n in this.measure_n_texts) {
    if (this.measure_n_texts[n])
    { 
      this.fabrCanvas.remove(this.measure_n_texts[n]);
      delete this.measure_n_texts[n];
    }
  }
  var rendered_measures = this.rendered_measures
  var ui_scale = this.scale;
  var ui_canvas = this.fabrCanvas;
  var ui_measure_n_texts = this.measure_n_texts;
  $.each(rendered_measures, function(n, measure) {
    console.log('meiView.UI.prototype.displayMeasureNos() n:' + n);
    if (measure) {
      var i, vexStaff = measure[1], skip = false;
      for (i=0; i<vexStaff.modifiers.length; i++) {
        var modifier = vexStaff.modifiers[i];

        // TODO: Detect collision between measure number and modifier
        // (perhaps by detecting collision with modifier.modifier_context)
        //
        // For now: if modifier is a volta, do not render measure number.
        if (modifier.volta == Vex.Flow.Volta.type.BEGIN || 
            modifier.volta == Vex.Flow.Volta.type.BEGIN_END) {
          skip = true;
        }
      }
      if (!skip) {
        console.log('meiView.UI.prototype.displayMeasureNos() vexStaff:');      
        console.log(vexStaff);
        var left = (vexStaff.x + 8) * ui_scale;
        var top = (vexStaff.y + 15) * ui_scale;
        var text = new fabric.Text(n.toString(), {
          fontSize: Math.round(16 * ui_scale),
          fill: 'grey',
          left:left, 
          top:top, 
          lockMovementX: true,
          lockMovementY: true,
          lockScalingX: true,
          lockScalingY: true,
          lockRotation: true,
          hasControls: false,
          hasBorders: false,
        });
        ui_canvas.add(text);
        ui_measure_n_texts[n] = text;
      }
    }
  });
}

meiView.UI.prototype.renderMei2Img = function(meixml, options) {
  var tempCanvas = this.renderMei2Canvas(meixml, options);
  var img = new Image;
  img.src = tempCanvas.toDataURL();
  return img;
}

meiView.UI.prototype.renderPage = function(pageXML, options) { 
  options = options || {};
  options.paddingX = 20;
  options.paddingY = 20;
  options.vexWidth = options.vexWidth || $(this.fabrCanvas.getElement()).attr('width');
  options.vexHeight = options.vexHeight || $(this.fabrCanvas.getElement()).attr('height');
  
  
  
  var img = this.renderMei2Img(pageXML, options);
  if (this.scoreImg) {
     this.fabrCanvas.remove(this.scoreImg);    
  }
  this.scale = this.fabrCanvas.width/options.vexWidth;
  var W = this.fabrCanvas.width;
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
}

meiView.UI.prototype.initCanvas = function(canvasid) {

  var dimensions = { width: $('#'+canvasid).width(), height: $('#'+canvasid).height() }
  var me = this;

  var canvas = new fabric.Canvas(canvasid);
  canvas.setDimensions(dimensions)
  canvas.hoverCursor = 'pointer';
  var this_ui = this;

  canvas.renderAll_Hack = function() {
    setTimeout(function(){canvas.renderAll()}, 1000);
  }

  canvas.findTarget = (function(originalFn) {
    return function() {
      var target = originalFn.apply(this, arguments);
      if (target) {
        if (this._hoveredTarget !== target) {
          canvas.fire('object:over', { target: target });
          if (this._hoveredTarget) {
            canvas.fire('object:out', { target: this._hoveredTarget });
          }
          this._hoveredTarget = target;
        }
      }
      else if (this._hoveredTarget) {
        canvas.fire('object:out', { target: this._hoveredTarget });
        this._hoveredTarget = null;
      }
      return target;
    };
  })(canvas.findTarget);
  
  canvas.on('object:over', function(e) {
    if (e.target && e.target.meiViewID) {
      e.target.setFill('red');
      canvas.renderAll();
    }
  });

  canvas.on('object:out', function(e) {
    if (e.target && e.target.meiViewID) {
      e.target.setFill('green');
      canvas.renderAll();
    }
  });

  canvas.on('mouse:down', function(e) {
    
    if (e.target) {
      var dotInfo = 
        e.target.meiViewID && 
        this_ui.dots[e.target.meiViewID] && 
        this_ui.dots[e.target.meiViewID].info;
      if (dotInfo) {
        this_ui.ShowSelectorPanel(dotInfo);
      } else if (e.target.selectItem>=0) {
        this_ui.dlg && this_ui.dlg.select(e.target.selectItem);
      } else {
        this_ui.HideSelectorPanel();
      }
      me.L(e.target);
      me.L(e.target.meiViewID  + ': x:' + e.target.left + ', y:' + e.target.top);
    }
  });
  
  canvas.allowTouchScrolling = true;
  
  return canvas;
  
}

meiView.UI.prototype.onSelectorDraw = function(args) {
  this.viewer.selectingState.enter(args.appID, this.viewer.MEI.sectionplane[args.appID].xmlID);
  this.updateSidebar();
}

meiView.UI.prototype.onSelectorSelect = function(args) {

  if (this.viewer.selectingState.ON) {

    var oldVarID = this.viewer.selectingState.selectedVarXmlID;
    this.viewer.selectVariant(args.varXmlID);

    /* re-draw current page [TODO: only re-draw if the change happened on the current page] */

    this.viewer.displayCurrentPage();
    if (this.dlg) { 
      this.dlg.bringToFront();
    }
    
    this.updateSidebar(this.viewer.selectingState.appID, oldVarID);
  }
}

meiView.UI.prototype.onSelectorHide = function() {
  this.viewer.selectingState.exit();
  this.updateSidebar();
}

meiView.UI.prototype.addHightlightClasses = function(appID) {
  var source = this.viewer.MEI.sectionplane[appID].source;
  var sources = source ? source.split(' ') : ['lem'];
  for (var i=0;i<sources.length; i++) {
    var liID = this.liID(sources[i], appID);
    $(this.maindiv).find('#' + liID)
      .addClass('meiview-variant-on')
      .closest('div.meiview-sidebar').prev().addClass('meiview-source-has-variant-on');
  }
}

meiView.UI.prototype.initSidebarHighlight = function() {
  if (!this.viewer.MEI.sectionview_socre) return;
  for (appID in this.viewer.MEI.ALTs) {
    this.addHightlightClasses(appID);
  } 
}

meiView.UI.prototype.updateSidebarHighlight = function(appID, oldVarID) {
  this.addHightlightClasses(appID);
  if (oldVarID) {
    source = this.viewer.MEI.ALTs[appID].altitems[oldVarID].source;
    var sources = source ? source.split(' ') : ['lem'];
    for (var i=0;i<sources.length; i++) {
      var liID = this.liID(sources[i], appID);
      $(this.maindiv).find('#' + liID)
      .removeClass('meiview-variant-on');
    }
    $(this.maindiv).find('div.meiview-sidebar')
      .not(':has(li.meiview-variant-on)')
      .prev('.meiview-source-has-variant-on')
      .removeClass('meiview-source-has-variant-on');
  }
}

meiView.UI.prototype.updateSidebar = function(appID, oldVarID) {
  if (appID) {
    this.updateSidebarHighlight(appID, oldVarID);
  }
  if (this.viewer.selectingState.ON) {
    /* Disable sources without variants at the currently selected <app> */
    $(this.maindiv).find('div.meiview-sidebar')
      .not(':has(li.' + this.toCSSId(this.viewer.selectingState.appID) + ')')
      .prev()
      .addClass('meiview-source-disabled');
    /* Close up variant list the source is disbaled */
    if ($(this.maindiv).find('.meiview-source-disabled.ui-accordion-header-active').length>0) { 
      $(this.maindiv).find("#accordion").accordion( "option", "active", false);
    }
    /* Disable clicking on sources */
    $(this.maindiv).find('#accordion').on('accordionbeforeactivate', function(event, ui) {
      event.preventDefault();
    });
  } else {
    /* Enable all sources */
    $(this.maindiv).find('h3.meiview-source-disabled').removeClass('meiview-source-disabled');
    /* Enable clicking on sources */
    $(this.maindiv).find('#accordion').off();
  }
}

meiView.UI.prototype.ShowSelectorPanel = function(dotInfo) {
  var variantSlice = this.viewer.MEI.getRichSlice({start_n:dotInfo.measure_n, end_n:dotInfo.measure_n, staves:[dotInfo.staff_n], noClef:true, noKey:true, noMeter:true, noConnectors:true});
  var panelItemParamList = [];
  var appID = dotInfo.appXmlID;
  var altitems = this.viewer.MEI.ALTs[appID].altitems;

  if (this.dlg) {
    this.dlg.hide();
  }
  this.dlg = new meiView.SelectorPanel({
    left: dotInfo.measure_left*this.scale, 
    top: dotInfo.measure_top*this.scale, 
    measureWidth: 500*this.scale, 
    //measureWidth: 300*this.scale, 
    canvas: this.fabrCanvas,
    scale: 0.7,
    appID: appID,
    UI: this,
  });
  
  self = this;
  this.dlg.onDraw = function(args) { self.onSelectorDraw(args) };
  this.dlg.onSelect = function (args) { self.onSelectorSelect(args) };
  this.dlg.onHide = function () { self.onSelectorHide() };

  variantSlice.initSectionView();
  for (xmlID in altitems) {
    var altitem = altitems[xmlID];
    var tagname = altitem.tagname;
    var source = altitem.source;
    var resp = altitem.resp;
    var replacements = {};
    replacements[appID] = xmlID;
    variantSlice.updateSectionView(replacements);
    var text = '';
    if (tagname == 'lem') {
      text = 'Lemma';
    }
    else if (tagname == 'sic') {
      text = 'Original';
    }
    else if (tagname == 'corr') {
      if (resp) {
        text = 'Corrected (' + resp.replace(/#/g, '').replace(/ /g, ', ') + ')';
      }
      else {
        text = 'Corrected'
      }
    }
    else if (source) {
      text = source.replace(/#/g, '').replace(/ /g, ', ');
    }
    else if (resp) {
      text = resp.replace(/#/g, '').replace(/ /g, ', ');
    }
    var selected = (this.viewer.MEI.sectionplane[appID] === altitem);
    this.dlg.addItem(text+':', variantSlice.sectionview_score, selected, xmlID);
  }
  this.dlg.draw();
}

meiView.UI.prototype.HideSelectorPanel = function() {
  if (this.dlg) {
    this.dlg.hide();
  }
}

meiView.DO_LOG = true;

meiView.UI.prototype.L = function() {
  if (meiView.DO_LOG) Vex.L("meiView", arguments);
}

meiView.SelectorItem = function(options) {
  this.text = options.text;
  this.imgData = options.imgData;
  this.xmlID = xmlID;
}

meiView.SelectorPanel = function (options) {
  this.measureWidth = options.measureWidth || 300;
  this.measureHeight = options.measureHeight || 125;
  this.scale = options.scale || 0.8;
  this.marginWE = options.marginWE || 5;
  this.marginNS = options.marginNS || this.marginWE;
  this.itemSpacing = options.itemSpacing || 5;
  this.width = this.measureWidth * this.scale;
  this.height = 0;
  this.selectedIndex = options.currentSelection || -1;

  this.left = options.left || this.width/2;
  this.top = options.top || this.height/2;

  this.canvas = options.canvas;
  this.UI = options.UI;
  
  this.contentWidth = this.width - 2*(this.marginWE);
  this.imgW = this.contentWidth;
  this.imgH = this.imgW * this.measureHeight/this.measureWidth;

  this.contentTop = this.top - this.height/2 + this.marginNS;

  this.contentScale = options.contentScale || 0.7;
  
  this.items = [];
  this.objects = [];
  if (!options.appID) throw "appID isn't defined for SelectorPanel.";
  this.appID = options.appID;

  this.onDraw = function(args) {};
  this.onSelect = function(args) {};
  this.onHide = function(args) {};
}

meiView.SelectorPanel.prototype.setCanvas = function(fabricCanvas) {
  this.canvas = fabricCanvas;
}

meiView.SelectorPanel.prototype.addItem = function(text, singleVarSliceXML, selected, xmlID) {
  var imgData = this.UI.renderMei2Img(singleVarSliceXML, {
    labelMode: 'full',
    systemLeftMar: 100,
    page_margin_top: 20,
    staveSpacing: 70,
    systemSpacing: 90,
    staff: {
      bottom_text_position : 8,
      fill_style : "#000000"
    },
    vexWidth:this.measureWidth, 
    vexHeight:this.measureHeight 
  });
  var newItem = new meiView.SelectorItem({text:text, imgData:imgData, xmlID:xmlID});
  this.items.push(newItem);
  if (selected) {
    this.select(this.items.length-1);
  }
}

meiView.SelectorPanel.prototype.addObjectsForItem = function(item, itemIndex) {
  var text = new fabric.Text(item.text, {
    fontSize: 17*this.scale,
    selectable: false,
    left: this.left,
  });
  
  if (text.width > this.contentWidth) {
    this.contentWidth = text.width;
    this.width = this.contentWidth + 2*(this.marginWE);
  }
  
  var img = new fabric.Image(item.imgData, {
    width:this.imgW, 
    height:this.imgH,
    left: this.left,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasControls: false,
    hasBorders: true,
    selectable: false,
  });

  var br = text.getBoundingRect();

//  text.left = this.contentLeft + br.width/2;
  text.top = this.contentTop + this.nextItemTop + br.height/2

  img.top = text.top + br.height/2 + img.height/2;
  // img.left = this.contentLeft + img.width/2;

  var vertIncr = text.height + img.height;
  item.height =  vertIncr;
  this.nextItemTop += vertIncr + this.itemSpacing;
  var heightIncr = itemIndex===0 ? vertIncr + this.marginNS : vertIncr + this.itemSpacing;
  this.height += heightIncr;
  this.top += heightIncr/2;
  
  var smW = this.contentWidth;
  var smH = this.imgH+text.height;
  item.selectorMask =  new fabric.Rect({
    fill: 'green',
    width:smW, 
    height:smH,
    left: this.left,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasControls: false,
    selectable: true,
  });
  
  item.selectorMask.top = item.selectorMask.height/2 + text.top - text.height/2;

  // some custom members for selectorMask:
  //  * remember the index to know which item it is attached to,
  //  * define how to highlight when selected
  item.selectorMask.selectItem = itemIndex;
  item.selectorMask.highlight = function(value) {
    this.opacity = value ? 0.35 : 0;
  };
  
  item.selectorMask.highlight(itemIndex === this.selectedIndex);

  this.objects.push(text);
  this.objects.push(img);
  this.objects.push(item.selectorMask);
 
}

/**
 * Calculate delta_x and delta_y to shift the panel so it fits inside the specified box;
 */
meiView.SelectorPanel.prototype.shiftXY = function(box) {
  var pHeight = 0;
  var items = this.items;
  for (var i=0;i<items.length;i++) {
    pHeight += items[i].height + (i === 0 ? this.marginNS : this.itemSpacing);
  }
  if (items.length>0) pHeight += this.marginNS;
  var pWidth = this.width;
  var Wc = box.width;
  var Hc = box.height;
  var Xc = box.x;
  var Yc = box.y;
  
  var curr_x = this.panel.left;
  var curr_y = this.panel.top;
  
  var min_x = Xc - Wc/2 + pWidth/2;
  var max_x = Xc + Wc/2 - pWidth/2;
  var delta_x = 0;
  if (curr_x > max_x ) delta_x = max_x - curr_x;
  if (curr_x < min_x) delta_x = min_x - curr_x;
 
  var min_y = Yc  - Hc/2 + pHeight/2;
  var max_y = Yc  + Hc/2 - pHeight/2;
  var delta_y = 0;
  if (curr_y > max_y) delta_y = max_y - curr_y;
  if (curr_y < min_y) delta_y = min_y - curr_y;

  return {x:delta_x, y:delta_y};
}

meiView.SelectorPanel.prototype.draw = function(box) {
  this.objects = [];
  this.nextItemTop = 0;

  if (!this.panel) {
      this.panel = new fabric.Rect({
        fill: 'grey',
        selectable: false
      });
  }
  this.objects.push(this.panel);

  var items = this.items;
  for (var i=0;i<items.length;i++) {
    this.addObjectsForItem(items[i], i);
  }

  this.panel.width = this.width;
  this.panel.height = this.height+this.marginNS;

  this.panel.left = this.left;
  this.panel.top = this.top+this.marginNS/2;
  
  var delta = this.shiftXY({
    x: this.canvas.width/2, 
    y: this.canvas.height/2, 
    width: this.canvas.width,
    height: this.canvas.height
  });

  var objects = this.objects;
  for (var i=0;i<objects.length;i++) {
    var obj = objects[i];
    obj.left += delta.x;
    obj.top += delta.y;
    this.canvas.add(obj);
  }
  this.canvas.renderAll_Hack();
  this.onDraw({appID:this.appID});
}

meiView.SelectorPanel.prototype.hide = function() {
  this.canvas.remove(this.panel);
  var objects = this.objects;
  for (var i=0;i<objects.length;i++) {
    this.canvas.remove(objects[i]);
  }
  this.onHide();
  delete this;
}

meiView.SelectorPanel.prototype.select = function(i) {

  if (0<=i && i<this.items.length) {
    
    //switch off highlight on prviously selected item
    if (this.selectedIndex>=0 && this.items[this.selectedIndex].selectorMask) {
      this.items[this.selectedIndex].selectorMask.highlight(false);
    }
    
    //switch off highlight on new selection
    if (this.items[i].selectorMask) {
      this.items[i].selectorMask.highlight(true);
    }
    
    this.selectedIndex = i;

    this.onSelect({ varXmlID: this.items[i].xmlID});
    
  }
  
}

meiView.SelectorPanel.prototype.bringToFront = function() {
  var objects = this.objects;
  for (var i=0;i<objects.length;i++) {
    objects[i].bringToFront();
  }
}

