package com.mycompany.sunrise_dental_clinic.resources;

import Libs.DBUtil;
import jakarta.ws.rs.core.Response;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Exercises StaffApiResource's read endpoints and login logic directly as
 * plain Java calls (no servlet container needed for a JAX-RS resource's own
 * method logic).
 *
 * Requires a MySQL server reachable at the URL configured in DBUtil.
 * Login tests additionally require at least one row in the "users" table.
 * Tests are skipped (not failed) if the database or that data is unavailable.
 */
class StaffApiResourceTest {

    private static boolean databaseAvailable;
    private static String validUsername;
    private static String validPassword;

    @BeforeAll
    static void checkDatabaseAndLoadExistingUser() {
        try (Connection conn = DBUtil.getConnection()) {
            databaseAvailable = conn != null;
        } catch (Exception e) {
            databaseAvailable = false;
        }
        assumeTrue(databaseAvailable,
                "Skipping StaffApiResource tests: could not connect to MySQL at localhost:3306/sunrise_dental");

        try (Connection conn = DBUtil.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT username, password FROM users LIMIT 1")) {
            if (rs.next()) {
                validUsername = rs.getString("username");
                validPassword = rs.getString("password");
            }
        } catch (Exception ignored) {
            // handled by the per-test assumeTrue below
        }
    }

    private final StaffApiResource resource = new StaffApiResource();

    @Test
    void getDoctorsReturnsOkWithJsonArray() {
        Response response = resource.getDoctors();

        assertEquals(200, response.getStatus());
        JSONArray doctors = new JSONArray(String.valueOf(response.getEntity()));
        if (doctors.length() > 0) {
            JSONObject first = doctors.getJSONObject(0);
            assertTrue(first.has("doctor_id"));
            assertTrue(first.has("doctor_name"));
        }
    }

    @Test
    void getPatientsReturnsOkWithJsonArray() {
        Response response = resource.getPatients();

        assertEquals(200, response.getStatus());
        JSONArray patients = new JSONArray(String.valueOf(response.getEntity()));
        if (patients.length() > 0) {
            JSONObject first = patients.getJSONObject(0);
            assertTrue(first.has("patient_id"));
            assertTrue(first.has("name"));
        }
    }

    @Test
    void getAppointmentsReturnsOkWithJsonArray() {
        Response response = resource.getAppointments();

        assertEquals(200, response.getStatus());
        // Valid JSON array even when there are currently no appointment rows.
        new JSONArray(String.valueOf(response.getEntity()));
    }

    @Test
    void getBillsReturnsOkWithJsonArray() {
        Response response = resource.getBills();

        assertEquals(200, response.getStatus());
        // Valid JSON array even when there are currently no bill rows.
        new JSONArray(String.valueOf(response.getEntity()));
    }

    @Test
    void loginUserWithCorrectCredentialsReturnsSuccessAndToken() {
        assumeTrue(validUsername != null,
                "Skipping: could not read a user from the database (empty 'users' table)");

        JSONObject body = new JSONObject();
        body.put("username", validUsername);
        body.put("password", validPassword);

        Response response = resource.loginUser(body.toString());

        assertEquals(200, response.getStatus());
        JSONObject result = new JSONObject(String.valueOf(response.getEntity()));
        assertEquals("success", result.getString("status"));
        assertTrue(result.has("token"));
        assertEquals(validUsername, result.getString("username"));
    }

    @Test
    void loginUserWithWrongPasswordReturnsUnauthorized() {
        assumeTrue(validUsername != null,
                "Skipping: could not read a user from the database (empty 'users' table)");

        JSONObject body = new JSONObject();
        body.put("username", validUsername);
        body.put("password", validPassword + "_wrong");

        Response response = resource.loginUser(body.toString());

        assertEquals(401, response.getStatus());
    }

    @Test
    void loginUserWithUnknownUsernameReturnsUnauthorized() {
        JSONObject body = new JSONObject();
        body.put("username", "no_such_user_" + UUID.randomUUID());
        body.put("password", "irrelevant");

        Response response = resource.loginUser(body.toString());

        assertEquals(401, response.getStatus());
    }
}
