import { model } from "@medusajs/framework/utils";
import WiperConnector from "./wiper-connector";

const WiperArm = model.define("wiper_arm", {
  id: model.id().primaryKey(),
  name: model.text(),
  code: model.text(),
  connector: model.belongsTo(() => WiperConnector, {
      mappedBy: "arms"
    })
});

export default WiperArm;//sdfasadf