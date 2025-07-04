import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, ChevronDown, Plus, FileText } from 'lucide-react';

const ClinicalNotesDisplay = ({ 
  notes = [], 
  onAddNote,
  onEditNote,
  userRole = "nurse", // Default to nurse role
  showAddButton = true,
  className = ""
}) => {
  const [expandedNote, setExpandedNote] = useState(null);

  const toggleNote = (index) => {
    setExpandedNote(expandedNote === index ? null : index);
  };

  // Only doctors can add and edit notes
  const canAddNotes = userRole === "doctor";
  const canEditNotes = userRole === "doctor";

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText size={24} className="text-purple-600" />
          <h3 className="text-lg font-bold">Doctor's Notes</h3>
        </div>
        {showAddButton && canAddNotes && onAddNote && (
          <Button variant="outline" size="sm" className="text-sm px-4 py-2" onClick={onAddNote}>
            <Plus size={16} className="mr-2" />
            Add Note
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        {notes.length > 0 ? (
          notes.map((note, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
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
                <div className="p-4 bg-white border-t border-gray-200">
                  <p className="text-sm text-gray-700 mb-4 leading-relaxed">{note.note}</p>
                  
                  {note.prescribedMedications && note.prescribedMedications.length > 0 && (
                    <div>
                      <h5 className="font-bold text-sm text-gray-800 mb-3">Prescribed Medications:</h5>
                      <div className="space-y-2">
                        {note.prescribedMedications.map((medication, medIndex) => (
                          <div key={medIndex} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div>
                              <span className="font-medium text-sm">{medication.name}</span>
                              <span className="text-xs text-gray-600 ml-2">- {medication.dosage}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              {medication.reason}
                            </Badge>
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
                        className="text-sm px-4 py-2"
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
          <div className="text-center py-8">
            <FileText size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 text-sm">No doctor's notes available</p>
            {canAddNotes && (
              <p className="text-gray-400 text-xs mt-2">Click "Add Note" to create the first note</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ClinicalNotesDisplay;
