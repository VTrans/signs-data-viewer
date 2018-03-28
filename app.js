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
    "esri/geometry/support/webMercatorUtils",
    "dojo/domReady!"
  ], function(
	  Map,
	  MapView,
	  VectorTileLayer,
	  FeatureLayer,
	  Geometry,
	  urlUtils,
    webMercatorUtils
  ) {
	  window['Geometry'] = Geometry;

    var lon = -72.6
    var lat = 44
    var zoomLevel = 8
    //if there are url params zoom to location
         var coords, zoomLevel;
         var urlObject = urlUtils.urlToObject(document.location.href);
				 // for dev ?coords=-72.683117,44.296882&zoomLevel=18
        if(urlObject.query && urlObject.query.coords && urlObject.query.zoomLevel){
          var coords = urlObject.query.coords.split(',');
          lon = parseFloat(coords[0]);
          lat = parseFloat(coords[1]);
          zoomLevel = parseInt(urlObject.query.zoomLevel);
        }

    map = new Map({
      basemap: "hybrid"
    });

    var view = new MapView({
      container: "map",
      map: map,
      center: [lon,lat],
      zoom: zoomLevel
    });

    var mapillary = new VectorTileLayer({
            url: "mapillary.json"
          });
    map.add(mapillary);

	signLayer = new FeatureLayer("http://maps.vtrans.vermont.gov/arcgis/rest/services/AMP/Sign_Symbols/FeatureServer/0", {
		mode: FeatureLayer.MODE_ONDEMAND,
		outFields: ["ID","MUTCDCode"],
		id: 'signs'
	});
	map.add(signLayer);

	map.on('click', function(evt) {
		handlePopup(evt);
		return false;
	});
});


function handlePopup(evt) {
  var graphics = identifyFeatures(evt);
  var contents = getPopupContents(graphics);
  console.log(contents);
}

function identifyFeatures(evt) {
	var extent = getExtent(evt.mapPoint, 20);
	var graphics = [];
	var layers = map.layers.items;

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
