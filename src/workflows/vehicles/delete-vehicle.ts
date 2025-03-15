import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../../modules/vehicles";
import VehiclesModuleService from "../../modules/vehicles/service";

export type DeleteVehicleStepInput = {
  id: string;
};

export const deleteVehicleStep = createStep(
  "delete-vehicle-step",
  async (input: DeleteVehicleStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    const original = await vehiclesModuleService.retrieveVehicle(input.id);
    await vehiclesModuleService.deleteVehicles(input.id);

    return new StepResponse(true, { id: input.id, original });
  },
  async (context: { id: string; original: Record<string, any> }, { container }) => {
    const vehiclesModuleService: VehiclesModuleService = 
      container.resolve(VEHICLES_MODULE);

    await vehiclesModuleService.createVehicles(context.original);
  }
);

type DeleteVehicleWorkflowInput = DeleteVehicleStepInput;

export const deleteVehicleWorkflow = createWorkflow(
  "delete-vehicle-workflow",
  (input: DeleteVehicleWorkflowInput) => {
    const result = deleteVehicleStep(input);

    return new WorkflowResponse(result);
  }
);