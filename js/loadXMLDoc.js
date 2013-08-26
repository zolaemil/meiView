function loadXMLDoc(filename) {
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