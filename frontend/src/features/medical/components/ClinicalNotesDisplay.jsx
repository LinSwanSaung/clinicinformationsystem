import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown, Plus, FileText } from 'lucide-react';

const ClinicalNotesDisplay = ({
  notes = [],
  onAddNote,
  onEditNote,
  userRole = 'nurse', // Default to nurse role
  showAddButton = true,
  className = '',
}) => {
  const [expandedNote, setExpandedNote] = useState(null);

  const toggleNote = (index) => {
    setExpandedNote(expandedNote === index ? null : index);
  };

  // Only doctors can add and edit notes
  const canAddNotes = userRole === 'doctor';
  const canEditNotes = userRole === 'doctor';

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText size={24} className="text-purple-600" />
          <h3 className="text-lg font-bold">Doctor&apos;s Notes</h3>
        </div>
        {showAddButton && canAddNotes && onAddNote && (
          <Button variant="outline" size="sm" className="px-4 py-2 text-sm" onClick={onAddNote}>
            <Plus size={16} className="mr-2" />
            Add Note
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notes.length > 0 ? (
          notes.map((note, index) => (
            <div key={index} className="overflow-hidden rounded-lg border border-gray-200">
              <div
                className="cursor-pointer bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                onClick={() => toggleNote(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar size={16} className="text-gray-500" />
                    <span className="text-sm font-medium">{note.date}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${expandedNote === index ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {expandedNote === index && (
                <div className="border-t border-gray-200 bg-white p-4">
                  {note.diagnosis && note.diagnosis !== 'N/A' && (
                    <div className="mb-4">
                      <h5 className="mb-2 text-sm font-bold text-gray-800">Diagnosis:</h5>
                      <p className="rounded-lg bg-yellow-50 p-3 text-sm text-gray-700">
                        {note.diagnosis}
                      </p>
                    </div>
                  )}

                  <div className="mb-4">
                    <h5 className="mb-2 text-sm font-bold text-gray-800">Clinical Notes:</h5>
                    <p className="text-sm leading-relaxed text-gray-700">{note.note}</p>
                  </div>

                  {note.prescribedMedications && note.prescribedMedications.length > 0 && (
                    <div>
                      <h5 className="mb-3 text-sm font-bold text-gray-800">
                        Prescribed Medications:
                      </h5>
                      <div className="space-y-2">
                        {note.prescribedMedications.map((medication, medIndex) => (
                          <div key={medIndex} className="rounded-lg bg-blue-50 p-3">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-medium">{medication.name}</span>
                              <span className="text-xs text-gray-600">- {medication.dosage}</span>
                            </div>
                            <div className="mt-2 space-y-1 text-xs text-gray-600">
                              {medication.frequency && <div>Frequency: {medication.frequency}</div>}
                              {medication.duration && <div>Duration: {medication.duration}</div>}
                              {medication.quantity && <div>Quantity: {medication.quantity}</div>}
                              {medication.refills !== undefined && (
                                <div>Refills: {medication.refills}</div>
                              )}
                              {medication.instructions && (
                                <div className="mt-1 italic">
                                  Instructions: {medication.instructions}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {canEditNotes && onEditNote && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-4 py-2 text-sm"
                        onClick={() => onEditNote(note, index)}
                      >
                        Edit Note
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            <FileText size={32} className="mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-500">No doctor&apos;s notes available</p>
            {canAddNotes && (
              <p className="mt-2 text-xs text-gray-400">
                Click &quot;Add Note&quot; to create the first note
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ClinicalNotesDisplay;
