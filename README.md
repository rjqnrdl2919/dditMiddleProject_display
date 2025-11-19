# ComplainManager - 민원 관리 사이트

> 대덕인재개발원 중간 프로젝트에서 **직접 구현한 실제 코드만 모아둔 포트폴리오**입니다.  
> 본 저장소는 실행 환경 제공이 아닌 코드 전시 및 기술 구조 증빙이 목적입니다.
> 업데이트 중입니다!

<br>

## 주요 기술

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?style=flat&logo=d3.js&logoColor=white)

<br>

## 실제 프로젝트 구조

```
src/
└── main/
    ├── java/
    │   └── kr/or/ddit/cpmn/graph/
    │       ├── controller/       # Graph 관련 Java 컨트롤러 모듈 (총 9개)
    │       ├── dao/
    │       ├── service/
    │       └── vo/
    ├── webapp/
    │   ├── adminsite/
    │   │   ├── dataManage.jsp        # 관리자 데이터 관리(뷰)
    │   │   ├── managerpage.jsp       # 관리자 대시보드(뷰)
    │   │   ├── 대전시 구역 WGS84.geojson
    │   │   └── 대전시 읍면동 WGS84.geojson
    │   ├── css/
    │   └── js/
    │       ├── dataManage.js         # JS: 데이터 관리 페이지 로직 (44KB)
    │       ├── graphMap.js           # JS: 지도/그래프 인터랙션 (13KB)
    │       └── rightPanel.js         # JS: 우측 패널 동작 (12KB)
    └── resources/
```

<br>

## 주요 구현 기능

### 1. **지도 데이터 관리 및 시각화**
- `dataManage.jsp`, `dataManage.js` (44KB)
  - 대전시 읍면/구역 GeoJSON 연동
  - 지도 데이터 시각화, 정보 패널, CRUD 기능 로직 구현

### 2. **그래프 데이터 인터랙션**
- `graphMap.js` (13KB)
  - 지도와 연동된 데이터 기반 그래프(도넛/라인 등) 시각화  
  - 각종 필터(카테고리, 기간 등) 적용 및 redraw UI 인터랙션 처리

### 3. **관리자 대시보드 + 컨트롤러 계층**
- `managerpage.jsp`, `rightPanel.js` (12KB)
  - 관리용 UI 및 부가 기능
- `kr/or/ddit/cpmn/graph/controller/` 내 Java 클래스
  - ClusterData, GraphDonutAll/Recent, GraphLineDaily/HalfHour, GraphMapAll/Recent/Urgent 등 각종 통계·지도 API/로직 처리 담당

<br>

## Java Controller 구조

`src/main/java/kr/or/ddit/cpmn/graph/controller/` 패키지 내 REST API 컨트롤러:

- **ClusterData.java** - 클러스터 데이터 처리
- **GraphDonutAll.java** - 전체 도넛 차트 데이터
- **GraphDonutRecent.java** - 최근 도넛 차트 데이터
- **GraphLineDaily.java** - 일별 라인 차트 데이터
- **GraphLineHalfHour.java** - 30분 단위 라인 차트 데이터
- **GraphMapAll.java** - 전체 지도 데이터
- **GraphMapRecent.java** - 최근 지도 데이터
- **GraphMapUrgent.java** - 긴급 지도 데이터
- **ListAddressCategory.java** - 주소 카테고리 리스트

<br>

## RESTful/프론트엔드 연동 예시

```javascript
// dataManage.js - GeoJSON 연동 후 지도 렌더링
fetch('./adminsite/대전시 구역 WGS84.geojson')
  .then(res => res.json())
  .then(geoData => drawMap(geoData));

// graphMap.js - 필터 변화시 그래프 SVG 다시 그림
function updateGraph(filter) {
  // AJAX로 데이터 받아와 redraw 수행
}
```

```java
// Java 컨트롤러 예시
@RequestMapping("/api/statistics/cluster")
public class ClusterData { 
    // 클러스터 데이터 API 로직
}
```

<br>

## 학습 및 성장 포인트

- **GeoJSON 처리**: 대용량(3MB+) GeoJSON 시각화 및 D3.js 지도 렌더링 경험
- **Controller 계층 분리**: RESTful 데이터 연동 구조, JSP·JS의 적절한 역할 분담 경험
- **복잡한 UI 인터랙션**: CRUD, 필터/검색, 실시간 차트 업데이트 등의 구현 역량

<br>

---

> 본 저장소는 중간 프로젝트 실 코드 기반의 API·시각화·관리자 페이지 예시만을 포함합니다. 
