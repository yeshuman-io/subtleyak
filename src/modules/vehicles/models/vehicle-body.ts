import { model } from "@medusajs/framework/utils"
import VehicleModel from "./vehicle-model"

const VehicleBody = model.define("vehicle_body", {
    id: model.id().primaryKey(),
    name: model.text(),
    models: model.manyToMany(() => VehicleModel, {
        mappedBy: "bodies"
    })
})

export default VehicleBody