package Libs;

public class Patient {
    private String patientId;
    private String name;
    private String address;
    private String contact;

    public Patient() {}

    public Patient(String patientId, String name, String address, String contact) {
        this.patientId = patientId;
        this.name = name;
        this.address = address;
        this.contact = contact;
    }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
}