document.addEventListener("DOMContentLoaded", event => {
  console.log("DOM fully loaded and parsed");

  document
    .getElementById("colab-btn")
    .addEventListener("mouseenter", function () {
      document.getElementById("tooltip-text").style.visibility = "visible";
    });

  document
    .getElementById("colab-btn")
    .addEventListener("mouseleave", function () {
      document.getElementById("tooltip-text").style.visibility = "hidden";
    });

  mapboxgl.accessToken =
    "pk.eyJ1IjoiaGVndWFuZWx2aXMiLCJhIjoiY2xnb25mZXI2MGo2NjNua2NyY2UwZWZsNSJ9.In4gfheRxQlTYDAc9g0JiA";

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/dark-v10",
    center: [139.78, 35.5895],
    zoom: 8,
  });

  // Mapping
  d3.csv("data/municipal_avg_price.csv").then(priceData => {
    const maxPrice = d3.max(priceData, d => +d.AveragePricePerSQM);
    const prices = priceData.map(d => +d.AveragePricePerSQM);
    const priceMap = {};

    priceData.forEach(d => {
      priceMap[d.JCODE] = d;
    });

    // Define a color scale for 20% buckets
    const custom_color_scale = [
      "#f2f0f7",
      "#cbc9e2",
      "#9e9ac8",
      "#756bb1",
      "#54278f",
    ];
    const colorScale = d3
      .scaleQuantile()
      .domain(prices)
      .range(custom_color_scale);

    const stops = colorScale
      .quantiles()
      .map((q, i) => [q, custom_color_scale[i]]);

    d3.json("data/GTA_Municipalities.geojson").then(geoData => {
      // Filter GeoJSON features based on CSV data
      geoData.features = geoData.features.filter(
        feature => priceMap[feature.properties.JCODE]
      );

      // Add price data to GeoJSON features
      geoData.features.forEach(feature => {
        const jcode = feature.properties.JCODE;
        if (priceMap[jcode]) {
          feature.properties.AveragePricePerSQM =
            +priceMap[jcode].AveragePricePerSQM;
        }
      });

      map.on("load", function () {
        map.addSource("municipalities", {
          type: "geojson",
          data: geoData,
        });

        map.addLayer({
          id: "municipalities-layer",
          type: "fill",
          source: "municipalities",
          layout: {},
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "AveragePricePerSQM"],
              ...stops.flat(),
            ],
            "fill-opacity": 0.5,
          },
        });
      });
    });
  });
});
