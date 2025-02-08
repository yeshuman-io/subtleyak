import { ShippingProfileType } from "@medusajs/framework/utils";

// Vehicle Types
export type VehicleMake = {
  id: string;
  name: string;
  models?: VehicleModel[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type VehicleModel = {
  id: string;
  name: string;
  make_id: string;
  make?: VehicleMake;
  vehicles?: Vehicle[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type VehicleBody = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Vehicle = {
  id: string;
  start_year: number;
  end_year: number;
  make_id: string;
  model_id: string;
  make?: VehicleMake;
  model?: VehicleModel;
};

// List Response Types
export type ListVehicleMakesRes = {
  vehicle_makes: VehicleMake[];
  count: number;
  limit: number;
  offset: number;
};

export type ListVehicleModelsRes = {
  vehicle_models: VehicleModel[];
  count: number;
  limit: number;
  offset: number;
};

export type ListVehicleBodiesRes = {
  vehicle_bodies: VehicleBody[];
  count: number;
  limit: number;
  offset: number;
};

// Full Response Types (with pagination)
export type VehicleMakeResponse = {
  vehicle_makes: VehicleMake[];
  count: number;
  limit: number;
  offset: number;
};

export type VehicleModelResponse = {
  vehicle_models: VehicleModel[];
  count: number;
  limit: number;
  offset: number;
};

export type VehicleResponse = {
  vehicles: Vehicle[];
  count: number;
  limit: number;
  offset: number;
};

export type VehicleSeries = {
  id: string;
  start_year: number;
  end_year: number;
  vehicle: string;
  model: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ListVehicleSeriessRes = {
  vehicleseries_items: VehicleSeries[];
  count: number;
  limit: number;
  offset: number;
};

export type VehicleSeries = {
  id: string;
  start_year: number;
  end_year: number;
  vehicle: string;
  model: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ListVehicleSeriessRes = {
  vehicle_series_items: VehicleSeries[];
  count: number;
  limit: number;
  offset: number;
};
