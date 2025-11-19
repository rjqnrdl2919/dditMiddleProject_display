<%@ page contentType="text/html; charset=UTF-8" language="java" %>
<!DOCTYPE html>

<html lang="ko">
<script>
  window.contextPath = '<%= request.getContextPath() %>';
</script>

<head>
  <meta charset="UTF-8">
  <title>관리자 대시보드</title>

  <!-- jQuery -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

  <!-- Bootstrap -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

  <!-- Leaflet -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet/dist/leaflet.css" />
  <script src="https://cdn.jsdelivr.net/npm/leaflet/dist/leaflet.js"></script>

  <!-- D3 -->
  <script src="https://d3js.org/d3.v7.min.js"></script>

  <!-- 사용자 정의 CSS -->
  <link rel="stylesheet" href="../css/manage.css" />
  <link rel="stylesheet" href="../css/graph.css" />

</head>
<body>

<!-- ✅ 슬라이드 사이드바 -->
<div id="sidebar" class="sidebar">
  <!-- <button class="close-btn" onclick="toggleSidebar()"> ✕ </button> -->
  <ul>
    <li><a href="<%= request.getContextPath() %>/adminsite/managerpage.jsp">대시보드</a></li>
    <li class="has-submenu">
      <a href="#" class="submenu-toggle">민원 관리 </a>
      <ul class="submenu">
        <li><a href="#" id="cpmnboard">게시판 관리</a></li>
        <li><a href="#" id="blacklist">블랙리스트 관리</a></li>
        <li><a href="#" id="dataManage">데이터 관리</a></li>
        <li><a href="#" id="chatmanage">1:1 대화 신청 확인</a></li>
      </ul>
    </li>
    <li><a href="#" id="noticeMenu">공지사항</a></li>
    <li><a href="#" id="memberInfo">회원 정보</a></li>
    <li><a href="#" id="faqMenu">FAQ</a></li>
  </ul>
</div>

<!-- ✅ 사이드바 열기 버튼 -->
<button class="open-btn" onclick="toggleSidebar()">☰</button>

<!-- ✅ 상단 고정 헤더 -->
<header class="admin-header">
  <div class="admin-header-left">
    <h1 style="font-size: 1.2em; margin: 0;">
      <a href="<%= request.getContextPath() %>/adminsite/managerpage.jsp" style="text-decoration:none; color:inherit;">
        관리자 대시보드
      </a>
    </h1>
  </div>
  <div class="admin-header-right">
    <button onclick="location.href='<%= request.getContextPath() %>/AdminLogout.do'">로그아웃</button>
  </div>
</header>

<!-- ✅ 메인 콘텐츠 -->
<main class="admin-main" id="mainContent">

  <!-- 채팅 테이블 영역 -->
  <div id="chatSection" style="display: none;">
    <h2>1:1 대화 신청 확인</h2>
    <div class="table-responsive">
      <table id="chatTable" class="table table-bordered table-hover" style="width: 100%; text-align: center;">
        <thead class="table-light">
          <tr>
            <th>민원 ID</th>
            <th>신청인</th>
            <th>대화 신청 메시지</th>
            <th>대화 수락</th>
          </tr>
        </thead>
        <tbody>
          <!-- chatlist.js에서 동적으로 채워짐 -->
        </tbody>
      </table>
    </div>
  </div>
  
	<!-- 대전시 민원 지도 및 차트 -->
	<div id="mapSection">
		<div style="display: flex; justify-content: right; align-items: center;">
		<!-- 좌측 패널 -->
			<div id="leftPanel">
				<div id="complainSummaryCard" class="card">
        		<div class="card-title">
				  <a href="#" id="btnGocomplainList" style="text-decoration:none; color:inherit; display:block;">
				    민원 현황
				  </a>
        		</div>
        		<div id="complainSummary" class="card-body">
        	</div>
        	</div>

			 <!-- 공지사항 요약 카드 (수정된 부분) -->
			  <div id="noticeSummaryCard" class="card">
			    <div class="card-title">  			
				  <a href="#" id="btnGoNoticeList" style="text-decoration:none; color:inherit; display:block;">
				    공지사항
				  </a>
				 </div>
			    <div id="noticeSummary" class="card-body">
			      <div class="text-muted">로딩 중...</div>
			    </div>
			  </div>
			</div>

		<!-- 지도 -->
    	<div id="mapWrapper" class="card">
			<svg id="map"></svg>

			<!-- 드롭다운 및 뒤로가기 -->
			<div class="card map-control-card">
				<div id="locationInfo">대전광역시 전체</div>
				<div class="range-select-row">
					<label for="timeRange">기간 선택:</label>
					<select id="timeRange">
						<option value="recent" selected>최근 24시간</option>
						<option value="all">전체</option>
					</select>
				</div>
			</div>

			<div id="back-button-wrapper">
				<!-- <button id="backButton" style="display:none; font-size:13px; padding:0.5vh;">← 뒤로가기</button> -->
				<button id="backButton" class="btn btn-outline-primary btn-sm" style="display:none;">← 뒤로가기</button>
			</div>
		</div>

		<!-- 우측 패널 -->
		<div id="rightPanel">
			<div id="donutCategoryCard" class="card">
				<div class="card-title">민원 유형 비율</div>
				<svg id="donutCategoryChart"></svg>
				<div id="donutCategoryNoData" class="no-data">민원이 없습니다.</div>	
			</div>
	
			<div id="lineStatusCard" class="card">
				<div class="card-title">미완료 민원 현황</div>
				<svg id="lineStatusChart"></svg>
				<div id="lineStatusNoData" class="no-data">민원이 없습니다.</div>
				<div class="chart-btn-row">
					<button class="btn btn-outline-primary btn-sm" onclick="loadLineChart('halfhour')">30분 민원량</button>
					<button class="btn btn-outline-primary btn-sm" onclick="loadLineChart('daily')">1일 민원량</button>
				</div>
			</div>
		</div>
	</div>
</div>
  
</main>


<!-- ✅ JavaScript 설정 -->
<script>
  window.contextPath = '<%= request.getContextPath() %>';

  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
  }
</script>

<script src="<%= request.getContextPath() %>/js/graphMap.js"></script>
<script src="<%= request.getContextPath() %>/js/rightPanel.js"></script>
<script src="<%= request.getContextPath() %>/js/dataManage.js"></script>
</body>
</html>
