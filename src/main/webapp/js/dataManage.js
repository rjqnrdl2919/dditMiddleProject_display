// 날짜 포맷
function formatToDatetimeLocal(date) {
  const pad = n => n.toString().padStart(2, '0');
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) 
  							+ "-" + pad(date.getDate()) 
							+ 'T' + pad(date.getHours()) 
							+ ':' + pad(date.getMinutes());
}

function getCategoryName(categoryId) {
  // 카테고리 ID를 이름으로 변환
  const categoryMap = {
    '0101': '교통사고',
    '0102': '신호등 고장',
    '0103': '불법 주차',
    '0104': '과속 주행',
    '0105': '스쿨존 제보',
    '0106': '도로 파손',
    '0107': '무단횡단 제보',
    '0108': '어린이구역 제보',
    '0109': '신호 대기 민원',
    '0110': '정류장 시설 제보',
    '0111': '자전거도로 점유',
	'0112': '교통섬 주차'	
  };
  return categoryMap[categoryId] || categoryId;
}

function getLocationName(d) {
  // 지역 정보 반환
  if (d.data && d.data.values && d.data.values.length > 0) {
    const item = d.data.values.find(function(v) { return v.categoryId === d.key; });
    if (item && item.emdName) {
      return item.sigunguName + ' ' + item.emdName;
    }
  }
  return '전체 지역';
}

// 전역 변수
window.CHART_CONFIG = window.CHART_CONFIG || {
  HEIGHT: 540,
  MARGIN: { top: 20, right: 30, bottom: 70, left: 60 },
  BAR_WIDTH: 40,
  ANIMATION_DURATION: 500,
  MIN_WIDTH: 1200,
  INTERVALS: {
    'M30': { minutes: 30, label: '30분' },
    'H1': { minutes: 60, label: '1시간' },
    'H2': { minutes: 120, label: '2시간' },
    'H3': { minutes: 180, label: '3시간' },
    'H4': { minutes: 240, label: '4시간' },
    'H6': { minutes: 360, label: '6시간' },
    'H8': { minutes: 480, label: '8시간' },
    'H12': { minutes: 720, label: '12시간' },
    'D1': { minutes: 1440, label: '1일' }
  }
};

if (!window.ChartState) {
	window.ChartState = class ChartState {	
	  constructor() {
	    this.currentMode = "stacked";
	    this.currentData = [];
	    this.allTimeSlots = [];
	    this.scales = null;
	    this.isAnimating = false;
	    this.currentInterval = 'M30';
	    this.yMaxValue = 0;
	    this.currentScrollPosition = 0; // 스크롤 위치 저장
	}
  };
}

const chartState = new ChartState();

function generateTimeSlots(startDate, endDate, intervalMinutes) {
  const slots = [];
  
  const parseKoreanTime = function(dateStr) {
    const parts = dateStr.split(' ');
    const date = parts[0].split('-');
    const time = parts[1].split(':');
    return new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), parseInt(time[0]), parseInt(time[1]));
  };
  
  const current = normalizeTime(parseKoreanTime(startDate), intervalMinutes);
  const end = parseKoreanTime(endDate);
  
  // 1일 단위일 때 특별 처리
  if (intervalMinutes === 1440) {
    while (current <= end) {
      const year = current.getFullYear();
      const month = (current.getMonth() + 1).toString().padStart(2, '0');
      const day = current.getDate().toString().padStart(2, '0');
      
      const timeString = year + '-' + month + '-' + day + ' 00:00';
      slots.push(timeString);
      
      // 1일씩 증가
      current.setDate(current.getDate() + 1);
    }
  } else {
    while (current <= end) {
      const year = current.getFullYear();
      const month = (current.getMonth() + 1).toString().padStart(2, '0');
      const day = current.getDate().toString().padStart(2, '0');
      const hour = current.getHours().toString().padStart(2, '0');
      const minute = current.getMinutes().toString().padStart(2, '0');
      
      const timeString = year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
      slots.push(timeString);
      
      current.setMinutes(current.getMinutes() + intervalMinutes);
    }
  }
  
  return slots;
}

// ========== 초기화 ==========
window.loadClusterPage = function () {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  document.getElementById("startDate").value = formatToDatetimeLocal(yesterday);
  document.getElementById("endDate").value = formatToDatetimeLocal(now);

  initAddressDropdowns();
  initCategoryDropdowns();
  initIntervalSelector();

  // 버튼 기능
  document.getElementById("toggleMode").addEventListener("click", function() {
    if (chartState.currentMode === "stacked") {
      transitionGrouped();
    } else {
      transitionStacked();
    }
  });
  
  document.getElementById("exportData").addEventListener("click", function() {
    console.log("내보내기 클릭됨");
    downloadGraphReportPages(); // 함수 호출 추가
  });
  
  ["filterHarmful", "filterSpam", "filterUrgent"].forEach(function(id) {
    var el = document.getElementById(id);
    el.checked = true;
    el.addEventListener("change", loadClusterData);
  });

  ["startDate", "endDate", "emdSelect", "category2ndSelect"].forEach(function(id) {
    document.getElementById(id).addEventListener("change", loadClusterData);
  });
  
  loadClusterData();
};

function initIntervalSelector() {
  var intervalSelect = document.getElementById("intervalSelect");
  if (intervalSelect) {
    intervalSelect.value = chartState.currentInterval;
    intervalSelect.addEventListener("change", function(e) {
      /*console.log("시간 간격 변경: " + chartState.currentInterval + " → " + e.target.value);*/
      chartState.currentInterval = e.target.value;
      
      // 차트 상태 초기화 후 데이터 재조회
      chartState.allTimeSlots = [];
      chartState.currentData = [];
      
      loadClusterData();
    });
  }
}

