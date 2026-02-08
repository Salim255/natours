export const displayMap = (location) => {
  
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2FsaW0yMyIsImEiOiJja3VwOW9ybWExYXU0Mm50aGM4M3ZyY2hwIn0.J7ideEPvsBHJZMkVePAv4A';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/salim23/ckupi8t0z0i7x18qvj4y6xm88',
    scrollZoom: false,
    // center: [3.057256, 50.62925],
    // zoom: 10,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds(); //

  locations.forEach((loc) => {
    //Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //Add popup
    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description} </p>`)
      .addTo(map);
    //Extebd map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  //fitBounds is the  fuction who excute the zooming and ...
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 50,
      left: 100,
      right: 100,
    },
  });


}
