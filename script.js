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

  // Mapping
  mapboxgl.accessToken =
    "pk.eyJ1IjoiaGVndWFuZWx2aXMiLCJhIjoiY2xnb25mZXI2MGo2NjNua2NyY2UwZWZsNSJ9.In4gfheRxQlTYDAc9g0JiA";

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/dark-v11",
    center: [139.78, 35.5895],
    zoom: 8,
  });

  d3.csv("data/municipal_avg_price.csv").then(priceData => {
    const prices = priceData.map(d => +d.AveragePricePerSQM);
    const priceMap = {};

    priceData.forEach(d => {
      priceMap[d.JCODE] = d;
    });

    const custom_color_scale = [
      "#ffe0cc",
      "#ffc299",
      "#ffa366",
      "#ff8533",
      "#ff7519",
      "#cc5200",
      "#993d00",
      "#662900",
      "#331400",
    ];

    const colorScale = d3
      .scaleQuantile()
      .domain(prices)
      .range(custom_color_scale);

    const stops = colorScale
      .quantiles()
      .map((q, i) => [q, custom_color_scale[i]]);

    const quantiles = [
      Math.min(...prices),
      ...colorScale.quantiles(),
      Math.max(...prices),
    ];

    const legend = document.getElementById("map-legend");

    const title = document.createElement("h6");
    title.textContent = "Avg Price per SQM";
    legend.appendChild(title);

    custom_color_scale.forEach((color, i) => {
      const legendItem = document.createElement("div");
      legendItem.className = "legend-item";

      const legendColor = document.createElement("div");
      legendColor.className = "legend-color";
      legendColor.style.backgroundColor = color;
      legendItem.appendChild(legendColor);

      const min =
        i === 0
          ? parseInt(quantiles[i]).toLocaleString()
          : parseInt(quantiles[i] + 1).toLocaleString();
      const max = parseInt(quantiles[i + 1]).toLocaleString();
      const legendText = document.createTextNode(`${min} - ${max} yen`);
      legendItem.appendChild(legendText);

      legend.appendChild(legendItem);
    });

    d3.json("data/GTA_Municipalities.geojson").then(geoData => {
      geoData.features = geoData.features.filter(
        feature => priceMap[feature.properties.JCODE]
      );

      geoData.features.forEach(feature => {
        const jcode = feature.properties.JCODE;
        if (priceMap[jcode]) {
          feature.properties.AveragePricePerSQM =
            +priceMap[jcode].AveragePricePerSQM;
          feature.properties.Prefecture = priceMap[jcode].Prefecture;
          feature.properties.Municipality = priceMap[jcode].Municipality;
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

        map.on("mousemove", "municipalities-layer", function (e) {
          const feature = e.features[0];

          const prefecture = feature.properties.Prefecture;
          const municipality = feature.properties.Municipality;
          const averagePrice = feature.properties.AveragePricePerSQM;
          const formattedAveragePrice = averagePrice.toLocaleString();

          const tooltipContent = `
            <h6>${prefecture}</h6>
            <span>Municipality: ${municipality}</span>
            <br/>
            <span>Avg Price per SQM: ${formattedAveragePrice} yen</span>
          `;

          const tooltip = document.getElementById("map-tooltip");
          tooltip.innerHTML = tooltipContent;

          let left = e.originalEvent.clientX;
          let top = e.originalEvent.clientY;

          tooltip.style.left = left + "px";
          tooltip.style.top = top + "px";
          tooltip.style.visibility = "visible";
        });

        map.on("mouseleave", "municipalities-layer", function () {
          const tooltip = document.getElementById("map-tooltip");
          tooltip.innerHTML = "";
          tooltip.style.visibility = "hidden";
        });
      });
    });
  });
});
