package Libs;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class DoctorTest {

    @Test
    void allArgsConstructorSetsAllFields() {
        Doctor doctor = new Doctor("DOC-1", "Nandun Benaragama", "Kegalle", "0725279638");

        assertEquals("DOC-1", doctor.getDoctorId());
        assertEquals("Nandun Benaragama", doctor.getName());
        assertEquals("Kegalle", doctor.getLocation());
        assertEquals("0725279638", doctor.getTelNo());
    }

    @Test
    void noArgsConstructorLeavesFieldsNull() {
        Doctor doctor = new Doctor();

        assertNull(doctor.getDoctorId());
        assertNull(doctor.getName());
        assertNull(doctor.getLocation());
        assertNull(doctor.getTelNo());
    }

    @Test
    void settersUpdateFields() {
        Doctor doctor = new Doctor();

        doctor.setDoctorId("DOC-2");
        doctor.setName("Nimthara Ananda");
        doctor.setLocation("Kiribathgoda");
        doctor.setTelNo("0723763763");

        assertEquals("DOC-2", doctor.getDoctorId());
        assertEquals("Nimthara Ananda", doctor.getName());
        assertEquals("Kiribathgoda", doctor.getLocation());
        assertEquals("0723763763", doctor.getTelNo());
    }
}
