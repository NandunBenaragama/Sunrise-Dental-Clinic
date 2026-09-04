package com.mycompany.sunrise_dental_clinic.resources;

import Libs.DBUtil;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.sql.*;

@Path("/billing")
public class BillingResource {

    @GET
    @Path("/{apptNum}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response calculateBill(@PathParam("apptNum") String apptNum) {
        Connection conn = null;
        try {
            conn = DBUtil.getConnection();
            String sql = "SELECT p.name, a.treatment_type FROM appointments a JOIN patients p ON a.patient_id = p.patient_id WHERE a.appointment_num = ?";
            
            PreparedStatement pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, apptNum);
            ResultSet rs = pstmt.executeQuery();

            if (rs.next()) {
                String name = rs.getString("name");
                String treatment = rs.getString("treatment_type");
                
                double consultationFee = 2000.00;
                double treatmentFee = 3000.00;
                
                if ("Cleaning".equalsIgnoreCase(treatment)) treatmentFee = 5000.00;
                else if ("Filling".equalsIgnoreCase(treatment)) treatmentFee = 4000.00;
                else if ("Root Canal".equalsIgnoreCase(treatment)) treatmentFee = 25000.00;
                else if ("Extraction".equalsIgnoreCase(treatment)) treatmentFee = 6000.00;

                double total = consultationFee + treatmentFee;

                String json = String.format(
                    "{\"appointmentNumber\":\"%s\", \"patientName\":\"%s\", \"treatment\":\"%s\", \"consultationFee\":%.2f, \"treatmentFee\":%.2f, \"totalAmount\":%.2f}",
                    apptNum, name, treatment, consultationFee, treatmentFee, total
                );
                
                return Response.ok(json).build();
            } else {
                return Response.status(404).entity("{\"error\":\"Appointment Not Found\"}").build();
            }
        } catch (Exception e) {
            return Response.status(500).entity("{\"error\":\"" + e.getMessage() + "\"}").build();
        } finally {
            DBUtil.closeConnection(conn);
        }
    }
}