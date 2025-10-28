import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Card } from './card';

const SearchableSelect = ({
  options = [],
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  displayField = "name",
  valueField = "id",
  secondaryField = null,
  customDisplayRenderer = null,
  customSearchRenderer = null,
  className = "",
  triggerClassName = "",
  disabled = false,
  clearable = false
}) => {
  const safeOptions = Array.isArray(options) ? options : [];
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
    }
  }, [open]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  const filteredOptions = safeOptions.filter(option => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    if (customSearchRenderer) {
      return customSearchRenderer(option, searchLower);
    }
    
    const displayValue = option[displayField]?.toLowerCase() || '';
    const secondaryValue = secondaryField ? (option[secondaryField]?.toLowerCase() || '') : '';
    const fullName = `${displayValue} ${secondaryValue}`.toLowerCase();
    
    return fullName.includes(searchLower);
  });

  const selectedOption = options.find(option => option[valueField] === value);

  const getDisplayText = (option) => {
    if (!option) return placeholder;
    
    if (customDisplayRenderer) {
      return customDisplayRenderer(option);
    }
    
    const primaryText = option[displayField] || '';
    const secondaryText = secondaryField ? option[secondaryField] : '';
    
    return secondaryText ? `${primaryText} - ${secondaryText}` : primaryText;
  };

  const handleSelect = (option) => {
    onValueChange(option[valueField]);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onValueChange('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between h-10 text-sm px-3 ${triggerClassName} ${className}`}
          disabled={disabled}
        >
          <span className={`truncate ${!selectedOption ? 'text-muted-foreground' : ''}`}>
            {getDisplayText(selectedOption)}
          </span>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {clearable && selectedOption && (
              <X 
                className="h-3 w-3 sm:h-4 sm:w-4 opacity-50 hover:opacity-100 cursor-pointer" 
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Card className="border-0 shadow-lg">
          <div className="p-2 sm:p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm"
              />
            </div>
          </div>
          
          <div className="max-h-48 sm:max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="flex items-center justify-center py-3 sm:py-4">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {searchTerm ? 'No results found' : 'No options available'}
                </div>
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option[valueField] === value;
                
                return (
                  <div
                    key={option[valueField]}
                    className={`
                      relative flex cursor-pointer select-none items-center rounded-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm 
                      hover:bg-accent hover:text-accent-foreground
                      ${isSelected ? 'bg-accent text-accent-foreground' : ''}
                    `}
                    onClick={() => handleSelect(option)}
                  >
                    <div className="flex-1">
                      {customDisplayRenderer ? (
                        <div className="font-medium">{customDisplayRenderer(option)}</div>
                      ) : (
                        <>
                          <div className="font-medium">
                            {option[displayField]}
                          </div>
                          {secondaryField && option[secondaryField] && (
                            <div className="text-[10px] sm:text-xs text-muted-foreground">
                              {option[secondaryField]}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export { SearchableSelect };