function transitionGrouped() {
  if (chartState.isAnimating) return;
  chartState.isAnimating = true;
  chartState.currentMode = "grouped";
  
  var svg = d3.select("#barplotSvg");
  var scales = chartState.scales;
  
  // 예시 코드 스타일의 조립 애니메이션
  svg.selectAll("g.layer").each(function(d, layerIndex) {
    var group = d3.select(this);
    
    group.selectAll("rect")
      .transition()
      .duration(600)
      .delay(function(d, i) { return layerIndex * 30 + i * 15; })
      .ease(d3.easeCubicInOut)
      // 첫 번째 단계: X 위치와 너비 변경
      .attr("x", function(d) { return calculateBarX(d, scales, "grouped"); })
      .attr("width", function(d) { return calculateBarWidth(d, scales, "grouped"); })
      .transition()
      .duration(400)
      // 두 번째 단계: Y 위치와 높이 변경 (조립 완성)
      .attr("y", function(d) { return calculateBarY(d, scales, "grouped"); })
      .attr("height", function(d) { return calculateBarHeight(d, scales, "grouped"); });
  });
  
  setTimeout(function() {
    chartState.isAnimating = false;
  }, 1000);
}

function transitionStacked() {
  if (chartState.isAnimating) return;
  chartState.isAnimating = true;
  chartState.currentMode = "stacked";
  
  var svg = d3.select("#barplotSvg");
  var scales = chartState.scales;
  
  // 예시 코드 스타일의 조립 애니메이션
  svg.selectAll("g.layer").each(function(d, layerIndex) {
    var group = d3.select(this);
    
    group.selectAll("rect")
      .transition()
      .duration(600)
      .delay(function(d, i) { return layerIndex * 30 + i * 15; })
      .ease(d3.easeCubicInOut)
      // 첫 번째 단계: Y 위치와 높이 변경
      .attr("y", function(d) { return calculateBarY(d, scales, "stacked"); })
      .attr("height", function(d) { return calculateBarHeight(d, scales, "stacked"); })
      .transition()
      .duration(400)
      // 두 번째 단계: X 위치와 너비 변경 (조립 완성)
      .attr("x", function(d) { return calculateBarX(d, scales, "stacked"); })
      .attr("width", function(d) { return calculateBarWidth(d, scales, "stacked"); });
  });
  
  setTimeout(function() {
    chartState.isAnimating = false;
  }, 1000);
}

// ========== 주소, 유형 필터 초기화 ==========
let cachedAddressCategoryData = null;
  
function initCategoryDropdowns() {
  if(cachedAddressCategoryData) {
    setupCategoryDropdowns(cachedAddressCategoryData);
    return;
  }
  
  fetch("../api/list-address-category")
    .then(function(res) { return res.json(); })
    .then(function(data) {
      cachedAddressCategoryData = data;
      setupCategoryDropdowns(data);
    });
}
  
function setupCategoryDropdowns(data) {
  const firstSelect = document.getElementById("category1stSelect");
  firstSelect.innerHTML = '<option value="01">교통</option>';
  firstSelect.disabled = true;

  const subcategories = data.categoryList.filter(function(c) {
    return c.categoryId.startsWith("01") && c.categoryId !== "0100";
  });
  
  populateDropdown(document.getElementById("category2ndSelect"), subcategories, "category2nd");
}  

function initAddressDropdowns() {
  if (cachedAddressCategoryData) {
    setupAddressDropdowns(cachedAddressCategoryData);
    return;
  }
  
  fetch("../api/list-address-category")
    .then(function(res) { return res.json(); })
    .then(function(data) {
      cachedAddressCategoryData = data;
      setupAddressDropdowns(data);
    });
}

function setupAddressDropdowns(data) {    
  const sidoSelect = document.getElementById("sidoSelect");
  sidoSelect.innerHTML = '<option value="30">대전광역시</option>';
  sidoSelect.disabled = true;

  const gugunList = data.addressList.filter(function(a) {
    return a.addressCode.substring(2, 6) !== "0000" && a.addressCode.endsWith("000");
  });
  populateDropdown(document.getElementById("sigunguSelect"), gugunList, "sigungu");

  document.getElementById("sigunguSelect").addEventListener("change", function(e) {
    const code = e.target.value.substring(0, 5);
    if(!cachedAddressCategoryData) return;
    const emdList = cachedAddressCategoryData.addressList.filter(function(a) {
      return a.addressCode.startsWith(code) && a.addressCode.substring(5, 8) !== "000";
    });
    populateDropdown(document.getElementById("emdSelect"), emdList, "emd");
    loadClusterData();
  });
}

function populateDropdown(select, items, type) {
  select.innerHTML = '<option value="전체">전체</option>';
  items.forEach(function(item) {
    let label = "";
    if (type === "sigungu") label = item.sigunguName;
    else if (type === "emd") label = item.emdName;
    else if (type === "category2nd") label = item.categoryName;
    
    select.innerHTML += '<option value="' + (item.addressCode || item.categoryId) + '">' + label + '</option>';
  });
}

// ========== 필터 파라미터 수집 ==========
function getSelectedAddressCode() {
  const emd = document.getElementById("emdSelect") ? document.getElementById("emdSelect").value : null;
  const sigungu = document.getElementById("sigunguSelect") ? document.getElementById("sigunguSelect").value : null;
  if (emd && emd !== "전체") return emd;
  if (sigungu && sigungu !== "전체") return sigungu.substring(0, 5) + "000";
  return "전체";
}

function getCategoryId() {
  const c2 = document.getElementById("category2ndSelect") ? document.getElementById("category2ndSelect").value : null;
  return (c2 && c2 !== "전체" && c2 !== "0100") ? c2 : null;
}

