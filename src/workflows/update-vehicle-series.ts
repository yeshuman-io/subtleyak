import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { VEHICLES_MODULE } from "../modules/vehicles";
import VehiclesModuleService from "../modules/vehicles/service";

export type UpdateVehicleSeriesStepInput = {
  id: string;
  start_year?: number;
  end_year?: number;
  vehicle_id?: string;
  model_id?: string;
};

export const updateVehicleSeriesStep = createStep(
  "update-vehicle-series-step",
  async (input: UpdateVehicleSeriesStepInput, { container }) => {
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);

    // First, get the existing entity to preserve any fields we're not updating
    const existing = await vehiclesModuleService.retrieveVehicleSeries(
      input.id,
    );

    const result = await vehiclesModuleService.updateVehicleSeries({
      id: input.id,
      ...input,
    });

    return new StepResponse(result, result.id);
  },
  async (id: string, { container }) => {
    // Rollback logic if needed
    const vehiclesModuleService: VehiclesModuleService =
      container.resolve(VEHICLES_MODULE);
  },
);

type UpdateVehicleSeriesWorkflowInput = UpdateVehicleSeriesStepInput;

export const updateVehicleSeriesWorkflow = createWorkflow(
  "update-vehicle-series-workflow",
  (input: UpdateVehicleSeriesWorkflowInput) => {
    const result = updateVehicleSeriesStep(input);
    return new WorkflowResponse(result);
  },
);
