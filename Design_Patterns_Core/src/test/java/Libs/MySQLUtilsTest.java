package Libs;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Requires a MySQL server reachable at the URL configured in DBUtil.
 * Tests are skipped (not failed) if that server is not reachable.
 *
 * The executeUpdate tests operate on a MySQL TEMPORARY TABLE, which is
 * private to this connection and is dropped automatically when the
 * connection closes, so no production schema or data is touched.
 */
class MySQLUtilsTest {

    @BeforeAll
    static void checkDatabaseAvailable() {
        boolean available;
        try (Connection conn = DBUtil.getConnection()) {
            available = conn != null;
        } catch (Exception e) {
            available = false;
        }
        assumeTrue(available, "Skipping MySQLUtils tests: could not connect to MySQL at localhost:3306/sunrise_dental");
    }

    private Connection connection;

    @BeforeEach
    void openConnection() throws Exception {
        connection = DBUtil.getConnection();
    }

    @AfterEach
    void closeConnection() {
        DBUtil.closeConnection(connection);
    }

    @Test
    void executeQueryRunsASelectAndReturnsResults() throws Exception {
        ResultSet rs = MySQLUtils.executeQuery(connection, "SELECT 1 AS one");

        assertTrue(rs.next());
        assertEquals(1, rs.getInt("one"));
    }

    @Test
    void executeUpdateInsertsAndUpdatesRowsInAScratchTable() throws Exception {
        try (Statement setup = connection.createStatement()) {
            setup.execute("CREATE TEMPORARY TABLE mysqlutils_test_scratch (id INT PRIMARY KEY, name VARCHAR(50))");
        }

        int insertedRows = MySQLUtils.executeUpdate(connection,
                "INSERT INTO mysqlutils_test_scratch (id, name) VALUES (?, ?)", 1, "Alice");
        assertEquals(1, insertedRows);

        int updatedRows = MySQLUtils.executeUpdate(connection,
                "UPDATE mysqlutils_test_scratch SET name = ? WHERE id = ?", "Bob", 1);
        assertEquals(1, updatedRows);

        ResultSet rs = MySQLUtils.executeQuery(connection, "SELECT name FROM mysqlutils_test_scratch WHERE id = 1");
        assertTrue(rs.next());
        assertEquals("Bob", rs.getString("name"));
    }
}
