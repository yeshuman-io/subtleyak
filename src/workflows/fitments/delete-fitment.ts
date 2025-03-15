import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { FITMENTS_MODULE } from "../../modules/fitments";
import FitmentsModuleService from "../../modules/fitments/service";

export type DeleteFitmentStepInput = {
  id: string;
};

export const deleteFitmentStep = createStep(
  "delete-fitment-step",
  async (input: DeleteFitmentStepInput, { container }) => {
    const fitmentsModuleService: FitmentsModuleService = 
      container.resolve(FITMENTS_MODULE);

    const original = await fitmentsModuleService.retrieveFitment(input.id);
    await fitmentsModuleService.deleteFitments(input.id);

    return new StepResponse(true, { id: input.id, original });
  },
  async (context: { id: string; original: Record<string, any> }, { container }) => {
    const fitmentsModuleService: FitmentsModuleService = 
      container.resolve(FITMENTS_MODULE);

    await fitmentsModuleService.createFitments(context.original);
  }
);

type DeleteFitmentWorkflowInput = DeleteFitmentStepInput;

export const deleteFitmentWorkflow = createWorkflow(
  "delete-fitment-workflow",
  (input: DeleteFitmentWorkflowInput) => {
    const result = deleteFitmentStep(input);

    return new WorkflowResponse(result);
  }
);