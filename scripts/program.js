    var lat;
    var lon;
    var type;
    var length;
    var i;
    var list = [];
    var resultsList;

    $(document).ready(function () {
        $('#SubmitBtn').click(function () {

            $.mobile.changePage("#Results");
            $.mobile.showPageLoadingMsg();

            return false;
        });
    });

    $('#index').live('pagehide', function (event) {
        $.mobile.showPageLoadingMsg();
        $("#List").empty();
        go();
    });

    $('#details').live('pagebeforeshow', function (event) {

        $('#title').text("");
        $('#summary').html("")

        fillDetailsView();
    });

    function fillDetailsView() {
        var id = localStorage.id;
        $('#title').text(resultsList[id].title);
        if (resultsList[id].thumbnailImg) {
            $('#summary').html("<img class='thumb2 left' src='" + resultsList[id].thumbnailImg + "' />")
        }
        $('#summary').append(resultsList[id].summary);
        $('#directions').attr('href', 'http://maps.google.com/?saddr=' + lat + ',' + lon + '&daddr=' + resultsList[id].lat + ',' + resultsList[id].lng);
        $('#article').attr('href', 'http://'+resultsList[id].wikipediaUrl);
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

    var url = 'http://api.geonames.org/findNearbyWikipediaJSON?lat='+lat+'&lng='+lon+'&maxRows='+25+'&radius='+($('#slider').val())+'&username=markshort';

    $.ajax({
        url: url,
        dataType: "json",
        success: function (data) {
            buildUpList(data.geonames);
        },
        fail: function (error) {
        }
    });
}

function buildUpList(list) {

    resultsList = list;

    if (list.length > 0) {

        list.sort(compare);
        var src;

        for (var i = 0; i < list.length; i++) {
            
            if (list[i].thumbnailImg) {
                src = list[i].thumbnailImg;
            }
            else {
                if (list[i].type == 'landmark') {
                     src = "images/placeholder.jpg";
                }
                else if(list[i].type == 'river' || list[i].type == 'waterbody' || list[i].type == 'mountain') {
                     src = "images/questionMark.jpg";
                }
                else{
                    src = "images/placeholder.jpg";
                }   
            }
            $('#List').append('<li><a target="_blank" class="listlink" id=' + i + '><img class="thumb" src="'+src+'" /><h3>' + list[i].title + '</h3><p>' + roundNumber(parseFloat(list[i].distance), 2) + 'km</p></a><a target="_blank" href=http://maps.google.com/?saddr=' + lat + ',' + lon + '&daddr=' + list[i].lat + ',' + list[i].lng + ' data-rel="dialog" data-transition="slideup">Map</a></li>');
        }
    }
    else {

        $('#List').append('<li class="divider" data-role="list-divider">Sorry, there were wiki articles for this query, try widening your catchment area or selecting a different category.</li>');
    }

    $('#List').listview('refresh');

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

function firstSentence(str) {

    var array = str.split(/^(.*?)[.?!]\s/);

    if (array[0].length > 1) {
        return array[0];
    }
    else if (array[1].length > 1) {
        return array[1];
    }
    else return "";
}

