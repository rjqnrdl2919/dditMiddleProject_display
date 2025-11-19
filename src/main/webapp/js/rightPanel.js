/**
 * adminsite 우측 패널
 */
const donutContainer = d3.select("#donutCategoryChart");
const donutSVG = donutContainer.append("svg")
	.attr("width", "100%")
	.attr("height", "100%")
	.attr("preserveAspectRatio", "xMidYMid meet");

const donutSvg = donutSVG.append("g");

const donutArc = d3.arc().innerRadius(80).outerRadius(140);
const donutOuterArc = d3.arc().innerRadius(145).outerRadius(145);
const donutPie = d3.pie().sort(null).value(d => d.value);
const donutColor = d3.scaleOrdinal(d3.schemeSet3);

function resizeDonutViewBox() {
	const rawWidth = donutContainer.node().clientWidth;
	const rawHeight = donutContainer.node().clientHeight;

	const margin = 20; // 충분한 여백 확보
	const width = rawWidth + margin * 2;
	const height = rawHeight + margin * 2;

	donutSVG.attr("viewBox", `0 0 ${width} ${height}`);
	donutSvg.attr("transform", `translate(${width / 2}, ${height / 2})`);
}
const donutResizeObserver = new ResizeObserver(resizeDonutViewBox);
donutResizeObserver.observe(donutContainer.node());

