package kr.or.ddit.cpmn.graph.service;

import java.util.List;
import java.util.Map;

import kr.or.ddit.cpmn.graph.vo.GraphVO;

/**
 * 그래프 서비스 인터페이스
 */
public interface GraphService {
	
	/**
	 * 지도 그래프 데이터 조회
	 * @return 지도 그래프 데이터 리스트
	 */
	List<GraphVO> selectGraphMapRecent();

	List<GraphVO> selectGraphMapAll();

	List<GraphVO> getGraphMapUrgent();
	
	List<GraphVO> selectGraphDonutRecent(String addressCode);

	List<GraphVO> selectGraphDonutAll(String addressCode);	

	List<GraphVO> selectGraphLineHalfHour();	
	
	List<GraphVO> selectGraphLineDaily();	
	
	List<GraphVO> selectClusterData(Map<String, Object> params);

	List<GraphVO> selectStatusData(Map<String, Object> params);
	
	List<GraphVO> getAddressList();	
	
	List<GraphVO> getCategoryList();	
}
