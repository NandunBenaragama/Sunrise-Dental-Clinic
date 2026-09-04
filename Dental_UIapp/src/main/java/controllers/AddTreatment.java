package controllers;

import Libs.DBUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;

@WebServlet(name = "AddTreatmentServlet", urlPatterns = {"/AddTreatmentServlet", "/AddTreatment"})
public class AddTreatment extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String treatmentName = request.getParameter("treatmentName");
        String costStr = request.getParameter("cost");

        Connection conn = null;
        PreparedStatement stmt = null;

        try {
            double cost = Double.parseDouble(costStr);
            conn = DBUtil.getConnection();
            String sql = "INSERT INTO treatments (treatment_name, cost) VALUES (?, ?)";
            stmt = conn.prepareStatement(sql);
            stmt.setString(1, treatmentName);
            stmt.setDouble(2, cost);

            int rows = stmt.executeUpdate();
            if (rows > 0) {
                response.sendRedirect("staff_dashboard.html?status=treat_success");
            } else {
                response.sendRedirect("staff_dashboard.html?status=treat_error");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.sendRedirect("staff_dashboard.html?status=treat_error");
        } finally {
            try {
                if (stmt != null) stmt.close();
                DBUtil.closeConnection(conn);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.sendRedirect("staff_dashboard.html");
    }
}