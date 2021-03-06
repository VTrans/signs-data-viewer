var signLayer; //global namespace to be more accessible to UI-driven post-load events.

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function mapillaryLink(){
    var data = document.getElementsByClassName('mapillary')[0].data || view.center,
        lat = data.latitude,
        lon = data.longitude;

    // url https://www.mapillary.com/app/?username=vtrans_row&lat=44&lng=-72&z=7.5
    var mapillarypre = 'https://www.mapillary.com/app/?username=vtrans_row&lat='
    var mapillary2nd = '&lng='
    var mapillary3rd = '&z='
    var mapillarySigns = '&signs=true'

    var mapillaryURL = mapillarypre + lat + mapillary2nd + lon + mapillary3rd + '17' + mapillarySigns
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
    "esri/WebMap",
    "esri/Graphic",
    "esri/widgets/BasemapToggle",
    "esri/Basemap",
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
        Query,
        WebMap,
        Graphic,
        BasemapToggle,
        Basemap
) {
      window['Geometry'] = Geometry;
      window['Extent'] = Extent;
      window['Query'] = Query;
      window['Graphic'] = Graphic;

    var lon = -72.6
    var lat = 44
    var zoom = 8
    //if there are url params zoom to location
         var lon, lat, zoom;
         var urlObject = urlUtils.urlToObject(document.location.href);
                 // for dev ?lon=-72.683117&lat=44.296882&zoomLevel=18
        if(urlObject.query && urlObject.query.lon && urlObject.query.lat && urlObject.query.zoomLevel){
          lon = parseFloat(urlObject.query.lon);
          lat = parseFloat(urlObject.query.lat);
          zoom = parseInt(urlObject.query.zoomLevel);
        }
	var VCGIBasemap = new Basemap({
        title: "VCGI Basemap",
        id: "VCGIBasemap",
        portalItem: {
            id: "a2a876693c324770bcb1666cfce1496c" 
        } 
    });
	
    map = new Map({ 
        basemap: VCGIBasemap
    }); 

    window['view'] = new MapView({
      container: "map",
      map: map,
      center: [lon,lat],
      zoom: zoom
    });
    
    
    
    window['basemapToggle'] = new BasemapToggle({
        view: view,  // The view that provides access to the map's "streets" basemap
        nextBasemap: "streets" // Allows for toggling to the "hybrid" basemap
    });

    window['pointMarker'] = {
        type: "simple-marker",
        size: 6,
        color: [255, 255, 0, 1]
    };

    var pointGeometry = {
      type: "point",
      longitude: lon,
      latitude: lat
    }

    var pointGraphic = new Graphic({
      geometry: pointGeometry,
      symbol: pointMarker
    });

    view.graphics.add(pointGraphic);

    signLayer = new FeatureLayer("https://maps.vtrans.vermont.gov/arcgis/rest/services/AMP/Sign_Symbols/FeatureServer/0", {
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
    drawClickPoint(lat, lon);
    var coordinates = {"latitude": lat, "longitude":lon};

    document.getElementsByClassName('mapillary')[0].data = coordinates;
    document.getElementsByClassName('coordinateCopier')[0].data = coordinates;

    document.getElementsByClassName('coordinates')[0].innerHTML = Math.round(lat*100000)/100000 + ', ' + Math.round(lon*100000)/100000;

    //clean up old .signInfos
    var signInfos = document.getElementsByClassName('signInfo');

    while(signInfos[0]) {
        signInfos[0].parentNode.removeChild(signInfos[0]);
    }
    //build new signinfos

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
        copyButton.data = JSON.stringify(data);
        copyButton.onclick = function() {
            copy(this.data);
        };

        signInfo.append(signName);
        signName.append(copyButton);

        document.getElementById('info').append(signInfo);
    }
}

function drawClickPoint(lat, lon) {
    view.graphics.removeAll();
    
    view.graphics.add(new Graphic({
        geometry: {
            type: "point",
            longitude: lon,
            latitude: lat 
        },
        symbol: pointMarker
    }));
}

function copyCoordinates() {
    var data = document.getElementsByClassName('coordinateCopier')[0].data || view.center,
        lat = data.latitude,
        lon = data.longitude;

        coordinates = {"latitude": lat, "longitude":lon};

    copy(JSON.stringify(coordinates));
}


function copy(target) {
    // https://dzone.com/articles/cross-browser-javascript-copy-and-paste
    var textArea = document.createElement('textarea');
    textArea.setAttribute
        ('style','width:1px;border:0;opacity:0;');
    document.body.appendChild(textArea);
    textArea.value = target;
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
}
