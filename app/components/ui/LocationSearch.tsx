import React, { useEffect, useRef, useState } from 'react';
import Input from './Input';

interface LocationSearchProps {
  onLocationSelect: (location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => void;
  defaultValue?: string;
  error?: string;
}

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

export default function LocationSearch({ onLocationSelect, defaultValue = '', error }: LocationSearchProps) {
  const [searchValue, setSearchValue] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize Google Places only once when the component mounts
    if (!window.google) {
      setIsLoading(true);
      // Define the callback function
      window.initGooglePlaces = () => {
        setIsLoading(false);
        initializeAutocomplete();
      };

      // Load the Google Places script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGooglePlaces`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      return () => {
        // Cleanup
        document.head.removeChild(script);
        delete window.initGooglePlaces;
      };
    } else {
      initializeAutocomplete();
    }
  }, []);

  const initializeAutocomplete = () => {
    if (!inputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['address_components', 'geometry']
    });

    autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
  };

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();
    
    if (!place.geometry) {
      console.error('No location data available');
      return;
    }

    let streetNumber = '';
    let route = '';
    let city = '';
    let state = '';
    let zipCode = '';
    let country = 'United States';

    // Extract address components
    place.address_components.forEach((component: any) => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      }
      if (types.includes('route')) {
        route = component.long_name;
      }
      if (types.includes('locality') || types.includes('postal_town')) {
        city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
      if (types.includes('postal_code')) {
        zipCode = component.long_name;
      }
      if (types.includes('country')) {
        country = component.long_name;
      }
    });

    const address = `${streetNumber} ${route}`.trim();
    const latitude = place.geometry.location.lat();
    const longitude = place.geometry.location.lng();

    onLocationSelect({
      address,
      city,
      state,
      zipCode,
      country,
      latitude,
      longitude
    });

    // Update the search field with the full address
    setSearchValue(address);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        label="Search Location"
        placeholder="Enter your parking lot address (any country)"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        error={error}
        fullWidth
        disabled={isLoading}
      />
      {isLoading && (
        <div className="absolute right-3 top-9">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
} 