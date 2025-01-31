import { model } from "@medusajs/framework/utils"
import VehicleMake from "./vehicle-make"
import VehicleModel from "./vehicle-model"


const Vehicle = model.define("vehicle", {
    id: model.id().primaryKey(),
    make: model.belongsTo(() => VehicleMake),
    model: model.belongsTo(() => VehicleModel),
    startYear: model
        .number()
        .default(2000),
    endYear: model
        .number()
        .default(2001)
})

export default Vehicle