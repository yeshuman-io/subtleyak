import VehiclesService from "./service";
import { Module } from "@medusajs/framework/utils";

// Single module for all vehicles-related models
export const VEHICLES_MODULE = "vehicles";

// Export the vehicles service that handles all models
export default Module(VEHICLES_MODULE, {
  service: VehiclesService
});