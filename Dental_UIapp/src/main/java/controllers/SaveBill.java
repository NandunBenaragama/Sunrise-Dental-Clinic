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

@WebServlet("/SaveBillServlet")
public class SaveBill extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String apptNum = request.getParameter("appointmentNum");
        String pName = request.getParameter("patientName");
        String treatment = request.getParameter("treatmentType");
        double consultationFee = Double.parseDouble(request.getParameter("consultationFee"));
        double treatmentFee = Double.parseDouble(request.getParameter("treatmentFee"));
        double totalAmount = Double.parseDouble(request.getParameter("totalAmount"));

        Connection conn = null;
        try {
            conn = DBUtil.getConnection();
            String sql = "INSERT INTO bills (appointment_num, patient_name, treatment_type, consultation_fee, treatment_fee, total_amount) " +
                         "VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE total_amount = VALUES(total_amount)";
            
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, apptNum);
            stmt.setString(2, pName);
            stmt.setString(3, treatment);
            stmt.setDouble(4, consultationFee);
            stmt.setDouble(5, treatmentFee);
            stmt.setDouble(6, totalAmount);
            
            stmt.executeUpdate();

            response.sendRedirect("doctor_dashboard.html?msg=bill_saved");

        } catch (Exception e) {
            e.printStackTrace();
            response.sendRedirect("doctor_dashboard.html?msg=bill_error");
        } finally {
            DBUtil.closeConnection(conn);
        }
    }
}