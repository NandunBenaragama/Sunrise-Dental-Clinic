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
import java.sql.ResultSet;
import java.util.UUID;

@WebServlet(name = "AddAppointmentServlet", urlPatterns = {"/AddAppointmentServlet", "/AddAppointment"})
public class AddAppointment extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String patientName = request.getParameter("patientName");
        String address = request.getParameter("address");
        String contact = request.getParameter("contact");
        String dentistName = request.getParameter("dentistName");
        String treatmentType = request.getParameter("treatmentType");
        String apptDateTime = request.getParameter("apptDateTime");

        Connection conn = null;
        PreparedStatement stmtPat = null;
        PreparedStatement stmtAppt = null;

        try {
            conn = DBUtil.getConnection();
            conn.setAutoCommit(false); // Transaction ආරම්භ කිරීම

            // 1. Patient කෙනෙක් දැනටමත් Contact Number එකෙන් DB එකේ ඉන්නවද බැලීම
            String checkPatSql = "SELECT patient_id FROM patients WHERE contact = ?";
            PreparedStatement checkStmt = conn.prepareStatement(checkPatSql);
            checkStmt.setString(1, contact);
            ResultSet rsPat = checkStmt.executeQuery();

            String patientId;
            if (rsPat.next()) {
                patientId = rsPat.getString("patient_id");
            } else {
                // අලුත් Unique Patient ID එකක් සෑදීම
                patientId = "PAT-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
                String insertPatSql = "INSERT INTO patients (patient_id, name, address, contact) VALUES (?, ?, ?, ?)";
                stmtPat = conn.prepareStatement(insertPatSql);
                stmtPat.setString(1, patientId);
                stmtPat.setString(2, patientName);
                stmtPat.setString(3, address);
                stmtPat.setString(4, contact);
                stmtPat.executeUpdate();
            }

            // 2. Unique Appointment Number එකක් සෑදීම
            int randomNum = 1000 + (int)(Math.random() * 9000);
            String appointmentNum = "APT-" + randomNum;

            // 3. Appointments Table එකට Insert කිරීම
            String insertApptSql = "INSERT INTO appointments (appointment_num, patient_id, dentist_name, treatment_type, appt_date_time, status) VALUES (?, ?, ?, ?, ?, 'Pending')";
            stmtAppt = conn.prepareStatement(insertApptSql);
            stmtAppt.setString(1, appointmentNum);
            stmtAppt.setString(2, patientId);
            stmtAppt.setString(3, dentistName);
            stmtAppt.setString(4, treatmentType);
            stmtAppt.setString(5, apptDateTime);

            int rows = stmtAppt.executeUpdate();

            if (rows > 0) {
                conn.commit();
                // සාර්ථක වූ පසු Staff Dashboard එකට Assigned Appointment Number එකත් සමඟ Redirect කිරීම
                response.sendRedirect("staff_dashboard.html?status=appt_success&apptNum=" + appointmentNum);
            } else {
                conn.rollback();
                response.sendRedirect("staff_dashboard.html?status=appt_error");
            }

        } catch (Exception e) {
            e.printStackTrace();
            try {
                if (conn != null) conn.rollback();
            } catch (Exception ex) {
                ex.printStackTrace();
            }
            response.sendRedirect("staff_dashboard.html?status=appt_error");
        } finally {
            try {
                if (stmtPat != null) stmtPat.close();
                if (stmtAppt != null) stmtAppt.close();
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