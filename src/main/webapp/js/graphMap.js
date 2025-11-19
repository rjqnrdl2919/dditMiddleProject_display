/**
 * adminsite 중앙 지도 그래프
 */
const svg = d3.select("#map");
const complaintLevels = ["#e0e0e0", "#00cc00", "#99ff33", "#ffff00", "#ff9933", "#ff0000"];
const urgentComplaintColor = "#771085"; // 긴급 민원 색상

const MAP_STATE = {
  projection: null,
  path: null,
  guData: null,
  dongData: null,
  urgentData: null,
  initialViewBox: "0 0 640 800",
  resizeObserver: null,
  resizeTimer: null
};

const MAP_CONFIG = {
  SIZE_RATIO: 0.98,
  TRANSITION_DURATION: 750,
  COLOR_TRANSITION_DURATION: 300,
  ZOOM_PADDING: 20,
  ZOOM_MARGIN: 40,
  GU_CODE_LENGTH: 5,
  DONG_CODE_LENGTH: 8
};

// 초기 설정 + 반응형 resize
document.addEventListener('DOMContentLoaded', function() {
	Promise.all([
	  d3.json("대전시 구역 WGS84.geojson"),
	  d3.json("대전시 읍면동 WGS84.geojson")
	]).then(([guJson, dongJson]) => {
		MAP_STATE.guData = guJson;
		MAP_STATE.dongData = dongJson;
		
	  setupMapSize();         // 초기 지도 크기 설정
	  setupResizeObserver();  // 리사이즈 대응
	
	  updateMap("recent");
	  drawGU();
	
	  d3.select("#backButton").on("click", () => {
	    svg.transition()
		.duration(MAP_CONFIG.TRANSITION_DURATION)
		.attr("viewBox", MAP_STATE.initialViewBox);
		
	    svg.selectAll("path.dong").remove();
	    svg.selectAll(".urgent-indicator").remove();
			
	    svg.selectAll("path.gu")
	    .style("display", "inline")
	    .style("fill", d => d.properties.hasUrgent ? urgentComplaintColor : complaintLevels[d.properties.complaintLevel]);
	
		svg.selectAll("path.gu")
		   .classed("disabled-gu", false)
		   .style("pointer-events", "auto");
		  	  	  
		svg.attr("data-current-code", null);  // 현재 선택 지역 초기화
	
	    document.getElementById("locationInfo").innerText = "대전광역시 전체";
	    d3.select("#backButton").style("display", "none");
	    loadDonutCategoryChart("", document.getElementById("timeRange").value);
		
		addUrgentIndicators();
	  });
	}).catch(error => {
	  console.error("지도 데이터 로드 실패:", error);
	  showMapError("지도를 불러올 수 없습니다.");
	});
});
/*function setupMapSize() {
  const rect = document.getElementById("map").getBoundingClientRect();
  const width = rect.width * MAP_CONFIG.SIZE_RATIO;
  const height = rect.height * MAP_CONFIG.SIZE_RATIO;  // 0.98도 상수로 변경

  MAP_STATE.initialViewBox = `0 0 ${width} ${height}`;
  svg.attr("viewBox", MAP_STATE.initialViewBox);

  MAP_STATE.projection = d3.geoMercator().fitSize([width, height], MAP_STATE.guData);
  MAP_STATE.path = d3.geoPath().projection(MAP_STATE.projection);
}*/

function setupMapSize() {
  const mapElement = document.getElementById("map");
  
  // null 체크 추가
  if (!mapElement) {
    console.error("Map element not found");
    return;
  }
  
  const rect = mapElement.getBoundingClientRect();
  
  // 유효한 크기인지 확인
  if (rect.width === 0 || rect.height === 0) {
    console.warn("Map element has no dimensions");
    return;
  }
  
  const width = rect.width * MAP_CONFIG.SIZE_RATIO;
  const height = rect.height * MAP_CONFIG.SIZE_RATIO;

  MAP_STATE.initialViewBox = `0 0 ${width} ${height}`;
  svg.attr("viewBox", MAP_STATE.initialViewBox);

  MAP_STATE.projection = d3.geoMercator().fitSize([width, height], MAP_STATE.guData);
  MAP_STATE.path = d3.geoPath().projection(MAP_STATE.projection);
}

function setupResizeObserver() {
  if (MAP_STATE.resizeObserver) {
    MAP_STATE.resizeObserver.disconnect();
  }
  
  MAP_STATE.resizeObserver = new ResizeObserver((entries) => {
    // entries 확인
    if (entries.length === 0) return;
    
    // 디바운싱을 위한 타이머
    clearTimeout(MAP_STATE.resizeTimer);
    MAP_STATE.resizeTimer = setTimeout(() => {
      setupMapSize();
      if (MAP_STATE.guData) { // 데이터가 로드된 경우에만 실행
        drawGU();
      }
    }, 100);
  });
  
  const mapWrapper = document.getElementById("mapWrapper");
  if (mapWrapper) {
    MAP_STATE.resizeObserver.observe(mapWrapper);
  }
}

