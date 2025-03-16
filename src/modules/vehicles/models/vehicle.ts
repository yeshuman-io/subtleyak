import { model } from "@medusajs/framework/utils";
import VehicleMake from "./vehicle-make";
import VehicleModel from "./vehicle-model";
import VehicleSeries from "./vehicle-series";

const Vehicle = model.define("vehicle", {
  id: model.id().primaryKey(),
  make: model.belongsTo(() => VehicleMake, {
      mappedBy: "vehicles"
    }),
  model: model.belongsTo(() => VehicleModel, {
      mappedBy: "vehicles"
    }),
  series: model.hasMany(() => VehicleSeries, {
      mappedBy: "vehicle"
    })
});

export default Vehicle;//sdfasadf