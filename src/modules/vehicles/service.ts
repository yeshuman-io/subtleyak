import { MedusaService } from "@medusajs/framework/utils";
import Vehicle from "./models/vehicle";
import VehicleSeries from "./models/vehicle-series";
import VehicleMake from "./models/vehicle-make";
import VehicleModel from "./models/vehicle-model";
import VehicleBody from "./models/vehicle-body";

// Combine all models into a single service
class Service extends MedusaService({
  Vehicle,
  VehicleSeries,
  VehicleMake,
  VehicleModel,
  VehicleBody
}) {}

export default Service;
