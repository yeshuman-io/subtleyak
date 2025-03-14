import VEHICLES_MODULE from "src/modules/vehicles";
import FITMENTS_MODULE from "src/modules/fitments";
import { defineLink } from "@medusajs/framework/utils";

export default defineLink(
    FITMENTS_MODULE.linkable.fitment,
    {
        linkable: VEHICLES_MODULE.linkable.vehicle,
        isList: true,
    }
)

