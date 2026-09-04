package controllers;

import Libs.DBUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@WebServlet("/LoginServlet")
public class Login extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {

        String user = request.getParameter("username");
        String pass = request.getParameter("password");

        Connection conn = null;
        try {
            conn = DBUtil.getConnection();
            String query = "SELECT full_name, role FROM users WHERE username = ? AND password = ?";
            
            PreparedStatement stmt = conn.prepareStatement(query);
            stmt.setString(1, user);
            stmt.setString(2, pass);
            
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                String fullName = rs.getString("full_name");
                String role = rs.getString("role");

                HttpSession session = request.getSession();
                session.setAttribute("user", user);
                session.setAttribute("fullName", fullName);
                session.setAttribute("role", role);

                if ("DOCTOR".equalsIgnoreCase(role)) {
                    response.sendRedirect("doctor_dashboard.html");
                } else {
                    response.sendRedirect("staff_dashboard.html");
                }
            } else {
                request.setAttribute("errorMessage", "Invalid Username or Password!");
                request.getRequestDispatcher("login.html").forward(request, response);
            }

        } catch (Exception e) {
            e.printStackTrace();
            request.setAttribute("errorMessage", "Database Connection Error!");
            request.getRequestDispatcher("login.html").forward(request, response);
        } finally {
            DBUtil.closeConnection(conn);
        }
    }
}