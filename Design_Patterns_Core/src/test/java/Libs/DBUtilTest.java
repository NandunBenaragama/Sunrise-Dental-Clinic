package Libs;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Requires a MySQL server reachable at the URL configured in DBUtil
 * (localhost:3306, database "sunrise_dental", user "root", no password).
 * Tests are skipped (not failed) if that server is not reachable.
 */
class DBUtilTest {

    @BeforeAll
    static void checkDatabaseAvailable() {
        boolean available;
        try (Connection conn = DBUtil.getConnection()) {
            available = conn != null;
        } catch (Exception e) {
            available = false;
        }
        assumeTrue(available, "Skipping DBUtil tests: could not connect to MySQL at localhost:3306/sunrise_dental");
    }

    private Connection connection;

    @AfterEach
    void closeConnectionIfOpen() {
        DBUtil.closeConnection(connection);
    }

    @Test
    void getConnectionReturnsOpenValidConnection() throws Exception {
        connection = DBUtil.getConnection();

        assertNotNull(connection);
        assertFalse(connection.isClosed());
        assertTrue(connection.isValid(2));
    }

    @Test
    void getConnectionPointsToSunriseDentalDatabase() throws Exception {
        connection = DBUtil.getConnection();

        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT DATABASE()")) {
            assertTrue(rs.next());
            assertEquals("sunrise_dental", rs.getString(1));
        }
    }

    @Test
    void closeConnectionClosesTheConnection() throws Exception {
        connection = DBUtil.getConnection();

        DBUtil.closeConnection(connection);

        assertTrue(connection.isClosed());
    }

    @Test
    void closeConnectionAcceptsNullWithoutThrowing() {
        DBUtil.closeConnection(null);
    }
}
