import { model } from "@medusajs/framework/utils";
import Wiper from "./wiper";

const WiperKit = model.define("wiper_kit", {
  id: model.id().primaryKey(),
  name: model.text(),
  code: model.text(),
  wiper: model.belongsTo(() => Wiper, {
      mappedBy: "kits"
    }
});

export default WiperKit; 