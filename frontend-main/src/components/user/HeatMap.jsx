import React, { useEffect, useState } from "react";
import HeatMap from "@uiw/react-heat-map";

// Function to generate random activity
const generateActivityData = (startDate, endDate) => {
  const data = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    // Generate counts with weight towards 0 or low values for a realistic graph
    const rand = Math.random();
    let count = 0;
    if (rand > 0.8) count = Math.floor(Math.random() * 8) + 1; // 1-8
    else if (rand > 0.92) count = Math.floor(Math.random() * 15) + 8; // 8-23
    else if (rand > 0.98) count = Math.floor(Math.random() * 25) + 20; // 20-45

    data.push({
      date: currentDate.toISOString().split("T")[0],
      count: count,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return data;
};

// Map counts to GitHub's specific green shades
const getPanelColors = (maxCount) => {
  const colors = {
    0: "#161b22" // default empty grid color
  };
  for (let i = 1; i <= maxCount; i++) {
    if (i <= 4) {
      colors[i] = "#0e4429"; // Level 1
    } else if (i <= 10) {
      colors[i] = "#006d32"; // Level 2
    } else if (i <= 20) {
      colors[i] = "#26a641"; // Level 3
    } else {
      colors[i] = "#39d353"; // Level 4
    }
  }
  return colors;
};

const initHeatMapData = () => {
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  const day = oneYearAgo.getDay();
  if (day !== 0) {
    oneYearAgo.setDate(oneYearAgo.getDate() - day);
  }

  const startStr = oneYearAgo.toISOString().split("T")[0];
  const endStr = today.toISOString().split("T")[0];
  const data = generateActivityData(oneYearAgo, today);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return {
    startStr,
    endStr,
    data,
    panelColors: getPanelColors(maxCount),
  };
};

const HeatMapProfile = () => {
  const [mapData] = useState(initHeatMapData);

  return (
    <div className="contribution-graph-card">
      <div className="graph-header">
        <span className="graph-contributions-count">124 contributions in the last year</span>
      </div>
      
      <div className="heatmap-scroll-container">
        <HeatMap
          className="HeatMapProfile"
          style={{ color: "#8b949e", backgroundColor: "transparent" }}
          value={mapData.data}
          weekLabels={["Sun", "", "Tue", "", "Thu", "", "Sat"]}
          startDate={new Date(mapData.startStr)}
          endDate={new Date(mapData.endStr)}
          rectSize={10}
          space={2}
          rectProps={{
            rx: 2,
          }}
          panelColors={mapData.panelColors}
        />
      </div>
      
      <div className="graph-footer">
        <a href="#" className="graph-footer-link">How people build software together</a>
        <div className="graph-legend">
          <span>Less</span>
          <span className="legend-box" style={{ backgroundColor: "#161b22" }}></span>
          <span className="legend-box" style={{ backgroundColor: "#0e4429" }}></span>
          <span className="legend-box" style={{ backgroundColor: "#006d32" }}></span>
          <span className="legend-box" style={{ backgroundColor: "#26a641" }}></span>
          <span className="legend-box" style={{ backgroundColor: "#39d353" }}></span>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default HeatMapProfile;
