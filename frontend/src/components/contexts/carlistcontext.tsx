import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface Car {
  entryID: number | null;
  userID: string;
  userName?: string;
  carName: string;
  carMake: string;
  carModel: string;
  carYear?: string;
  carColor?: string;
  carTrim?: string;
  description?: string;
  s3ContentID: string; 
  totalMods: number;
  totalCost: number;
  category: string;
  region: string;
  upvotes: number;
  commentCount?: number;  // Add this line
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  horsepower?: number;
  torque?: number;
  viewCount: number;
  createdAt: string;
  tags?: string[];
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
  CLEAR_ERROR: 'CLEAR_ERROR',
  INCREMENT_VIEW_COUNT: 'INCREMENT_VIEW_COUNT'
};

function carReducer(state: CarState, action: CarAction): CarState {
  console.log('🔴 Reducer called:', action.type, 'Payload:', action.payload);
  console.log('🔴 Current state before:', state);
  
  switch (action.type) {
    case CarActionTypes.FETCH_CARS_REQUEST:
      const requestState = {
        ...state,
        isLoading: true,
        error: null
      };
      console.log('🟡 FETCH_CARS_REQUEST new state:', requestState);
      return requestState;
      
    case CarActionTypes.FETCH_CARS_SUCCESS:
      const successState = {
        ...state,
        cars: action.payload,
        isLoading: false,
        error: null
      };
      console.log('🟢 FETCH_CARS_SUCCESS new state:', successState);
      console.log('🟢 Cars array length:', Array.isArray(action.payload) ? action.payload.length : 'Not an array');
      return successState;
      
    case CarActionTypes.FETCH_CARS_FAILURE:
      const failureState = {
        ...state,
        isLoading: false,
        error: action.payload
      };
      console.log('🔴 FETCH_CARS_FAILURE new state:', failureState);
      return failureState;
      
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
    case CarActionTypes.INCREMENT_VIEW_COUNT:
      return {
        ...state,
        cars: state.cars.map(car => 
          car.entryID === action.payload 
            ? { ...car, viewCount: car.viewCount + 1 } 
            : car
        ),
        selectedCar: state.selectedCar && state.selectedCar.entryID === action.payload 
          ? { ...state.selectedCar, viewCount: state.selectedCar.viewCount + 1 } 
          : state.selectedCar
      };
    case CarActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      console.log('🔴 Unknown action type:', action.type);
      return state;
  }
}

type CarStateContextType = CarState;
type CarDispatchContextType = React.Dispatch<CarAction>;

const CarStateContext = createContext<CarStateContextType>(initialState);
const CarDispatchContext = createContext<CarDispatchContextType>(() => null);

export function CarProvider({ children }: { children: React.ReactNode }) {
  // TEMPORARILY DISABLE LOCALSTORAGE - use fresh state every time
  const [state, dispatch] = useReducer(carReducer, initialState);

  // DISABLE localStorage for debugging
  // useEffect(() => {
  //   localStorage.setItem('carState', JSON.stringify(state));
  // }, [state]);

  console.log('🔵 CarProvider current state:', state);

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
  console.log('🔵 useCarState returning:', context);
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