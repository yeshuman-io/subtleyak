import { model } from "@medusajs/framework/utils";
import WiperArm from "./wiper-arm";

const WiperConnector = model.define("wiper_connector", {
  id: model.id().primaryKey(),
  name: model.text(),
  code: model.text(),
  type: model.text(),
  media_url: model.text(),
  arms: model.hasMany(() => WiperArm, {
      mappedBy: "connector"
    })
});

export default WiperConnector;//sdfasadf