package com.mycompany.sunrise_dental_clinic.resources;

import Libs.DBUtil;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.sql.*;

@Path("/auth")
public class AuthResource {

    @POST
    @Path("/login")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces(MediaType.APPLICATION_JSON)
    public Response login(@FormParam("username") String username, @FormParam("password") String password) {
        Connection conn = null;
        try {
            conn = DBUtil.getConnection();
            String sql = "SELECT role, full_name FROM users WHERE username = ? AND password = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, username);
            stmt.setString(2, password);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                String json = String.format("{\"status\":\"success\", \"role\":\"%s\", \"fullName\":\"%s\"}", 
                        rs.getString("role"), rs.getString("full_name"));
                return Response.ok(json).build();
            } else {
                return Response.status(401).entity("{\"status\":\"error\", \"message\":\"Invalid Credentials\"}").build();
            }
        } catch (Exception e) {
            return Response.status(500).entity("{\"error\":\"" + e.getMessage() + "\"}").build();
        } finally {
            DBUtil.closeConnection(conn);
        }
    }
}