/*function setupResizeObserver() {
  if (MAP_STATE.resizeObserver) {
    MAP_STATE.resizeObserver.disconnect();
  }
  
  MAP_STATE.resizeObserver = new ResizeObserver(() => {
    setupMapSize();
    drawGU();
  });
  MAP_STATE.resizeObserver.observe(document.getElementById("mapWrapper"));
}*/

function updatePathColors(selector, duration = 300) {
  svg.selectAll(selector)
    .transition()
    .duration(duration)
    .ease(d3.easeCubicInOut)
    .style("fill", d => {
		if(d.properties.hasUrgent){
			return urgentComplaintColor;
		}
		return complaintLevels[d.properties.complaintLevel];
	})
	.style("stroke", "#ffffff")
	.style("stroke-width", d => d.properties.hasUrgent ? "2px" : "1px");
}

function addUrgentIndicators() {
  // 기존 긴급 표시 제거
  svg.selectAll(".urgent-indicator").remove();
  
  const currentCode = svg.attr("data-current-code");
  let selector = "path.gu";
  
  if (currentCode && currentCode.length === MAP_CONFIG.GU_CODE_LENGTH) {
    selector = "path.dong";
  }
  
  // 긴급민원이 있는 지역에 깜빡이는 점 추가
  svg.selectAll(selector)
    .filter(d => d.properties.hasUrgent)
    .each(function(d) {
      const centroid = MAP_STATE.path.centroid(d);
      
      svg.append("circle")
        .attr("class", "urgent-indicator")
        .attr("cx", centroid[0])
        .attr("cy", centroid[1])
        .attr("r", 4)
        .style("fill", "#ffffff")
        .style("stroke", urgentComplaintColor)
        .style("stroke-width", "2px")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1)
        .transition()
        .duration(1000)
        .style("opacity", 0.3)
        .on("end", function repeat() {
          d3.select(this)
            .transition()
            .duration(1000)
            .style("opacity", 1)
            .transition()
            .duration(1000)
            .style("opacity", 0.3)
            .on("end", repeat);
        });
    });
}

function drawGU() {
	const guPaths = 
		svg.selectAll("path.gu")
    	.data(MAP_STATE.guData.features)
		.join(
			enter => 
				enter.append("path")
				.attr("class", "gu")
				.attr("d", MAP_STATE.path)
				.style("display", d => {
					const currentCode = svg.attr("data-current-code");
					return !currentCode || currentCode.length !== 5 || d.properties.COL_ADM_SE === currentCode 
						? "inline" : "none";
				}).on("click", function (_, d) {
					const guCode = d.properties.COL_ADM_SE;
					const [[x0, y0], [x1, y1]] = MAP_STATE.path.bounds(d);
					svg.attr("data-current-code", guCode);
				  	svg.transition()
					.duration(MAP_CONFIG.TRANSITION_DURATION)
					.attr("viewBox", `${x0 - MAP_CONFIG.ZOOM_PADDING} 
									  ${y0 - MAP_CONFIG.ZOOM_PADDING} 
									  ${x1 - x0 + MAP_CONFIG.ZOOM_MARGIN} 
									  ${y1 - y0 + MAP_CONFIG.ZOOM_MARGIN}`);
			
					svg.selectAll("path.gu")
					.filter(d2 => d2 !== d)
					.style("display", "none");
			
					d3.select(this)
					.style("display", "inline")
					.style("fill", "transparent")  // 배경색을 완전 투명하게
					.style("pointer-events", "none")
					.classed("disabled-gu", true);
			
					document.getElementById("locationInfo")
					.innerText = d.properties.SGG_NM || guCode;
									   
					loadDong(guCode);
					loadDonutCategoryChart(guCode, document.getElementById("timeRange").value);
									    
					d3.select("#backButton")
					.style("display", "inline");
				})
		);
		updatePathColors("path.gu");
		addUrgentIndicators();
}

function loadDong(guCode) {
	svg.selectAll("path.dong")
	.remove();
	const dongFiltered = 
		MAP_STATE.dongData.features.filter(f => f.properties.COL_ADM_SE === guCode);

	const dongPaths = 
		svg.selectAll("path.dong")
		.data(dongFiltered)
		.join("path")
		.attr("class", "dong")
		.attr("d", MAP_STATE.path)
						 					     
	updatePathColors("path.dong");	
	addUrgentIndicators();			          
	
	dongPaths.on("click", function (_, d) {	
		const dongCode = d.properties.EMD_CD;
		svg.attr("data-current-code", dongCode); // 현재 선택된 동 코드 저장
		
		const dongName = d.properties.EMD_NM || dongCode;
		const guCode = dongCode.substring(0, 5);
		const guMatch = MAP_STATE.guData.features.find(f => String(f.properties.COL_ADM_SE) === guCode);
		const siguName = guMatch ? guMatch.properties.SGG_NM : guCode;
	  
		document.getElementById("locationInfo").innerText = `${siguName} ${dongName}`;
		const period = document.getElementById("timeRange").value;
		loadDonutCategoryChart(dongCode, period);
    });
}

