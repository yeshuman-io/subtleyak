import VehiclesModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

// Single module for all vehicle-related models
export const VEHICLES_MODULE = "vehiclesModuleService"

// Export the vehicle service that handles all models
export default Module(VEHICLES_MODULE, {
    service: VehiclesModuleService
})