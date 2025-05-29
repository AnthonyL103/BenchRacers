import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface Car {
  entryID: number | null;
  userID: string;
  carName: string;
  carMake: string;
  carColor?: string;
  description?: string;
  s3ContentID: string;
  totalMods: number;
  totalCost: number;
  region: string;
  upvotes: number;
}

interface CarState {
  cars: Car[];
  selectedCar: Car | null;
  isLoading: boolean;
  error: string | null;
}

interface CarAction {
  type: string;
  payload?: any;
}

const initialState: CarState = {
  cars: [],
  selectedCar: null,
  isLoading: false,
  error: null
};

const getInitialState = (): CarState => {
  try {
    const savedState = localStorage.getItem('carState');
    return savedState ? JSON.parse(savedState) : initialState;
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    return initialState;
  }
};

export const CarActionTypes = {
  FETCH_CARS_REQUEST: 'FETCH_CARS_REQUEST',
  FETCH_CARS_SUCCESS: 'FETCH_CARS_SUCCESS',
  FETCH_CARS_FAILURE: 'FETCH_CARS_FAILURE',
  ADD_CAR_REQUEST: 'ADD_CAR_REQUEST',
  ADD_CAR_SUCCESS: 'ADD_CAR_SUCCESS',
  ADD_CAR_FAILURE: 'ADD_CAR_FAILURE',
  UPDATE_CAR_REQUEST: 'UPDATE_CAR_REQUEST',
  UPDATE_CAR_SUCCESS: 'UPDATE_CAR_SUCCESS',
  UPDATE_CAR_FAILURE: 'UPDATE_CAR_FAILURE',
  DELETE_CAR_REQUEST: 'DELETE_CAR_REQUEST',
  DELETE_CAR_SUCCESS: 'DELETE_CAR_SUCCESS',
  DELETE_CAR_FAILURE: 'DELETE_CAR_FAILURE',
  SELECT_CAR: 'SELECT_CAR',
  CLEAR_SELECTED_CAR: 'CLEAR_SELECTED_CAR',
  UPVOTE_CAR: 'UPVOTE_CAR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

function carReducer(state: CarState, action: CarAction): CarState {
  switch (action.type) {
    case CarActionTypes.FETCH_CARS_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case CarActionTypes.FETCH_CARS_SUCCESS:
      return {
        ...state,
        cars: action.payload,
        isLoading: false,
        error: null
      };
    case CarActionTypes.FETCH_CARS_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case CarActionTypes.ADD_CAR_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case CarActionTypes.ADD_CAR_SUCCESS:
      return {
        ...state,
        cars: [...state.cars, action.payload],
        isLoading: false,
        error: null
      };
    case CarActionTypes.ADD_CAR_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case CarActionTypes.UPDATE_CAR_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case CarActionTypes.UPDATE_CAR_SUCCESS:
      return {
        ...state,
        cars: state.cars.map(car => 
          car.entryID === action.payload.entryID ? action.payload : car
        ),
        selectedCar: state.selectedCar?.entryID === action.payload.entryID 
          ? action.payload 
          : state.selectedCar,
        isLoading: false,
        error: null
      };
    case CarActionTypes.UPDATE_CAR_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case CarActionTypes.DELETE_CAR_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case CarActionTypes.DELETE_CAR_SUCCESS:
      return {
        ...state,
        cars: state.cars.filter(car => car.entryID !== action.payload),
        selectedCar: state.selectedCar?.entryID === action.payload 
          ? null 
          : state.selectedCar,
        isLoading: false,
        error: null
      };
    case CarActionTypes.DELETE_CAR_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case CarActionTypes.SELECT_CAR:
      return {
        ...state,
        selectedCar: action.payload
      };
    case CarActionTypes.CLEAR_SELECTED_CAR:
      return {
        ...state,
        selectedCar: null
      };
    case CarActionTypes.UPVOTE_CAR:
      return {
        ...state,
        cars: state.cars.map(car => 
          car.entryID === action.payload 
            ? { ...car, upvotes: car.upvotes + 1 } 
            : car
        ),
        selectedCar: state.selectedCar && state.selectedCar.entryID === action.payload 
          ? { ...state.selectedCar, upvotes: state.selectedCar.upvotes + 1 } 
          : state.selectedCar
      };
    case CarActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}

type CarStateContextType = CarState;
type CarDispatchContextType = React.Dispatch<CarAction>;

const CarStateContext = createContext<CarStateContextType>(initialState);
const CarDispatchContext = createContext<CarDispatchContextType>(() => null);

export function CarProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(carReducer, getInitialState());

  useEffect(() => {
    localStorage.setItem('carState', JSON.stringify(state));
  }, [state]);

  return (
    <CarStateContext.Provider value={state as CarStateContextType}>
      <CarDispatchContext.Provider value={dispatch}>
        {children}
      </CarDispatchContext.Provider>
    </CarStateContext.Provider>
  );
}

export function useCarState() {
  const context = useContext(CarStateContext);
  if (!context) {
    throw new Error('useCarState must be used within a CarProvider');
  }
  return context;
}

export function useCarDispatch() {
  const context = useContext(CarDispatchContext);
  if (!context) {
    throw new Error('useCarDispatch must be used within a CarProvider');
  }
  return context;
}

export function useCar() {
  const state = useCarState();
  const dispatch = useCarDispatch();
  
  return { ...state, dispatch };
}