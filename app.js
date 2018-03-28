var signLayer; //global namespace to be more accessible to UI-driven post-load events.

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function mapillaryLink(){
	// url https://www.mapillary.com/app/?username=vtrans_row&lat=44&lng=-72&z=7.5
	var mapillarypre = 'https://www.mapillary.com/app/?username=vtrans_row&lat='
	var mapillary2nd = '&lng='
	var mapillary3rd = '&z='

	var mapillaryURL = mapillarypre + view.center.latitude + mapillary2nd + view.center.longitude + mapillary3rd + '17'
	window.open(mapillaryURL, "_blank")

}

require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/VectorTileLayer",
	"esri/layers/FeatureLayer",
    "esri/geometry",
    "esri/core/urlUtils",
    "esri/geometry/support/webMercatorUtils",
	"esri/geometry/Extent",
	"esri/tasks/support/Query",
    "dojo/domReady!"
  ], function(
	  Map,
	  MapView,
	  VectorTileLayer,
	  FeatureLayer,
	  Geometry,
	  urlUtils,
	  webMercatorUtils,
	  Extent,
	  Query
  ) {
	  window['Geometry'] = Geometry;
	  window['Extent'] = Extent;
	  window['Query'] = Query;

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

    window['view'] = new MapView({
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
		outFields: ["*"],
		id: 'signs'
	});
	map.add(signLayer);

	view.on('click', function(evt) {
		handlePopup(evt);
		return false;
	});
});

function handlePopup(evt) {
	var latitude = evt.mapPoint.latitude,
		longitude = evt.mapPoint.longitude;
	
	var extent = getExtent(evt.mapPoint, 20);
	
	var query = new Query();
	query.geometry = extent;
	query.spatialRelationship = "intersects";
	
	view.whenLayerView(signLayer).then(function (signs) {
		signs.queryFeatures(query).then(function(results) {
			buildPopup(latitude, longitude, results);
		});
	});
}

function getExtent(point, tol) {
	var pixelWidth = view.extent.width / view.width;
	var toleranceInMapCoords = tol * pixelWidth;
	return new Geometry.Extent( point.x - toleranceInMapCoords,
		   point.y - toleranceInMapCoords,
		   point.x + toleranceInMapCoords,
		   point.y + toleranceInMapCoords,
		   point.spatialReference );
}

function buildPopup(lat, lon, signs) {
	console.log(lat, lon, signs);
	
	for (var i = 0; i < signs.length; i++) {
		var geo = signs[i].geometry,
			attr = signs[i].attributes,
			data = attr,
			name = '';
			signInfo = document.createElement("DIV");
		
		signInfo.className = "signInfo";
		signInfo.id = "sign" + attr.ID;
		
		data.latitude = geo.latitude;
		data.longitude = geo.longitude;
		
		name += data.MUTCDCode;
		name += ' at ' + data.Marker;
		name += ' on ' + data.STREETNAME.substring(data.STREETNAME.indexOf(',') + 1);
		name += ' ' + data.LaneDirection + ' ';
		
		
		
		signName = document.createElement("P");
		signName.innerHTML = name;
		
		copyButton = document.createElement("BUTTON");
		copyButton.innerHTML = "Copy";
		copyButton.onclick = function () {
			copy(JSON.stringify(data));
			return false;
		}
		
		signInfo.append(signName);
		signInfo.append(copyButton);
		
		document.getElementById('info').append(signInfo);
	}
}