function getCheckboxFilterValue(id) {
  const checkbox = document.getElementById(id);
  return checkbox.checked ? null : 0;
}

function normalizeDate(inputValue) {
  if (!inputValue || typeof inputValue !== 'string') {
    console.error('Invalid input for normalizeDate:', inputValue);
    return '';
  }
  
  if (!inputValue.includes('T')) {
    console.error('Invalid datetime format for normalizeDate:', inputValue);
    return inputValue;
  }
  
  const parts = inputValue.split("T");
  return parts[0] + ' ' + parts[1] + ':00';
}

function normalizeTime(date, intervalMinutes) {
  const normalizedDate = new Date(date);
  
  if (intervalMinutes === 30) {
    // 30분 단위: 0-29분은 0분, 30-59분은 30분
    const minutes = normalizedDate.getMinutes();
    const normalizedMinutes = minutes < 30 ? 0 : 30;
    normalizedDate.setMinutes(normalizedMinutes, 0, 0);
  } else if (intervalMinutes >= 60) {
    // 1시간 이상: 항상 정시부터 해당 간격으로 나누기
    const hours = normalizedDate.getHours();
    const intervalHours = intervalMinutes / 60;
    
    // 0시부터 시작해서 해당 간격으로 나눈 구간의 시작 시간
    const normalizedHours = Math.floor(hours / intervalHours) * intervalHours;
    normalizedDate.setHours(normalizedHours, 0, 0, 0);
  } else if (intervalMinutes === 1440) {
    // 1일 단위: 00:00으로 정규화
    normalizedDate.setHours(0, 0, 0, 0);
  }
  
  return normalizedDate;
}

function validateChartData(data) {
  if (!Array.isArray(data)) return [];
  
  return data.filter(function(d) {
    return d && 
           typeof d.complaintCount === 'number' && 
           d.complaintCount >= 0 && 
           d.timeSlot && 
           d.categoryId;
  });
}

function sanitizeData(data) {
  return data.map(function(d) {
    return Object.assign({}, d, {
      complaintCount: Math.max(0, d.complaintCount || 0)
    });
  });
}  

// ========== 클러스터 조회 ==========
function loadClusterData() {
  const params = new URLSearchParams();
  const startDate = normalizeDate(document.getElementById("startDate").value);
  const endDate = normalizeDate(document.getElementById("endDate").value);
  
  // 전체 시간대 생성을 API 호출 전에 이동
  const intervalMinutes = CHART_CONFIG.INTERVALS[chartState.currentInterval].minutes;
  chartState.allTimeSlots = generateTimeSlots(startDate, endDate, intervalMinutes);
  
  params.set("startDate", startDate);
  params.set("endDate", endDate);
  params.set("interval", chartState.currentInterval);
  params.set("addressCode", getSelectedAddressCode());

  const categoryId = getCategoryId();
  if (categoryId) params.set("categoryId", categoryId); 

  const h = getCheckboxFilterValue("filterHarmful");
  const s = getCheckboxFilterValue("filterSpam");
  const u = getCheckboxFilterValue("filterUrgent");

  if (h !== null) params.set("isHarmful", h);
  if (s !== null) params.set("isSpam", s);
  if (u !== null) params.set("isUrgent", u);

  fetch("../api/cluster-data?" + params)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      const validatedData = validateChartData(data);
      const sanitizedData = sanitizeData(validatedData);
      
      // 데이터가 없어도 차트는 그리기 (빈 시간대 표시)
      calculateYMaxValue(sanitizedData);
      animateDataUpdate(sanitizedData);
    })
    .catch(function(err) {
      console.error("❌ 데이터 요청 실패", err);
      showErrorChart(err.message);
    });
}

function animateDataUpdate(newData) {
  if (!chartState.currentData || chartState.currentData.length === 0) {
    drawBarplot(newData);
    return;
  }
  
  const svg = d3.select("#barplotSvg");
  
  svg.selectAll("rect")
    .transition()
    .duration(400)
    .attr("x", chartState.scales.x.range()[1] / 2)
    .attr("width", 2)
    .style("opacity", 0.3)
    .on("end", function() {
      drawBarplot(newData);
    });
}

function calculateYMaxValue(data) {
  if (!data || data.length === 0) {
    chartState.yMaxValue = 5; // 기본값 설정
    return;
  }
  
  const groupedData = groupByTime(data);
  const groups = Array.from(new Set(data.map(function(d) { return d.categoryId; })));
  
  let maxStackedValue = 0;
  groupedData.forEach(function(timeGroup) {
    const stackedSum = groups.reduce(function(sum, groupId) {
      const found = timeGroup.values.find(function(v) { return v.categoryId === groupId; });
      return sum + (found ? found.complaintCount : 0);
    }, 0);
    maxStackedValue = Math.max(maxStackedValue, stackedSum);
  });
  
  chartState.yMaxValue = Math.max(maxStackedValue + 2, 5);
}