function getViewType(code) {
	if (!code) return 'city';
	if (code.length === 5) return 'gu';
	if (code.length === 8) return 'dong';
	return 'city';
}

function handleCityView() {
	drawGU();
	svg.selectAll("path.dong").remove();
}

function handleGuView() {
	updatePathColors("path.gu");
	updatePathColors("path.dong");
}

function handleDongView() {
	svg.selectAll("path.gu.disabled-gu")
	.style("fill", "transparent")
	.style("display", "none");
	  
	updatePathColors("path.dong");
	updatePathColors("path.gu");
}

function updateMap(period) {
	// 일반 민원 데이터 가져오기
	const generalPromise = fetch(`/webpro/api/graph-map-${period}`)
	.then(res => {
	    if (!res.ok) throw new Error(`HTTP ${res.status}`);
	    return res.json();
	});

	// 긴급 민원 데이터 가져오기
	const urgentPromise = fetch(`/webpro/api/graph-map-urgent`)
	.then(res => {
	    if (!res.ok) throw new Error(`HTTP ${res.status}`);
	    return res.json();
	});
	
	Promise.all([generalPromise, urgentPromise])
	.then(([generalData, urgentData]) => {
		
		if (!generalData || !Array.isArray(generalData)) {
			console.error("generalData is null or not an array:", generalData);
			generalData = []; // 빈 배열로 초기화
		}

		if (!urgentData || !Array.isArray(urgentData)) {
			console.error("urgentData is null or not an array:", urgentData);
			urgentData = []; // 빈 배열로 초기화
		}
		
		const levelMap = new Map();
		const urgentSet = new Set();
		
		generalData.forEach(d => {
			if (d && d.addressCode) {
				levelMap.set(d.addressCode, d.complaintCount || 0);
			}
		});

		urgentData.forEach(d => {
			if (d && d.addressCode) {
				urgentSet.add(d.addressCode);
			}
		});

		MAP_STATE.urgentData = urgentSet;
		
		const currentCode = svg.attr("data-current-code");
	  
		MAP_STATE.guData.features.forEach(f => {
			const guCode = f.properties.COL_ADM_SE;
			let totalCount = 0;
			let hasUrgent = false;
			
			levelMap.forEach((count, addrCode) => {
				if (addrCode.startsWith(guCode)) totalCount += count;
			});
			
			urgentSet.forEach(addrCode => {
				if (addrCode.startsWith(guCode)) hasUrgent = true;
			});
			
			f.properties.complaintLevel = calcGuLevel(totalCount);
			f.properties.hasUrgent = hasUrgent;
		});

		MAP_STATE.dongData.features.forEach(f => {
			const dongCode = f.properties.EMD_CD;
			const count = levelMap.get(dongCode) || 0;
			const hasUrgent = urgentSet.has(dongCode);
			
			f.properties.complaintLevel = calcDongLevel(count);
			f.properties.hasUrgent = hasUrgent;			
		});

		const viewType = getViewType(currentCode);
		switch(viewType) {
		case 'dong':
		    handleDongView();
		    break;
		case 'gu':
		    handleGuView();
		    break;
		default:
		    handleCityView();
		    break;
		}
		 	
		if (document.getElementById("locationInfo").innerText === "대전광역시 전체") {
			loadDonutCategoryChart("", period);
		}
	})
	.catch(error => {
		console.error("지도 데이터 업데이트 실패:", error);
		showMapError("데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.");
	});
}

function calcDongLevel(count) {
  if (count >= 9) return 5;
  if (count >= 7) return 4;
  if (count >= 5) return 3;
  if (count >= 3) return 2;
  if (count >= 1) return 1;
  return 0;
}

function calcGuLevel(count) {
  if (count >= 200) return 5;
  if (count >= 160) return 4;
  if (count >= 120) return 3;
  if (count >= 80) return 2;
  if (count >= 40) return 2;
  return 0;
}

document.getElementById("timeRange").addEventListener("change", (e) => {
  const period = e.target.value;
  updateMap(period);
  
  const currentCode = svg.attr("data-current-code") || "";
  loadDonutCategoryChart(currentCode, period);
});

// ✅ 여기에 추가하세요 (파일 맨 끝)
function showMapError(message) {
  const mapWrapper = document.getElementById("mapWrapper");
  const errorDiv = document.createElement("div");
  errorDiv.className = "map-error";
  errorDiv.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #f8d7da;
    color: #721c24;
    padding: 15px;
    border-radius: 5px;
    border: 1px solid #f5c6cb;
  `;
  errorDiv.textContent = message;
  mapWrapper.appendChild(errorDiv);
}

