import { model } from "@medusajs/framework/utils";
import WiperKit from "./wiper-kit";

const Wiper = model.define("wiper", {
  id: model.id().primaryKey(),
  name: model.text(),
  code: model.text(),
  kits: model.hasMany(() => WiperKit, {
      mappedBy: "wiper"
    })
});

export default Wiper;//sdfasadf