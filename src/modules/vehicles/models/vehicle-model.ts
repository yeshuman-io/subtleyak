import { model } from "@medusajs/framework/utils"
import VehicleMake from "./vehicle-make";


const VehicleModel = model.define("vehicle_model", {
    id: model.id().primaryKey(),
    name: model.text(),
    make: model.belongsTo(() => VehicleMake)
})

export default VehicleModel