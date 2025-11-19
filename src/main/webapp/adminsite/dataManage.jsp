<%@ page contentType="text/html; charset=UTF-8" language="java" %>

<!DOCTYPE html>

<html lang="ko">
<script>
  window.contextPath = '<%= request.getContextPath() %>';
</script>

<head>
  <meta charset="UTF-8">
  <title>민원 클러스터 시각화</title>

  <!-- ✅ jQuery → Bootstrap 순서 중요 -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  
  <!-- D3.JS -->
  <script src="https://d3js.org/d3.v6.min.js"></script> 
  
  <!-- 이미지 저장 JS -->
  <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>

  <!-- 사용자 정의 CSS -->
  <link rel="stylesheet" href="../css/manage.css">
  <link rel="stylesheet" href="../css/graph.css">
  
  <style>
.board-container {
  padding: 20px;
  padding-right: 60px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.05);
  width: 1240px;
  min-height: 820px;
  margin: 0 auto;
}

/* 헤더 수정 - 버튼을 위쪽 오른쪽으로 이동 */
.board-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* 상단 정렬로 변경 */
  margin-bottom: 15px;
  height: 48px; /* 높이 자동 조정 */
}

/* 버튼 패널 스타일링 */
#buttonPanel {
  margin-top: 15px; /* 더 위쪽으로 이동 */
  margin-right: 10px; /* 더 오른쪽으로 이동 */
}

#buttonPanel button {
  padding: 10px 20px; /* 버튼 크기 증가 */
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}

#buttonPanel button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,123,255,0.3);
}

#barplotSvg {
	width: auto !important;
	height: auto !important;
	display: block;
}

#chartContainer {
  position: relative;
  width: 100%;
  height: 540px;
}

#yAxisContainer {
  position: absolute;
  left: 0;
  top: 0;
  width: 60px;
  height: 540px;
  z-index: 10;
  background: white;
  border-right: 1px solid #ccc;
}

#barplotWrapper {
  margin-left: 60px;
  overflow-x: auto;
  overflow-y: hidden;
  width: calc(100% - 60px);
  height: 540px;
}

.x-axis {
  z-index: 100 !important;
  pointer-events: none;
}

.y-axis {
  z-index: 100 !important;
  pointer-events: none;
}

.x-axis line,
.x-axis path,
.y-axis line,
.y-axis path {
  stroke: #000;
  stroke-width: 1;
  fill: none;
  z-index: 101 !important;
}

.x-axis text,
.y-axis text {
  fill: #000;
  z-index: 102 !important;
  font-family: sans-serif;
  font-size: 10px;
}

g.layer {
  z-index: 1;
}

.axis line,
.axis path {
  stroke: #000;
  stroke-width: 1;
  fill: none;
}

.axis text {
  font-family: sans-serif;
  font-size: 10px;
  fill: #000;
  z-index: 21;
}

/* 스크롤바 스타일링 */
#barplotWrapper::-webkit-scrollbar {
  height: 8px;
}

#barplotWrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
}

#barplotWrapper::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

#barplotWrapper::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.tooltip {
  position: absolute;
  background-color: white;
  border: solid 1px #ccc;
  border-radius: 5px;
  padding: 10px;
  opacity: 0;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  font-size: 12px;
  z-index: 1000;
}

.tooltip .category-name {
  font-weight: bold;
  color: #333;
}

.tooltip .value {
  color: #666;
}

/* 하이라이트 효과 */
g.layer.highlighted {
  opacity: 1 !important;
}

g.layer.dimmed {
  opacity: 0.3 !important;
}

/* 카테고리별 클래스 */
g.layer.0101, g.layer.0102, g.layer.0103, g.layer.0104, 
g.layer.0105, g.layer.0106, g.layer.0107, g.layer.0108, 
g.layer.0109, g.layer.0110, g.layer.0111 {
  transition: opacity 0.3s ease;
}

.board-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.board-tabs .tab-btn {
  padding: 6px 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f8f9fa;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.board-tabs .tab-btn:hover {
  background-color: #e2e6ea;
}

.board-tabs .tab-btn.active {
  background-color: #003366;
  border-color: #003366;
  color: #fff;
  font-weight: bold;
}

/* 필터 패널 스타일링 - 가로 여백 증가 */
#filterPanel {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px 25px; /* 좌우 패딩 증가 */
  margin-bottom: 8px;
  max-width: 1100px; /* 최대 너비 제한 */
  margin-left: 50px;
  margin-right: 10px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px; /* 간격 증가 */
  align-items: center;
  margin-bottom: 12px; /* 행 간격 증가 */
  justify-content: flex-start; /* 왼쪽 정렬 */
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: white;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  flex-shrink: 0; /* 크기 고정 */
}

