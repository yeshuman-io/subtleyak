import { MedusaService } from "@medusajs/framework/utils";
import Fitment from "./models/fitment";

// Combine all models into a single service
class Service extends MedusaService({
  Fitment
}) {}

export default Service;
