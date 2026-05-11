import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, X } from "lucide-react";

// Nigerian locations and cities for autocomplete suggestions
const NIGERIAN_LOCATIONS = [
  "Abuja, Nigeria",
  "Lagos, Nigeria", 
  "Kano, Nigeria",
  "Ibadan, Nigeria",
  "Kaduna, Nigeria",
  "Port Harcourt, Nigeria",
  "Benin City, Nigeria",
  "Maiduguri, Nigeria",
  "Zaria, Nigeria",
  "Aba, Nigeria",
  "Jos, Nigeria",
  "Ilorin, Nigeria",
  "Oyo, Nigeria",
  "Enugu, Nigeria",
  "Abeokuta, Nigeria",
  "Festac, Lagos",
  "Ikeja, Lagos",
  "Lekki, Lagos",
  "Victoria Island, Lagos",
  "Surulere, Lagos",
  "Yaba, Lagos",
  "Ikoyi, Lagos",
  "Apapa, Lagos",
  "Badagry, Lagos",
  "Mushin, Lagos",
  "Oshodi, Lagos",
  "Maryland, Lagos",
  "Anthony, Lagos",
  "Gbagada, Lagos",
  "Ikotun, Lagos",
  "Iyana Ipaja, Lagos",
  "Agege, Lagos",
  "Ifako-Ijaiye, Lagos",
  "Alimosho, Lagos",
  "Kosofe, Lagos",
  "Mushin, Lagos",
  "Oshodi-Isolo, Lagos",
  "Shomolu, Lagos",
  "Wuse, Abuja",
  "Maitama, Abuja",
  "Asokoro, Abuja",
  "Garki, Abuja",
  "Gwarimpa, Abuja",
  "Jabi, Abuja",
  "Life Camp, Abuja",
  "Kubwa, Abuja",
  "Bwari, Abuja",
  "Dutse, Abuja",
  "Karu, Abuja",
  "Nyanya, Abuja",
  "Mararaba, Abuja",
  "Masaka, Abuja",
  "One Man Village, Abuja",
  "Suleja, Nigeria",
  "Minna, Nigeria",
  "Kaduna, Nigeria",
  "Zaria, Nigeria",
  "Katsina, Nigeria",
  "Sokoto, Nigeria",
  "Kebbi, Nigeria",
  "Zamfara, Nigeria",
  "Kano, Nigeria",
  "Jigawa, Nigeria",
  "Yobe, Nigeria",
  "Borno, Nigeria",
  "Gombe, Nigeria",
  "Bauchi, Nigeria",
  "Adamawa, Nigeria",
  "Taraba, Nigeria",
  "Plateau, Nigeria",
  "Nasarawa, Nigeria",
  "Benue, Nigeria",
  "Kogi, Nigeria",
  "Kwara, Nigeria",
  "Ekiti, Nigeria",
  "Ondo, Nigeria",
  "Osun, Nigeria",
  "Ogun, Nigeria",
  "Oyo, Nigeria",
  "Lagos, Nigeria",
  "Edo, Nigeria",
  "Delta, Nigeria",
  "Bayelsa, Nigeria",
  "Rivers, Nigeria",
  "Cross River, Nigeria",
  "Akwa Ibom, Nigeria",
  "Anambra, Nigeria",
  "Imo, Nigeria",
  "Abia, Nigeria",
  "Enugu, Nigeria",
  "Ebonyi, Nigeria"
];

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Enter location...",
  disabled = false,
  className = "",
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Filter suggestions based on input
  const filterSuggestions = useCallback((input: string) => {
    if (!input.trim()) {
      return [];
    }

    const searchTerm = input.toLowerCase().trim();
    const filtered = NIGERIAN_LOCATIONS.filter(location =>
      location.toLowerCase().includes(searchTerm)
    ).slice(0, 8); // Limit to 8 suggestions

    return filtered;
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback((input: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      const results = filterSuggestions(input);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
      setLoading(false);
    }, 300); // 300ms debounce
  }, [filterSuggestions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.trim()) {
      debouncedSearch(newValue);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (value.trim()) {
      const results = filterSuggestions(value);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    }
  };

  // Handle click outside to close dropdown
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      inputRef.current &&
      !inputRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }, []);

  // Set up click outside listener
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
          data-testid="location-autocomplete-input"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground"
              data-testid="location-clear-button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto"
          data-testid="location-suggestions-dropdown"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`px-3 py-2 cursor-pointer flex items-center gap-2 transition-colors ${
                index === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              data-testid={`location-suggestion-${index}`}
            >
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{suggestion}</span>
            </div>
          ))}
        </div>
      )}

      {isOpen && !loading && suggestions.length === 0 && value.trim() && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg"
          data-testid="location-no-results"
        >
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No locations found. You can enter a custom location.
          </div>
        </div>
      )}
    </div>
  );
}
