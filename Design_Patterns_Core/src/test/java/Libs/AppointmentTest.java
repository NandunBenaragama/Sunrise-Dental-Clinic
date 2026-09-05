package Libs;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class AppointmentTest {

    @Test
    void allArgsConstructorSetsAllFields() {
        Appointment appt = new Appointment(
                "APT-1", "PAT-1001", "Dr. Wickramasinghe", "Cleaning", "2026-09-10 10:00", "Pending");

        assertEquals("APT-1", appt.getAppointmentNum());
        assertEquals("PAT-1001", appt.getPatientId());
        assertEquals("Dr. Wickramasinghe", appt.getDentistName());
        assertEquals("Cleaning", appt.getTreatmentType());
        assertEquals("2026-09-10 10:00", appt.getApptDateTime());
        assertEquals("Pending", appt.getStatus());
    }

    @Test
    void noArgsConstructorLeavesFieldsNull() {
        Appointment appt = new Appointment();

        assertNull(appt.getAppointmentNum());
        assertNull(appt.getPatientId());
        assertNull(appt.getDentistName());
        assertNull(appt.getTreatmentType());
        assertNull(appt.getApptDateTime());
        assertNull(appt.getStatus());
    }

    @Test
    void settersUpdateFields() {
        Appointment appt = new Appointment();

        appt.setAppointmentNum("APT-2");
        appt.setPatientId("PAT-2002");
        appt.setDentistName("Dr. Nandun Benaragama");
        appt.setTreatmentType("Filling");
        appt.setApptDateTime("2026-09-11 14:30");
        appt.setStatus("Completed");

        assertEquals("APT-2", appt.getAppointmentNum());
        assertEquals("PAT-2002", appt.getPatientId());
        assertEquals("Dr. Nandun Benaragama", appt.getDentistName());
        assertEquals("Filling", appt.getTreatmentType());
        assertEquals("2026-09-11 14:30", appt.getApptDateTime());
        assertEquals("Completed", appt.getStatus());
    }
}
