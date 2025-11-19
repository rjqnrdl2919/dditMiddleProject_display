package kr.or.ddit.cpmn.graph.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.or.ddit.cpmn.graph.service.GraphService;
import kr.or.ddit.cpmn.graph.service.GraphServiceImpl;
import kr.or.ddit.cpmn.graph.vo.GraphVO;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;

/**
 * Servlet implementation class ClusterData
 */
@WebServlet("/api/cluster-data")
public class ClusterData extends HttpServlet {
	
	private static final long serialVersionUID = 1L;
	private final GraphService service = new GraphServiceImpl();
       
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

		Map<String, Object> params = new HashMap<>();
		params.put("startDate", req.getParameter("startDate"));
		params.put("endDate", req.getParameter("endDate"));
		params.put("interval", req.getParameter("interval"));
		params.put("categoryId", req.getParameter("categoryId"));
		params.put("category1ST", req.getParameter("category1ST"));
		params.put("category2ND", req.getParameter("category2ND"));
		params.put("addressCode", req.getParameter("addressCode"));
		params.put("isHarmful", req.getParameter("isHarmful"));
		params.put("isSpam", req.getParameter("isSpam"));
		params.put("isUrgent", req.getParameter("isUrgent"));
		
		List<GraphVO> clusterData = service.selectClusterData(params);

		resp.setContentType("application/json; charset=UTF-8");
		new Gson().toJson(clusterData, resp.getWriter());
	}
}
