package Libs;

public class Appointment {
    private String appointmentNum;
    private String patientId;
    private String dentistName;
    private String treatmentType;
    private String apptDateTime;
    private String status;

    public Appointment() {}

    public Appointment(String appointmentNum, String patientId, String dentistName, String treatmentType, String apptDateTime, String status) {
        this.appointmentNum = appointmentNum;
        this.patientId = patientId;
        this.dentistName = dentistName;
        this.treatmentType = treatmentType;
        this.apptDateTime = apptDateTime;
        this.status = status;
    }

    // Getters & Setters
    public String getAppointmentNum() { return appointmentNum; }
    public void setAppointmentNum(String appointmentNum) { this.appointmentNum = appointmentNum; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getDentistName() { return dentistName; }
    public void setDentistName(String dentistName) { this.dentistName = dentistName; }

    public String getTreatmentType() { return treatmentType; }
    public void setTreatmentType(String treatmentType) { this.treatmentType = treatmentType; }

    public String getApptDateTime() { return apptDateTime; }
    public void setApptDateTime(String apptDateTime) { this.apptDateTime = apptDateTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}