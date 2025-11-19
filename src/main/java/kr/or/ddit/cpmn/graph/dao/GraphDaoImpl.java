package kr.or.ddit.cpmn.graph.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.session.SqlSession;

import kr.or.ddit.cpmn.graph.vo.GraphVO;
import kr.or.ddit.mybatis.config.MybatisUtil;

/**
 * 그래프 DAO 구현체
 */
public class GraphDaoImpl implements GraphDao{

	private static final String NAMESPACE = "graph";
	
	@Override
	public List<GraphVO> selectGraphMapRecent() {
		try(SqlSession sqlSession = MybatisUtil.getInstance()){
			return sqlSession.selectList(NAMESPACE + ".selectGraphMapRecent"); 
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	@Override
	public List<GraphVO> selectGraphMapAll() {
		try(SqlSession sqlSession = MybatisUtil.getInstance()){
			return sqlSession.selectList(NAMESPACE + ".selectGraphMapAll"); 
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
	
	@Override
	public List<GraphVO> getGraphMapUrgent() {
		try(SqlSession sqlSession = MybatisUtil.getInstance()){
			return sqlSession.selectList(NAMESPACE + ".getGraphMapUrgent");
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
	
	@Override
	public List<GraphVO> selectGraphDonutRecent(String addressCode) {
		try(SqlSession sqlSession = MybatisUtil.getInstance()){
			return sqlSession.selectList(NAMESPACE + ".selectGraphDonutRecent", addressCode);
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
	
	@Override
	public List<GraphVO> selectGraphDonutAll(String addressCode) {
		try(SqlSession sqlSession = MybatisUtil.getInstance()){
			return sqlSession.selectList(NAMESPACE + ".selectGraphDonutAll", addressCode);
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	@Override
	public List<GraphVO> selectGraphLineHalfHour() {
		try(SqlSession sqlSession = MybatisUtil.getInstance()){			
			return sqlSession.selectList(NAMESPACE + ".selectGraphLineHalfHour");
		}  catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
	
	@Override
	public List<GraphVO> selectGraphLineDaily() {
		try(SqlSession sqlSession = MybatisUtil.getInstance()){			
			return sqlSession.selectList(NAMESPACE + ".selectGraphLineDaily");
		}  catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	@Override
	public List<GraphVO> selectClusterData(Map<String, Object> params) {
		try(SqlSession sqlSession = MybatisUtil.getInstance()){
			return sqlSession.selectList(NAMESPACE + ".selectClusterData", params);
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	@Override
	public List<GraphVO> selectStatusData(Map<String, Object> params) {
		try(SqlSession sqlSession = MybatisUtil.getInstance()){
			return sqlSession.selectList(NAMESPACE + ".selectStatusData", params);
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	@Override
	public List<GraphVO> getAddressList() {
		try(SqlSession sqlSession = MybatisUtil.getInstance()){
			return sqlSession.selectList(NAMESPACE + ".getAddressList");
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	@Override
	public List<GraphVO> getCategoryList() {
		try(SqlSession sqlSession = MybatisUtil.getInstance()){
			return sqlSession.selectList(NAMESPACE + ".getCategoryList");
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
}
