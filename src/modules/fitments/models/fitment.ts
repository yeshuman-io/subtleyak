import { model } from "@medusajs/framework/utils";

const Fitment = model.define("fitment", {
  id: model.id().primaryKey(),
  code: model.text()
});

export default Fitment;//sdfasadf