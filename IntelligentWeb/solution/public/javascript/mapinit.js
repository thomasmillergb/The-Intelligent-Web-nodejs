$(function() {
    if (window.location.hash != "") activeTab(window.location.hash.substring(1));
    $("form.map_init").each(function() {
        var currentform = $(this);
        var map;

        function initialize() {
            var mapOptions = {
                center: {
                    lat: 53.381796,
                    lng: -1.480719
                },
                scrollwheel: false,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoom: 14
            };
            var markers = [];
            map = new google.maps.Map(currentform.find('.search-map-canvas').get(0), mapOptions);
            // Create the search box and link it to the UI element.
            var input_wrapper = currentform.find('.maps_input_wrapper').get(0);
            var input = currentform.find('.maps_input').get(0);
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(input_wrapper);
            var searchBox = new google.maps.places.SearchBox(input);
            google.maps.event.addListener(searchBox, 'places_changed', function() {
                var places = searchBox.getPlaces();
                if (places.length == 0) {
                    return;
                }
                for (var i = 0, marker; marker = markers[i]; i++) {
                    marker.setMap(null);
                }
                // For each place, get the icon, place name, and location.
                markers = [];
                var bounds = new google.maps.LatLngBounds();
                for (var i = 0, place; place = places[i]; i++) {
                    var image = {
                        url: place.icon,
                        size: new google.maps.Size(71, 71),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(17, 34),
                        scaledSize: new google.maps.Size(25, 25)
                    };
                    var marker = new google.maps.Marker({
                        map: map,
                        icon: image,
                        title: place.name,
                        position: place.geometry.location
                    });
                    markers.push(marker);
                    bounds.extend(place.geometry.location);
                    setLatLong();
                }
                map.fitBounds(bounds);
            });
            // Bias the SearchBox results towards places that are within the bounds of the
            // current map's viewport.
            google.maps.event.addListener(map, 'bounds_changed', function() {
                var bounds = map.getBounds();
                searchBox.setBounds(bounds);
                setLatLong();
            });
            $(".nav_button").on("mouseup", function() {
                toggleAlternatePanel(false);
                google.maps.event.trigger(map, 'resize');
            });
            google.maps.event.addListener(map, 'dragend', function() {
                setLatLong();
            });

            function setLatLong() {
                templocation = map.getCenter();
                currentform.find(".lat").get(0).value = parseFloat(templocation.A.toFixed(6));
                currentform.find(".long").get(0).value = parseFloat(templocation.F.toFixed(6));
                Draw_Circle();
            }
            setLatLong();
        }
        var draw_circle = null;
        var lastm;
        var lastlat;
        var lastlong;

        function Draw_Circle() {
            m = parseFloat(currentform.find(".radius").val() * 1609.34);
            latitude = parseFloat(currentform.find(".lat").val());
            longitude = parseFloat(currentform.find(".long").val());
            if (m == lastm && latitude == lastlat && longitude == lastlong) return;
            if (draw_circle != null) {
                draw_circle.setMap(null);
            }
            draw_circle = new google.maps.Circle({
                center: new google.maps.LatLng(latitude, longitude),
                radius: m,
                strokeColor: "#FF0000",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#FF0000",
                fillOpacity: 0.35,
                map: map
            });
        }
        currentform.find(".radius, .lat, .long").on("keyup", function() {
            Draw_Circle();
            map.setCenter(new google.maps.LatLng(parseFloat(currentform.find(".lat").val()), parseFloat(currentform.find(".long").val())));
        });
        google.maps.event.addDomListener(window, 'load', initialize);
    });
});