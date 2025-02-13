import Service from "./service";
import { Module } from "@medusajs/framework/utils";

// Single module for all -related models
export const _MODULE = "";

// Export the  service that handles all models
export default Module(_MODULE, {
    service: Service
}); 