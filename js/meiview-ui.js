meiView.UI = {};
meiView.UI.dots = {};

meiView.UI.fillSideBar = function(sidebardiv, sources, sidebar_class) {
  for(src in sources){
    var source = sources[src];
    sidebardiv.append('<h3 class="' + sidebar_class + '">'+src+'</h3><div class="' + sidebar_class + '"><ul id="' + src + '"></ul></div>');
    var listElem = sidebardiv.find('ul[id="'+src+'"]');
    for (var i=0; i<source.length; i++) {
      listElem.append('<li>' + source[i].appID + '</li>')
    }
  }
}

meiView.UI.renderMei2Canvas = function(score, options) {
  options = options || {};
  var paddingX = options.paddingX || 0;
  var paddingY = options.paddingY || 0;

  var tempCanvas = new fabric.StaticCanvas();
  tempCanvas.setDimensions({width:options.vexWidth, height:options.vexHeight});

  var score_width = options.vexWidth;
  var score_height = options.vexHeight;
  Vex.LogInfo('Rendering MEI... ');
  console.log(score);
  MEI2VF.render_notation(score, tempCanvas, score_width, score_height);
  Vex.LogInfo('Done rendering MEI');
  return tempCanvas;  
}

meiView.UI.DisplayMainMEI = function(score, canvas, options) {
  var score_width = $(canvas).attr('width') - 20
  var score_height = $(canvas).attr('height') - 20;
  Vex.LogInfo('Rendering main MEI... ');
  MEI2VF.render_notation(score, canvas, score_width, score_height);
  Vex.LogInfo('Done rendering main MEI');
  return canvas;  
}

meiView.UI.displayDots = function() {
  for (dot in meiView.UI.dots) {
    meiView.UI.fabrCanvas.remove(meiView.UI.dots[dot]);
    delete meiView.UI.dots[dot];
  }
  for (appID in meiView.MEI.APPs) {
    meiView.UI.dots[appID] = meiView.UI.displayDotForAPP(appID);
  }
}

meiView.UI.displayDotForAPP = function(appID) {

  // In order to know what coordiantes to display the dot at, we have to
  // get the coordinates of the VexFlow staff object. VexFlow staff objects are 
  // exposed by MEI2VF via the MEI2VF.rendered_measures:
  // MEI2VF.rendered_measures is indexed by the measure number and staff number.
  // so, in order to retreive the right measure we have to know the measure number and the 
  // staff number:

  // get the meausure number first, 
  var app = $(meiView.MEI.score).find('app[xml\\:id="' + appID + '"]')[0];
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
    return meiView.UI.displayDotForMeasure(vexStaffs[staff_n]);
  }

}
meiView.UI.displayDotForMeasure = function(vexStaff) { 
  if (vexStaff) {
    var left = (vexStaff.x + vexStaff.width - 12) * meiView.UI.scale;
    var top = (vexStaff.y + 30) * meiView.UI.scale;
    // var left = vexStaff.x;
    // var top = 0; 

    var circle = new fabric.Circle({
      radius: 5, 
      fill: 'green', 
      left:left, 
      top:top, 
      lockMovementX: true,
      // lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      hasControls: false,
      hasBorders: false,
    });
    circle.meiViewID = appID;
    meiView.UI.fabrCanvas.add(circle);
    return circle;
  }
}

meiView.UI.renderMei2Img = function(meixml, options) {
  var tempCanvas = meiView.UI.renderMei2Canvas(meixml, options);
  var img = new Image;
  img.src = tempCanvas.toDataURL();
  return img;
}

meiView.UI.renderPage = function(pageXML, options) { 
  options = options || {};
  options.paddingX = 20;
  options.paddingY = 20;
  options.vexWidth = options.vexWidth || $(meiView.UI.fabrCanvas.getElement()).attr('width');
  options.vexHeight = options.vexHeight || $(meiView.UI.fabrCanvas.getElement()).attr('height');
  var img = meiView.UI.renderMei2Img(pageXML, options);
  if (meiView.UI.scoreImg) {
     meiView.UI.fabrCanvas.remove(meiView.UI.scoreImg);    
  }
  meiView.UI.scale = meiView.UI.fabrCanvas.width/options.vexWidth;
  var W = meiView.UI.fabrCanvas.width;
  var H = options.vexHeight * meiView.UI.scale;
  meiView.UI.scoreImg = new fabric.Image(img, {
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
  meiView.UI.fabrCanvas.add(meiView.UI.scoreImg);
}

meiView.UI.initCanvas = function(canvasid) {

  var canvas = new fabric.Canvas(canvasid);
  canvas.hoverCursor = 'pointer';

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
      console.log(e.target.meiViewID  + ': x:' + e.target.left + ', y:' + e.target.top);
    }
  });
  
  return canvas;
  
}

