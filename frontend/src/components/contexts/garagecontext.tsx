// garageContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './usercontext';
import axios from 'axios';

// Define the Car type
export interface Car {
    entryID: number;
    userEmail: string;
    carName: string;
    carMake: string;
    carModel: string;
    carYear?: string;
    carColor?: string;
    description?: string;
    totalMods: number;
    totalCost: number;
    category: string;
    region: string;
    upvotes: number;
    engine?: string;
    transmission?: string;
    drivetrain?: string;
    horsepower?: number;
    torque?: number;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    mainPhotoKey?: string; // The primary photo S3 key
    allPhotoKeys?: string[]; // Array of all photo S3 keys including the main one
}

// Type for car creation
export interface CarCreate {
  userEmail: string;
  carName: string;
  carMake: string;
  carModel: string;
  carYear?: string;
  carColor?: string;
  description?: string;
  totalMods: number;
  totalCost: number;
  category: string;
  region: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  horsepower?: number;
  torque?: number;
  photos: { s3Key: string; isMainPhoto: boolean }[]; // New photos structure
  tags?: string[];
  engineMods?: number[];
  interiorMods?: number[];
  exteriorMods?: number[];
}

// Define the garage context state
interface GarageContextState {
  cars: Car[];
  isLoading: boolean;
  error: string | null;
  fetchUserCars: () => Promise<void>;
  addCar: (car: CarCreate) => Promise<void>;
  updateCar: (car: Car) => Promise<void>;
  deleteCar: (entryID: number) => Promise<void>;
}

// Create context
const GarageContext = createContext<GarageContextState | undefined>(undefined);

// Provider component
export function GarageProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useUser();
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's cars
  const fetchUserCars = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setCars([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://api.benchracershq.com/api/garage/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setCars(response.data.cars || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch cars');
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching cars');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Add a new car
  const addCar = async (carData: CarCreate) => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to add a car');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://api.benchracershq.com/api/garage', carData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Add the new car to the state
        setCars(prevCars => [...prevCars, response.data.car]);
      } else {
        throw new Error(response.data.message || 'Failed to add car');
      }
    } catch (error) {
      console.error('Error adding car:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while adding the car');
      throw error; // Re-throw to let the component handle it
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing car
  const updateCar = async (car: Car) => {
    // Implementation...
  };

  // Delete a car
  // Delete a car
// Delete a car
// Delete a car
const deleteCar = async (entryID: number): Promise<void> => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to delete a car');
      return;
    }
  
    setIsLoading(true);
    setError(null);
  
    try {
      const token = localStorage.getItem('token');
      
      // Match the '/delete' endpoint from your backend router
      const response = await axios.delete('https://api.benchracershq.com/api/garage/delete', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { entryID } // Send entryID in the request body as expected by your backend
      });
  
      if (response.data.success) {
        // Remove the deleted car from the state
        setCars(prevCars => prevCars.filter(car => car.entryID !== entryID));
        
        // Optional: Add a success message or notification
        // setSuccessMessage('Car deleted successfully');
      } else {
        throw new Error(response.data.message || 'Failed to delete car');
      }
    } catch (error) {
      console.error('Error deleting car:', error);
      const errorMessage = 
        error instanceof axios.AxiosError && error.response?.data?.message
          ? error.response.data.message
          : error instanceof Error 
            ? error.message 
            : 'An error occurred while deleting the car';
      
      setError(errorMessage);
      // We're no longer returning a boolean value
    } finally {
      setIsLoading(false);
    }
  };
  // Fetch cars when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserCars();
    } else {
      setCars([]);
    }
  }, [isAuthenticated, fetchUserCars]);

  return (
    <GarageContext.Provider
      value={{
        cars,
        isLoading,
        error,
        fetchUserCars,
        addCar,
        updateCar,
        deleteCar
      }}
    >
      {children}
    </GarageContext.Provider>
  );
}

// Hook to use the garage context
export function useGarage() {
  const context = useContext(GarageContext);
  if (context === undefined) {
    throw new Error('useGarage must be used within a GarageProvider');
  }
  return context;
}