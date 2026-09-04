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

@WebServlet(name = "AddDoctorServlet", urlPatterns = {"/AddDoctorServlet", "/AddDoctor"})
public class AddDoctor extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        String doctorId = request.getParameter("doctorId");
        String doctorName = request.getParameter("doctorName");
        String location = request.getParameter("location");
        String telNo = request.getParameter("telNo");
        String username = request.getParameter("username");
        String password = request.getParameter("password");

        Connection conn = null;
        PreparedStatement stmtDoc = null;
        PreparedStatement stmtUser = null;

        try {
            conn = DBUtil.getConnection();
            conn.setAutoCommit(false); // Transaction එකක් ලෙස ක්‍රියාත්මක කිරීම

            // 1. Doctor Profile එක `doctors` Table එකට Save කිරීම
            String docSql = "INSERT INTO doctors (doctor_id, doctor_name, location, tel_no) VALUES (?, ?, ?, ?)";
            stmtDoc = conn.prepareStatement(docSql);
            stmtDoc.setString(1, doctorId);
            stmtDoc.setString(2, doctorName);
            stmtDoc.setString(3, location);
            stmtDoc.setString(4, telNo);
            stmtDoc.executeUpdate();

            // 2. Doctor ගේ Login Account එක `users` Table එකට Save කිරීම (Role = 'DOCTOR')
            String userSql = "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, 'DOCTOR')";
            stmtUser = conn.prepareStatement(userSql);
            stmtUser.setString(1, username);
            stmtUser.setString(2, password);
            stmtUser.setString(3, doctorName);
            stmtUser.executeUpdate();

            conn.commit(); // දෙකම සාර්ථකව Insert වූ පසු Commit කිරීම
            response.sendRedirect("staff_dashboard.html?status=doc_success");

        } catch (Exception e) {
            e.printStackTrace();
            try {
                if (conn != null) conn.rollback(); // දෝෂයක් ආවොත් Database එක Rollback කිරීම
            } catch (Exception ex) {
                ex.printStackTrace();
            }
            response.sendRedirect("staff_dashboard.html?status=doc_error");
        } finally {
            try {
                if (stmtDoc != null) stmtDoc.close();
                if (stmtUser != null) stmtUser.close();
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