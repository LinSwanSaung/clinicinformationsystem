import { memo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Timer, AlertCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
      type: 'spring',
      stiffness: 100,
    },
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: { scale: 0.98 },
};

const QueueDoctorCard = memo(
  ({
    doctor,
    onClick,
    buttonText = 'View Queue',
    buttonIcon: ButtonIcon = Eye,
    showCurrentConsultation = true,
    showNextInQueue = true,
    customStats = null,
  }) => {
    const queueStats = customStats || {
      waitingPatients:
        doctor.queueStatus?.tokens?.filter((token) => token.status === 'waiting').length || 0,
      readyPatients:
        doctor.queueStatus?.tokens?.filter((token) => token.status === 'called').length || 0, // Waiting for Doctor
      completedToday:
        doctor.queueStatus?.tokens?.filter((token) => token.status === 'completed').length || 0,
    };

    const status = doctor.status || {
      text: 'Unknown',
      color: 'bg-gray-100 text-gray-600',
      canAcceptPatients: false,
    };

    const currentConsultation = doctor.queueStatus?.tokens?.find(
      (token) => token.status === 'serving'
    );
    const nextInQueue = doctor.queueStatus?.tokens?.find((token) => token.status === 'waiting');

    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        layout
        whileHover="hover"
        whileTap="tap"
      >
        <Card
          className={`transition-shadow ${
            status.canAcceptPatients
              ? 'cursor-pointer hover:shadow-lg'
              : 'cursor-not-allowed opacity-75'
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full font-medium text-white ${
                    status.canAcceptPatients
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}
                >
                  {doctor.first_name?.[0]}
                  {doctor.last_name?.[0]}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Dr. {doctor.first_name} {doctor.last_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                  {status.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{status.description}</p>
                  )}
                </div>
              </div>
              <Badge className={status.color}>{status.text}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Queue Statistics */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {queueStats.waitingPatients || 0}
                </p>
                <p className="text-xs text-muted-foreground">Waiting</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{queueStats.readyPatients || 0}</p>
                <p className="text-xs text-muted-foreground">Ready</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {queueStats.completedToday || 0}
                </p>
                <p className="text-xs text-muted-foreground">Done</p>
              </div>
            </div>

            {/* Current Status */}
            {showCurrentConsultation && currentConsultation && (
              <div
                className={`rounded-lg p-3 ${currentConsultation.priority >= 4 ? 'border-2 border-red-300 bg-red-50' : 'bg-blue-50'}`}
              >
                <div className="flex items-center gap-2">
                  <Activity
                    className={`h-4 w-4 ${currentConsultation.priority >= 4 ? 'text-red-600' : 'text-blue-600'}`}
                  />
                  <span className="text-sm font-medium">Currently Consulting:</span>
                  {currentConsultation.priority >= 4 && <span className="text-lg">⭐</span>}
                </div>
                <p className="mt-1 text-sm">
                  {currentConsultation.patient?.first_name} {currentConsultation.patient?.last_name}
                  ({currentConsultation.priority >= 4 && '⭐ '}Token #
                  {currentConsultation.token_number})
                </p>
              </div>
            )}

            {showNextInQueue && nextInQueue && !currentConsultation && (
              <div
                className={`rounded-lg p-3 ${nextInQueue.priority >= 4 ? 'border-2 border-red-300 bg-red-50' : 'bg-yellow-50'}`}
              >
                <div className="flex items-center gap-2">
                  <Timer
                    className={`h-4 w-4 ${nextInQueue.priority >= 4 ? 'text-red-600' : 'text-yellow-600'}`}
                  />
                  <span className="text-sm font-medium">Next in Queue:</span>
                  {nextInQueue.priority >= 4 && <span className="text-lg">⭐</span>}
                </div>
                <p className="mt-1 text-sm">
                  {nextInQueue.patient?.first_name} {nextInQueue.patient?.last_name}(
                  {nextInQueue.priority >= 4 && '⭐ '}Token #{nextInQueue.token_number})
                </p>
              </div>
            )}

            {/* Queue Full Notice */}
            {!status.canAcceptPatients && status.status === 'full' && (
              <div className="rounded-lg bg-red-50 p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">
                    Queue Full - No more appointments today
                  </span>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="flex gap-2">
              <Button onClick={() => onClick(doctor)} className="w-full gap-2" variant="outline">
                <ButtonIcon className="h-4 w-4" />
                {buttonText}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

QueueDoctorCard.displayName = 'QueueDoctorCard';

export default QueueDoctorCard;