function groupByTime(data) {
  const intervalMinutes = CHART_CONFIG.INTERVALS[chartState.currentInterval].minutes;
  const aggregatedData = new Map();
  
  data.forEach(function(d) {
    try {
      const parseKoreanTime = function(timeStr) {
        const parts = timeStr.split(' ');
        const date = parts[0].split('-');
        const time = parts[1].split(':');
        return new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), parseInt(time[0]), parseInt(time[1]));
      };
      
      const originalTime = parseKoreanTime(d.timeSlot);
      const normalizedTime = normalizeTime(originalTime, intervalMinutes);
      
      let normalizedTimeString;
      if (intervalMinutes === 1440) {
        const year = normalizedTime.getFullYear();
        const month = (normalizedTime.getMonth() + 1).toString().padStart(2, '0');
        const day = normalizedTime.getDate().toString().padStart(2, '0');
        normalizedTimeString = year + '-' + month + '-' + day + ' 00:00';
      } else {
        const year = normalizedTime.getFullYear();
        const month = (normalizedTime.getMonth() + 1).toString().padStart(2, '0');
        const day = normalizedTime.getDate().toString().padStart(2, '0');
        const hour = normalizedTime.getHours().toString().padStart(2, '0');
        const minute = normalizedTime.getMinutes().toString().padStart(2, '0');
        normalizedTimeString = year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
      }
      
      const key = normalizedTimeString + '-' + d.categoryId;
      
      if (aggregatedData.has(key)) {
        aggregatedData.get(key).complaintCount += d.complaintCount;
      } else {
        aggregatedData.set(key, {
          timeSlot: normalizedTimeString,
          categoryId: d.categoryId,
          complaintCount: d.complaintCount
        });
      }
    } catch (error) {
      console.warn('Error processing data item:', d, error.message);
    }
  });
  
  const aggregatedArray = Array.from(aggregatedData.values());
  const grouped = d3.group(aggregatedArray, function(d) { return d.timeSlot; });
  
  return chartState.allTimeSlots.map(function(timeSlot) {
    const values = grouped.get(timeSlot) || [];
    return { timeSlot: timeSlot, values: values };
  });
}

function drawBarplot(data, mode) {
  if (mode === undefined) { mode = chartState.currentMode; }
  if (chartState.isAnimating) return;
  chartState.isAnimating = true;

  var wrapper = document.getElementById("barplotWrapper");
  
  // 현재 스크롤 위치 저장
  if (wrapper) {
    chartState.currentScrollPosition = wrapper.scrollLeft;
  }

  // 고정 너비 계산 - 항상 동일한 간격 유지
  var totalBars = chartState.allTimeSlots.length;
  var minRequiredWidth = totalBars * CHART_CONFIG.BAR_WIDTH + CHART_CONFIG.MARGIN.left + CHART_CONFIG.MARGIN.right;
  var width = Math.max(minRequiredWidth, CHART_CONFIG.MIN_WIDTH);
  var height = CHART_CONFIG.HEIGHT;

  var svg = d3.select("#barplotSvg");
  svg.attr("width", width).attr("height", height);
  
  var fixedYAxis = d3.select("#fixedYAxis");
  fixedYAxis.attr("width", 60).attr("height", height);
  
  var margin = Object.assign({}, CHART_CONFIG.MARGIN);
  margin.left = 0;

  var xAxisGroup = svg.select(".x-axis");
  var yAxisGroup = fixedYAxis.select(".y-axis");

  if (xAxisGroup.empty()) {
    xAxisGroup = svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + (height - CHART_CONFIG.MARGIN.bottom) + ")");
  }
  if (yAxisGroup.empty()) {
    yAxisGroup = fixedYAxis.append("g")
      .attr("class", "y-axis")
      .attr("transform", "translate(59,0)");
  }

  svg.selectAll("text.nodata, text.error").remove();

  chartState.currentData = data;
  chartState.currentMode = mode;

  var groups = Array.from(new Set(data.map(function(d) { return d.categoryId; })));
  var groupedData = groupByTime(data);
  var stackedData = createStackedData(groupedData, groups);
  
  var yMax = chartState.yMaxValue;
  var scales = createScales(chartState.allTimeSlots, yMax, width, height, margin, groups);
  chartState.scales = scales;

  updateAxes(xAxisGroup, yAxisGroup, scales);
  renderBarsWithSequentialAnimation(svg, stackedData, scales, mode, groupedData);

  // 축을 맨 앞으로 가져오기 (애니메이션 완료 후)
  setTimeout(function() {
    xAxisGroup.raise();
    yAxisGroup.raise();
  }, 100);

  // 스크롤 위치 복원
  setTimeout(function() {
    if (wrapper) {
      var maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
      var scrollRatio = chartState.currentScrollPosition / (wrapper.scrollWidth - wrapper.clientWidth || 1);
      wrapper.scrollLeft = Math.min(scrollRatio * maxScroll, maxScroll);
    }
    chartState.isAnimating = false;
  }, CHART_CONFIG.ANIMATION_DURATION + 500);
}

