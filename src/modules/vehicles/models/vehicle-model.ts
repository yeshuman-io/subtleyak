import { model } from "@medusajs/framework/utils";
import VehicleMake from "./vehicle-make";
import Vehicle from "./vehicle";
import VehicleBody from "./vehicle-body";

const VehicleModel = model.define("vehicle_model", {
  id: model.id().primaryKey(),
  name: model.text(),
  make: model.belongsTo(() => VehicleMake,
  vehicles: model.hasMany(() => Vehicle, {
      mappedBy: "model"
    },
  bodies: model.manyToMany(() => VehicleBody, {
      through: "vehicle_model_body"
    }
});

export default VehicleModel; 