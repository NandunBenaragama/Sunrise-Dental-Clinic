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

@WebServlet("/UpdateAppointmentServlet")
public class UpdateAppointment extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String apptNum = request.getParameter("appointmentNum");
        String newStatus = request.getParameter("status");

        Connection conn = null;
        try {
            conn = DBUtil.getConnection();
            String sql = "UPDATE appointments SET status = ? WHERE appointment_num = ?";
            
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, newStatus);
            stmt.setString(2, apptNum);
            stmt.executeUpdate();

            response.sendRedirect("doctor_dashboard.html?msg=updated");

        } catch (Exception e) {
            e.printStackTrace();
            response.sendRedirect("doctor_dashboard.html?msg=error");
        } finally {
            DBUtil.closeConnection(conn);
        }
    }
}