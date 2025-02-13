import { MedusaService } from "@medusajs/framework/utils";
import  from "./models/";
import Wiper from "./models/wiper";
import WiperKit from "./models/wiper-kit";

// Combine all models into a single service
class Service extends MedusaService({
  ,
  Wiper,
  WiperKit
}) {}

export default Service; 