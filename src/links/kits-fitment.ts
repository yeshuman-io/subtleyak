import WIPERS_MODULE from "src/modules/wipers";
import FITMENTS_MODULE from "src/modules/fitments";
import { defineLink } from "@medusajs/framework/utils";

export default defineLink(
    FITMENTS_MODULE.linkable.fitment,
    {
        linkable: WIPERS_MODULE.linkable.wiperKit,
        isList: true,
    }
)