meiView.UI.SelectorItem2 = function(options) {
  this.text = options.text;
  this.imgData = options.imgData;
}

meiView.UI.SelectorPanel2 = function (options) {
  this.width = options.width || 200;
  this.height = options.height || 200;
  this.left = options.left || this.width/2;
  this.top = options.top || this.height/2;
  this.padding = options.padding || 20;
  this.paddingLeft = options.paddingLeft || this.padding;
  this.paddingTop = options.paddingTop || this.padding;
  this.paddingRight = options.paddingRight || this.padding;
  this.paddingBottom = options.paddingBottom || this.padding;
  this.canvas = options.canvas;
  
  this.contentLeft = this.left - this.width/2 + this.paddingLeft;
  this.contentTop = this.top - this.height/2 + this.paddingTop;
  
  this.contentScale = options.contentScale || 0.7;
  
  //TODO: make two columns for text and staves?
  //Or maybe better to make a group of text and under the staff.
  
  this.items = [];
  this.objects = [];
  
}

meiView.UI.SelectorPanel2.prototype.setCanvas = function(fabricCanvas) {
  this.canvas = fabricCanvas;
}

meiView.UI.SelectorPanel2.prototype.addItem = function(text, singleVarSliceXML) {

  var imgData = meiView.UI.renderMei2Img(singleVarSliceXML, {vexWidth:300, vexHeight:125});
  var newItem = new meiView.UI.SelectorItem2({text:text, imgData:imgData, width:this.width*0.8, height:260*0.8});
  this.items.push(newItem);  
  
  // 
  // 
  // // var pageXML = meiView.currentScore.getSlice({start_n:variant.start_n, end_n:variant.end_n, staves:variant.staves, noClef:true, noKey:true, noMeter:true});
  // var imgData = meiView.UI.renderMei2Img(pageXML, {vexWidth:300, vexHeight:125});
  // var newItem = new meiView.UI.SelectorItem2({text:'Lemma:', imgData:imgData});
  // this.items.push(newItem);
}

