var signLayer, //global namespace to be more accessible to UI-driven post-load events.
	map,
	Geometry;

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
    "esri/geometry",
    "esri/core/urlUtils",
    "dojo/domReady!"
  ], function(
	  Map,
	  MapView,
	  VectorTileLayer,
	  FeatureLayer,
	  Geometry,
	  urlUtils
  ) {
	  window['Geometry'] = Geometry;

    //if there are url params zoom to location
         var coords, zoomLevel;
         var urlObject = urlUtils.urlToObject(document.location.href);


        if(urlObject.query && urlObject.query.coords && urlObject.query.zoomLevel){
          var coords = urlObject.query.coords.split(',');

          var lon = parseFloat(coords[0]);
          var lat = parseFloat(coords[1]);


          var zoomLevel = parseInt(urlObject.query.zoomLevel);
          var point = Geometry.geographicToWebMercator(new esri.geometry.Point(lon,lat));

          map.centerAndZoom(point,zoomLevel);
        }

    map = new Map({
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




function identifyFeatures(evt) {	
	var extent = getExtent(evt.mapPoint, 20);
	var graphics = [];
	var layers = map.getLayersVisibleAtScale();

	for (var i = 0; i<layers.length; i++) {
		if (!layers[i].graphics || layers[i].graphics.length < 1 || !layers[i].visible) continue;
		
		var features = layers[i].graphics.filter(function(graphic) {
			return extent.intersects(graphic.geometry);
		});
		graphics = graphics.concat(features);
	}
	
	
	return graphics;
}

function getExtent(point, tol) {
	var pixelWidth = map.extent.getWidth() / map.width;
	var toleraceInMapCoords = tol * pixelWidth;
	return new Geometry.Extent( point.x - toleraceInMapCoords,
		   point.y - toleraceInMapCoords,
		   point.x + toleraceInMapCoords,
		   point.y + toleraceInMapCoords,
		   map.spatialReference );
}
