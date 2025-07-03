import { Star, Clock, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import doctorService from '../services/doctorService';

export default function AvailableDoctors({ onAppointDoctor }) {
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAvailableDoctors = async () => {
      try {
        setIsLoading(true);
        const doctors = await doctorService.getAvailableDoctors();
        setAvailableDoctors(doctors);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading available doctors:', error);
        setIsLoading(false);
      }
    };

    loadAvailableDoctors();
  }, []);

  if (isLoading) {
    return <div className="p-4">Loading available doctors...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {availableDoctors.map((doctor) => (
        <div key={doctor.id} className="bg-card text-card-foreground rounded-lg shadow-lg p-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16">
              <img
                src={doctor.image}
                alt={doctor.name}
                className="rounded-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/64x64';
                }}
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{doctor.name}</h3>
              <p className="text-muted-foreground">{doctor.specialization}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-muted-foreground">
              <Star className="w-4 h-4 mr-2 text-yellow-400" />
              <span>{doctor.rating} Rating</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Users className="w-4 h-4 mr-2" />
              <span>{doctor.patients}+ Patients</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Clock className="w-4 h-4 mr-2" />
              <span>{doctor.availability}</span>
            </div>
          </div>

          <button
            onClick={() => onAppointDoctor(doctor)}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md transition-colors"
          >
            Appoint Doctor
          </button>
        </div>
      ))}
    </div>
  );
}
