var map;
var markers = [];
var data;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 30, lng: -100 },
        zoom: 4,
        styles: [{
            featureType: 'all',
            elementType: 'all',
            stylers: [{ visibility: 'on' }]
        }, {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ visibility: 'on' }, { color: '#fcfcfc' }]
        }, {
            featureType: 'water',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
        }, {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ visibility: 'on' }, { hue: '#5f94ff' }, { lightness: 0 }]
        }]
    });
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(document.getElementById("title"));
    map.controls[google.maps.ControlPosition.LEFT_CENTER].push(document.getElementById("legend"));
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(document.getElementById("data"));

    var asyncData = getRentAsync();
    asyncData.then(d => { data = d; populateMap(); });
}

function getRentAsync() {
    return fetch("http://localhost:5000/rent")
        .then(function (response) {
            return response.json();
        })
        .catch(error => console.error('Error:', error));
}

function populateMap() {
    document.getElementById("national").innerHTML = '$' + data.national.one_br_rent;

    for (var i = 0; i < data.cities.length; i++) {
        var city = data.cities[i];

        city.state = getState(city.location);
        createMarker(city);
    }

    //Create marker for Washington D.C.
    var DC = data.states.filter(function (state) { return (state.location == "District of Columbia"); })[0];
    createMarker(DC);
}

function createMarker(city) {
    var icon;
    var color;
    var rent = city.one_br_rent;
    switch (true) {
        case (rent <= 599):
            icon = 'img/pink.png';
            color = 'pink';
            break;
        case (600 <= rent && rent <= 899):
            icon = 'img/red.png';
            color = 'red';
            break;
        case (900 <= rent && rent <= 1199):
            icon = 'img/orange.png';
            color = 'orange';
            break;
        case (1200 <= rent && rent <= 1499):
            icon = 'img/yellow.png';
            color = 'yellow';
            break;
        case (1500 <= rent && rent <= 1999):
            icon = 'img/lightgreen.png';
            color = 'lightgreen';
            break;
        case (2000 <= rent):
            icon = 'img/green.png';
            color = 'green';
            break;
        default:
            icon = 'img/black.png';
            color = 'black';
            break;
    }

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(city.coordinates.lat, city.coordinates.long),
        map: map,
        icon: icon,
        color: color
    });

    var infowindow = new google.maps.InfoWindow({
        content: city.location +
            '<br/>' +
            '$' + city.one_br_rent
    })

    marker.addListener('mouseover', function () {
        infowindow.open(map, marker);
    });
    marker.addListener('mouseout', function () {
        infowindow.close();
    });
    marker.addListener('click', function () {
        updateDataWindow(city);
    });
    markers.push(marker);
}

function toggleMarkers(color) {
    var box = document.getElementById(color);

    for (var i = 0; i < markers.length; i++) {
        if (markers[i].color == color) {
            var visible = box.checked ? map : null;
            markers[i].setMap(visible);
        }
    }
}

function updateDataWindow(city) {
    var dataHtml = document.getElementById("data");
    var locationHtml = document.getElementById("location");
    var cityHtml = document.getElementById("city");
    var stateHtml = document.getElementById("state");
    var state = getState(city.location);

    locationHtml.innerHTML = city.location;
    cityHtml.innerHTML = "$" + city.one_br_rent;
    if (state) {
        stateHtml.innerHTML = state.location + ": $" + state.one_br_rent; 
    }
    dataHtml.style.display = "block";
}

function getState(location) {
    var abbr = location[location.length - 2] + location[location.length - 1];
    var dict = {
        "AL": "Alabama",
        "AK": "Alaska",
        "AZ": "Arizona",
        "AR": "Arkansas",
        "CA": "California",
        "CO": "Colorado",
        "CT": "Connecticut",
        "DE": "Delaware",
        "FL": "Florida",
        "GA": "Georgia",
        "HI": "Hawaii",
        "ID": "Idaho",
        "IL": "Illinois",
        "IN": "Indiana",
        "IA": "Iowa",
        "KS": "Kansas",
        "KY": "Kentucky",
        "LA": "Louisiana",
        "ME": "Maine",
        "MD": "Maryland",
        "MA": "Massachusetts",
        "MI": "Michigan",
        "MN": "Minnesota",
        "MS": "Mississippi",
        "MO": "Missouri",
        "MT": "Montana",
        "NE": "Nebraska",
        "NV": "Nevada",
        "NH": "New Hampshire",
        "NJ": "New Jersey",
        "NM": "New Mexico",
        "NY": "New York",
        "NC": "North Carolina",
        "ND": "North Dakota",
        "OH": "Ohio",
        "OK": "Oklahoma",
        "OR": "Oregon",
        "PA": "Pennsylvania",
        "RI": "Rhode Island",
        "SC": "South Carolina",
        "SD": "South Dakota",
        "TN": "Tennessee",
        "TX": "Texas",
        "UT": "Utah",
        "VT": "Vermont",
        "VA": "Virginia",
        "WA": "Washington",
        "WV": "West Virginia",
        "WI": "Wisconsin",
        "WY": "Wyoming"
    };

    if (!dict[abbr]) {
        return;
    }

    var state = data.states.filter(function (state) { return state.location == dict[abbr] })[0];
    return state;
}