function renderBarsWithSequentialAnimation(svg, stackedData, scales, mode, groupedData) {
  var tooltip = d3.select("#tooltip");
  
  var layer = svg.selectAll("g.layer")
    .data(stackedData, function(d) { return d.key; });

  // 기존 레이어는 유지, 새로운 레이어만 추가
  var layerEnter = layer.enter()
    .append("g")
    .attr("class", function(d) { return "layer " + d.key; })
    .attr("fill", function(d) { return scales.color(d.key); })
    .style("opacity", 1);

  var layerUpdate = layerEnter.merge(layer);

  // 제거되는 레이어 처리
  layer.exit()
    .transition()
    .duration(400)
    .style("opacity", 0)
    .remove();

  layerUpdate.each(function(d, layerIndex) {
    var group = d3.select(this);
    
    var rects = group.selectAll("rect")
      .data(d.map(function(p) { return Object.assign({}, p, { key: d.key }); }), 
            function(d) { return d.data.timeSlot + "-" + d.key; });

    // 새로운 바 생성
    var entered = rects.enter()
      .append("rect")
      .attr("x", function(d) { return calculateBarX(d, scales, mode); })
      .attr("width", function(d) { return calculateBarWidth(d, scales, mode); })
      .attr("y", scales.y(0))
      .attr("height", 0)
      .style("opacity", 0)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5);

    // 기존 바 제거
    rects.exit()
      .transition()
      .duration(300)
      .style("opacity", 0)
      .attr("height", 0)
      .attr("y", scales.y(0))
      .remove();

    var merged = entered.merge(rects);

    // 조립 애니메이션 (예시 코드 스타일)
    merged
      .transition()
      .duration(CHART_CONFIG.ANIMATION_DURATION)
      .delay(function(d, i) { return layerIndex * 50 + i * 20; })
      .ease(d3.easeBackOut.overshoot(0.1))
      .style("opacity", function(d) {
        var value = calculateActualValue(d, mode);
        return value > 0 ? 1 : 0;
      })
      .attr("x", function(d) { return calculateBarX(d, scales, mode); })
      .attr("width", function(d) { return calculateBarWidth(d, scales, mode); })
      .attr("y", function(d) { return calculateBarY(d, scales, mode); })
      .attr("height", function(d) { return calculateBarHeight(d, scales, mode); });

    // 마우스 이벤트 추가 (예시 코드 스타일)
    merged
      .on("mouseover", function(event, d) {
        var value = calculateActualValue(d, mode);
        if (value <= 0) return;

        // 툴팁 표시
        tooltip.style("opacity", 1)
          .html('<div class="category-name">' + getCategoryName(d.key) + '</div>' +
                '<div class="value">시간: ' + d.data.timeSlot + '</div>' +
                '<div class="value">건수: ' + value + '건</div>' +
                '<div class="value">지역: ' + getLocationName(d) + '</div>');

        // 같은 카테고리 하이라이트
        svg.selectAll("g.layer").classed("dimmed", true);
        svg.selectAll("g.layer").filter(function(layerData) { return layerData.key === d.key; }).classed("dimmed", false).classed("highlighted", true);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 30) + "px");
      })
      .on("mouseleave", function() {
        tooltip.style("opacity", 0);
        svg.selectAll("g.layer").classed("dimmed", false).classed("highlighted", false);
      });
  });
}

function showEmptyChart() {
  var svg = d3.select("#barplotSvg");
  var width = svg.attr("width") || CHART_CONFIG.MIN_WIDTH;
  var height = svg.attr("height") || CHART_CONFIG.HEIGHT;
  
  svg.selectAll(".layer").remove();
  
  var message = svg.selectAll("text.nodata").data([1]);
  message.enter().append("text")
    .attr("class", "nodata")
    .merge(message)
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .attr("fill", "#999")
    .style("font-size", "16px")
    .text("표시할 데이터가 없습니다.");
}

function showErrorChart(errorMessage) {
  var svg = d3.select("#barplotSvg");
  var width = svg.attr("width") || CHART_CONFIG.MIN_WIDTH;
  var height = svg.attr("height") || CHART_CONFIG.HEIGHT;
  
  svg.selectAll(".layer").remove();
  
  var message = svg.selectAll("text.error").data([1]);
  message.enter().append("text")
    .attr("class", "error")
    .merge(message)
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .attr("fill", "#d32f2f")
    .style("font-size", "16px")
    .text("데이터 로드 실패: " + errorMessage);
}

function createStackedData(groupedData, groups) {
  return d3.stack()
    .keys(groups)
    .value(function(d, key) {
      var found = d.values.find(function(v) { return v.categoryId === key; });
      return found ? Math.max(0, found.complaintCount) : 0;
    })(groupedData);
}

function createScales(timeSlots, yMax, width, height, margin, groups) {
  return {
    x: d3.scaleBand()
      .domain(timeSlots)
      .range([0, width - margin.right]) // 전체 너비 사용
      .padding(0.1), // 간격은 자동으로 조정됨
    y: d3.scaleLinear()
      .domain([0, yMax])
      .range([height - margin.bottom, margin.top]),
    color: d3.scaleOrdinal(d3.schemeSet3).domain(groups)
  };
}

function updateAxes(xAxisGroup, yAxisGroup, scales) {
  var intervalMinutes = CHART_CONFIG.INTERVALS[chartState.currentInterval].minutes;
  
  xAxisGroup.transition()
    .duration(CHART_CONFIG.ANIMATION_DURATION)
    .call(d3.axisBottom(scales.x)
      .tickSizeOuter(0)
      .tickFormat(function(d) {
        var parts = d.split(" ");
        var datePart = parts[0];
        var timePart = parts[1];
        
        if (!timePart) return d;
        
        var dateParts = datePart.split('-');
        var shortDate = dateParts[1] + "/" + dateParts[2];
        var shortTime = timePart.substring(0, 5);
        
        // 시간 간격에 따른 표시 방식
        if (intervalMinutes >= 1440) {
          return shortDate; // 1일 이상: 날짜만
        } else if (intervalMinutes >= 360 || timePart === "00:00") {
          return shortDate + "\n" + shortTime; // 6시간 이상 또는 자정: 날짜+시간
        } else {
          return shortTime; // 일반: 시간만
        }
      }))
    .selectAll("text")
    .style("font-size", "10px")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-40)");

  yAxisGroup.transition()
    .duration(CHART_CONFIG.ANIMATION_DURATION)
    .call(d3.axisLeft(scales.y)
      .ticks(Math.min(10, scales.y.domain()[1]))
      .tickFormat(d3.format("d")));
}

function calculateActualValue(d, mode) {
  if (mode === "grouped") {
    var found = d.data.values.find(function(v) { return v.categoryId === d.key; });
    return found ? found.complaintCount : 0;
  }
  return d[1] - d[0];
}

