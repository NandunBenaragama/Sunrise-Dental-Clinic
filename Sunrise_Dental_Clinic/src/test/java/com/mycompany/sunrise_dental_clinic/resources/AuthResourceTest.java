package com.mycompany.sunrise_dental_clinic.resources;

import Libs.DBUtil;
import jakarta.ws.rs.core.Response;
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
 * Exercises AuthResource.login(...) directly as a plain Java call (no servlet
 * container needed for a JAX-RS resource's own method logic).
 *
 * Requires a MySQL server reachable at the URL configured in DBUtil, with at
 * least one row in the "users" table. Tests are skipped (not failed) if the
 * database or that data is unavailable. Credentials are read from the
 * existing "users" table at run time rather than hard-coded.
 */
class AuthResourceTest {

    private static String validUsername;
    private static String validPassword;

    @BeforeAll
    static void loadExistingUser() {
        try (Connection conn = DBUtil.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT username, password FROM users LIMIT 1")) {
            if (rs.next()) {
                validUsername = rs.getString("username");
                validPassword = rs.getString("password");
            }
        } catch (Exception e) {
            validUsername = null;
            validPassword = null;
        }
        assumeTrue(validUsername != null,
                "Skipping AuthResource tests: could not read a user from the database (unreachable or empty 'users' table)");
    }

    @Test
    void loginWithCorrectCredentialsReturnsSuccess() {
        AuthResource resource = new AuthResource();

        Response response = resource.login(validUsername, validPassword);

        assertEquals(200, response.getStatus());
        String body = String.valueOf(response.getEntity());
        assertTrue(body.contains("\"status\":\"success\""), "Expected success response but got: " + body);
    }

    @Test
    void loginWithWrongPasswordReturnsUnauthorized() {
        AuthResource resource = new AuthResource();

        Response response = resource.login(validUsername, validPassword + "_wrong");

        assertEquals(401, response.getStatus());
        String body = String.valueOf(response.getEntity());
        assertTrue(body.contains("Invalid Credentials"), "Expected invalid-credentials response but got: " + body);
    }

    @Test
    void loginWithUnknownUsernameReturnsUnauthorized() {
        AuthResource resource = new AuthResource();

        Response response = resource.login("no_such_user_" + UUID.randomUUID(), "irrelevant");

        assertEquals(401, response.getStatus());
    }
}
