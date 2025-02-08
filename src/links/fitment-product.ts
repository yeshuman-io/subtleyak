import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import FITMENTS_MODULE from "src/modules/fitments";

export default defineLink(
    FITMENTS_MODULE.linkable.fitment,
    ProductModule.linkable.product
)

