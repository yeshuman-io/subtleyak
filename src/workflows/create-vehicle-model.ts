import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../modules/vehicles";
import VehiclesModuleService from "../modules/vehicles/service";

export type CreateVehicleModelStepInput = {
  name: string;
  make_id: string;
};

export const createVehicleModelStep = createStep(
  "create-vehicle-make-step",
  async (input: CreateVehicleModelStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    const vehicleModel = await vehiclesModuleService.createVehicleModels(input);

    return new StepResponse(vehicleModel, vehicleModel.id);
  },
  async (id: string, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    await vehiclesModuleService.deleteVehicleModels(id);
  }
);

type CreateVehicleModelWorkflowInput = {
  name: string;
  make_id: string;
};

export const createVehicleModelWorkflow = createWorkflow(
  "create-vehicle-model-workflow",
  (input: CreateVehicleModelWorkflowInput) => {
    const vehicleModel = createVehicleModelStep(input);

    return new WorkflowResponse(vehicleModel);
  }
);
