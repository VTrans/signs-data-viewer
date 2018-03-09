var signLayer = {}; //global namespace to be more accessible to UI-driven post-load events.

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
  ], function(Map, MapView, VectorTileLayer, FeatureLayer) {

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
	
	signLayer = new FeatureLayer("http://maps.vtrans.vermont.gov/arcgis/rest/services/AMP/Sign_Symbols/FeatureServer/0", {
		mode: FeatureLayer.MODE_ONDEMAND,
		outFields: ["*"],
		id: 'signs'
	});
	map.add(signLayer);
});