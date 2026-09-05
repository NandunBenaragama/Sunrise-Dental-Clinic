package Libs;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PatientTest {

    @Test
    void allArgsConstructorSetsAllFields() {
        Patient patient = new Patient("PAT-1001", "Kumara Makandana", "D26, Malwana", "0723898639");

        assertEquals("PAT-1001", patient.getPatientId());
        assertEquals("Kumara Makandana", patient.getName());
        assertEquals("D26, Malwana", patient.getAddress());
        assertEquals("0723898639", patient.getContact());
    }

    @Test
    void noArgsConstructorLeavesFieldsNull() {
        Patient patient = new Patient();

        assertNull(patient.getPatientId());
        assertNull(patient.getName());
        assertNull(patient.getAddress());
        assertNull(patient.getContact());
    }

    @Test
    void settersUpdateFields() {
        Patient patient = new Patient();

        patient.setPatientId("PAT-2002");
        patient.setName("Tharusha Benaragama");
        patient.setAddress("D26, Pitadeniya");
        patient.setContact("0729276449");

        assertEquals("PAT-2002", patient.getPatientId());
        assertEquals("Tharusha Benaragama", patient.getName());
        assertEquals("D26, Pitadeniya", patient.getAddress());
        assertEquals("0729276449", patient.getContact());
    }
}
