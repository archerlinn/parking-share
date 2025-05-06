"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../../components/layout/Layout';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import TextArea from '../../../../components/ui/TextArea';
import Card from '../../../../components/ui/Card';
import LocationSearch from '../../../../components/ui/LocationSearch';
import { useAuth } from '../../../../providers/AuthProvider';
import { useParking } from '../../../../providers/ParkingProvider';

export default function EditParkingLotPage() {
  const params = useParams();
  const parkingLotId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const router = useRouter();
  const { user } = useAuth();
  const { getParkingLotById, updateParkingLot, loading } = useParking();
  
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    latitude: '',
    longitude: '',
    instructions: '',
    pricePerHour: '',
    amenities: '',
    photoUrl: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [notFoundError, setNotFoundError] = useState('');
  
  // Load parking lot data
  useEffect(() => {
    if (parkingLotId) {
      const parkingLot = getParkingLotById(parkingLotId);
      if (parkingLot) {
        // Check if the user is the owner
        if (user && parkingLot.ownerId !== user.id) {
          setNotFoundError('You do not have permission to edit this parking lot.');
          return;
        }
        
        setFormData({
          street: parkingLot.address.street,
          city: parkingLot.address.city,
          state: parkingLot.address.state,
          zipCode: parkingLot.address.zipCode,
          country: parkingLot.address.country,
          latitude: parkingLot.address.coordinates.latitude.toString(),
          longitude: parkingLot.address.coordinates.longitude.toString(),
          instructions: parkingLot.instructions,
          pricePerHour: parkingLot.pricePerHour.toString(),
          amenities: parkingLot.amenities.join(', '),
          photoUrl: parkingLot.photoUrl || '',
        });
      } else {
        setNotFoundError('Parking lot not found.');
      }
    }
  }, [parkingLotId, user, getParkingLotById]);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Zip code is required';
    }
    
    if (!formData.latitude.trim() || !formData.longitude.trim()) {
      newErrors.latitude = 'Coordinates are required';
      newErrors.longitude = 'Coordinates are required';
    } else {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude must be between -90 and 90';
      }
      
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Longitude must be between -180 and 180';
      }
    }
    
    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    }
    
    if (!formData.pricePerHour.trim()) {
      newErrors.pricePerHour = 'Price per hour is required';
    } else {
      const price = parseFloat(formData.pricePerHour);
      if (isNaN(price) || price <= 0) {
        newErrors.pricePerHour = 'Price must be a positive number';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!user) {
      setErrors({
        form: 'You must be logged in to update a parking lot',
      });
      return;
    }
    
    const amenitiesArray = formData.amenities
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
    
    const parkingLotData = {
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        coordinates: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        },
      },
      instructions: formData.instructions,
      photoUrl: formData.photoUrl || undefined,
      pricePerHour: parseFloat(formData.pricePerHour),
      amenities: amenitiesArray,
    };
    
    const updatedParkingLot = await updateParkingLot(parkingLotId, parkingLotData);
    
    if (updatedParkingLot) {
      setSuccessMessage('Parking lot updated successfully! Redirecting...');
      setTimeout(() => {
        router.push('/owner/dashboard');
      }, 2000);
    } else {
      setErrors({
        form: 'Failed to update parking lot. Please try again.',
      });
    }
  };
  
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          setErrors(prev => ({
            ...prev,
            latitude: 'Could not get your current location',
          }));
        }
      );
    } else {
      setErrors(prev => ({
        ...prev,
        latitude: 'Geolocation is not supported by your browser',
      }));
    }
  };
  
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">You need to be logged in to edit a parking lot</h2>
              <p className="mt-2 text-sm text-gray-600">Please sign in or create an account to continue.</p>
              <div className="mt-6">
                <Button onClick={() => router.push(`/auth/login?next=/owner/parking-lot/${parkingLotId}/edit`)}>
                  Sign In
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (notFoundError) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">{notFoundError}</h2>
              <div className="mt-6">
                <Button onClick={() => router.push('/owner/dashboard')}>
                  Return to Dashboard
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Edit Parking Lot
            </h1>
            <Button
              variant="outline"
              onClick={() => router.push('/owner/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            Update details about your parking space.
          </p>
            
          <div className="mt-10">
            <Card className="p-6 sm:p-8 border border-gray-200 shadow-sm">
              {successMessage ? (
                <div className="text-center text-green-600 py-12">
                  <div className="text-3xl mb-4">✓</div>
                  <p className="text-xl font-semibold">{successMessage}</p>
                </div>
              ) : (
                <form className="space-y-8" onSubmit={handleSubmit}>
                  {errors.form && (
                    <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                      <p>{errors.form}</p>
                    </div>
                  )}
                  
                  <div className="space-y-8 divide-y divide-gray-200">
                    <div className="space-y-6 pt-4">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Location Information</h3>
                      
                      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-6 mb-4">
                          <LocationSearch
                            defaultValue={formData.street}
                            onLocationSelect={(location) => {
                              setFormData(prev => ({
                                ...prev,
                                street: location.address,
                                city: location.city,
                                state: location.state,
                                zipCode: location.zipCode,
                                country: location.country,
                                latitude: location.latitude.toString(),
                                longitude: location.longitude.toString(),
                              }));
                              // Clear any location-related errors
                              setErrors(prev => {
                                const newErrors = {...prev};
                                delete newErrors.street;
                                delete newErrors.city;
                                delete newErrors.state;
                                delete newErrors.zipCode;
                                delete newErrors.latitude;
                                delete newErrors.longitude;
                                return newErrors;
                              });
                            }}
                            error={errors.street}
                          />
                        </div>
                      
                        <div className="sm:col-span-3">
                          <Input
                            id="street"
                            name="street"
                            type="text"
                            label="Street address"
                            value={formData.street}
                            onChange={handleChange}
                            error={errors.street}
                            fullWidth
                            disabled
                          />
                        </div>
                        
                        <div className="sm:col-span-3">
                          <Input
                            id="city"
                            name="city"
                            type="text"
                            label="City"
                            value={formData.city}
                            onChange={handleChange}
                            error={errors.city}
                            fullWidth
                            disabled
                          />
                        </div>
                        
                        <div className="sm:col-span-2">
                          <Input
                            id="state"
                            name="state"
                            type="text"
                            label="State / Province"
                            value={formData.state}
                            onChange={handleChange}
                            error={errors.state}
                            fullWidth
                            disabled
                          />
                        </div>
                        
                        <div className="sm:col-span-2">
                          <Input
                            id="zipCode"
                            name="zipCode"
                            type="text"
                            label="ZIP / Postal Code"
                            value={formData.zipCode}
                            onChange={handleChange}
                            error={errors.zipCode}
                            fullWidth
                            disabled
                          />
                        </div>
                        
                        <div className="sm:col-span-2">
                          <Input
                            id="country"
                            name="country"
                            type="text"
                            label="Country"
                            value={formData.country}
                            onChange={handleChange}
                            fullWidth
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6 pt-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Coordinates</h3>
                      
                      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <Input
                            id="latitude"
                            name="latitude"
                            type="text"
                            label="Latitude"
                            value={formData.latitude}
                            onChange={handleChange}
                            error={errors.latitude}
                            fullWidth
                          />
                        </div>
                        
                        <div className="sm:col-span-3">
                          <Input
                            id="longitude"
                            name="longitude"
                            type="text"
                            label="Longitude"
                            value={formData.longitude}
                            onChange={handleChange}
                            error={errors.longitude}
                            fullWidth
                          />
                        </div>
                        
                        <div className="sm:col-span-6">
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={getLocation}
                            >
                              Use Current Location
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6 pt-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Parking Details</h3>
                      
                      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <Input
                            id="pricePerHour"
                            name="pricePerHour"
                            type="text"
                            label="Price per Hour ($)"
                            value={formData.pricePerHour}
                            onChange={handleChange}
                            error={errors.pricePerHour}
                            fullWidth
                          />
                        </div>
                        
                        <div className="sm:col-span-3">
                          <Input
                            id="photoUrl"
                            name="photoUrl"
                            type="text"
                            label="Photo URL (optional)"
                            value={formData.photoUrl}
                            onChange={handleChange}
                            fullWidth
                          />
                        </div>

                        {formData.photoUrl && (
                          <div className="sm:col-span-6 mt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Photo Preview
                            </label>
                            <div className="relative h-48 w-full bg-gray-100 rounded-md overflow-hidden">
                              <img
                                src={formData.photoUrl}
                                alt="Parking lot preview"
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.style.display = 'none';
                                  setErrors(prev => ({
                                    ...prev,
                                    photoUrl: 'Invalid image URL. Please provide a valid URL.'
                                  }));
                                }}
                                onLoad={() => {
                                  if (errors.photoUrl) {
                                    setErrors(prev => {
                                      const newErrors = {...prev};
                                      delete newErrors.photoUrl;
                                      return newErrors;
                                    });
                                  }
                                }}
                              />
                            </div>
                            {errors.photoUrl && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.photoUrl}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="sm:col-span-6">
                          <Input
                            id="amenities"
                            name="amenities"
                            type="text"
                            label="Amenities (comma separated, e.g. Covered, EV Charging, Security)"
                            value={formData.amenities}
                            onChange={handleChange}
                            fullWidth
                          />
                        </div>
                        
                        <div className="sm:col-span-6">
                          <TextArea
                            id="instructions"
                            name="instructions"
                            label="Access Instructions"
                            value={formData.instructions}
                            onChange={handleChange}
                            error={errors.instructions}
                            rows={4}
                            fullWidth
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-x-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/owner/dashboard')}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={loading} className="min-w-[120px]">
                      Update
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
} 