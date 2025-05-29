import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './usercontext';
import axios from 'axios';

export interface Mod {
  modID: number;  
  brand: string;
  cost: number;
  description: string;
  category: string;
  link: string;
}

export interface Car {
    entryID: number;
    userEmail: string;
    carName: string;
    carMake: string;
    carModel: string;
    carYear?: string;
    carColor?: string;
    carTrim?: string; 
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
    

    tags: string[];              
    mods: Mod[];                 
    
    mainPhotoKey?: string;       
    allPhotoKeys: string[];     
    photos?: { s3Key: string; isMainPhoto: boolean }[]; 
}

export interface CarCreate {
  entryID?: number;               
  userEmail: string;
  carName: string;
  carMake: string;
  carModel: string;
  carYear?: string;
  carColor?: string;
  carTrim?: string;              
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
  
  photos: { s3Key: string; isMainPhoto: boolean }[];  
  tags: string[];                                     
  mods: number[];                                     
}

interface GarageContextState {
  cars: Car[];
  Car: Car | null;
  isLoading: boolean;
  error: string | null;
  fetchUserCars: () => Promise<void>;
  addCar: (car: CarCreate) => Promise<void>;
  updateCar: (entryID: number, car: CarCreate) => Promise<void>;
  deleteCar: (entryID: number) => Promise<void>;
}

const GarageContext = createContext<GarageContextState | undefined>(undefined);

export function GarageProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useUser();
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
        setCars(prevCars => [...prevCars, response.data.car]);
      } else {
        throw new Error(response.data.message || 'Failed to add car');
      }
    } catch (error) {
      console.error('Error adding car:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while adding the car');
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };

  const updateCar = async (entryID: number,carData: CarCreate) => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to add a car');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
      `https://api.benchracershq.com/api/garage/update/${entryID}`, 
      carData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
      if (response.data.success) {
        alert("Updated Entry Successfully");
      return;
        
      } else {
        throw new Error(response.data.message || 'Failed to update car');
      }
    } catch (error) {
      console.error('Error updating car:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while updating the car');
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };


const deleteCar = async (entryID: number): Promise<void> => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to delete a car');
      return;
    }
  
    setIsLoading(true);
    setError(null);
  
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.delete('https://api.benchracershq.com/api/garage/delete', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { entryID } 
      });
  
      if (response.data.success) {
        setCars(prevCars => prevCars.filter(car => car.entryID !== entryID));

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
    } finally {
      setIsLoading(false);
    }
  };
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
        Car: null, 
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

export function useGarage() {
  const context = useContext(GarageContext);
  if (context === undefined) {
    throw new Error('useGarage must be used within a GarageProvider');
  }
  return context;
}