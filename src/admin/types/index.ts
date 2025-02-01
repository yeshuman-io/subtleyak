// Vehicle Types
export type VehicleMake = {
  id: string
  name: string
  models?: VehicleModel[]
}

export type VehicleMakeResponse = {
  vehicle_makes: VehicleMake[]
  count: number
  limit: number
  offset: number
}

export type VehicleModel = {
  id: string
  name: string
  make_id: string
  make?: VehicleMake
  vehicles?: Vehicle[]
}

export type VehicleModelResponse = {
  vehicle_models: VehicleModel[]
  count: number
  limit: number
  offset: number
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

export type VehicleResponse = {
  vehicles: Vehicle[]
  count: number
  limit: number
  offset: number
}