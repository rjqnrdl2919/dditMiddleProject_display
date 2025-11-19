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
 * Servlet implementation class ListAddressCategory
 */
@WebServlet("/api/list-address-category")
public class ListAddressCategory extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private final GraphService service = new GraphServiceImpl();
       
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        
		List<GraphVO> addressList = service.getAddressList();
        List<GraphVO> categoryList = service.getCategoryList();
        
        System.out.println("📍 addressList = " + addressList);
        System.out.println("📍 categoryList = " + categoryList);

        Map<String, Object> result = new HashMap<>();
        result.put("addressList", addressList);
        result.put("categoryList", categoryList);

        resp.setContentType("application/json;charset=UTF-8");
        new Gson().toJson(result, resp.getWriter());
	}
}