function calculateBarX(d, scales, mode) {
  var timeSlotCenter = scales.x(d.data.timeSlot) + scales.x.bandwidth() / 2; // 시간대 중앙
  var fixedBarWidth = CHART_CONFIG.BAR_WIDTH;
  
  if (mode === "grouped") {
    var validCategories = d.data.values
      .filter(function(v) { return v.complaintCount > 0; })
      .map(function(v) { return v.categoryId; });
    
    if (validCategories.length === 0) return timeSlotCenter - fixedBarWidth / 2;
    
    var index = validCategories.indexOf(d.key);
    if (index === -1) return timeSlotCenter - fixedBarWidth / 2;
    
    var individualBarWidth = fixedBarWidth / validCategories.length;
    var totalWidth = fixedBarWidth;
    var startX = timeSlotCenter - totalWidth / 2;
    
    return startX + (individualBarWidth * index); // 고정 폭 내에서 배치
  }
  
  return timeSlotCenter - fixedBarWidth / 2; // stacked는 중앙 정렬
}

function calculateBarWidth(d, scales, mode) {
  var fixedBarWidth = CHART_CONFIG.BAR_WIDTH; // 고정 바 폭
  
  if (mode === "grouped") {
    var validCount = d.data.values.filter(function(v) { return v.complaintCount > 0; }).length;
    return validCount > 0 ? fixedBarWidth / validCount : 0; // 고정 폭을 개수로 나눔
  }
  return fixedBarWidth; // stacked는 고정 폭 그대로
}

function calculateBarY(d, scales, mode) {
  if (mode === "grouped") {
    var found = d.data.values.find(function(v) { return v.categoryId === d.key; });
    var value = found ? found.complaintCount : 0;
    return scales.y(value);
  }
  return scales.y(d[1]);
}

function calculateBarHeight(d, scales, mode) {
  if (mode === "grouped") {
    var found = d.data.values.find(function(v) { return v.categoryId === d.key; });
    var value = found ? found.complaintCount : 0;
    return scales.y(0) - scales.y(value);
  }
  return scales.y(d[0]) - scales.y(d[1]);
}

function getCurrentFilterInfo() {
  try {
    const startDateElement = document.getElementById('startDate');
    const startDate = startDateElement ? startDateElement.value : '';
    
    const endDateElement = document.getElementById('endDate');
    const endDate = endDateElement ? endDateElement.value : '';
    
    const sigungu = document.getElementById('sigunguSelect');
    const emd = document.getElementById('emdSelect');
    const category = document.getElementById('category2ndSelect');
    const interval = document.getElementById('intervalSelect');
    
    const filterHarmfulElement = document.getElementById('filterHarmful');
    const harmful = filterHarmfulElement ? filterHarmfulElement.checked : false;
    
    const filterSpamElement = document.getElementById('filterSpam');
    const spam = filterSpamElement ? filterSpamElement.checked : false;
    
    const filterUrgentElement = document.getElementById('filterUrgent');
    const urgent = filterUrgentElement ? filterUrgentElement.checked : false;
    
    return {
      period: startDate.replace('T', ' ') + ' ~ ' + endDate.replace('T', ' '),
      location: getLocationText(sigungu, emd),
      category: category && category.options && category.selectedIndex >= 0 ? 
                category.options[category.selectedIndex].text : '전체',
      interval: interval && interval.options && interval.selectedIndex >= 0 ? 
                interval.options[interval.selectedIndex].text : '30분',
      filters: getFilterText(harmful, spam, urgent),
      mode: chartState.currentMode === 'stacked' ? '누적형' : '그룹형',
      generatedAt: new Date().toLocaleString('ko-KR')
    };
  } catch (error) {
    console.error('getCurrentFilterInfo 오류:', error);
    return {
      period: '정보 없음',
      location: '대전광역시 전체',
      category: '전체',
      interval: '30분',
      filters: '정보 없음',
      mode: '누적형',
      generatedAt: new Date().toLocaleString('ko-KR')
    };
  }
}

function getLocationText(sigungu, emd) {
  try {
    // emd 요소와 options 안전성 검사
    if (emd && emd.value !== '전체' && emd.options && emd.selectedIndex >= 0 && emd.options[emd.selectedIndex]) {
      const emdText = emd.options[emd.selectedIndex].text;
      if (sigungu && sigungu.options && sigungu.selectedIndex >= 0 && sigungu.options[sigungu.selectedIndex]) {
        const sigunguText = sigungu.options[sigungu.selectedIndex].text;
        return sigunguText + ' ' + emdText;
      }
      return emdText;
    } 
    // sigungu만 선택된 경우
    else if (sigungu && sigungu.value !== '전체' && sigungu.options && sigungu.selectedIndex >= 0 && sigungu.options[sigungu.selectedIndex]) {
      const sigunguText = sigungu.options[sigungu.selectedIndex].text;
      return sigunguText + ' 전체';
    }
    // 기본값
    return '대전광역시 전체';
  } catch (error) {
    console.warn('getLocationText 오류:', error);
    return '대전광역시 전체';
  }
}

function getFilterText(harmful, spam, urgent) {
  const filters = [];
  if (harmful) filters.push('악성');
  if (spam) filters.push('스팸');
  if (urgent) filters.push('긴급');
  return filters.length > 0 ? filters.join(', ') : '필터 없음';
}

function createFilterSection(filterInfo) {
  const section = document.createElement('div');
  section.style.marginBottom = '20px';
  section.style.padding = '15px';
  section.style.backgroundColor = '#f8f9fa';
  section.style.borderRadius = '5px';
  section.style.fontSize = '12px';
  
  section.innerHTML = 
    '<h3 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">조회 조건</h3>' +
    '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">' +
      '<div><strong>기간:</strong> ' + filterInfo.period + '</div>' +
      '<div><strong>지역:</strong> ' + filterInfo.location + '</div>' +
      '<div><strong>카테고리:</strong> ' + filterInfo.category + '</div>' +
      '<div><strong>시간 간격:</strong> ' + filterInfo.interval + '</div>' +
      '<div><strong>필터:</strong> ' + filterInfo.filters + '</div>' +
      '<div><strong>차트 모드:</strong> ' + filterInfo.mode + '</div>' +
    '</div>';
  
  return section;
}