meiView.UI.SelectorPanel2.prototype.addObjectsForItem = function(item) {
  var text = new fabric.Text(item.text, {
    fontSize: 17,
    selectable: false
  })
  
  var imgW = item.imgData.width * this.contentScale;
  var imgH = item.imgData.height * this.contentScale;
  var img = new fabric.Image(item.imgData, {
    width:imgW, 
    height:imgH,
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

  text.left = this.contentLeft + br.width/2;
  text.top = this.contentTop + this.nextItemTop + br.height/2

  img.top = text.top + br.height/2 + img.height/2;
  img.left = this.contentLeft + img.width/2;

  this.nextItemTop += text.height + img.height + 10;
  
  var smW = imgW;
  var smH = imgH+text.height;
  var selectorMask =  new fabric.Rect({
    fill: 'green',
    opacity: 0.2,
    width:smW, 
    height:smH,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasControls: false,
    selectable: true,
  });
  
  selectorMask.left = this.contentLeft + selectorMask.width/2;
  selectorMask.top = selectorMask.height/2 + text.top - text.height/2;

  this.objects.push(selectorMask);
  this.objects.push(text);
  this.objects.push(img);

}

meiView.UI.SelectorPanel2.prototype.draw = function() {
  if (!this.panel) {
      this.panel = new fabric.Rect({
        width:this.width,
        height:this.height,
        top:this.top,
        left:this.left, 
        fill: 'grey',
        selectable: false
      });
  }
  
  this.objects = [];
  this.nextItemTop = 0;
  var items = this.items;
  for (var i=0;i<items.length;i++) {
    this.addObjectsForItem(items[i]);
  }
  
  this.canvas.add(this.panel);
  var objects = this.objects;
  for (var i=0;i<objects.length;i++) {
    this.canvas.add(objects[i]);
  }
}

meiView.UI.SelectorPanel2.prototype.hide = function() {
  this.canvas.remove(this.panel);
  var objects = this.objects;
  for (var i=0;i<objects.length;i++) {
    this.canvas.remove(objects[i]);
  }
}



meiView.UI.SelectorItem = function(options) {
  this.width = options.width || 300;
  this.height = options.height || 300;
  this.group = new fabric.Group();
  
  this.text = new fabric.Text(options.text, {
    fontSize: 20,
  })
  this.img = new fabric.Image(options.img, {
    width:this.width, 
    height:this.height,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasControls: false,
    hasBorders: false,
    selectable: false,
  });
  var br = this.text.getBoundingRect();

  this.text.left = br.width/2;
  this.text.top = br.height/2

  this.img.top = this.text.top + br.height/2 ;
  this.img.left = this.img.width/2;
  
  this.selectorMask =  new fabric.Rect({
    fill: 'green',
    opacity: 0,
    width:this.width, 
    height:80+this.text.height,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasControls: false,
    selectable: true,
  });
  
  this.selectorMask.left = this.selectorMask.width/2;
  this.selectorMask.top = this.selectorMask.height/2 + this.text.top - this.text.height/2;
  this.group.add(this.text);
  this.group.add(this.img);
  this.group.add(this.selectorMask);
}

meiView.UI.SelectorItem.prototype.setSelection = function(value) {
  this.selected = value;
  this.selectorMask.opacity = value ? 0.2 : 0;
}

meiView.UI.SelectorItem.prototype.toggleSelection = function() {
  this.setSelection(!this.selected);
}

meiView.UI.SelectorPanel = function (options) {
  this.width = options.width || 200;
  this.height = options.height || 200;
  this.left = options.left || this.width/2;
  this.top = options.top || this.height/2;
  this.padding = options.padding || 20;
  this.paddingLeft = options.paddingLeft || this.padding;
  this.paddingTop = options.paddingTop || this.padding;
  this.paddingRight = options.paddingRight || this.padding;
  this.paddingBottom = options.paddingBottom || this.padding;
  this.canvas = options.canvas;
  
  this.contentLeft = this.left - this.width/2 + this.paddingLeft;
  this.contentTop = this.top - this.height/2 + this.paddingTop;
  
  //TODO: make two columns for text and staves?
  //Or maybe better to make a group of text and under the staff.
  
  this.items = [];
  
}

meiView.UI.SelectorPanel.prototype.setCanvas = function(fabricCanvas, variantMEI) {
  this.canvas = fabricCanvas;
  this.variantMEI = variantMEI;
}

meiView.UI.SelectorPanel.prototype.createItems = function(variant) {
  // var pageXML = meiView.currentScore.getSlice({start_n:3, end_n:3, Staves:[2], noClef:true, noKey:true, noMeter:true});

  var lem = new MeiLib.SingleVariantPathScore(variantSlice, {
    'app.m3.tie': new MeiLib.AppReplacement('lem', 'lem.app.m3.tie'),
  });


  var rawimg = meiView.UI.renderMei2Img(pageXML, {vexWidth:300, vexHeight:260});
  var newItem = new meiView.UI.SelectorItem({text:'Lemma:', img:rawimg, width:this.width*0.8, height:260*0.8});
  var br = newItem.group.getBoundingRect();
  newItem.group.left = this.contentLeft + br.width/2;
  newItem.group.top = this.contentTop + br.height/2;
  this.items.push(newItem);  
  
  var rdg1 = new MeiLib.SingleVariantPathScore(variantSlice, {
    'app.m3.tie': new MeiLib.AppReplacement('rdg', 'rdg1.app.m3.tie'),
  });
  
  
  newItem.setSelection(true);
}


meiView.UI.SelectorPanel.prototype.addItem = function(text, singleVarSliceXML) {
  // var pageXML = meiView.currentScore.getSlice({start_n:3, end_n:3, Staves:[2], noClef:true, noKey:true, noMeter:true});


  var rawimg = meiView.UI.renderMei2Img(singleVarSliceXML, {vexWidth:300, vexHeight:260});
  var newItem = new meiView.UI.SelectorItem({text:text, img:rawimg, width:this.width*0.8, height:260*0.8});
  var br = newItem.group.getBoundingRect();
  newItem.group.left = this.contentLeft + br.width/2;
  newItem.group.top = this.contentTop + br.height/2;
  this.items.push(newItem);  
  
  // newItem.setSelection(true);
}

meiView.UI.SelectorPanel.prototype.draw2 = function() {
  // this.items.push(new meiView.UI.SelectorItem('BQ18, FC2439, Lo31922:'));
  var panel = new fabric.Rect({
    width:this.width,
    height:this.height,
    top:this.top,
    left:this.left, 
    fill: 'grey'
  });
  this.group = this.group || new fabric.Group();
  this.group.add(panel);
  var items = this.items;
  for (var i=0;i<items.length;i++) {
    this.group.add(items[i].group);
    // this.canvas.add(items[i].text);
    // this.canvas.add(items[i].img);
    // this.canvas.add(items[i].selectorMask);
  }
  // this.group.selectable = true;
  // this.group.hasControls = true;
  this.canvas.add(this.group);
  // this.canvas.add(panel);
  // this.group.bringToFront();
  
}


meiView.UI.SelectorPanel.prototype.draw = function() {
  
  var panel = new fabric.Rect({
    width:this.width,
    height:this.height,
    top:this.top,
    left:this.left, 
    fill: 'grey'
  });
  
  var pageXML = meiView.currentScore.getSlice({start_n:3, end_n:3, Staves:[2], noClef:true, noKey:true, noMeter:true});
  var rawimg = meiView.UI.renderMei2Img(pageXML, {vexWidth:220, vexHeight:260});
  var W = 220;
  var H = 260;
  var left = this.left;
  var top = this.top;
  var img = new fabric.Image(rawimg, {
    width:W,height:H, left:left, top:top,
    // lockMovementX: true,
    // lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasControls: false,
    hasBorders: false,
    // selectable: false,
  });
  // meiView.UI.fabrCanvas.add(meiView.UI.varImg);

  var text = new fabric.Text('hoosssz', {
    fontSize: 18,
    textAlign:'right'
  });
  console.log(text.getBoundingRect());
  var txtBR = text.getBoundingRect();
  text.left = this.contentLeft + txtBR.width/2;
  text.top = this.contentTop + txtBR.height/2
  
  var dialog = new fabric.Group();
  dialog.selectable = true;
  dialog.add(panel);
  dialog.add(text);
  dialog.add(img);
  this.canvas.add(dialog);
}


meiView.UI.VariantSelector = function(canvas, variants) {
  
  var selectionFilter = new fabric.Image.filters.Sepia();
  var mouseOnFilter = new fabric.Image.filters.Brightness({brightness:100});
  var variantScale = 0.75; // how big are the variants compared to the main score.
  
  var Item = function(text, img){
    this.text = text;
    this.img = img;
  }
  
  Item.prototype.select = function() {
    if (this.selected) {
      this.img.filters.remove(selectionFilter);
      this.selected = false;
    }
  }
  
  Items = [];
  
  
  var panel_width = 200;
  var panel_height = 200;
  var panel_left = 200;
  var panel_top = 200;
  var panel_padding = 15;
  
  var panel_content_left = panel_left - panel_width/2 + panel_padding;
  
  var panel = new fabric.Rect({
    width:panel_width, 
    height:panel_height,
    top:panel_left,
    left:panel_top, 
    fill: 'grey' 
  });
  
  var pageXML = meiView.currentScore.getSlice({start_n:3, end_n:3, Staves:[2], noClef:true, noKey:true, noMeter:true});
  var img = meiView.UI.renderMei2Img(pageXML, {vexWidth:220, vexHeight:260});
  var W = 220;
  var H = 260;
  var left = panel_left;
  var top = panel_top;
  var img = new fabric.Image(img, {
    width:W,height:H, left:left, top:top,
    // lockMovementX: true,
    // lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasControls: false,
    hasBorders: false,
    // selectable: false,
  });
  // meiView.UI.fabrCanvas.add(meiView.UI.varImg);

  var text = new fabric.Text('hoosssz', {
    fontSize: 18,
    textAlign:'right'
  });
  console.log(text.getBoundingRect());
  var txtBR = text.getBoundingRect();
  text.left = panel_left - panel_width/2 + panel_padding + txtBR.width/2;
  text.top = panel_top - panel_height/2 + panel_padding + txtBR.height/2
  
  
  
  // 
  // Items.push(new Item(text, img));
  var dialog = new fabric.Group();
  dialog.selectable = true;
  dialog.add(panel);
  dialog.add(text);
  // dialog.add(img);
  canvas.add(dialog);
  
  
  
  
}

