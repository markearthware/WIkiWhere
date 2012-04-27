var lat;
var lon
var resultsList;
var desLat;
var desLon;
var desTitle;
var placeName;
var distance;
var locationStr;

$('#index').live('pagecreate', function (event) {
    $('#SubmitBtn').click(function () {
        lat = "";
        lon = "";
        if (navigator.network) {
            if (navigator.network.connection.type == "none") {
                navigator.notification.alert("Sorry, you are not connected to WiFi or 3G. Please connect and then try again", function () { }, "Warning", "OK");
            }
            else {
                go();
                $.mobile.changePage("#Results");
                $.mobile.showPageLoadingMsg();
            }
        } else {
            go();
            $.mobile.changePage("#Results");
            $.mobile.showPageLoadingMsg();
        }
        return false;
    });
});

$('#index').live('pagebeforeshow', function (event) {
    $("#List").empty();
});

$('#details').live('pagebeforeshow', function (event) {
    $('#title').text("");
    $('#summary').html("")
    fillDetailsView();
    $('#details-header').text(desTitle);
});

$('#details').live('pagecreate', function (event) {
    $('.ext').click(function () {
        if (navigator.network) {
            if (navigator.network.connection.type == "none") {
                navigator.notification.alert("Sorry, you are not connected to WiFi or 3G. Please connect and then try again", function () { }, "Warning", "OK");
                return false;
            }
            else {
                return true;
            }
        } else {
            return true;
        }
    });
});


$('#map').live('pageshow', function (event) {
    $('#header').text(desTitle);
    initialize(lat, lon)
});

$('#directions').live('pagebeforeshow', function (event) {
    $('#directions-list').empty();
    $('#directions-h4').text("Directions to " + desTitle);
    getDirections(lat, lon);
});

function getDirections(lat, lon) {
    var directionsService = new google.maps.DirectionsService();
    var latlng = new google.maps.LatLng(lat, lon);
    var desLatlng = new google.maps.LatLng(desLat, desLon);

    var directionsRequest =
    {
        origin: latlng,
        destination: desLatlng,
        travelMode: google.maps.DirectionsTravelMode.DRIVING
    };

    directionsService.route(directionsRequest, function (result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            $('#directions-list').append('<li>Start</li>');
            $(result.routes[0].legs).each(function () {
                $(this.steps).each(function () {
                    $('#directions-list').append('<li>' + this.instructions + '</li>');
                });
            });
            $('#directions-list').append('<li>Finish</li>');
            $('#directions-list').listview('refresh');
        }
    });
}

function initialize(lat, lon) {

    var directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer(); 
    var latlng = new google.maps.LatLng(lat, lon);
    var desLatlng = new google.maps.LatLng(desLat, desLon);
    
    var myOptions = {
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    
    directionsDisplay.setMap(map);

    var directionsRequest =
    {
       origin: latlng,
       destination: desLatlng,
       travelMode: google.maps.DirectionsTravelMode.DRIVING
    };

    directionsService.route(directionsRequest, function(result,status){
        if (status == google.maps.DirectionsStatus.OK)
        {
        directionsDisplay.setDirections(result);   // draw the routes
        }
    });
}

function fillDetailsView() {
    var id = localStorage.id;

    desLat = resultsList[id].lat;
    desLon = resultsList[id].lng;
    desTitle = resultsList[id].title;

    $('#title').text(roundNumber(resultsList[id].distance, 2) + "km away");
    if (resultsList[id].thumbnailImg) {
        $('#summary').html("<img class='thumb2 left' src='" + resultsList[id].thumbnailImg + "' />")
    }
    $('#summary').append(resultsList[id].summary);
    $('#article').attr('href', 'http://' + resultsList[id].wikipediaUrl);
}

function go() {
    if (!!navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {

            lat = position.coords.latitude;
            lon = position.coords.longitude;
            callService();

        }, function () {
        });
    }
    else {
        navigator.notification.alert("Sorry, WikiWhere won't work if you do not allow the app to track your physical location", null, "Alert", "Alert");
    }
}


function callService() {
    distance = $('#slider').val();
    var url = 'http://api.geonames.org/findNearbyWikipediaJSON?lat=' + lat + '&lng=' + lon + '&maxRows=' + 50 + '&radius=' + distance + '&username=markshort';
    var geocodeUrl = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat +','+ lon +'&sensor=true';

    $.ajax({
        url: url,
        dataType: "json",
        success: function (data) {
            buildUpList(data.geonames);
            var geocoder = new google.maps.Geocoder();
            var latlng = new google.maps.LatLng(lat, lon);
            if (geocoder) {
                geocoder.geocode({ 'latLng': latlng }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        var formattedAddr = results[0].formatted_address;
                        var split = formattedAddr.split(",");
                        locationStr = split[0] + ", " + split[1];
                        $('#locationStr').text(locationStr);
                    }
                });
            }
        },
        fail: function (error) {
        }
    });
}



function buildUpList(list) {

    resultsList = list;

    if (list.length > 0) {

        $('#List').append('<li class="divider aligncenter link-blue" data-role="list-divider"><span id="locationStr"></span><br/>Points of interest less than ' + distance + ' km away:</li>');

        list.sort(compare);
        var src;

        for (var i = 0; i < list.length; i++) {

            if (list[i].thumbnailImg) {
                src = list[i].thumbnailImg;
            }
            else {
                src = "images/placeholder2.png";
            }
            $('#List').append('<li><a target="_blank" class="listlink" id=' + i + '><img height="50" width="50" class="thumb" src="' + src + '" /><h3>' + list[i].title + '</h3><p>' + roundNumber(parseFloat(list[i].distance), 2) + 'km away</p></a><a class="wikilink" target="_blank" href="http://' + list[i].wikipediaUrl + '">Wiki</a></li>');
        }
    }
    else {
        $('#List').append('<li class="divider aligncenter link-blue" data-role="list-divider">Sorry, there were no wiki articles for this query, try widening your catchment area.</li>');
    }

    $(".nodisplay").show();

    $('#List').listview('refresh');

    $('.wikilink').click(function () {
        if (navigator.network) {
            if (navigator.network.connection.type == "none") {
                navigator.notification.alert("Sorry, you are not connected to WiFi or 3G. Please connect and then try again", function () { }, "Warning", "OK");
                return false;
            }
            else {
                return true;
            }
        } else {
            return true;
        }
    });

    $('.listlink').click(function () {
        var id = $(this).attr("id");
        localStorage.id = id;
        $.mobile.changePage("#details");
    });

    $.mobile.hidePageLoadingMsg();
}


function compare(a, b) {
    return a.distance - b.distance;
}

function roundNumber(num, dec) {
    var result = Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
    return result;
}


