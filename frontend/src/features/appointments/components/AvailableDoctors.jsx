import { Star, Clock, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import doctorService from '@/services/doctorService';
import logger from '@/utils/logger';

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
        logger.error('Error loading available doctors:', error);
        setIsLoading(false);
      }
    };

    loadAvailableDoctors();
  }, []);

  if (isLoading) {
    return <div className="p-4">Loading available doctors...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
      {availableDoctors.map((doctor) => (
        <div
          key={doctor.id}
          className="space-y-4 rounded-lg bg-card p-6 text-card-foreground shadow-lg"
        >
          <div className="flex items-center space-x-4">
            <div className="relative h-16 w-16">
              <img
                src={doctor.image}
                alt={doctor.name}
                className="rounded-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/64x64';
                }}
              />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{doctor.name}</h3>
              <p className="text-muted-foreground">{doctor.specialization}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-muted-foreground">
              <Star className="mr-2 h-4 w-4 text-yellow-400" />
              <span>{doctor.rating} Rating</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Users className="mr-2 h-4 w-4" />
              <span>{doctor.patients}+ Patients</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" />
              <span>{doctor.availability}</span>
            </div>
          </div>

          <button
            onClick={() => onAppointDoctor(doctor)}
            className="hover:bg-primary/90 w-full rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors"
          >
            Appoint Doctor
          </button>
        </div>
      ))}
    </div>
  );
}
