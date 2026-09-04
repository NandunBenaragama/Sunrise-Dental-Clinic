package com.mycompany.sunrise_dental_clinic.resources;

import Libs.DBUtil;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.sql.*;
import org.json.JSONObject;

@Path("/doctor-service") // "doctors" හෝ "/" තිබේ නම් එය doctor-service ලෙස වෙනස් කරන්න
public class DoctorResource {
    // ...

    @OPTIONS
    public Response handleOptions() {
        return Response.ok()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept")
                .build();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response addDoctor(String jsonBody) {
        Connection conn = null;
        try {
            JSONObject data = new JSONObject(jsonBody);
            
            // Key mismatch නොවීමට සියලුම format වලින් අගය ලබා ගැනීම
            String docId = data.optString("doctorId", data.optString("doctor_id", data.optString("id", ""))).trim();
            String docName = data.optString("doctorName", data.optString("doctor_name", data.optString("name", ""))).trim();
            String location = data.optString("location", "").trim();
            String telNo = data.optString("telNo", data.optString("tel_no", "")).trim();
            String username = data.optString("username", docId).trim();
            String password = data.optString("password", "1234").trim();

            if (docId.isEmpty()) {
                docId = "DOC-" + (System.currentTimeMillis() % 10000);
            }
            if (docName.isEmpty()) {
                return Response.status(400).entity("{\"error\":\"Doctor Name is required\"}").header("Access-Control-Allow-Origin", "*").build();
            }

            conn = DBUtil.getConnection();
            conn.setAutoCommit(false);

            // 1. Insert Doctor
            String sql = "INSERT INTO doctors (doctor_id, doctor_name, location, tel_no) VALUES (?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, docId);
                ps.setString(2, docName);
                ps.setString(3, location);
                ps.setString(4, telNo);
                ps.executeUpdate();
            }

            // 2. Insert User Login
            try {
                String uSql = "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, 'DOCTOR')";
                try (PreparedStatement psU = conn.prepareStatement(uSql)) {
                    psU.setString(1, username);
                    psU.setString(2, password);
                    psU.setString(3, docName);
                    psU.executeUpdate();
                }
            } catch (Exception ignored) {}

            conn.commit();
            return Response.ok("{\"status\":\"success\",\"message\":\"Doctor registered successfully!\"}")
                    .header("Access-Control-Allow-Origin", "*")
                    .build();

        } catch (Exception e) {
            if (conn != null) {
                try { conn.rollback(); } catch (Exception ignored) {}
            }
            return Response.status(500)
                    .entity("{\"error\":\"" + e.getMessage() + "\"}")
                    .header("Access-Control-Allow-Origin", "*")
                    .build();
        } finally {
            DBUtil.closeConnection(conn);
        }
    }
}