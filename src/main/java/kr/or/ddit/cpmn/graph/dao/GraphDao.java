package kr.or.ddit.cpmn.graph.dao;

import java.util.List;
import java.util.Map;

import kr.or.ddit.cpmn.graph.vo.GraphVO;

/**
 * 그래프 DAO 인터페이스
 */
public interface GraphDao {
	/**
	 * 최근 지도 그래프용 DAO
	 * @return 
	 */
	List<GraphVO> selectGraphMapRecent();

	/**
	 * 전체기간 지도 그래프용 DAO
	 * @return 
	 */
	List<GraphVO> selectGraphMapAll();
	
	/**
	 * 긴급민원 지도 그래프용 DAO
	 * @return 
	 */
	List<GraphVO> getGraphMapUrgent();
	
	/**
	 * 최근 도넛차트용 DAO
	 * @return 
	 */
	List<GraphVO> selectGraphDonutRecent(String addressCode);
	
	/**
	 * 전체 도넛차트용 DAO 
	 * @return
	 */
	List<GraphVO> selectGraphDonutAll(String addressCode);
	
	/**
	 * 30분 선형그래프용 DAO
	 * @return
	 */
	List<GraphVO> selectGraphLineHalfHour();
	
	/**
	 * 일일 선형그래프용 DAO
	 * @return
	 */
	List<GraphVO> selectGraphLineDaily();	
	
	/**
	 * 민원 클러스터 상세보기용 DAO
	 * @return
	 */
	List<GraphVO> selectClusterData(Map<String, Object> params);
	
	/**
	 * 민원 상태 클러스터 상세보기용 DAO
	 * @return
	 */
	List<GraphVO> selectStatusData(Map<String, Object> params);

	/**
	 * 주소 목록 드롭다운용 DAO
	 * @return
	 */
	List<GraphVO> getAddressList();
	
	/**
	 * 유형 목록 드롭다운용 DAO
	 * @return
	 */
	List<GraphVO> getCategoryList();
}	
