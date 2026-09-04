package com.mycompany.sunrise_dental_clinic;

import com.mycompany.sunrise_dental_clinic.resources.*;
import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;
import java.util.HashSet;
import java.util.Set;

@ApplicationPath("/api")
public class JakartaRestConfiguration extends Application {

    @Override
    public Set<Class<?>> getClasses() {
        Set<Class<?>> resources = new HashSet<>();
        resources.add(StaffApiResource.class);
        resources.add(DoctorResource.class);
        resources.add(BillingResource.class);
        resources.add(AppointmentResource.class);
        resources.add(AuthResource.class);
        return resources;
    }
}