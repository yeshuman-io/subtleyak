import { MedusaService } from "@medusajs/framework/utils";
import Wiper from "./models/wiper";
import WiperKit from "./models/wiper-kit";
import WiperLength from "./models/wiper-length";
import WiperConnector from "./models/wiper-connector";
import WiperArm from "./models/wiper-arm";

// Combine all models into a single service
class Service extends MedusaService({
  Wiper,
  WiperKit,
  WiperLength,
  WiperConnector,
  WiperArm
}) {}

export default Service;
