package kr.or.ddit.cpmn.graph.service;

import java.util.List;
import java.util.Map;

import kr.or.ddit.cpmn.graph.dao.GraphDao;
import kr.or.ddit.cpmn.graph.dao.GraphDaoImpl;
import kr.or.ddit.cpmn.graph.vo.GraphVO;

/**
 * 그래프 서비스
 */
public class GraphServiceImpl implements GraphService {

	// DAO 객체 생성
	private GraphDao graphDao = new GraphDaoImpl();
	
	@Override
	public List<GraphVO> selectGraphMapRecent() {
		return graphDao.selectGraphMapRecent();
	}

	@Override
	public List<GraphVO> selectGraphMapAll() {
		return graphDao.selectGraphMapAll();
	}
	
	@Override
	public List<GraphVO> getGraphMapUrgent() {
		return graphDao.getGraphMapUrgent();
	}

	@Override
	public List<GraphVO> selectGraphDonutRecent(String addressCode) {
		return graphDao.selectGraphDonutRecent(addressCode);
	}

	@Override
	public List<GraphVO> selectGraphDonutAll(String addressCode) {
		return graphDao.selectGraphDonutAll(addressCode);
	}

	@Override
	public List<GraphVO> selectGraphLineHalfHour() {
		return graphDao.selectGraphLineHalfHour();
	}

	@Override
	public List<GraphVO> selectGraphLineDaily() {
		return graphDao.selectGraphLineDaily();
	}

	@Override
	public List<GraphVO> selectClusterData(Map<String, Object> params) {
		return graphDao.selectClusterData(params);
	}

	@Override
	public List<GraphVO> selectStatusData(Map<String, Object> params) {
		return graphDao.selectStatusData(params);
	}

	@Override
	public List<GraphVO> getAddressList() {
		return graphDao.getAddressList();
	}

	@Override
	public List<GraphVO> getCategoryList() {
		return graphDao.getCategoryList();
	}
}
