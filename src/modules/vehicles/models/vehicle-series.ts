import { model } from "@medusajs/framework/utils";
import Vehicle from "./vehicle";
import VehicleModel from "./vehicle-model";

const VehicleSeries = model.define("vehicle_series", {
  id: model.id().primaryKey(),
  start_year: model.number(),
  end_year: model.number(),
  vehicle: model.belongsTo(() => Vehicle, {
      mappedBy: "series"
    }),
  model: model.belongsTo(() => VehicleModel, {
      mappedBy: "series"
    })
});

export default VehicleSeries;//sdfasadf