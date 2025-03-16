import { model } from "@medusajs/framework/utils";

const WiperLength = model.define("wiper_length", {
  id: model.id().primaryKey(),
  value: model.number(),
  unit: model.text()
});

export default WiperLength;//sdfasadf