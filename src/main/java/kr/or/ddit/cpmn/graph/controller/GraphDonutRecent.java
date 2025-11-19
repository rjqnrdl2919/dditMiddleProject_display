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
import java.util.List;
import com.google.gson.Gson;

/**
 * Servlet implementation class GraphDonutRecent
 */
@WebServlet("/api/graph-donut-recent")
public class GraphDonutRecent extends HttpServlet {
	
	private static final long serialVersionUID = 1L;
	private final GraphService service = new GraphServiceImpl();
		
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		
		String addressCode = req.getParameter("addressCode");
		List<GraphVO> donutRecent = service.selectGraphDonutRecent(addressCode);

		resp.setContentType("application/json; charset=UTF-8");
		new Gson().toJson(donutRecent, resp.getWriter());
	}
}
