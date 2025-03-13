import WipersService from "./service";
import { Module } from "@medusajs/framework/utils";

// Single module for all wipers-related models
export const WIPERS_MODULE = "wipers";

// Export the wipers service that handles all models
export default Module(WIPERS_MODULE, {
  service: WipersService
});