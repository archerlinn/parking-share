"use client";

import React, { useState, useEffect } from 'react';
import Input from './Input';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  suggestions?: Array<{
    display_name: string;
    type: string;
    lat: string;
    lon: string;
  }>;
}

export default function SearchBar({ onSearch, placeholder, suggestions = [] }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [localSuggestions, setLocalSuggestions] = useState<typeof suggestions>([]);

  useEffect(() => {
    const searchLocations = async () => {
      if (!query) {
        setLocalSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
        );
        const data = await response.json();
        setLocalSuggestions(data);
      } catch (error) {
        console.error('Error searching locations:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchLocations, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleSuggestionClick = (suggestion: typeof suggestions[0]) => {
    setQuery(suggestion.display_name);
    setLocalSuggestions([]);
    onSearch(suggestion.display_name);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder || "Search locations..."}
            className="w-full pl-4 pr-10 py-2 bg-white shadow-lg rounded-lg"
          />
        </form>
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-rose-600 border-t-transparent" />
          </div>
        )}
      </div>

      {localSuggestions.length > 0 && (
        <div className="absolute mt-2 w-full bg-white rounded-lg shadow-lg max-h-60 overflow-auto z-50">
          {localSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
            >
              <span className="block text-sm font-medium text-gray-900">
                {suggestion.display_name}
              </span>
              <span className="block text-xs text-gray-500">
                {suggestion.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 