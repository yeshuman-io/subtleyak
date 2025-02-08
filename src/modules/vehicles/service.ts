import { MedusaService } from "@medusajs/framework/utils";
import VehicleSeries from "./models/vehicle-series";

class vehiclesService extends MedusaService({
  VehicleSeries,
}) {}

export default vehiclesService;
