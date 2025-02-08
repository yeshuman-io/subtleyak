import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../../modules/vehicles";
import VehiclesModuleService from "../../modules/vehicles/service";

export type DeleteVehicleModelStepInput = {
  id: string;
};

export const deleteVehicleModelStep = createStep(
  "delete-vehicle-model-step",
  async (input: DeleteVehicleModelStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    const original = await vehiclesModuleService.retrieveVehicleModel(input.id);
    await vehiclesModuleService.deleteVehicleModels(input.id);

    return new StepResponse(true, { id: input.id, original });
  },
  async (context: { id: string; original: Record<string, any> }, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    await vehiclesModuleService.createVehicleModels(context.original);
  }
);

type DeleteVehicleModelWorkflowInput = DeleteVehicleModelStepInput;

export const deleteVehicleModelWorkflow = createWorkflow(
  "delete-vehicle-model-workflow",
  (input: DeleteVehicleModelWorkflowInput) => {
    const result = deleteVehicleModelStep(input);

    return new WorkflowResponse(result);
  }
);