function createLegendSection() {
  const section = document.createElement('div');
  section.style.marginBottom = '20px';
  section.style.padding = '15px';
  section.style.backgroundColor = '#f8f9fa';
  section.style.borderRadius = '5px';
  
  const legendTitle = document.createElement('h3');
  legendTitle.style.margin = '0 0 10px 0';
  legendTitle.style.fontSize = '14px';
  legendTitle.style.color = '#333';
  legendTitle.textContent = '범례';
  
  const legendGrid = document.createElement('div');
  legendGrid.style.display = 'grid';
  legendGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
  legendGrid.style.gap = '8px';
  legendGrid.style.fontSize = '11px';
  
  // 카테고리별 색상과 이름 표시
  const categories = ['0101', '0102', '0103', '0104', '0105', '0106', '0107', '0108', '0109', '0110', '0111'];
  const colors = d3.scaleOrdinal(d3.schemeSet3).domain(categories);
  
  categories.forEach(function(categoryId) {
    const legendItem = document.createElement('div');
    legendItem.style.display = 'flex';
    legendItem.style.alignItems = 'center';
    legendItem.style.gap = '5px';
    
    const colorBox = document.createElement('div');
    colorBox.style.width = '12px';
    colorBox.style.height = '12px';
    colorBox.style.backgroundColor = colors(categoryId);
    colorBox.style.border = '1px solid #ccc';
    
    const label = document.createElement('span');
    label.textContent = getCategoryName(categoryId);
    
    legendItem.appendChild(colorBox);
    legendItem.appendChild(label);
    legendGrid.appendChild(legendItem);
  });
  
  section.appendChild(legendTitle);
  section.appendChild(legendGrid);
  
  return section;
}

function downloadGraphReportPages() {
  console.log("페이지별 리포트 다운로드 시작");
  
  const exportBtn = document.getElementById('exportData');
  const originalText = exportBtn ? exportBtn.textContent : '';
  
  if (exportBtn) {
    exportBtn.textContent = '리포트 분석 중...';
    exportBtn.disabled = true;
  }
  
  // 데이터가 있는 구간 찾기
  const dataRanges = findDataRanges();
  
  if (dataRanges.length === 0) {
    alert('표시할 데이터가 없습니다.');
    if (exportBtn) {
      exportBtn.textContent = originalText;
      exportBtn.disabled = false;
    }
    return;
  }
  
  // 현재 필터 정보 수집
  const filterInfo = getCurrentFilterInfo();
  
  // 페이지별로 다운로드
  downloadPagesSequentially(dataRanges, filterInfo, 0, originalText);
}

function findDataRanges() {
  const svg = document.getElementById('barplotSvg');
  const wrapper = document.getElementById('barplotWrapper');
  
  if (!svg || !wrapper) return [];
  
  const ranges = [];
  const rects = svg.querySelectorAll('rect');
  const positions = [];
  
  // 데이터가 있는 바들의 X 위치 수집
  rects.forEach(function(rect) {
    const height = parseFloat(rect.getAttribute('height') || 0);
    if (height > 0) { // 높이가 0보다 큰 바만
      const x = parseFloat(rect.getAttribute('x') || 0);
      positions.push(x);
    }
  });
  
  if (positions.length === 0) return [];
  
  // X 위치 정렬 및 중복 제거
  const uniquePositions = [...new Set(positions)].sort((a, b) => a - b);
  
  // 연속된 구간으로 그룹화
  const pageWidth = wrapper.clientWidth - 100; // 여백 고려
  const margin = 50; // 좌우 여백
  
  let currentStart = uniquePositions[0] - margin;
  let currentEnd = uniquePositions[0] + margin;
  
  for (let i = 1; i < uniquePositions.length; i++) {
    const pos = uniquePositions[i];
    
    // 현재 페이지 범위를 벗어나거나 너무 멀리 떨어진 경우
    if (pos - currentStart > pageWidth || pos - currentEnd > 200) {
      ranges.push({
        start: Math.max(0, currentStart),
        end: currentEnd,
        width: currentEnd - currentStart
      });
      currentStart = pos - margin;
      currentEnd = pos + margin;
    } else {
      currentEnd = pos + margin;
    }
  }
  
  // 마지막 구간 추가
  ranges.push({
    start: Math.max(0, currentStart),
    end: currentEnd,
    width: currentEnd - currentStart
  });
  
  return ranges;
}

