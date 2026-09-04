package com.mycompany.sunrise_dental_clinic.resources;

import Libs.DBUtil;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.sql.*;

@Path("/appointments")
public class AppointmentResource {

    @POST
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces(MediaType.APPLICATION_JSON)
    public Response registerAppointment(
            @FormParam("name") String name,
            @FormParam("address") String address,
            @FormParam("contact") String contact,
            @FormParam("dentist") String dentist,
            @FormParam("treatment") String treatment,
            @FormParam("datetime") String dateTime) {

        String apptNum = "APT-" + (System.currentTimeMillis() % 10000);
        String patId = "PAT-" + (int)(Math.random() * 9000 + 1000);

        Connection conn = null;
        try {
            conn = DBUtil.getConnection();
            
            PreparedStatement pStmt = conn.prepareStatement("INSERT INTO patients VALUES (?, ?, ?, ?)");
            pStmt.setString(1, patId);
            pStmt.setString(2, name);
            pStmt.setString(3, address);
            pStmt.setString(4, contact);
            pStmt.executeUpdate();

            PreparedStatement aStmt = conn.prepareStatement("INSERT INTO appointments VALUES (?, ?, ?, ?, ?)");
            aStmt.setString(1, apptNum);
            aStmt.setString(2, patId);
            aStmt.setString(3, dentist);
            aStmt.setString(4, treatment);
            aStmt.setString(5, dateTime);
            aStmt.executeUpdate();

            return Response.ok("{\"status\":\"success\", \"appointmentNumber\":\"" + apptNum + "\"}").build();

        } catch (Exception e) {
            return Response.status(500).entity("{\"status\":\"error\", \"message\":\"" + e.getMessage() + "\"}").build();
        } finally {
            DBUtil.closeConnection(conn);
        }
    }
}