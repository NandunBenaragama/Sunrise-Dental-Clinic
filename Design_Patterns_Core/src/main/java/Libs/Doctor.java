package Libs;

public class Doctor {
    private String doctorId;
    private String name;
    private String location;
    private String telNo;

    public Doctor() {}

    public Doctor(String doctorId, String name, String location, String telNo) {
        this.doctorId = doctorId;
        this.name = name;
        this.location = location;
        this.telNo = telNo;
    }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getTelNo() { return telNo; }
    public void setTelNo(String telNo) { this.telNo = telNo; }
}