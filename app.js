function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}


require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/VectorTileLayer",
	"esri/layers/FeatureLayer",
    "dojo/domReady!"
  ], function(Map, MapView, FeatureLayer, VectorTileLayer) {

    var map = new Map({
      basemap: "osm"
    });

    var view = new MapView({
      container: "map",
      map: map,
      center: [-72.6,44],
      zoom: 8
    });

    var mapillary = new VectorTileLayer({
            url: "mapillary.json"
          });
    map.add(mapillary);
});