.filter-group label {
  font-weight: 500;
  color: #495057;
  margin: 0;
  white-space: nowrap;
  font-size: 14px;
}

.filter-group select,
.filter-group input[type="datetime-local"] {
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 14px;
  background-color: white;
  min-width: 120px;
}

.filter-group select:focus,
.filter-group input[type="datetime-local"]:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.checkbox-group {
  display: flex;
  gap: 12px; /* 체크박스 간격 증가 */
  background-color: white;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
  color: #495057;
  margin: 0;
  cursor: pointer;
  font-size: 14px;
}

.checkbox-group input[type="checkbox"] {
  margin: 0;
  cursor: pointer;
}

/* 그래프 모양 전환 버튼 스타일링 */
#toggleMode, #exportData{
  background-color: #007bff;
  color: white;
  border: 1px solid #007bff;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,123,255,0.3);
}

#toggleMode:hover, #exportData:hover{
  background-color: #0056b3;
  border-color: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0,123,255,0.4);
}

#toggleMode:active, #exportData:active{
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0,123,255,0.3);
}

/* 버튼이 들어간 checkbox-group 스타일 조정 */
.checkbox-group:has(#toggleMode) {
  background-color: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}
  </style>
  
</head>
<body>

<div class="board-container mt-4">
	<div class="board-header">
		<h3>데이터 관리</h3>
	</div>
	<!-- 버튼 -->

	<div class="board-tabs">
	  <button class="tab-btn" data-target="cpmnboard">게시판 관리</button>
	  <button class="tab-btn" data-target="blacklist">블랙 리스트 관리</button>
	  <button class="tab-btn active" data-target="dataManage">데이터 관리</button>
	  <button class="tab-btn" data-target="chatmanage">1:1 대화 신청 확인</button>
	</div>
	   <!-- 필터 -->
	<section id="filterPanel">
		<div class="filter-row">
	        <div class="filter-group">
	            <label>지역:</label>
	            <select id="sidoSelect"></select>
	            <select id="sigunguSelect"></select>
	            <select id="emdSelect"></select>
	        </div>
	        
	        <div class="filter-group">
	            <label>유형:</label>
	            <select id="category1stSelect"></select>
	            <select id="category2ndSelect"></select>
	        </div>
	        
	        <div class="checkbox-group">
	            <label><input type="checkbox" id="filterHarmful" checked="checked"> 악성</label>
	            <label><input type="checkbox" id="filterSpam" checked="checked"> 스팸</label>
	            <label><input type="checkbox" id="filterUrgent" checked="checked"> 긴급</label>
	        </div>
	    </div>
	    
	    <div class="filter-row">
	        <div class="filter-group">
	            <label>시작일시:</label>
	            <input type="datetime-local" id="startDate">
	        </div>
	        
	        <div class="filter-group">
	            <label>종료일시:</label>
	            <input type="datetime-local" id="endDate">
	        </div>
	        
	        <div class="filter-group">
	            <label>시간 간격:</label>
	            <select id="intervalSelect">
	                <option value="M30">30분</option>
	                <option value="H1">1시간</option>
	                <option value="H2">2시간</option>
	                <option value="H3">3시간</option>
	                <option value="H4">4시간</option>
	                <option value="H6">6시간</option>
	                <option value="H8">8시간</option>
	                <option value="H12">12시간</option>
	                <option value="D1">1일</option>
	            </select>
	        </div>
	        <div class="checkbox-group">
	        	<button id="toggleMode">그래프 전환</button>
 		        <button id="exportData">다운로드</button>
	        </div>	
	    </div>
	</section>
    <!-- 그래프 영역 -->
	<section>
	  <div id="chartContainer" style="position: relative;">
	  
	    <div id="yAxisContainer" style="position: absolute; left: 0; top: 0; z-index: 10; background: white;">
	      <svg id="fixedYAxis"></svg>
	    </div>
	    <div id="barplotWrapper" style="margin-left: 60px;">
	      <svg id="barplotSvg"></svg>
	    </div>
	  </div>
	  <div id="tooltip" class="tooltip"></div>
	</section>
</div>
</body>
</html>
