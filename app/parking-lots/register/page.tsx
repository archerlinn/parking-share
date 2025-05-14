"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Card from '../../components/ui/Card';
import LocationSearch from '../../components/ui/LocationSearch';
import { useAuth } from '../../providers/AuthProvider';
import { useParking } from '../../providers/ParkingProvider';
import { supabase } from '../../lib/supabase';

export default function RegisterParkingLotPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { addParkingLot, loading } = useParking();
  
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
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

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
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 5MB'
        }));
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          image: 'Please upload an image file'
        }));
        return;
      }

      setSelectedImage(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.image;
        return newErrors;
      });
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('parking-lots')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('parking-lots')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!user) {
      setErrors({
        form: 'You must be logged in to register a parking lot',
      });
      return;
    }

    if (!selectedImage) {
      setErrors(prev => ({
        ...prev,
        image: 'Please upload an image of your parking lot'
      }));
      return;
    }
    
    const amenitiesArray = formData.amenities
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    // Upload image first
    const imageUrl = await uploadImage(selectedImage);
    if (!imageUrl) {
      setErrors(prev => ({
        ...prev,
        image: 'Failed to upload image. Please try again.'
      }));
      return;
    }
    
    const parkingLotData = {
      userId: user.id,
      userName: profile?.name || user.user_metadata?.name || 'Unknown',
      userEmail: profile?.email || user.email || '',
      userPhone: profile?.phone || user.user_metadata?.phone || '',
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
      photoUrl: imageUrl,
      isAvailable: true,
      pricePerHour: parseFloat(formData.pricePerHour),
      amenities: amenitiesArray,
    };

    console.log('Submitting parking lot data:', parkingLotData); // Debug log
    
    const newParkingLot = await addParkingLot(parkingLotData);
    
    if (newParkingLot) {
      setSuccessMessage('Parking lot registered successfully! Redirecting...');
      setTimeout(() => {
        router.push('/parking-lots');
      }, 2000);
    } else {
      setErrors({
        form: 'Failed to register parking lot. Please try again.',
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
              <h2 className="text-lg font-semibold text-gray-900">You need to be logged in to register a parking lot</h2>
              <p className="mt-2 text-sm text-gray-600">Please sign in or create an account to continue.</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/auth/login?next=/owner/parking-lot/register')}>
                  Sign In
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
          <div className="mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Register Your Parking Lot
            </h1>
            <p className="mt-2 text-lg leading-8 text-gray-600">
              Provide details about your parking space to start renting it.
            </p>
            
            <div className="mt-10">
              <Card className="p-6">
                {successMessage ? (
                  <div className="text-center text-green-600">
                    <p>{successMessage}</p>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-6 pt-4">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Location Information</h3>
                      
                      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                          <LocationSearch
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
                            label="City (optional)"
                            value={formData.city}
                            onChange={handleChange}
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
                            label="ZIP / Postal code"
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
                            disabled
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
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-6">
                      <TextArea
                        id="instructions"
                        name="instructions"
                        rows={4}
                        label="Access Instructions"
                        placeholder="Provide detailed instructions on how to access your parking lot..."
                        value={formData.instructions}
                        onChange={handleChange}
                        error={errors.instructions}
                        fullWidth
                      />
                    </div>
                    
                    <div className="sm:col-span-3">
                      <Input
                        id="pricePerHour"
                        name="pricePerHour"
                        type="number"
                        min="0"
                        step="0.01"
                        label="Price per Hour ($)"
                        value={formData.pricePerHour}
                        onChange={handleChange}
                        error={errors.pricePerHour}
                        fullWidth
                      />
                    </div>
                    
                    <div className="sm:col-span-3">
                      <Input
                        id="amenities"
                        name="amenities"
                        type="text"
                        label="Amenities"
                        placeholder="Covered, EV Charging, 24/7 Access, etc."
                        value={formData.amenities}
                        onChange={handleChange}
                        fullWidth
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Comma-separated list of amenities
                      </p>
                    </div>
                    
                    <div className="space-y-6 pt-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Parking Lot Photo</h3>
                      
                      <div className="mt-2">
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {imagePreview ? (
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <>
                                  <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                  </svg>
                                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                  <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                                </>
                              )}
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                        </div>
                        {errors.image && (
                          <p className="mt-2 text-sm text-red-600">{errors.image}</p>
                        )}
                      </div>
                    </div>
                    
                    {errors.form && (
                      <div className="text-sm text-red-600">{errors.form}</div>
                    )}
                    
                    <div className="mt-8 flex justify-end">
                      <Button type="button" variant="outline" className="mr-4" onClick={() => router.push('/parking-lots')}>
                        Cancel
                      </Button>
                      <Button type="submit" isLoading={loading}>
                        Register Parking Lot
                      </Button>
                    </div>
                  </form>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 