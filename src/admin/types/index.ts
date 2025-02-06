import { ShippingProfileType } from "@medusajs/framework/utils"

// Vehicle Types
export type VehicleMake = {
  id: string
  name: string
  models?: VehicleModel[]
}

export type VehicleModel = {
  id: string
  name: string
  make_id: string
  make?: VehicleMake
  vehicles?: Vehicle[]
}

export type Vehicle = {
  id: string
  start_year: number
  end_year: number
  make_id: string
  model_id: string
  make?: VehicleMake
  model?: VehicleModel
}

// List Response Types
export type ListVehicleMakesRes = {
  vehicle_makes: VehicleMake[]
}

export type ListVehicleModelsRes = {
  vehicle_models: VehicleModel[]
}

// Full Response Types (with pagination)
export type VehicleMakeResponse = {
  vehicle_makes: VehicleMake[]
  count: number
  limit: number
  offset: number
}

export type VehicleModelResponse = {
  vehicle_models: VehicleModel[]
  count: number
  limit: number
  offset: number
}

export type VehicleResponse = {
  vehicles: Vehicle[]
  count: number
  limit: number
  offset: number
}