function downloadPagesSequentially(dataRanges, filterInfo, pageIndex, originalText) {
  if (pageIndex >= dataRanges.length) {
    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
      exportBtn.textContent = originalText;
      exportBtn.disabled = false;
    }
    alert('총 ' + dataRanges.length + '개 페이지 다운로드가 완료되었습니다.');
    return;
  }
  
  const exportBtn = document.getElementById('exportData');
  if (exportBtn) {
    exportBtn.textContent = '페이지 ' + (pageIndex + 1) + '/' + dataRanges.length + ' 생성 중...';
  }
  
  const range = dataRanges[pageIndex];
  
  // 현재 페이지 리포트 생성
  const reportContainer = createPageReport(filterInfo, range, pageIndex + 1, dataRanges.length);
  document.body.appendChild(reportContainer);
  
  // html2canvas로 캡처
  html2canvas(reportContainer, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    width: reportContainer.offsetWidth,
    height: reportContainer.offsetHeight
  }).then(function(canvas) {
    const now = new Date();
    const timestamp = now.getFullYear() + 
                     (now.getMonth() + 1).toString().padStart(2, '0') + 
                     now.getDate().toString().padStart(2, '0') + '_' +
                     now.getHours().toString().padStart(2, '0') + 
                     now.getMinutes().toString().padStart(2, '0');
    
    const link = document.createElement('a');
    link.download = `complaint_report_${timestamp}_page${pageIndex + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 임시 컨테이너 제거
    document.body.removeChild(reportContainer);
    
    // 다음 페이지 처리 (약간의 지연을 두어 브라우저 부하 방지)
    setTimeout(function() {
      downloadPagesSequentially(dataRanges, filterInfo, pageIndex + 1, originalText);
    }, 500);
    
  }).catch(function(error) {
    console.error(`페이지 ${pageIndex + 1} 생성 중 오류:`, error);
    document.body.removeChild(reportContainer);
    
    // 오류가 있어도 다음 페이지 계속 진행
    setTimeout(function() {
      downloadPagesSequentially(dataRanges, filterInfo, pageIndex + 1, originalText);
    }, 500);
  });
}

function createPageReport(filterInfo, range, pageNum, totalPages) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '1400px';
  container.style.backgroundColor = 'white';
  container.style.padding = '30px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.boxSizing = 'border-box';
  
  // 헤더 생성 (페이지 정보 포함)
  const header = createPageHeader(filterInfo, pageNum, totalPages);
  container.appendChild(header);
  
  // 필터 정보 (첫 페이지에만)
  if (pageNum === 1) {
    const filterSection = createFilterSection(filterInfo);
    container.appendChild(filterSection);
  }
  
  // 해당 범위의 그래프 생성
  const graphSection = createRangedGraphSection(range);
  container.appendChild(graphSection);
  
  // 범례 (마지막 페이지에만)
  if (pageNum === totalPages) {
    const legendSection = createLegendSection();
    container.appendChild(legendSection);
  }
  
  // 푸터
  const footer = createPageFooter(filterInfo, pageNum, totalPages);
  container.appendChild(footer);
  
  return container;
}

function createPageHeader(filterInfo, pageNum, totalPages) {
  const header = document.createElement('div');
  header.style.marginBottom = '20px';
  header.style.borderBottom = '2px solid #333';
  header.style.paddingBottom = '15px';
  
  header.innerHTML = 
    '<h1 style="margin: 0; font-size: 24px; color: #333; text-align: center;">' +
      '민원 데이터 분석 리포트 (' + pageNum + '/' + totalPages + ')' +
    '</h1>' +
    '<p style="margin: 10px 0 0 0; text-align: center; color: #666; font-size: 14px;">' +
      filterInfo.location + ' | ' + filterInfo.category +
    '</p>';
  
  return header;
}

function createRangedGraphSection(range) {
  const section = document.createElement('div');
  section.style.marginBottom = '20px';
  section.style.position = 'relative';
  section.style.overflow = 'hidden';
  
  // Y축 복사
  const yAxisContainer = document.getElementById('yAxisContainer');
  const yAxisClone = yAxisContainer.cloneNode(true);
  yAxisClone.style.position = 'absolute';
  yAxisClone.style.left = '0px';
  yAxisClone.style.top = '0px';
  yAxisClone.style.width = '60px';
  yAxisClone.style.height = '540px';
  
  // 그래프 영역 복사 및 범위 조정
  const originalSvg = document.getElementById('barplotSvg');
  const svgClone = originalSvg.cloneNode(true);
  
  const graphContainer = document.createElement('div');
  graphContainer.style.position = 'absolute';
  graphContainer.style.left = '60px';
  graphContainer.style.top = '0px';
  graphContainer.style.width = (range.width + 100) + 'px'; // 여백 추가
  graphContainer.style.height = '540px';
  graphContainer.style.overflow = 'hidden';
  
  // SVG viewBox를 해당 범위로 설정
  const svgWidth = parseFloat(originalSvg.getAttribute('width')) || originalSvg.clientWidth;
  const svgHeight = parseFloat(originalSvg.getAttribute('height')) || originalSvg.clientHeight;
  
  svgClone.setAttribute('viewBox', `${range.start} 0 ${range.width + 100} ${svgHeight}`);
  svgClone.setAttribute('width', range.width + 100);
  svgClone.setAttribute('height', svgHeight);
  
  graphContainer.appendChild(svgClone);
  section.appendChild(yAxisClone);
  section.appendChild(graphContainer);
  
  // 전체 섹션 크기 조정
  section.style.width = (range.width + 160) + 'px'; // Y축 + 그래프 + 여백
  section.style.height = '540px';
  
  return section;
}

function createPageFooter(filterInfo, pageNum, totalPages) {
  const footer = document.createElement('div');
  footer.style.marginTop = '20px';
  footer.style.paddingTop = '15px';
  footer.style.borderTop = '1px solid #ddd';
  footer.style.fontSize = '11px';
  footer.style.color = '#666';
  footer.style.display = 'flex';
  footer.style.justifyContent = 'space-between';
  
  footer.innerHTML = 
    '<div>' +
      '<p style="margin: 0;">페이지 ' + pageNum + ' / ' + totalPages + '</p>' +
    '</div>' +
    '<div style="text-align: right;">' +
      '<p style="margin: 0;">생성일시: ' + filterInfo.generatedAt + '</p>' +
      '<p style="margin: 5px 0 0 0;">민원 클러스터 시각화 시스템</p>' +
    '</div>';
  
  return footer;
}
