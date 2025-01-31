import { MedusaService } from "@medusajs/framework/utils"
import Vehicle from "./models/vehicle"
import VehicleMake from "./models/vehicle-make"
import VehicleModel from "./models/vehicle-model"

// Combine all models into a single service
class VehicleService extends MedusaService({
    Vehicle,
    VehicleMake,
    VehicleModel
}){
}

export default VehicleService