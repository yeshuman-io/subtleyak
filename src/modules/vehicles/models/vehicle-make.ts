import { model } from "@medusajs/framework/utils";
import VehicleModel from "./vehicle-model";
import Vehicle from "./vehicle";

const VehicleMake = model.define("vehicle_make", {
  id: model.id().primaryKey(),
  name: model.text(),
  models: model.hasMany(() => VehicleModel, {
      mappedBy: "make"
    }),
  vehicles: model.hasMany(() => Vehicle, {
      mappedBy: "make"
    })
});

export default VehicleMake;//sdfasadf