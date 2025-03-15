import FitmentsService from "./service";
import { Module } from "@medusajs/framework/utils";

// Single module for all fitments-related models
export const FITMENTS_MODULE = "fitments";

// Export the fitments service that handles all models
export default Module(FITMENTS_MODULE, {
  service: FitmentsService
});