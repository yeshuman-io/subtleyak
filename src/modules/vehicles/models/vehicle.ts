import { model } from "@medusajs/framework/utils"
import VehicleMake from "./vehicle-make"
import VehicleModel from "./vehicle-model"

const Vehicle = model.define("vehicle", {
    id: model.id().primaryKey(),
    make: model.belongsTo(() => VehicleMake, {
        mappedBy: "vehicles"
    }),
    model: model.belongsTo(() => VehicleModel, {
        mappedBy: "vehicles"
    }),
    start_year: model
        .number()
        .default(2000),
    end_year: model
        .number()
        .default(2001)
})

export default Vehicle