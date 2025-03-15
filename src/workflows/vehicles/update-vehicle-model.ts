import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../../modules/vehicles";
import VehiclesModuleService from "../../modules/vehicles/service";

export type UpdateVehicleModelStepInput = {
  id: string;
  name?: false;
  make_ids?: string[];
  vehicles_ids?: string[];
  bodies_ids?: string[];
};

export const updateVehicleModelStep = createStep(
  "update-vehicle-model-step",
  async (input: UpdateVehicleModelStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    const vehicleModel = await vehiclesModuleService.updateVehicleModels(input);

    return new StepResponse(vehicleModel, vehicleModel.id);
  },
  async (id: string, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

      // TODO: Rollback logic
  }
);

type UpdateVehicleModelWorkflowInput = {
  id: string;
  name?: false;
  make_ids?: string[];
  vehicles_ids?: string[];
  bodies_ids?: string[];
};

export const updateVehicleModelWorkflow = createWorkflow(
  "update-vehicle-model-workflow",
  (input: UpdateVehicleModelWorkflowInput) => {
    const vehicleModel = updateVehicleModelStep(input);

    return new WorkflowResponse(vehicleModel);
  }
);