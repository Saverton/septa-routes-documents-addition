"use strict";

const fs = require("fs");

const FREQUENT_BUS_ROUTE_IDS = [
  "3",
  "6",
  "17",
  "18",
  "21",
  "23",
  "33",
  "45",
  "46",
  "47",
  "48",
  "52",
  "56",
  "58",
  "60",
  "66",
  "70",
  "79",
  "108",
  "113",
  "G",
  "L",
  "R",
];

const NEW_TO_OLD_ROUTE_IDS = {
  T1: "10",
  "T1 Bus": "10",
  T2: "34",
  "T2 Bus": "34",
  T3: "13",
  T3B: "13",
  "T3 Bus": "13",
  T4: "11",
  "T4 Bus": "11",
  T5: "36",
  "T5 Bus": "36",
  G1: "15",
  D1: "101",
  D2: "102",
  L1: "MFL",
  B1: "BSL",
  B2: "BSL",
  B3: "BSL",
  M1: "NHSL",
};

const GLN_ROUTE_IDS = ["WAR", "WTR", "LAN"];
const FERN_ROUTE_IDS = ["WAR", "WTR", "LAN"];
const PENN_ROUTE_IDS = ["WIL", "MED", "AIR"];

async function main() {
  const routesResponse = await fetch(
    "https://s3.amazonaws.com/flat-api.septa.org/metro/routes.json"
  );
  const routesList = await routesResponse.json();

  for (let route of routesList) {
    if (FREQUENT_BUS_ROUTE_IDS.includes(route.route_id)) {
      route.is_frequent_bus = true;
    } else {
      route.is_frequent_bus = false;
    }

    route.documents = [];

    // schedule pdf
    const oldRouteId = NEW_TO_OLD_ROUTE_IDS[route.route_id] || route.route_id;
    route.documents.push({
      type: "schedule",
      title: `${route.route_type === 3 ? "Bus " : ""}${
        route.route_short_name
      } Schedule (PDF)`,
      url: `https://s3.amazonaws.com/schedules.septa.org/current/${oldRouteId}.pdf`,
      linkLabel: "Open Schedule PDF",
    });

    // map pdf
    route.documents.push({
      type: "map",
      title: getMapPdfTitle(route),
      url: getMapPdfUrl(route),
      linkLabel: "Open Map PDF",
    });

    // GLN schedule PDF
    if (GLN_ROUTE_IDS.includes(route.route_id)) {
      route.documents.push({
        type: "schedule",
        title: "Glenside Combined Schedule (PDF)",
        url: "https://s3.amazonaws.com/schedules.septa.org/current/GLN.pdf",
        linkLabel: "Open Schedule PDF",
      });
    }

    // FERN schedule PDF
    if (FERN_ROUTE_IDS.includes(route.route_id)) {
      route.documents.push({
        type: "schedule",
        title: "Fern Rock Combined Schedule (PDF)",
        url: "https://s3.amazonaws.com/schedules.septa.org/current/FERN.pdf",
        linkLabel: "Open Schedule PDF",
      });
    }

    // PENN schedule PDF
    if (PENN_ROUTE_IDS.includes(route.route_id)) {
      route.documents.push({
        type: "schedule",
        title: "Penn Medicine Combined Schedule (PDF)",
        url: "https://s3.amazonaws.com/schedules.septa.org/current/PENN.pdf",
        linkLabel: "Open Schedule PDF",
      });
    }
  }

  saveToRoutesJson(routesList);
}

function getMapPdfTitle(route) {
  if (route.route_type === 2) {
    return "Regional Rail System Map (PDF)";
  } else {
    switch (route.route_id) {
      case "T1":
      case "T2":
      case "T3":
      case "T3B":
      case "T3 Bus":
      case "T4":
      case "T4 Bus":
      case "T5":
      case "T5 Bus":
      case "G1":
        return "Trolley Lines Map (PDF)";
      case "D1":
      case "D2":
        return "Route 101 & 102 Map (PDF)";
      case "B1":
      case "B2":
      case "B3":
        return "Broad Street Line Map (PDF)";
      case "L1":
        return "Market-Frankford Line Map (PDF)";
      case "M1":
        return "Norristown High Speed Line Map (PDF)";
      default:
        return `${route.route_type === 3 ? "Bus " : ""}${
          route.route_short_name
        } Map (PDF)`;
    }
  }
}

function getMapPdfUrl(route) {
  // if routeId matches one of these routes, point to the appropriate map
  // if no match, default to the global route map (catches buses)
  if (route.route_type === 2) {
    return "https://www5.septa.org/wp-content/uploads/travel/line-map-rr.pdf";
  } else {
    switch (route.route_id) {
      case "T1":
      case "T2":
      case "T3":
      case "T3B":
      case "T3 Bus":
      case "T4":
      case "T4 Bus":
      case "T5":
      case "T5 Bus":
      case "G1":
        return `https://wwww.septa.org/wp-content/uploads/travel/line-map-trolley.pdf`;
      case "D1":
      case "D2":
        return `https://wwww.septa.org/wp-content/uploads/travel/line-map-101-102.pdf`;
      case "B1":
      case "B2":
      case "B3":
        return `https://wwww.septa.org/wp-content/uploads/travel/line-map-bsl.pdf`;
      case "L1":
        return `https://wwww.septa.org/wp-content/uploads/travel/line-map-mfl.pdf`;
      case "M1":
        return `https://wwww.septa.org/wp-content/uploads/travel/line-map-nhsl.pdf`;
      default:
        return `https://www5.septa.org/wp-content/uploads/route/maps/${route.route_id}.pdf`;
    }
  }
}

function saveToRoutesJson(routesList) {
  const json = JSON.stringify(routesList);
  const cwd = process.cwd();

  fs.writeFileSync(`${cwd}/routes.json`, json, function (err) {
    console.error(err);
    process.exit(1);
  });
}

main();
