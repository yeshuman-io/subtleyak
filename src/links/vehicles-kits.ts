import VEHICLES_MODULE from "src/modules/vehicles";
import WIPERS_MODULE from "src/modules/wipers";
import { defineLink } from "@medusajs/framework/utils";

export default defineLink(
    {
        linkable: VEHICLES_MODULE.linkable.vehicle,
        isList: true,
    },
    {
        linkable:WIPERS_MODULE.linkable.wiperKit,
        isList: true,
    }
)

