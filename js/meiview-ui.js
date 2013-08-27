meiView.UI = {};

meiView.UI.fillSideBar = function(sidebardiv, sources) {
  for(src in sources){
    var source = sources[src];
    sidebardiv.append('<h3>'+src+'</h3><div><ul id="' + src + '"></ul></div>');
    var listElem = sidebardiv.find('ul[id="'+src+'"]');
    for (var i=0; i<source.length; i++) {
      listElem.append('<li>' + source[i].appID + '</li>')
    }
  }
}