function loadDonutCategoryChart(addressCode, period = "recent") {
	// period가 "all"일 때고 addressCode 쿼리값을 포함하도록 수정
	const base = `/webpro/api/graph-donut-${period}`;
	const params = addressCode ? `?addressCode=${addressCode}` : '';
	const url = base + params;

	fetch(`${url}`)
		.then(res => {
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${res.statusText}`);
			}	
			return res.json();
		})
		.then(data => {
			if (!data || !Array.isArray(data)) {
			    console.warn('Invalid donut data format:', data);
			    d3.select("#donutCategoryNoData").style("display", "block");
			    d3.select("#donutCategoryChart").style("display", "none");
			    return;
			}
			const grouped = groupBySecondCategory(data).filter(d => d.value > 0);
			const total = d3.sum(grouped, d => d.value);

			donutSvg.selectAll("*").remove();
			d3.select("#donutCategoryNoData").style("display", total === 0 ? "block" : "none");
			d3.select("#donutCategoryChart").style("display", total === 0 ? "none" : "block");
			if (total === 0) return;

			// 긴 라벨 우선 정렬로 위/아래 배치 유도
			const sortedGrouped = grouped.slice().sort((a, b) => b.label.length - a.label.length);
			const pieData = donutPie(sortedGrouped);

			donutSvg.selectAll("path")
				.data(pieData)
				.join("path")
				.attr("fill", d => donutColor(d.data.label))
				.attr("stroke", "#fff")
				.attr("stroke-width", 1.5)
				.transition()
				.duration(800)
				.attrTween("d", function(d) {
					const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
					return t => donutArc(i(t));
				});

			donutSvg.selectAll("polyline")
				.data(pieData)
				.join("polyline")
				.attr("stroke", "#6f6f6f")
				.style("fill", "none")
				.attr("stroke-width", 1.5)
				.transition()
				.duration(800)
				.attrTween("points", function(d) {
					const i = d3.interpolate({ startAngle: 0, endAngle: 0}, d);
					return function(t) {
						const d2 = i(t);
						const posA = donutArc.centroid(d2);
						const posB = donutOuterArc.centroid(d2);
						const posC = [...posB];
						const midAngle = (d2.startAngle + d2.endAngle) / 2;
						posC[0] += (midAngle < Math.PI ? 1 : -1) * 5; // 여백 확장
						return [posA, posB, posC];
					};
				});

			donutSvg.selectAll("text")
				.data(pieData)
				.join("text")
				.text(d => `${d.data.label} (${d.data.value})`)
				.transition()
				.duration(800)
				.attrTween("transform", function(d) {
					const i = d3.interpolate({ startAngle: 0, endAngle: 0}, d);
					return function(t) {
						const d2 = i(t);					
						const pos = [...donutOuterArc.centroid(d2)];
						const midAngle = (d2.startAngle + d2.endAngle) / 2;
						pos[0] += (midAngle < Math.PI ? 1 : -1) * 7; // 여백 확장
						return `translate(${pos})`;
					}
				})
				.style("text-anchor", d => (d.startAngle + d.endAngle) / 2 < Math.PI ? "start" : "end")
				.style("font-size", "13px")
				.style("font-weight", "bold")
				.style("alignment-baseline", "middle")
			
			donutSvg.selectAll(".donut-center-text").remove();

			donutSvg.append("text")
				.attr("class", "donut-center-text")
				.attr("text-anchor", "middle")
				.attr("dy", "-0.3em")
				.style("font-size", "14px")
				.style("font-weight", "bold")
				.text(`총 민원`);

			donutSvg.append("text")
				.attr("class", "donut-center-text")
				.attr("text-anchor", "middle")
				.attr("dy", "1.2em")
				.style("font-size", "16px")
				.text(`${total.toLocaleString()}건`);		
		})
		.catch(error => {
			console.error('Error loading donut chart:', error);
			d3.select("#donutCategoryNoData").style("display", "block");
			d3.select("#donutCategoryChart").style("display", "none");
		});
}

function groupBySecondCategory(data) {
	const grouped = {};
	data.forEach(d => {
		const name = d.categoryName || "기타";
		const count = parseInt(d.complaintCount) || 0;
		grouped[name] = (grouped[name] || 0) + count;
	});
	return Object.entries(grouped).map(([label, value]) => ({ label, value }));
}

/////////////////////////////////////////////////////////////////////////////////

// 선형 차트 설정
const lineMargin = {top: 10, right: 20, bottom: 30, left: 50};
const lineContainer = d3.select("#lineStatusChart");

let lineW, lineH, currentUnit = "halfhour";
let x = d3.scaleTime();
let y = d3.scaleLinear();

const lineSvg = lineContainer.append("svg")
	.attr("width", "100%")
	.attr("height", "100%")
	.append("g")
	.attr("transform", `translate(${lineMargin.left},${lineMargin.top})`);
	

const color = d3.scaleOrdinal()
	.domain(["NEW", "IN_PROGRESS"])
	.range(["#08d0fc", "#02bf34"]);	
	
lineSvg.append("g").attr("class", "x-axis");
lineSvg.append("g").attr("class", "y-axis");	
	
function resizeLineChartSize() {
	const containerWidth = lineContainer.node().clientWidth;
	const containerHeight = lineContainer.node().clientHeight;

	lineW = containerWidth - lineMargin.left - lineMargin.right;
	lineH = containerHeight - lineMargin.top - lineMargin.bottom;

	x.range([0, lineW]);
	y.range([lineH, 0]);

	lineSvg.select(".x-axis").attr("transform", `translate(0, ${lineH})`);

	// 차트가 이미 렌더링된 경우 다시 그리기
	if (lineSvg.selectAll(".lineSeries").size() > 0) {
	    loadLineChart(currentUnit); //또는 현재 unit 상태 저장해서 사용
	}
}
	
const lineResizeObserver = new ResizeObserver(() => {
    resizeLineChartSize();
});
lineResizeObserver.observe(lineContainer.node());

resizeLineChartSize();

function loadLineChart(unit) {
	// 유효성 검사 추가
	if (!unit || typeof unit != 'string'){
		console.error('Invalid unit parameter:', unit);
		return;
	}
	currentUnit = unit; //현재 unit 저장
	
	fetch(`/webpro/api/graph-line-${unit}`)
		.then(res => {
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);	
			}
			return res.json();
		})
		.then(rawData => {
			console.log('Raw data received:', rawData);
			
			if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
				d3.select("#lineStatusNoData").style("display", "block");
				d3.select("#lineStatusChart").style("display", "none");
				return;
			}
			
			// 유효한 데이터만 필터링
			let validData = rawData.filter(d =>
				d.savedAt &&
				d.complaintCount !== undefined &&
				d.complaintCount !== null &&
				!isNaN(d.complaintCount)
			);
			
			// 30분 단위일때는 최근 3시간만 보이게
			if (unit === "halfhour") {
				const latestTime = d3.max(validData, d => new Date(d.savedAt));
				const threeHoursAgo = new Date(latestTime.getTime() - 3 * 60 * 60 * 1000);
				validData = validData.filter(d => new Date(d.savedAt) >= threeHoursAgo);
			}
			
			if(validData.length === 0){
				d3.select("#lineStatusNoData").style("display", "block");
				d3.select("#lineStatusChart").style("display", "none");
				return;				
			}
			
			d3.select("#lineStatusNoData").style("display", "none");
			d3.select("#lineStatusChart").style("display", "block");			

			const grouped = d3.groups(validData, d => d.status);
			const allTimes = validData.map(d => new Date(d.savedAt));
			const maxCount = d3.max(validData, d => parseInt(d.complaintCount) || 0) || 0;
			const minCount = d3.min(validData, d => parseInt(d.complaintCount) || 0) || 0;

			const buffer = Math.max(Math.floor(maxCount * 0.1), 5);
			const safeDomain = [
				Math.max(minCount - buffer, 0),
				maxCount + buffer
			];

			x.domain(d3.extent(allTimes));
			y.domain(safeDomain);
			
			const lineGenerator = d3.line()
				.x(d => x(new Date(d.savedAt)))
				.y(d => y(parseInt(d.complaintCount) || 0));

			const xFormat = unit === "halfhour" ? d3.timeFormat("%H:%M") : d3.timeFormat("%m-%d");
			lineSvg.select(".x-axis")
				   .transition()
				   .duration(800)
				   .call(d3.axisBottom(x).tickFormat(xFormat).ticks(5))
				   .style("font-size", "12px")
				   .style("font-weight", "bold");
				   
			lineSvg.select(".y-axis")
				   .transition()
				   .duration(800)
				   .call(d3.axisLeft(y).ticks(4))
				   .style("font-size", "13px")
				   .style("font-weight", "bold");
				   
			   // 기존 격자선 제거
			   lineSvg.selectAll(".grid").remove();

			   // 격자선이 제대로 그려지는지 확인
			   console.log('Creating grid with lineW:', lineW, 'lineH:', lineH);

			   // Y축 격자선 (수평선)
			   if (lineW > 0) {
			       lineSvg.append("g")
			           .attr("class", "grid y-grid")
			           .call(d3.axisLeft(y)
			               .ticks(4)
			               .tickSize(-lineW)
			               .tickFormat(""))
			           .selectAll("line")
			           .style("stroke", "#e0e0e0")
			           .style("stroke-width", "1px")
			           .style("stroke-dasharray", "3,3")
			           .style("opacity", 0.7);
			   }

			   // X축 격자선 (수직선)
			   if (lineH > 0) {
			       lineSvg.append("g")
			           .attr("class", "grid x-grid")
			           .attr("transform", `translate(0, ${lineH})`)
			           .call(d3.axisBottom(x)
			               .ticks(5)
			               .tickSize(-lineH)
			               .tickFormat(""))
			           .selectAll("line")
			           .style("stroke", "#e0e0e0")
			           .style("stroke-width", "1px")
			           .style("stroke-dasharray", "3,3")
			           .style("opacity", 0.7);
			   }

			   // 격자선의 축 path 제거
			   lineSvg.selectAll(".grid path").remove();

			   // 격자선을 배경으로 보내기
			   lineSvg.selectAll(".grid").lower();

			lineSvg.selectAll(".axis-label").remove();
			lineSvg.selectAll(".lineSeries").remove();
			lineSvg.selectAll(".legend").remove();
			
			grouped.forEach(([status, values]) => {
				if (!values || values.length === 0) return; // 빈 그룹 스킵
				
				lineSvg.append("path")
					.datum(values)
					.attr("class", "lineSeries")
					.attr("fill", "none")
					.attr("stroke", color(status))
					.attr("stroke-width", 2)
					.attr("d", d3.line()
					        	.x(d => x(new Date(d.savedAt)))
					        	.y(() => y(Math.max(minCount, 0)))) // 최소값 0 보장
					.transition()
					.duration(800)
					.attr("d", lineGenerator);
			});

			const statusLabelMap = {
				"NEW": "신규",
				"IN_PROGRESS": "처리중"
			};

			["NEW", "IN_PROGRESS"].forEach((status, i) => {
				const legendX = Math.max(lineW - 80, 10); // 최소 여백 보장
				const legendY = Math.max(i * 25, 10);

				lineSvg.append("rect")
					.attr("class", "legend")
					.attr("x", legendX)
					.attr("y", legendY)					
					.attr("width", 10)
					.attr("height", 10)
					.attr("fill", color(status));
					
				lineSvg.append("text")
					.attr("class", "legend")					
				    .attr("x", legendX + 15)
					.attr("y", legendY + 9)
					.attr("font-size", "13px")
					.style("font-weight", "bold")
					.text(statusLabelMap[status]);
			});
		}).catch(error => {
			console.error('Error loading chart data:', error);
			d3.select("#lineStatusNoData").style("display", "block");
			d3.select("#lineStatusChart").style("display", "none");
		});
}

// 초기 30분 단위 로딩
loadLineChart("halfhour");